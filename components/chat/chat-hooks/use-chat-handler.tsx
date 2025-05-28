"use client"

import { ChatbotUIContext } from "@/context/context"
import { getAssistantCollectionsByAssistantId } from "@/db/assistant-collections"
import { getAssistantFilesByAssistantId } from "@/db/assistant-files"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { updateChat } from "@/db/chats"
import { getCollectionFilesByCollectionId } from "@/db/collection-files"
import { deleteMessagesIncludingAndAfter } from "@/db/messages"
import { buildFinalMessages } from "@/lib/build-prompt"
import { generateLocalEmbedding } from "@/lib/generate-local-embedding"
import { Tables } from "@/supabase/types"
import { ChatMessage, ChatPayload, LLMID, ModelProvider } from "@/types"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useRef } from "react"
import { LLM_LIST } from "../../../lib/models/llm/llm-list"
import {
  createTempMessages,
  handleCreateChat,
  handleCreateMessages,
  handleHostedChat,
  handleLocalChat,
  handleRetrieval,
  processResponse,
  validateChatSettings
} from "../chat-helpers"

const RUN_SEARCH_PREFIX = "run search "
const isRunSearchCmd = (txt: string) =>
  txt.trim().toLowerCase().startsWith(RUN_SEARCH_PREFIX)
const stripRunSearch = (txt: string) =>
  txt.trim().substring(RUN_SEARCH_PREFIX.length)

export const useChatHandler = () => {
  const router = useRouter()

  const {
    userInput,
    chatFiles,
    setUserInput,
    setNewMessageImages,
    profile,
    setIsGenerating,
    setChatMessages,
    setFirstTokenReceived,
    selectedChat,
    selectedWorkspace,
    setSelectedChat,
    setChats,
    setSelectedTools,
    availableLocalModels,
    availableOpenRouterModels,
    abortController,
    setAbortController,
    chatSettings,
    newMessageImages,
    selectedAssistant,
    chatMessages,
    chatImages,
    setChatImages,
    setChatFiles,
    setNewMessageFiles,
    setShowFilesDisplay,
    newMessageFiles,
    chatFileItems,
    setChatFileItems,
    setToolInUse,
    useRetrieval,
    sourceCount,
    setIsPromptPickerOpen,
    setIsFilePickerOpen,
    selectedTools,
    selectedPreset,
    setChatSettings,
    models,
    isPromptPickerOpen,
    isFilePickerOpen,
    isToolPickerOpen
  } = useContext(ChatbotUIContext)

  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isPromptPickerOpen || !isFilePickerOpen || !isToolPickerOpen) {
      chatInputRef.current?.focus()
    }
  }, [isPromptPickerOpen, isFilePickerOpen, isToolPickerOpen])

  const handleNewChat = async () => {
    if (!selectedWorkspace) return

    /* reset state ... (same as original) */
    setUserInput("")
    setChatMessages([])
    setSelectedChat(null)
    setChatFileItems([])
    setIsGenerating(false)
    setFirstTokenReceived(false)
    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
    setIsPromptPickerOpen(false)
    setIsFilePickerOpen(false)
    setSelectedTools([])
    setToolInUse("none")

    /* assistant / preset logic unchanged - omitted for brevity */
    /* ... */

    return router.push(`/${selectedWorkspace.id}/chat`)
  }

  const handleFocusChatInput = () => chatInputRef.current?.focus()

  const handleStopMessage = () => abortController?.abort()

  const handleSendMessage = async (
    messageContent: string,
    chatMessages: ChatMessage[],
    isRegeneration: boolean
  ) => {
    const startingInput = messageContent

    /* custom run search path */
    let overrideRetrieved: Tables<"file_items">[] | null = null
    if (isRunSearchCmd(messageContent)) {
      const plainQuery = stripRunSearch(messageContent)
      const embedding = await generateLocalEmbedding(plainQuery)
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
        const res = await fetch(`${backendUrl}/api/file_ops/search_docs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embedding,
            user_id: profile?.id ?? null
          })
        })
        if (res.ok) {
          const data = await res.json()
          overrideRetrieved = data.retrieved_chunks ?? []
        }
      } catch (err) {
        console.error("Search backend failed", err)
      }
      messageContent = plainQuery
    }

    try {
      /* existing pre-flight setup */
      setUserInput("")
      setIsGenerating(true)
      setIsPromptPickerOpen(false)
      setIsFilePickerOpen(false)
      setNewMessageImages([])

      const newAbortController = new AbortController()
      setAbortController(newAbortController)

      /* model lookup and validation (unchanged) */
      const modelData = [
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
      ].find(l => l.modelId === chatSettings?.model)

      validateChatSettings(
        chatSettings,
        modelData,
        profile,
        selectedWorkspace,
        messageContent
      )

      let currentChat = selectedChat ? { ...selectedChat } : null

      const b64Images = newMessageImages.map(i => i.base64)
      let retrievedFileItems: Tables<"file_items">[] = []

      if (overrideRetrieved) {
        retrievedFileItems = overrideRetrieved
      } else if (
        (newMessageFiles.length > 0 || chatFiles.length > 0) &&
        useRetrieval
      ) {
        setToolInUse("retrieval")
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
        const res = await fetch(`${backendUrl}/api/file_ops/search_docs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embedding: await generateLocalEmbedding(userInput),
            user_id: profile?.id ?? null
          })
        })
        if (res.ok) {
          const data = await res.json()
          retrievedFileItems = data.retrieved_chunks ?? []
        }
      }

      /* create temp messages and payload – unchanged except messageFileItems */
      const { tempUserChatMessage, tempAssistantChatMessage } =
        createTempMessages(
          messageContent,
          chatMessages,
          chatSettings!,
          b64Images,
          isRegeneration,
          setChatMessages,
          selectedAssistant
        )

      const payload: ChatPayload = {
        chatSettings: chatSettings!,
        workspaceInstructions: selectedWorkspace!.instructions || "",
        chatMessages: isRegeneration
          ? [...chatMessages]
          : [...chatMessages, tempUserChatMessage],
        assistant: selectedChat?.assistant_id ? selectedAssistant : null,
        messageFileItems: retrievedFileItems,
        chatFileItems
      }

      /* rest of the original logic (tools / hosted / local chat) unchanged */
      /* ... */
    } catch (err) {
      setIsGenerating(false)
      setFirstTokenReceived(false)
      setUserInput(startingInput)
    }
  }

  const handleSendEdit = async (editedContent: string, sequenceNumber: number) => {
    if (!selectedChat) return
    await deleteMessagesIncludingAndAfter(
      selectedChat.user_id,
      selectedChat.id,
      sequenceNumber
    )
    const filtered = chatMessages.filter(
      m => m.message.sequence_number < sequenceNumber
    )
    setChatMessages(filtered)
    handleSendMessage(editedContent, filtered, false)
  }

  return {
    chatInputRef,
    prompt,
    handleNewChat,
    handleSendMessage,
    handleFocusChatInput,
    handleStopMessage,
    handleSendEdit
  }
}
