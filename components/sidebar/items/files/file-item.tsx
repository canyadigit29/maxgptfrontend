import { FileIcon } from "@/components/ui/file-icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FILE_DESCRIPTION_MAX, FILE_NAME_MAX } from "@/db/limits"
import { getFileFromStorage } from "@/db/storage/files"
import { Tables } from "@/supabase/types"
import { FC, useContext, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChatbotUIContext } from "@/context/context"
import { SidebarItem } from "../all/sidebar-display-item"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"

interface FileItemProps {
  file: Tables<"files">
}

export const FileItem: FC<FileItemProps> = ({ file }) => {
  const [name, setName] = useState(file.name)
  const [isTyping, setIsTyping] = useState(false)
  const [description, setDescription] = useState(file.description)
  const { setChatMessages, chatMessages, profile } = useContext(ChatbotUIContext)
  const [analyzing, setAnalyzing] = useState(false)
  const [checklist, setChecklist] = useState<Array<{ label: string; text: string }>>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [checklistError, setChecklistError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const getLinkAndView = async () => {
    const link = await getFileFromStorage(file.file_path)
    window.open(link, "_blank")
  }

  const handleAnalyzeFile = async () => {
    setAnalyzing(true)
    setChecklist([])
    setChecklistError(null)
    try {
      let fileContent = ""
      let fileName = file.name
      if (file.type.includes("pdf")) {
        // Call backend API to extract text from PDF
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/extract_text?file_path=${encodeURIComponent(file.file_path)}`
        const response = await fetch(apiUrl)
        if (!response.ok) throw new Error("Failed to extract PDF text")
        const data = await response.json()
        fileContent = data.text
        fileName = data.file_name || fileName
      } else {
        // Fallback: fetch file as text
        const link = await getFileFromStorage(file.file_path)
        const response = await fetch(link)
        fileContent = await response.text()
      }
      // Call backend checklist endpoint
      const checklistApi = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/extract_checklist`
      const checklistResp = await fetch(checklistApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fileContent })
      })
      if (!checklistResp.ok) throw new Error("Failed to extract checklist from file")
      const checklistData = await checklistResp.json()
      setChecklist(checklistData.checklist)
      setSelectedItems([])
    } catch (e: any) {
      setChecklistError(e.message || "Unknown error")
    } finally {
      setAnalyzing(false)
    }
  }

  // Handler for checkbox selection
  const handleChecklistChange = (idx: number) => {
    setSelectedItems(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
    // TODO: Trigger semantic search for selected items here
  }

  // Use the chat handler to send each selected checklist item as a chat message
  const { handleSendMessage } = useChatHandler();

  const handleSearchSelected = async () => {
    setSearching(true);
    setSearchError(null);
    try {
      const selected = checklist.filter((_, idx) => selectedItems.includes(idx));
      if (selected.length === 0) {
        setSearchError("Please select at least one item.");
        setSearching(false);
        return;
      }
      for (const item of selected) {
        // Extract the most specific part of the checklist item for searching
        let searchTerm = item.text;
        // Try to get the part after the last period, colon, or letter/number prefix
        const match = searchTerm.match(/([A-Za-z0-9\- ]+)(?=[.:]?\s*$)/);
        if (match && match[1]) {
          searchTerm = match[1].trim();
        } else {
          // fallback: after last colon or period
          const lastColon = item.text.lastIndexOf(":");
          const lastPeriod = item.text.lastIndexOf(".");
          const lastSep = Math.max(lastColon, lastPeriod);
          if (lastSep !== -1) {
            searchTerm = item.text.substring(lastSep + 1).trim();
          }
        }
        // Clean the topic header for chat display
        const cleanedTopic = cleanHeader(item.label).toUpperCase() + ": " + searchTerm;
        // Call backend to get item history
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const resp = await fetch(`${backendUrl}/api/file_ops/item_history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: searchTerm, user_id: profile?.user_id || "" })
        });
        if (!resp.ok) {
          throw new Error("Failed to fetch item history");
        }
        const data = await resp.json();
        setChatMessages(prev => [
          ...prev,
          {
            message: {
              id: `item-history-${Date.now()}-${Math.random()}`,
              role: "assistant",
              content: JSON.stringify({
                type: "item_history",
                topic: cleanedTopic,
                history: data.history,
                retrieved_chunks: data.retrieved_chunks
              }),
              created_at: new Date().toISOString(),
              sequence_number: prev.length,
              chat_id: "",
              assistant_id: null,
              user_id: profile?.user_id || "",
              model: "item-history",
              image_paths: [],
              updated_at: ""
            },
            fileItems: []
          }
        ]);
      }
    } catch (e: any) {
      setSearchError(e.message || "Unknown error during search.");
    } finally {
      setSearching(false);
    }
  }

  // Utility to clean up checklist item headers for display
  const cleanHeader = (label: string) => {
    // Remove "Action Items", "Old Business", and leading roman numerals/letters
    return label
      .replace(/^(I+\.?|[A-Z]\.?|\d+\.?)+\s*/i, "")
      .replace(/Action Items\s*\d*\.?\s*/i, "")
      .replace(/Old Business\s*/i, "")
      .replace(/^[.\s]+/, "")
      .trim();
  }

  return (
    <SidebarItem
      item={file}
      isTyping={isTyping}
      contentType="files"
      icon={<FileIcon type={file.type} size={30} />}
      updateState={{ name, description }}
      renderInputs={() => (
        <>
          <div
            className="cursor-pointer underline hover:opacity-50"
            onClick={getLinkAndView}
          >
            View {file.name}
          </div>

          <div className="flex flex-col justify-between">
            <div>{file.type}</div>

            <div>{formatFileSize(file.size)}</div>

            <div>{file.tokens.toLocaleString()} tokens</div>
          </div>

          <div className="space-y-1">
            <Label>Name</Label>

            <Input
              placeholder="File name..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={FILE_NAME_MAX}
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>

            <Input
              placeholder="File description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={FILE_DESCRIPTION_MAX}
            />
          </div>

          <Button
            variant="default"
            className="mt-2"
            onClick={handleAnalyzeFile}
            disabled={analyzing}
          >
            {analyzing ? "Analyzing..." : "Analyze File"}
          </Button>

          {/* Checklist UI */}
          {checklistError && (
            <div className="mt-2 text-red-500">Checklist error: {checklistError}</div>
          )}
          {checklist.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 font-bold">Checklist (select items to search):</div>
              <ul className="space-y-2">
                {checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(idx)}
                      onChange={() => handleChecklistChange(idx)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-semibold">{cleanHeader(item.label)}</div>
                      <div className="max-w-[400px] truncate text-xs text-gray-400">{item.text}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={handleSearchSelected}
                disabled={searching || selectedItems.length === 0}
              >
                {searching ? "Searching..." : "Search Selected"}
              </Button>
              {searchError && (
                <div className="mt-2 text-red-500">{searchError}</div>
              )}
            </div>
          )}
        </>
      )}
    />
  )
}

export const formatFileSize = (sizeInBytes: number): string => {
  let size = sizeInBytes
  let unit = "bytes"

  if (size >= 1024) {
    size /= 1024
    unit = "KB"
  }

  if (size >= 1024) {
    size /= 1024
    unit = "MB"
  }

  if (size >= 1024) {
    size /= 1024
    unit = "GB"
  }

  return `${size.toFixed(2)} ${unit}`
}
