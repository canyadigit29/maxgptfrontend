import { ACCEPTED_FILE_TYPES } from "@/components/chat/chat-hooks/use-select-file-handler"
import { SidebarCreateItem } from "@/components/sidebar/items/all/sidebar-create-item"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { FILE_DESCRIPTION_MAX, FILE_NAME_MAX } from "@/db/limits"
import { TablesInsert } from "@/supabase/types"
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleSelectedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const file = e.target.files[0]
    if (!file) return

    setSelectedFile(file)
    const fileNameWithoutExtension = file.name.split(".").slice(0, -1).join(".")
    setName(fileNameWithoutExtension)
  }

  if (!profile) return null
  if (!selectedWorkspace) return null

  const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-(\d{4})$/;
  const isValidDate = relevantDate === "" || dateRegex.test(relevantDate);
  if (!isValidDate) {
    toast({
      variant: "destructive",
      title: "Invalid Date Format",
      description: "Please enter the date as MM-DD-YYYY (e.g. 06-01-2025)."
    });
    return null;
  }

  
  const handleCreate = (fileRecord: TablesInsert<"files">) => {
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-(\d{4})$/;

    if (relevantDate && !dateRegex.test(relevantDate)) {
      toast({
        variant: "destructive",
        title: "Invalid Date Format",
        description: "Please enter the date as MM-DD-YYYY (e.g. 06-01-2025)."
      });
      return;
    }

    return fileRecord;
  };


  return (
    <SidebarCreateItem
      contentType="files"
            createState={
        {
          file: selectedFile,
          user_id: profile.user_id,
          name,
          description,
          relevant_date: relevantDate, // ✅ ADDED TO PAYLOAD
          file_path: "",
          size: selectedFile?.size || 0,
          tokens: 0,
          type: selectedFile?.type || 0
        } as TablesInsert<"files">
      }
      isOpen={isOpen}
      isTyping={isTyping}
      onOpenChange={onOpenChange}
      renderInputs={() => (
        <>
          <div className="space-y-1">
            <Label>File</Label>
            <Input
              type="file"
              onChange={handleSelectedFile}
              accept={ACCEPTED_FILE_TYPES}
            />
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

          <div className="space-y-1"> {/* ✅ NEW FIELD */}
            <Label>Relevant Date</Label>
            <Input
              placeholder="MM-DD-YYYY (e.g. 06-01-2025)" title="Enter date as MM-DD-YYYY (e.g. 06-01-2025)"
              value={relevantDate}
              onChange={e => setRelevantDate(e.target.value)}
            />
          </div>
        </>
      )}
    />
  )
}
