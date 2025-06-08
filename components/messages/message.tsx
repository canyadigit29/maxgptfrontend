import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import { Tables } from "@/supabase/types"
import { LLM, LLMID, MessageImage, ModelProvider } from "@/types"
import {
  IconBolt,
  IconCaretDownFilled,
  IconCaretRightFilled,
  IconCircleFilled,
  IconFileText,
  IconMoodSmile,
  IconPencil
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { ModelIcon } from "../models/model-icon"
import { Button } from "../ui/button"
import { FileIcon } from "../ui/file-icon"
import { FilePreview } from "../ui/file-preview"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { WithTooltip } from "../ui/with-tooltip"
import { MessageActions } from "./message-actions"
import { MessageMarkdown } from "./message-markdown"
import { PdfViewerDialog } from "../ui/pdf-viewer-dialog"
import { getFileFromStorage } from "@/db/storage/files"
import { AgendaEnrichResults } from "./agenda-enrich-results"

const ICON_SIZE = 32

interface MessageProps {
  message: Tables<"messages">
  fileItems: Tables<"file_items">[]
  isEditing: boolean
  isLast: boolean
  onStartEdit: (message: Tables<"messages">) => void
  onCancelEdit: () => void
  onSubmitEdit: (value: string, sequenceNumber: number) => void
}

export const Message: FC<MessageProps> = ({
  message,
  fileItems,
  isEditing,
  isLast,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit
}) => {
  const {
    assistants,
    profile,
    isGenerating,
    setIsGenerating,
    firstTokenReceived,
    availableLocalModels,
    availableOpenRouterModels,
    chatMessages,
    selectedAssistant,
    chatImages,
    assistantImages,
    toolInUse,
    files,
    models
  } = useContext(ChatbotUIContext)

  const { handleSendMessage } = useChatHandler()

  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const [isHovering, setIsHovering] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message.content)

  const [showImagePreview, setShowImagePreview] = useState(false)
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null)

  const [showFileItemPreview, setShowFileItemPreview] = useState(false)
  const [selectedFileItem, setSelectedFileItem] = useState<Tables<"file_items"> | null>(null)

  const [showFilePreview, setShowFilePreview] = useState(false)
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<any>(null)
  const [highlightedChunks, setHighlightedChunks] = useState<string[]>([])

  const [viewSources, setViewSources] = useState(false)
  const [showPdfDialog, setShowPdfDialog] = useState(false)
  const [selectedPdfFile, setSelectedPdfFile] = useState<any>(null)
  const [pdfHighlightText, setPdfHighlightText] = useState<string | undefined>(undefined)
  const [pdfHighlightTexts, setPdfHighlightTexts] = useState<string[]>([]) // Add state for pdfHighlightTexts

  const [showSources, setShowSources] = useState(false); // Add missing useState for showSources toggle

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content)
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = message.content
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
  }

  const handleSendEdit = () => {
    onSubmitEdit(editedMessage, message.sequence_number)
    onCancelEdit()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isEditing && event.key === "Enter" && event.metaKey) {
      handleSendEdit()
    }
  }

  const handleRegenerate = async () => {
    setIsGenerating(true)
    await handleSendMessage(
      editedMessage || chatMessages[chatMessages.length - 2].message.content,
      chatMessages,
      true
    )
  }

  const handleStartEdit = () => {
    onStartEdit(message)
  }

  useEffect(() => {
    setEditedMessage(message.content)
  }, [message.content, isEditing])

  const MODEL_DATA = [
    ...models.map(model => ({
      modelId: model.model_id as LLMID,
      modelName: model.name,
      provider: "custom" as ModelProvider,
      hostedId: model.id,
      platformLink: "",
      imageInput: false
    })),
    ...LLM_LIST,
    ...availableLocalModels,
    ...availableOpenRouterModels
  ].find(llm => llm.modelId === message.model) as LLM

  const messageAssistantImage = assistantImages.find(
    image => image.assistantId === message.assistant_id
  )?.base64

  const selectedAssistantImage = assistantImages.find(
    image => image.path === selectedAssistant?.image_path
  )?.base64

  const modelDetails = LLM_LIST.find(model => model.modelId === message.model)

  const fileAccumulator: Record<
    string,
    {
      id: string
      name: string
      count: number
      type: string
      description: string
    }
  > = {}

  const fileSummary = fileItems.reduce((acc, fileItem) => {
    const parentFile = files.find(file => file.id === fileItem.file_id)
    if (parentFile) {
      if (!acc[parentFile.id]) {
        acc[parentFile.id] = {
          id: parentFile.id,
          name: parentFile.name,
          count: 1,
          type: parentFile.type,
          description: parentFile.description
        }
      } else {
        acc[parentFile.id].count += 1
      }
    }
    return acc
  }, fileAccumulator)

  // PDF click handler
  const handlePdfClick = async (file: any) => {
    const fullFile = files.find((f: any) => f.id === file.id);
    if (fullFile && fullFile.file_path) {
      const signedUrl = await getFileFromStorage(fullFile.file_path);
      // Open in new tab with download attribute for filename
      const a = document.createElement('a');
      a.href = signedUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = fullFile.name || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("Could not find file path for PDF.");
    }
  };

  return (
    <div
      className={cn(
        "flex w-full justify-center",
        message.role === "user" ? "" : "bg-secondary"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onKeyDown={handleKeyDown}
    >
      <div className="relative flex w-full flex-col p-6 sm:w-[550px] sm:px-0 md:w-[650px] lg:w-[650px] xl:w-[700px]">
        <div className="absolute right-5 top-7 sm:right-0">
          <MessageActions
            onCopy={handleCopy}
            onEdit={handleStartEdit}
            isAssistant={message.role === "assistant"}
            isLast={isLast}
            isEditing={isEditing}
            isHovering={isHovering}
            onRegenerate={handleRegenerate}
          />
        </div>
        <div className="space-y-3">
          {message.role === "system" ? (
            <div className="flex items-center space-x-4">
              <IconPencil
                className="border-primary bg-primary text-secondary rounded border-DEFAULT p-1"
                size={ICON_SIZE}
              />

              <div className="text-lg font-semibold">Prompt</div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {message.role === "assistant" ? (
                messageAssistantImage ? (
                  <Image
                    style={{
                      width: `${ICON_SIZE}px`,
                      height: `${ICON_SIZE}px`
                    }}
                    className="rounded"
                    src={messageAssistantImage}
                    alt="assistant image"
                    height={ICON_SIZE}
                    width={ICON_SIZE}
                  />
                ) : (
                  <WithTooltip
                    display={<div>{MODEL_DATA?.modelName}</div>}
                    trigger={
                      <ModelIcon
                        provider={modelDetails?.provider || "custom"}
                        height={ICON_SIZE}
                        width={ICON_SIZE}
                      />
                    }
                  />
                )
              ) : profile?.image_url ? (
                <Image
                  className={`size-[32px] rounded`}
                  src={profile?.image_url}
                  height={32}
                  width={32}
                  alt="user image"
                />
              ) : (
                <IconMoodSmile
                  className="bg-primary text-secondary border-primary rounded border-DEFAULT p-1"
                  size={ICON_SIZE}
                />
              )}

              <div className="font-semibold">
                {message.role === "assistant"
                  ? message.assistant_id
                    ? assistants.find(
                        assistant => assistant.id === message.assistant_id
                      )?.name
                    : selectedAssistant
                      ? selectedAssistant?.name
                      : MODEL_DATA?.modelName
                  : profile?.display_name ?? profile?.username}
              </div>
            </div>
          )}
          {!firstTokenReceived &&
          isGenerating &&
          isLast &&
          message.role === "assistant" ? (
            <>
              {(() => {
                switch (toolInUse) {
                  case "none":
                    return (
                      <IconCircleFilled className="animate-pulse" size={20} />
                    )
                  case "retrieval":
                    return (
                      <div className="flex animate-pulse items-center space-x-2">
                        <IconFileText size={20} />

                        <div>Searching files...</div>
                      </div>
                    )
                  default:
                    return (
                      <div className="flex animate-pulse items-center space-x-2">
                        <IconBolt size={20} />

                        <div>Using {toolInUse}...</div>
                      </div>
                    )
                }
              })()}
            </>
          ) : isEditing ? (
            <TextareaAutosize
              textareaRef={editInputRef}
              className="text-md"
              value={editedMessage}
              onValueChange={setEditedMessage}
              maxRows={20}
            />
          ) : (
            (() => {
              // Try to parse agenda enrichment results JSON
              try {
                const parsed = JSON.parse(message.content)
                if (
                  parsed &&
                  parsed.topics &&
                  Array.isArray(parsed.topics) &&
                  parsed.topics.length > 0 &&
                  parsed.topics[0].title &&
                  parsed.topics[0].summary &&
                  parsed.topics[0].retrieved_chunks
                ) {
                  return <AgendaEnrichResults results={parsed.topics} />
                }
              } catch (e) {
                // Not JSON, fallback to markdown
              }
              return <MessageMarkdown content={message.content} />
            })()
          )}
        </div>

        {fileItems.length > 0 && (
          <div className="border-primary mt-6 border-t pt-4 font-bold">
            <div
              className="flex cursor-pointer items-center text-lg hover:opacity-50"
              onClick={() => setShowSources(v => !v)}
            >
              {fileItems.length} {fileItems.length > 1 ? "Sources" : "Source"} from {Object.keys(fileSummary).length} {Object.keys(fileSummary).length > 1 ? "Files" : "File"}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="M9 6c0 -.852 .986 -1.297 1.623 -.783l.084 .076l6 6a1 1 0 0 1 .083 1.32l-.083 .094l-6 6l-.094 .083l-.077 .054l-.096 .054l-.036 .017l-.067 .027l-.108 .032l-.053 .01l-.06 .01l-.057 .004l-.059 .002l-.059 -.002l-.058 -.005l-.06 -.009l-.052 -.01l-.108 -.032l-.067 -.027l-.132 -.07l-.09 -.065l-.081 -.073l-.083 -.094l-.054 -.077l-.054 -.096l-.017 -.036l-.027 -.067l-.032 -.108l-.01 -.053l-.01 -.06l-.004 -.057l-.002 -12.059z" fill="currentColor" strokeWidth="0"></path>
              </svg>
            </div>
            {showSources && (
              <div className="mt-3 space-y-4">
                {Object.values(fileSummary).map((file, index) => (
                  <div key={index}>
                    <div className="flex items-center space-x-2">
                      <div>
                        <FileIcon type={file.type} />
                      </div>
                      <div
                        className="truncate underline text-blue-600 cursor-pointer hover:opacity-50"
                        onClick={() => {
                          if (file.type === "pdf" || file.name?.toLowerCase().endsWith(".pdf")) {
                            handlePdfClick(file);
                          } else {
                            setSelectedFileForPreview(file)
                            const chunks = fileItems
                              .filter((fileItem: any) => fileItem.file_id === file.id)
                              .map((fileItem: any) => fileItem.content)
                            setHighlightedChunks(chunks)
                            setShowFilePreview(true)
                          }
                        }}
                      >
                        {file.name}
                      </div>
                    </div>
                    {fileItems
                      .filter(fileItem => {
                        const parentFile = files.find(
                          parentFile => parentFile.id === fileItem.file_id
                        )
                        return parentFile?.id === file.id
                      })
                      .map((fileItem, index) => (
                        <div
                          key={index}
                          className="ml-8 mt-1.5 flex cursor-pointer items-center space-x-2 hover:opacity-50"
                          onClick={() => {
                            setSelectedFileItem(fileItem)
                            setShowFileItemPreview(true)
                          }}
                        >
                          <div className="text-sm font-normal">
                            <span className="mr-1 text-lg font-bold">-</span>{" "}
                            {fileItem.content.substring(0, 200)}...
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {message.image_paths.map((path, index) => {
            const item = chatImages.find(image => image.path === path)

            return (
              <Image
                key={index}
                className="cursor-pointer rounded hover:opacity-50"
                src={path.startsWith("data") ? path : item?.base64}
                alt="message image"
                width={300}
                height={300}
                onClick={() => {
                  setSelectedImage({
                    messageId: message.id,
                    path,
                    base64: path.startsWith("data") ? path : item?.base64 || "",
                    url: path.startsWith("data") ? "" : item?.url || "",
                    file: null
                  })

                  setShowImagePreview(true)
                }}
                loading="lazy"
              />
            )
          })}
        </div>
        {isEditing && (
          <div className="mt-4 flex justify-center space-x-2">
            <Button size="sm" onClick={handleSendEdit}>
              Save & Send
            </Button>

            <Button size="sm" variant="outline" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {showImagePreview && selectedImage && (
        <FilePreview
          type="image"
          item={selectedImage}
          isOpen={showImagePreview}
          onOpenChange={(isOpen: boolean) => {
            setShowImagePreview(isOpen)
            setSelectedImage(null)
          }}
        />
      )}

      {showFileItemPreview && selectedFileItem && (
        <FilePreview
          type="file_item"
          item={selectedFileItem}
          isOpen={showFileItemPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowFileItemPreview(isOpen)
            setSelectedFileItem(null)
          }}
        />
      )}

      {showFilePreview && selectedFileForPreview && (
        <FilePreview
          type="file"
          item={selectedFileForPreview}
          isOpen={showFilePreview}
          onOpenChange={(isOpen: boolean) => {
            setShowFilePreview(isOpen)
            setSelectedFileForPreview(null)
            setHighlightedChunks([])
          }}
          highlightedChunks={highlightedChunks}
        />
      )}

      {showPdfDialog && selectedPdfFile && (
        <PdfViewerDialog
          file={selectedPdfFile}
          highlightTexts={pdfHighlightTexts}
          isOpen={showPdfDialog}
          onOpenChange={(isOpen: boolean) => {
            setShowPdfDialog(isOpen)
            setSelectedPdfFile(null)
            setPdfHighlightTexts([])
          }}
        />
      )}
    </div>
  )
}
