import { useContext, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChatbotUIContext } from "@/context/context"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { getEmbedding } from "@/lib/embedding"
import { searchDocs } from "@/lib/search-docs-api"
import { handleCreateChat, updateChat } from "@/db/chats"
import { handleLocalChat, handleHostedChat, buildFinalMessages, processResponse } from "../chat-helpers"

export const useChatHandler = () => {
  const router = useRouter()
  const {
    profile,
    chats,
    setChats,
    files,
    setFiles,
    models,
    setModels,
    selectedWorkspace,
    setSelectedWorkspace,
    selectedPreset,
    setSelectedPreset,
    selectedAssistant,
    setSelectedAssistant,
    userInput,
    setUserInput,
    selectedChat,
    setSelectedChat,
    chatMessages,
    setChatMessages,
    chatSettings,
    setChatSettings,
    chatFileItems,
    setChatFileItems,
    isGenerating,
    setIsGenerating,
    firstTokenReceived,
    setFirstTokenReceived,
    abortController,
    setAbortController,
    isPromptPickerOpen,
    setIsPromptPickerOpen,
    isFilePickerOpen,
    setIsFilePickerOpen,
    chatFiles,
    setChatFiles,
    chatImages,
    setChatImages,
    newMessageFiles,
    setNewMessageFiles,
    newMessageImages,
    setNewMessageImages,
    showFilesDisplay,
    setShowFilesDisplay,
    useRetrieval,
    setUseRetrieval,
    sourceCount,
    setSourceCount,
    selectedTools,
    setSelectedTools,
    toolInUse,
    setToolInUse,
    // ...other context values if needed
  } = useContext(ChatbotUIContext)

  const chatInputRef = useRef<HTMLInputElement>(null)

  // Inlined validateChatSettings logic
  function validateChatSettings(
    chatSettings: any,
    modelData: any,
    profile: any,
    selectedWorkspace: any,
    messageContent: string
  ) {
    if (!chatSettings) throw new Error("Chat settings must be set.")
    if (!modelData) throw new Error("Selected model not found.")
    if (!profile) throw new Error("User profile not found.")
    if (!selectedWorkspace) throw new Error("No workspace selected.")
    if (!messageContent) throw new Error("Message content is empty.")
  }

  // Inlined retrieval handler logic (dummy for now, could be replaced if needed)
  async function handleRetrieval(
    userInput: string,
    newMessageFiles: any[],
    chatFiles: any[],
    embeddingsProvider: any,
    sourceCount: number
  ) {
    // You can implement retrieval logic here if used elsewhere in your code.
    return []
  }

  // Inlined message creation logic (dummy for now, could be expanded)
  async function handleCreateMessages(
    chatMessages: any[],
    currentChat: any,
    profile: any,
    modelData: any,
    messageContent: string,
    generatedText: string,
    newMessageImages: any[],
    isRegeneration: boolean,
    retrievedFileItems: any[],
    setChatMessages: any,
    setChatFileItems: any,
    setChatImages: any,
    selectedAssistant: any
  ) {
    // Example: just append the assistant's message
    setChatMessages([
      ...chatMessages,
      {
        id: `assistant-message-${Date.now()}`,
        role: "assistant",
        content: generatedText
      }
    ])
  }

  const handleNewChat = async () => {
    setChatMessages([])
    setChatFileItems([])
    setChatFiles([])
    setChatImages([])
    setSelectedChat(null)
    setSelectedAssistant(null)
    setSelectedPreset(null)
    setShowFilesDisplay(false)
    setUserInput("")
    setIsGenerating(false)
    setFirstTokenReceived(false)
    setAbortController(null)
    setNewMessageFiles([])
    setNewMessageImages([])
    setUseRetrieval(false)
    setSourceCount(3)
    setSelectedTools([])
    setToolInUse("none")

    if (files.length > 0) {
      setShowFilesDisplay(true)
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
    chatMessages: any[],
    isRegeneration: boolean
  ) => {
    const startingInput = messageContent

    try {
      setUserInput("")
      setIsGenerating(true)
      setIsPromptPickerOpen(false)
      setIsFilePickerOpen(false)
      setNewMessageImages([])

      const newAbortController = new AbortController()
      setAbortController(newAbortController)

      // ---- "search my" intent handling ----
      if (
        typeof messageContent === "string" &&
        messageContent.toLowerCase().includes("search my") &&
        profile?.id
      ) {
        let embedding: number[]
        let retrievalChunks: any[] = []

        try {
          embedding = await getEmbedding(messageContent)
        } catch (embeddingError) {
          setChatMessages([
            ...chatMessages,
            {
              id: `assistant-embedding-error-${Date.now()}`,
              role: "assistant",
              content: "Sorry, there was an error generating your search embedding."
            }
          ])
          setIsGenerating(false)
          return
        }

        try {
          retrievalChunks = await searchDocs({
            embedding,
            user_id: profile.id
          })
        } catch (retrievalError) {
          setChatMessages([
            ...chatMessages,
            {
              id: `assistant-retrieval-error-${Date.now()}`,
              role: "assistant",
              content: "Sorry, there was an error searching your documents."
            }
          ])
          setIsGenerating(false)
          return
        }

        if (retrievalChunks.length > 0) {
          const resultsText = retrievalChunks
            .map(
              (chunk: any, idx: number) =>
                `**Result ${idx + 1}:**\n${chunk.content || JSON.stringify(chunk)}`
            )
            .join("\n\n")

          setChatMessages([
            ...chatMessages,
            {
              id: `assistant-retrieval-results-${Date.now()}`,
              role: "assistant",
              content:
                "Here are the results from your search:\n\n" +
                resultsText +
                (retrievalChunks.length === 10
                  ? "\n\n_(Note: Only the first 10 results are shown.)_"
                  : "")
            }
          ])
        } else {
          setChatMessages([
            ...chatMessages,
            {
              id: `assistant-retrieval-no-results-${Date.now()}`,
              role: "assistant",
              content: "No results found for your search."
            }
          ])
        }

        setIsGenerating(false)
        return // Prevents LLM or other chat logic from running
      }
      // ---- END PATCH ----

      const modelData = [
        ...models.map(model => ({
          modelId: model.model_id,
          modelName: model.name,
          provider: "custom",
          hostedId: model.id,
          platformLink: "",
          imageInput: false
        })),
        ...LLM_LIST
      ].find(llm => llm.modelId === chatSettings?.model)

      validateChatSettings(
        chatSettings,
        modelData,
        profile,
        selectedWorkspace,
        messageContent
      )

      let currentChat = selectedChat ? { ...selectedChat } : null

      const b64Images = newMessageImages.map((image: any) => image.base64)

      let retrievedFileItems: any[] = []

      if (
        (newMessageFiles.length > 0 || chatFiles.length > 0) &&
        useRetrieval
      ) {
        setToolInUse("retrieval")

        retrievedFileItems = await handleRetrieval(
          userInput,
          newMessageFiles,
          chatFiles,
          chatSettings!.embeddingsProvider,
          sourceCount
        )
      }

      // Minimal temp message logic for demonstration
      const tempUserChatMessage = {
        id: `user-message-temp-${Date.now()}`,
        role: "user",
        content: messageContent
      }
      const tempAssistantChatMessage = {
        id: `assistant-message-temp-${Date.now()}`,
        role: "assistant",
        content: ""
      }

      let payload: any = {
        chatSettings: chatSettings!,
        workspaceInstructions: selectedWorkspace!.instructions || "",
        chatMessages: isRegeneration
          ? [...chatMessages]
          : [...chatMessages, tempUserChatMessage],
        assistant: selectedChat?.assistant_id ? selectedAssistant : null,
        messageFileItems: retrievedFileItems,
        chatFileItems: chatFileItems
      }

      let generatedText = ""

      if (selectedTools.length > 0) {
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
      } else {
        if (modelData!.provider === "ollama") {
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
      }

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

        setChats((prevChats: any[]) => {
          const updatedChats = prevChats.map(prevChat =>
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
        selectedAssistant
      )

      setIsGenerating(false)
      setFirstTokenReceived(false)
    } catch (error) {
      setIsGenerating(false)
      setFirstTokenReceived(false)
      setUserInput(startingInput)
    }
  }

  const handleSendEdit = async (
    editedContent: string,
    chatMessages: any[],
    sequenceNumber: number
  ) => {
    // Implement your edit logic here if needed
  }

  return {
    chatInputRef,
    handleNewChat,
    handleSendMessage,
    handleStopMessage,
    handleFocusChatInput,
    handleSendEdit
  }
}