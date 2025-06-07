import { ACCEPTED_FILE_TYPES } from "@/components/chat/chat-hooks/use-select-file-handler"
import { SidebarCreateItem } from "@/components/sidebar/items/all/sidebar-create-item"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { FILE_DESCRIPTION_MAX, FILE_NAME_MAX } from "@/db/limits"
import { TablesInsert } from "@/supabase/types"
import { createFileBasedOnExtension } from "@/db/files"
import { FC, useContext, useState } from "react"
import { toast } from "@/components/ui/use-toast"
import React, { DragEvent } from "react"

interface CreateFileProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreateFile: FC<CreateFileProps> = ({ isOpen, onOpenChange }) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)

  const [name, setName] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [description, setDescription] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const handleSelectedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setSelectedFiles(files)
  }

  // Handles uploading all files in the queue
  const handleUploadAll = async () => {
    if (!profile || !selectedWorkspace || uploading || selectedFiles.length === 0) return
    setUploading(true)
    for (const file of selectedFiles) {
      const fileNameWithoutExtension = file.name.split(".").slice(0, -1).join(".")
      const extension = file.name.split(".").pop() || ""
      const fileRecord: TablesInsert<"files"> = {
        user_id: profile.user_id,
        name: fileNameWithoutExtension,
        description: "",
        file_path: "",
        size: file.size,
        tokens: 0,
        type: extension
      }
      try {
        await createFileBasedOnExtension(
          file,
          fileRecord,
          selectedWorkspace.id,
          selectedWorkspace.embeddings_provider as "openai" | "local"
        )
      } catch (err) {
        toast({
          variant: "destructive",
          title: `Failed to upload ${file.name}`,
          description: String(err)
        })
      }
    }
    setUploading(false)
    setSelectedFiles([])
    onOpenChange(false)
  }

  // Drag-and-drop handlers
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      setSelectedFiles(prev => [...prev, ...files])
    }
  }
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  if (!profile) return null
  if (!selectedWorkspace) return null

  return (
    <SidebarCreateItem
      contentType="files"
      createState={{}} // Not used for batch upload
      isOpen={isOpen}
      isTyping={isTyping}
      onOpenChange={onOpenChange}
      renderInputs={() => (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
              border: "2px dashed #888",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              textAlign: "center",
              background: "#18181b",
              color: "#fff",
              cursor: "pointer"
            }}
          >
            Drag and drop files here, or use the file picker below.
          </div>
          <div className="space-y-1">
            <Label>Files</Label>
            <input
              type="file"
              onChange={handleSelectedFile}
              accept={ACCEPTED_FILE_TYPES}
              multiple
              style={{
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '8px',
                width: '100%',
                background: 'inherit',
                color: 'inherit',
              }}
            />
          </div>
          {selectedFiles.length > 0 && (
            <div className="space-y-1">
              <Label>Files to upload:</Label>
              <ul className="ml-4 list-disc">
                {selectedFiles.map((file, idx) => (
                  <li key={file.name + idx}>{file.name}</li>
                ))}
              </ul>
              <button
                className="mt-2 rounded px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
                onClick={handleUploadAll}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : `Upload ${selectedFiles.length} file(s)`}
              </button>
            </div>
          )}
        </>
      )}
    />
  )
}
