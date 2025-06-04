import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import {
  IconBolt,
  IconCirclePlus,
  IconPlayerStopFilled,
  IconSend
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Input } from "../ui/input"
import { Progress } from "../ui/progress"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { ChatCommandInput } from "./chat-command-input"
import { ChatFilesDisplay } from "./chat-files-display"
import { useChatHandler } from "./chat-hooks/use-chat-handler"
import { useChatHistoryHandler } from "./chat-hooks/use-chat-history"
import { usePromptAndCommand } from "./chat-hooks/use-prompt-and-command"
import { useSelectFileHandler } from "./chat-hooks/use-select-file-handler"

interface ChatInputProps {}

export const ChatInput: FC<ChatInputProps> = ({}) => {
  const { t } = useTranslation()

  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [uploadStatus, setUploadStatus] = useState<
    | null
    | "uploading"
    | "processing"
    | "downloading"
    | "done"
    | "error"
  >(null)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadFileName, setDownloadFileName] = useState<string>("")
  const [selectedEnrichFile, setSelectedEnrichFile] = useState<File | null>(null)
  const [enrichInstructions, setEnrichInstructions] = useState<string>("")
  const [showEnrichPrompt, setShowEnrichPrompt] = useState(false)

  const {
    isAssistantPickerOpen,
    focusAssistant,
    setFocusAssistant,
    userInput,
    chatMessages,
    isGenerating,
    selectedPreset,
    selectedAssistant,
    focusPrompt,
    setFocusPrompt,
    focusFile,
    focusTool,
    setFocusTool,
    isToolPickerOpen,
    isPromptPickerOpen,
    setIsPromptPickerOpen,
    isFilePickerOpen,
    setFocusFile,
    chatSettings,
    selectedTools,
    setSelectedTools,
    assistantImages
  } = useContext(ChatbotUIContext)

  const {
    chatInputRef,
    handleSendMessage,
    handleStopMessage,
    handleFocusChatInput
  } = useChatHandler()

  const { handleInputChange } = usePromptAndCommand()

  const { filesToAccept, handleSelectDeviceFile } = useSelectFileHandler()

  const {
    setNewMessageContentToNextUserMessage,
    setNewMessageContentToPreviousUserMessage
  } = useChatHistoryHandler()

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => {
      handleFocusChatInput()
    }, 200) // FIX: hacky
  }, [selectedPreset, selectedAssistant, handleFocusChatInput])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isTyping && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      setIsPromptPickerOpen(false)
      handleSendMessage(userInput, chatMessages, false)
    }

    // Consolidate conditions to avoid TypeScript error
    if (
      isPromptPickerOpen ||
      isFilePickerOpen ||
      isToolPickerOpen ||
      isAssistantPickerOpen
    ) {
      if (
        event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault()
        // Toggle focus based on picker type
        if (isPromptPickerOpen) setFocusPrompt(!focusPrompt)
        if (isFilePickerOpen) setFocusFile(!focusFile)
        if (isToolPickerOpen) setFocusTool(!focusTool)
        if (isAssistantPickerOpen) setFocusAssistant(!focusAssistant)
      }
    }

    if (event.key === "ArrowUp" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToPreviousUserMessage()
    }

    if (event.key === "ArrowDown" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToNextUserMessage()
    }

    //use shift+ctrl+up and shift+ctrl+down to navigate through chat history
    if (event.key === "ArrowUp" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToPreviousUserMessage()
    }

    if (event.key === "ArrowDown" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToNextUserMessage()
    }

    if (
      isAssistantPickerOpen &&
      (event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown")
    ) {
      event.preventDefault()
      setFocusAssistant(!focusAssistant)
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const imagesAllowed = LLM_LIST.find(
      llm => llm.modelId === chatSettings?.model
    )?.imageInput

    const items = event.clipboardData.items
    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        if (!imagesAllowed) {
          toast.error(
            `Images are not supported for this model. Use models like GPT-4 Vision instead.`
          )
          return
        }
        const file = item.getAsFile()
        if (!file) return
        handleSelectDeviceFile(file)
      }
    }
  }

  const handleEnrichAgendaUpload = async (file: File, instructions: string) => {
    setUploadStatus("uploading")
    setProgress(10)
    setDownloadUrl(null)
    setDownloadFileName("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("instructions", instructions)
      setProgress(20)
      setUploadStatus("processing")
      const fileOpsEnv = process.env.NEXT_PUBLIC_BACKEND_FILEOPS_URL
      if (!fileOpsEnv) {
        throw new Error(
          "Environment variable NEXT_PUBLIC_BACKEND_FILEOPS_URL is not set. Please set it in your environment."
        )
      }
      const fileOpsUrl = fileOpsEnv.replace(/\/$/, "")
      const response = await fetch(
        fileOpsUrl + "/file_ops/enrich_agenda",
        {
          method: "POST",
          body: formData
        }
      )
      setProgress(70)
      if (!response.ok) throw new Error("Failed to process file")
      setUploadStatus("downloading")
      const blob = await response.blob()
      setProgress(90)
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      // Try to get filename from response header
      const disposition = response.headers.get("content-disposition")
      let fileName = file.name
      if (disposition && disposition.includes("filename=")) {
        fileName = disposition.split("filename=")[1].replace(/['"]/g, "")
      }
      setDownloadFileName(fileName.startsWith("enriched_") ? fileName : "enriched_" + fileName)
      setProgress(100)
      setUploadStatus("done")
    } catch (e) {
      setUploadStatus("error")
      setProgress(0)
      toast.error("Failed to enrich agenda file.")
    }
  }

  return (
    <>
      <div className="flex flex-col flex-wrap justify-center gap-2">
        <ChatFilesDisplay />

        {selectedTools &&
          selectedTools.map((tool, index) => (
            <div
              key={index}
              className="flex justify-center"
              onClick={() =>
                setSelectedTools(
                  selectedTools.filter(
                    selectedTool => selectedTool.id !== tool.id
                  )
                )
              }
            >
              <div className="flex cursor-pointer items-center justify-center space-x-1 rounded-lg bg-purple-600 px-3 py-1 hover:opacity-50">
                <IconBolt size={20} />

                <div>{tool.name}</div>
              </div>
            </div>
          ))}

        {selectedAssistant && (
          <div className="border-primary mx-auto flex w-fit items-center space-x-2 rounded-lg border p-1.5">
            {selectedAssistant.image_path && (
              <Image
                className="rounded"
                src={
                  assistantImages.find(
                    img => img.path === selectedAssistant.image_path
                  )?.base64
                }
                width={28}
                height={28}
                alt={selectedAssistant.name}
              />
            )}

            <div className="text-sm font-bold">
              Talking to {selectedAssistant.name}
            </div>
          </div>
        )}
      </div>

      <div className="border-input relative mt-3 flex min-h-[60px] w-full items-center justify-center rounded-xl border-2">
        <div className="absolute bottom-[76px] left-0 max-h-[300px] w-full overflow-auto rounded-xl dark:border-none">
          <ChatCommandInput />
        </div>

        <>
          <IconCirclePlus
            className="absolute bottom-[12px] left-3 cursor-pointer p-1 hover:opacity-50"
            size={32}
            onClick={() => fileInputRef.current?.click()}
          />

          {/* Hidden input to select files from device */}
          <Input
            ref={fileInputRef}
            className="hidden"
            type="file"
            onChange={e => {
              if (!e.target.files) return
              setSelectedEnrichFile(e.target.files[0])
              setShowEnrichPrompt(true)
            }}
            accept={filesToAccept}
          />
        </>

        {/* Enrichment instructions prompt */}
        {showEnrichPrompt && selectedEnrichFile && (
          <div className="absolute left-1/2 top-1/2 z-50 flex w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-lg border border-gray-300 bg-white p-6 shadow-xl">
            <div className="mb-1 font-semibold">Provide instructions for enrichment</div>
            <div className="mb-2 text-xs text-gray-500">Example: &#39;Find all the meeting topics and search for any related information contained in my documents and summarize.&#39;</div>
            <TextareaAutosize
              className="mb-2 w-full rounded border p-2"
              minRows={2}
              maxRows={6}
              value={enrichInstructions}
              onValueChange={setEnrichInstructions}
              placeholder="Enter your instructions here..."
            />
            <div className="flex justify-end gap-2">
              <button
                className="rounded bg-gray-200 px-4 py-1 hover:bg-gray-300"
                onClick={() => {
                  setShowEnrichPrompt(false)
                  setSelectedEnrichFile(null)
                  setEnrichInstructions("")
                }}
              >
                Cancel
              </button>
              <button
                className="rounded bg-blue-600 px-4 py-1 text-white hover:bg-blue-700"
                disabled={!enrichInstructions.trim()}
                onClick={() => {
                  setShowEnrichPrompt(false)
                  if (selectedEnrichFile && enrichInstructions.trim()) {
                    handleEnrichAgendaUpload(selectedEnrichFile, enrichInstructions.trim())
                  }
                  setSelectedEnrichFile(null)
                  setEnrichInstructions("")
                }}
              >
                Enrich & Upload
              </button>
            </div>
          </div>
        )}

        <TextareaAutosize
          textareaRef={chatInputRef}
          className="ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring text-md flex w-full resize-none rounded-md border-none bg-transparent px-14 py-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={t(
            // `Ask anything. Type "@" for assistants, "/" for prompts, "#" for files, and "!" for tools.`
            `Ask anything. Type @  /  #  !`
          )}
          onValueChange={handleInputChange}
          value={userInput}
          minRows={1}
          maxRows={18}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => setIsTyping(true)}
          onCompositionEnd={() => setIsTyping(false)}
        />

        <div className="absolute bottom-[14px] right-3 cursor-pointer hover:opacity-50">
          {isGenerating ? (
            <IconPlayerStopFilled
              className="hover:bg-background animate-pulse rounded bg-transparent p-1"
              onClick={handleStopMessage}
              size={30}
            />
          ) : (
            <IconSend
              className={cn(
                "bg-primary text-secondary rounded p-1",
                !userInput && "cursor-not-allowed opacity-50"
              )}
              onClick={() => {
                if (!userInput) return

                handleSendMessage(userInput, chatMessages, false)
              }}
              size={30}
            />
          )}
        </div>

        {uploadStatus && (
          <div className="w-full mt-2 flex flex-col items-center">
            <Progress value={progress} />
            <div className="text-xs mt-1">
              {uploadStatus === "uploading" && "Uploading..."}
              {uploadStatus === "processing" && "Processing..."}
              {uploadStatus === "downloading" && "Preparing download..."}
              {uploadStatus === "done" && downloadUrl && (
                <>
                  File ready.{" "}
                  <button
                    className="underline text-blue-600"
                    onClick={() => {
                      const a = document.createElement("a")
                      a.href = downloadUrl
                      a.download = downloadFileName
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      setDownloadUrl(null)
                      setUploadStatus(null)
                      setProgress(0)
                    }}
                  >
                    Download
                  </button>
                </>
              )}
              {uploadStatus === "error" && "Error during enrichment."}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
