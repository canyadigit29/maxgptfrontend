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
  const { profile } = useContext(ChatbotUIContext)

  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const [isTyping, setIsTyping] = useState<boolean>(false)

  // Add prop/state for follow-up context (simulate with a placeholder for now)
  const [followupContextActive, setFollowupContextActive] = useState(false)

  const {
    selectedEnrichFile,
    setSelectedEnrichFile,
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
      if (selectedEnrichFile) {
        handleSendMessageWithEnrichment(userInput, chatMessages, false)
      } else {
        handleSendMessage(userInput, chatMessages, false)
      }
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

  const chatContext = useContext(ChatbotUIContext)
  // On file select, prompt user in chat for instructions
  const handleFileSelectForEnrichment = (file: File) => {
    setSelectedEnrichFile(file)
    chatContext.setChatMessages((prev: any[]) => [
      ...prev,
      {
        message: {
          id: `sys-enrich-prompt-${Date.now()}`,
          role: "assistant",
          content: "Please provide instructions for how you'd like this file to be enriched.",
          created_at: new Date().toISOString(),
          sequence_number: prev.length,
          chat_id: "",
          assistant_id: null,
          user_id: "",
          model: chatSettings?.model || "",
          image_paths: [],
          updated_at: ""
        },
        fileItems: []
      }
    ])
  }

  // Intercept send message: if file is pending, treat user input as instructions
  const handleSendMessageWithEnrichment = async (messageContent: string, chatMessages: any[], isRegeneration: boolean) => {
    if (selectedEnrichFile) {
      try {
        const formData = new FormData()
        formData.append("file", selectedEnrichFile)
        formData.append("instructions", messageContent)
        formData.append("user_id", profile?.user_id || "")
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
        if (!response.ok) throw new Error("Failed to process file")
        // Expect JSON response
        const json = await response.json()
        // Add enrichment results as a chat message
        chatContext.setChatMessages((prev: any[]) => [
          ...prev,
          {
            message: {
              id: `sys-enrich-results-${Date.now()}`,
              role: "assistant",
              content: JSON.stringify(json),
              created_at: new Date().toISOString(),
              sequence_number: prev.length,
              chat_id: "",
              assistant_id: null,
              user_id: "",
              model: chatSettings?.model || "",
              image_paths: [],
              updated_at: ""
            },
            fileItems: []
          }
        ])
      } catch (e) {
        toast.error("Failed to enrich agenda file.")
      }
      setSelectedEnrichFile(null)
      chatContext.setUserInput("")
      return
    }
    handleSendMessage(messageContent, chatMessages, isRegeneration)
  }

  // Handler to clear context
  const handleClearContext = () => {
    setFollowupContextActive(false)
    toast.success("Context cleared. You can start a new search.")
  }

  return (
    <div className="w-full">
      {/* Context info box (show only if follow-up context is active) */}
      {followupContextActive && (
        <div className="mb-2 flex items-center justify-between rounded bg-blue-50 px-3 py-2 text-sm text-blue-800 font-medium border border-blue-200">
          <span>Follow-up mode: Your next message will use previous search context.</span>
          <button
            className="ml-4 text-xs font-semibold text-blue-700 underline hover:opacity-80"
            onClick={handleClearContext}
          >
            Clear context
          </button>
        </div>
      )}

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
              handleFileSelectForEnrichment(e.target.files[0])
            }}
            accept={filesToAccept}
          />
        </>

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
                handleSendMessageWithEnrichment(userInput, chatMessages, false)
              }}
              size={30}
            />
          )}
        </div>
      </div>
    </div>
  )
}
