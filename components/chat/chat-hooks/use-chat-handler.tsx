import { useContext, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChatbotUIContext } from "@/context/context"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { createTempMessages } from "./chat-helpers"
import { validateChatSettings } from "./validate-chat-settings"
import { handleRetrieval } from "./retrieval-handler"
import { handleCreateChat, updateChat } from "@/db/chats"
import { handleCreateMessages } from "./message-handler"
import { handleLocalChat, handleHostedChat } from "../chat-helpers"
import { buildFinalMessages } from "../chat-helpers"
import { processResponse } from "../chat-helpers"
import { getEmbedding } from "@/lib/embedding"
import { searchDocs } from "@/lib/search-docs-api"

export const useChatHandler = () => {
  const router = useRouter()
  const {
    profile,
    setProfile,
    assistants,
    setAssistants,
    collections,
    setCollections,
    chats,
    setChats,
    files,
    setFiles,
    folders,
    setFolders,
    models,
    setModels,
    presets,
    setPresets,
    prompts,
    setPrompts,
    tools,
    setTools,
    workspaces,
    setWorkspaces,
    envKeyMap,
    setEnvKeyMap,
    availableHostedModels,
    setAvailableHostedModels,
    availableLocalModels,
    setAvailableLocalModels,
    availableOpenRouterModels,
    setAvailableOpenRouterModels,
    selectedWorkspace,
    setSelectedWorkspace,
    workspaceImages,
    setWorkspaceImages,
    selectedPreset,
    setSelectedPreset,
    selectedAssistant,
    setSelectedAssistant,
    assistantImages,
    setAssistantImages,
    openaiAssistants,
    setOpenaiAssistants,
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
    slashCommand,
    setSlashCommand,
    isFilePickerOpen,
    setIsFilePickerOpen,
    hashtagCommand,
    setHashtagCommand,
    isToolPickerOpen,
    setIsToolPickerOpen,
    toolCommand,
    setToolCommand,
    focusPrompt,
    setFocusPrompt,
    focusFile,
    setFocusFile,
    focusTool,
    setFocusTool,
    focusAssistant,
    setFocusAssistant,
    atCommand,
    setAtCommand,
    isAssistantPickerOpen,
    setIsAssistantPickerOpen,
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
    setToolInUse
  } = useContext(ChatbotUIContext)

  const chatInputRef = useRef<HTMLInputElement>(null)

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
      setUserInput("")
      setIsGenerating(true)
      setIsPromptPickerOpen(false)
      setIsFilePickerOpen(false)
      setNewMessageImages([])

      const newAbortController = new AbortController()
      setAbortController(newAbortController)

      // ---- PATCH: "search my" intent handling ----
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
      ].find(llm => llm.modelId === chatSettings?.model)

      validateChatSettings(
        chatSettings,
        modelData,
        profile,
        selectedWorkspace,
        messageContent
      )

      let currentChat = selectedChat ? { ...selectedChat } : null

      const b64Images = newMessageImages.map(image => image.base64)

      let retrievedFileItems: Tables<"file_items">[] = []

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

      let payload: ChatPayload = {
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

        setChats(prevChats => {
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
    chatMessages: ChatMessage[],
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