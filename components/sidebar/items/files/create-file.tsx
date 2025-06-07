import { ACCEPTED_FILE_TYPES } from "@/components/chat/chat-hooks/use-select-file-handler"
import { SidebarCreateItem } from "@/components/sidebar/items/all/sidebar-create-item"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { FILE_DESCRIPTION_MAX, FILE_NAME_MAX } from "@/db/limits"
import { TablesInsert } from "@/supabase/types"
import { createFileBasedOnExtension } from "@/db/files"
import { FC, useContext, useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface CreateFileProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreateFile: FC<CreateFileProps> = ({ isOpen, onOpenChange }) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)

  const [name, setName] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [description, setDescription] = useState("")
  const [relevantDate, setRelevantDate] = useState("") // ✅ NEW STATE
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
        relevant_date: "",
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

  if (!profile) return null
  if (!selectedWorkspace) return null

  
  
  const handleCreate = (fileRecord: TablesInsert<"files">) => {
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-(\d{4})$/;

    if (relevantDate && !dateRegex.test(relevantDate)) {
      toast({
        variant: "destructive",
        title: "Invalid Date Format",
        description: "Please enter the date as MM-DD-YYYY (e.g. 06-01-2025)."
      });
      return null;
    }

    return fileRecord;
  };



  return (
    <SidebarCreateItem
      contentType="files"
      createState={{}} // Not used for batch upload
      isOpen={isOpen}
      isTyping={isTyping}
      onOpenChange={onOpenChange}
      renderInputs={() => (
        <>
          <div className="space-y-1">
            <Label>Files</Label>
            <Input
              type="file"
              onChange={handleSelectedFile}
              accept={ACCEPTED_FILE_TYPES}
              multiple
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
                className="mt-2 px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
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
