import { ChatbotUIContext } from "@/context/context"
import { getAssistantCollectionsByAssistantId } from "@/db/assistant-collections"
import { getAssistantFilesByAssistantId } from "@/db/assistant-files"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { updateChat } from "@/db/chats"
import { getCollectionFilesByCollectionId } from "@/db/collection-files"
import { deleteMessagesIncludingAndAfter } from "@/db/messages"
import { buildFinalMessages } from "@/lib/build-prompt"
import { Tables } from "@/supabase/types"
import { ChatMessage, ChatPayload, LLMID, ModelProvider } from "@/types"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useRef } from "react"
import { LLM_LIST } from "../../../lib/models/llm/llm-list"
import {
  createTempMessages,
  handleBackendSearch,
  handleCreateChat,
  handleCreateMessages,
  handleHostedChat,
  handleLocalChat,
  handleRetrieval,
  processResponse,
  validateChatSettings
} from "../chat-helpers"
import { toast } from "sonner"

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
    isToolPickerOpen,
    setSearchSummary
  } = useContext(ChatbotUIContext)

  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isPromptPickerOpen || !isFilePickerOpen || !isToolPickerOpen) {
      chatInputRef.current?.focus()
    }
  }, [isPromptPickerOpen, isFilePickerOpen, isToolPickerOpen])

  const handleNewChat = async () => {
    if (!selectedWorkspace) return

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

    if (selectedAssistant) {
      setChatSettings({
        model: selectedAssistant.model as LLMID,
        prompt: selectedAssistant.prompt,
        temperature: selectedAssistant.temperature,
        contextLength: selectedAssistant.context_length,
        includeProfileContext: selectedAssistant.include_profile_context,
        includeWorkspaceInstructions:
          selectedAssistant.include_workspace_instructions,
        embeddingsProvider: selectedAssistant.embeddings_provider as
          | "openai"
          | "local"
      })

      let allFiles = []

      const assistantFiles = (
        await getAssistantFilesByAssistantId(selectedAssistant.id)
      ).files
      allFiles = [...assistantFiles]
      const assistantCollections = (
        await getAssistantCollectionsByAssistantId(selectedAssistant.id)
      ).collections
      for (const collection of assistantCollections) {
        const collectionFiles = (
          await getCollectionFilesByCollectionId(collection.id)
        ).files
        allFiles = [...allFiles, ...collectionFiles]
      }
      const assistantTools = (
        await getAssistantToolsByAssistantId(selectedAssistant.id)
      ).tools

      setSelectedTools(assistantTools)
      setChatFiles(
        allFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          file: null
        }))
      )

      if (allFiles.length > 0) setShowFilesDisplay(true)
    } else if (selectedPreset) {
      setChatSettings({
        model: selectedPreset.model as LLMID,
        prompt: selectedPreset.prompt,
        temperature: selectedPreset.temperature,
        contextLength: selectedPreset.context_length,
        includeProfileContext: selectedPreset.include_profile_context,
        includeWorkspaceInstructions:
          selectedPreset.include_workspace_instructions,
        embeddingsProvider: selectedPreset.embeddings_provider as
          | "openai"
          | "local"
      })
    } else if (selectedWorkspace) {
      // setChatSettings({
      //   model: (selectedWorkspace.default_model ||
      //     "gpt-4-1106-preview") as LLMID,
      //   prompt:
      //     selectedWorkspace.default_prompt ||
      //     "You are a friendly, helpful AI assistant.",
      //   temperature: selectedWorkspace.default_temperature || 0.5,
      //   contextLength: selectedWorkspace.default_context_length || 4096,
      //   includeProfileContext:
      //     selectedWorkspace.include_profile_context || true,
      //   includeWorkspaceInstructions:
      //     selectedWorkspace.include_workspace_instructions || true,
      //   embeddingsProvider:
      //     (selectedWorkspace.embeddings_provider as "openai" | "local") ||
      //     "openai"
      // })
    }

    return router.push(`/${selectedWorkspace.id}/chat`)
  }

  const handleFocusChatInput = () => {
    chatInputRef.current?.focus()
  }

  const handleStopMessage = () => {
    if (abortController) {
      abortController.abort()
    }
  }

  const handleSendMessage = async (
    messageContent: string,
    chatMessages: ChatMessage[],
    isRegeneration: boolean
  ) => {
    const startingInput = messageContent
    try {
      // Debug: log the incoming message
      console.debug("[chat] handleSendMessage called", { messageContent, isRegeneration })
      setUserInput("")
      setIsGenerating(true)
      setIsPromptPickerOpen(false)
      setIsFilePickerOpen(false)
      setNewMessageImages([])
      const newAbortController = new AbortController()
      setAbortController(newAbortController)

      // Detect 'run search' command
      const isRunSearch = messageContent.trim().toLowerCase().startsWith("run search")
      let retrievedFileItems: Tables<"file_items">[] = []
      let backendSearchResults: any[] = []
      let runSearchDebugInfo = {}

      // Detect 'run ingestion' command
      const isRunIngestion = messageContent.trim().toLowerCase().startsWith("run ingestion")
      if (isRunIngestion) {
        try {
          // If backendUrl ends with /chat, remove it for ingestion endpoint
          let backendUrl = process.env.NEXT_PUBLIC_BACKEND_SEARCH_URL || "https://your-backend-search-url/chat"
          if (backendUrl.endsWith("/chat")) {
            backendUrl = backendUrl.replace(/\/chat$/, "")
          }
          const response = await fetch(`${backendUrl}/background_ingest_all`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          })
          if (!response.ok) {
            toast.error("Failed to start global ingestion.")
          } else {
            toast.success("Global ingestion started.")
          }
        } catch (err) {
          toast.error("Error triggering global ingestion.")
        }
        setIsGenerating(false)
        setFirstTokenReceived(false)
        return
      }

      // Move b64Images declaration above its first use
      const b64Images = newMessageImages.map((image: any) => image.base64)

      // Move temp message creation and chat pipeline after all retrieval logic
      let modelData = [
        ...models.map((model: any) => ({
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
      ].find((llm: any) => llm.modelId === chatSettings?.model)

      let payload: ChatPayload = {
        chatSettings: chatSettings!,
        workspaceInstructions: selectedWorkspace!.instructions || "",
        chatMessages: isRegeneration
          ? [...chatMessages]
          : [...chatMessages], // Will be updated below for run search
        assistant: selectedChat?.assistant_id ? selectedAssistant : null,
        messageFileItems: [],
        chatFileItems: []
      }

      let tempAssistantChatMessage: ChatMessage = {
        message: {
          id: "temp-assistant-message",
          chat_id: selectedChat?.id || "",
          user_id: profile?.user_id || "",
          assistant_id: selectedAssistant?.id || null,
          role: "assistant",
          content: "",
          model: chatSettings?.model || "",
          sequence_number: chatMessages.length + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          image_paths: []
        },
        fileItems: []
      }

      let generatedText = ""
      let searchId: string | undefined = undefined
      if (isRunSearch) {
        // Always store the message in chat history (handled below)
        // Call backend_search /chat endpoint
        console.debug("[run search] Triggered for message:", messageContent)
        const backendSearchResults = await handleBackendSearch(
          messageContent,
          profile?.user_id || "",
          selectedChat?.id || selectedWorkspace?.id || ""
        )
        // Store summary in context for UI display
        setSearchSummary?.(backendSearchResults.summary)
        // Limit to 100 results
        retrievedFileItems = backendSearchResults.retrieved_chunks.slice(0, 100)
        runSearchDebugInfo = { backendSearchResultsCount: backendSearchResults.retrieved_chunks.length, usedCount: retrievedFileItems.length }
        console.debug("[run search] Results processed", runSearchDebugInfo)
        // Use the summary as the assistant's message content
        generatedText = backendSearchResults.summary?.trim() || "[No summary available. Results injected, ready for follow-up questions.]"
        searchId = backendSearchResults.search_id
        console.debug("[run search] Assistant ready for follow-up with summary.")
      } else if (selectedTools.length > 0) {
        setToolInUse("Tools")
        const formattedMessages = await buildFinalMessages(
          payload,
          profile!,
          chatImages
        )
        const response = await fetch("/api/chat/tools", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chatSettings: payload.chatSettings,
            messages: formattedMessages,
            selectedTools
          })
        })
        setToolInUse("none")
        generatedText = await processResponse(
          response,
          isRegeneration
            ? payload.chatMessages[payload.chatMessages.length - 1]
            : tempAssistantChatMessage,
          true,
          newAbortController,
          setFirstTokenReceived,
          setChatMessages,
          setToolInUse
        )
      } else if (modelData!.provider === "ollama") {
        generatedText = await handleLocalChat(
          payload,
          profile!,
          chatSettings!,
          tempAssistantChatMessage,
          isRegeneration,
          newAbortController,
          setIsGenerating,
          setFirstTokenReceived,
          setChatMessages,
          setToolInUse
        )
      } else {
        generatedText = await handleHostedChat(
          payload,
          profile!,
          modelData!,
          tempAssistantChatMessage,
          isRegeneration,
          newAbortController,
          newMessageImages,
          chatImages,
          setIsGenerating,
          setFirstTokenReceived,
          setChatMessages,
          setToolInUse
        )
      }

      // For 'run search', skip embedding and modelData logic, but still create temp messages and continue pipeline
      let currentChat = selectedChat ? { ...selectedChat } : null

      // Always create or update chat and messages, so context is preserved
      if (!currentChat) {
        currentChat = await handleCreateChat(
          chatSettings!,
          profile!,
          selectedWorkspace!,
          messageContent,
          selectedAssistant!,
          newMessageFiles,
          setSelectedChat,
          setChats,
          setChatFiles
        )
      } else {
        const updatedChat = await updateChat(currentChat.id, {
          updated_at: new Date().toISOString()
        })
        setChats((prevChats: any) => {
          const updatedChats = prevChats.map((prevChat: any) =>
            prevChat.id === updatedChat.id ? updatedChat : prevChat
          )
          return updatedChats
        })
      }
      await handleCreateMessages(
        chatMessages,
        currentChat,
        profile!,
        modelData!,
        messageContent,
        generatedText,
        newMessageImages,
        isRegeneration,
        retrievedFileItems,
        setChatMessages,
        setChatFileItems,
        setChatImages,
        selectedAssistant,
        searchId // PATCH: pass searchId to handleCreateMessages
      )
      setIsGenerating(false)
      setFirstTokenReceived(false)
      console.debug("[chat] handleSendMessage completed")
    } catch (error) {
      setIsGenerating(false)
      setFirstTokenReceived(false)
      setUserInput(startingInput)
    }
  }

  const handleSendEdit = async (
    editedContent: string,
    sequenceNumber: number
  ) => {
    if (!selectedChat) return

    await deleteMessagesIncludingAndAfter(
      selectedChat.user_id,
      selectedChat.id,
      sequenceNumber
    )

    const filteredMessages = chatMessages.filter(
      (chatMessage: ChatMessage) => chatMessage.message.sequence_number < sequenceNumber
    )

    setChatMessages(filteredMessages)

    handleSendMessage(editedContent, filteredMessages, false)
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
