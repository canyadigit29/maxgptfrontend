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
  const [searchResults, setSearchResults] = useState<any[]>([])
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

  const handleSearchSelected = async () => {
    setSearching(true)
    setSearchError(null)
    setSearchResults([])
    try {
      const selected = checklist.filter((_, idx) => selectedItems.includes(idx))
      if (selected.length === 0) {
        setSearchError("Please select at least one item.")
        setSearching(false)
        return
      }
      // For each selected item, call the backend semantic search endpoint
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const results: any[] = []
      for (const item of selected) {
        const resp = await fetch(`${backendUrl}/api/file_ops/search_docs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: item.text, user_id: profile?.user_id })
        })
        if (!resp.ok) {
          const err = await resp.text()
          throw new Error(`Search failed: ${err}`)
        }
        const data = await resp.json()
        results.push({ label: item.label, result: data })
      }
      setSearchResults(results)
    } catch (e: any) {
      setSearchError(e.message || "Unknown error during search.")
    } finally {
      setSearching(false)
    }
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
                      <div className="font-semibold">{item.label}</div>
                      <div className="max-w-[400px] text-xs text-gray-400 truncate">{item.text}</div>
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
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 font-bold">Search Results:</div>
                  <ul className="space-y-4">
                    {searchResults.map((res, idx) => (
                      <li key={idx}>
                        <div className="font-semibold">{res.label}</div>
                        <pre className="bg-zinc-900 text-xs p-2 rounded whitespace-pre-wrap max-w-[600px] overflow-x-auto">
                          {JSON.stringify(res.result, null, 2)}
                        </pre>
                      </li>
                    ))}
                  </ul>
                </div>
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
