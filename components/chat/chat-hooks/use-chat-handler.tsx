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
  handleCreateChat,
  handleCreateMessages,
  handleHostedChat,
  handleLocalChat,
  handleRetrieval,
  processResponse,
  validateChatSettings
} from "../chat-helpers"

function parseSearchIntent(userMessage: string) {
  const searchWords = /(search|find|look up|documents?|files?)/i
  return searchWords.test(userMessage)
}

function extractFiltersFromQuery(query: string) {
  const filters: {
    file_name_filter?: string
    collection_filter?: string
    description_filter?: string
    start_date?: string
    end_date?: string
    fuzzy_date?: string
  } = {}

  const fileMatch = query.match(/file(?:d)?(?: named)? ([\w.\- ]+)/i)
  if (fileMatch) filters.file_name_filter = fileMatch[1].trim()

  const collectionMatch = query.match(/collection(?: named)? ([\w.\- ]+)/i)
  if (collectionMatch) filters.collection_filter = collectionMatch[1].trim()

  const descMatch = query.match(/description(?: contains| is)? ([\w.\- ]+)/i)
  if (descMatch) filters.description_filter = descMatch[1].trim()

  const fuzzyDateMatch = query.match(
    /(?:around|about|near|on|in)\s+([A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{4})/i
  )
  if (fuzzyDateMatch) filters.fuzzy_date = fuzzyDateMatch[1].trim()

  return filters
}

function getDateRangeAround(dateString: string): { start_date: string; end_date: string } {
  const date = new Date(dateString)
  const start = new Date(date)
  const end = new Date(date)
  start.setMonth(start.getMonth() - 3)
  end.setMonth(end.getMonth() + 3)
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0]
  }
}

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

    if (parseSearchIntent(messageContent)) {
      try {
        setUserInput("")
        setIsGenerating(true)
        setIsPromptPickerOpen(false)
        setIsFilePickerOpen(false)
        setNewMessageImages([])

        let allFiles: { id: string, name: string, type: string }[] = []
        let allCollections: { id: string, name: string }[] = []
        if (selectedAssistant) {
          const assistantFiles = (
            await getAssistantFilesByAssistantId(selectedAssistant.id)
          ).files
          allFiles = [...assistantFiles]
          const assistantCollections = (
            await getAssistantCollectionsByAssistantId(selectedAssistant.id)
          ).collections
          allCollections = [...assistantCollections]
          for (const collection of assistantCollections) {
            const collectionFiles = (
              await getCollectionFilesByCollectionId(collection.id)
            ).files
            allFiles = [...allFiles, ...collectionFiles]
          }
        }
        const fileNames = allFiles.map(f => f.name)
        const collectionNames = allCollections.map(c => c.name)

        const extracted = extractFiltersFromQuery(messageContent)
        let missingFilters: string[] = []
        let file_name_filter = extracted.file_name_filter
        let collection_filter = extracted.collection_filter
        let description_filter = extracted.description_filter
        let start_date: string | undefined
        let end_date: string | undefined

        if (extracted.fuzzy_date) {
          const range = getDateRangeAround(extracted.fuzzy_date)
          start_date = range.start_date
          end_date = range.end_date
        }

        if (
          file_name_filter &&
          !fileNames.some(
            (fn) => fn.toLowerCase() === file_name_filter!.toLowerCase()
          )
        ) {
          const close = fileNames.find((fn) =>
            fn.toLowerCase().includes(file_name_filter!.toLowerCase())
          )
          if (close) file_name_filter = close
          else missingFilters.push("file name (choose one of your files)")
        }

        if (
          collection_filter &&
          !collectionNames.some(
            (cn) => cn.toLowerCase() === collection_filter!.toLowerCase()
          )
        ) {
          const close = collectionNames.find((cn) =>
            cn.toLowerCase().includes(collection_filter!.toLowerCase())
          )
          if (close) collection_filter = close
          else missingFilters.push("collection name (choose one of your collections)")
        }

        if (!file_name_filter && fileNames.length > 1)
          missingFilters.push("file name")
        if (!collection_filter && collectionNames.length > 1)
          missingFilters.push("collection name")

        if (missingFilters.length > 0) {
          const prompt = `Please specify: ${missingFilters.join(
            " and "
          )}.\n\nYour file names: ${fileNames.join(
            ", "
          )}\nYour collections: ${collectionNames.join(", ")}`
          setChatMessages([
            ...chatMessages,
            { message: { role: "assistant", content: prompt } }
          ])
          setIsGenerating(false)
          return
        }

        const payload = {
          embedding: null,
          assistant_id: selectedAssistant?.id || null,
          file_name_filter,
          collection_filter,
          description_filter,
          start_date,
          end_date,
          query: messageContent
        }

        const response = await fetch("/api/file_ops/search_docs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })

        const { retrieved_chunks, error } = await response.json()

        if (error) {
          setChatMessages([
            ...chatMessages,
            { message: { role: "assistant", content: `Search failed: ${error}` } }
          ])
          setIsGenerating(false)
          return
        }

        const summary =
          retrieved_chunks && retrieved_chunks.length
            ? "Search results:\n" +
              retrieved_chunks
                .map(
                  (chunk: any, idx: number) =>
                    `Result ${idx + 1} (score: ${chunk.score}):\nFile: ${
                      chunk.metadata.file_name
                    }\nCollection: ${chunk.metadata.collection}\nCreated: ${
                      chunk.metadata.created_at
                    }\n---\n${chunk.content}\n`
                )
                .join("\n")
            : "No results found for your search."

        setChatMessages([
          ...chatMessages,
          { message: { role: "assistant", content: summary } }
        ])
        setIsGenerating(false)
        return
      } catch (err: any) {
        setChatMessages([
          ...chatMessages,
          { message: { role: "assistant", content: `Error: ${err.message}` } }
        ])
        setIsGenerating(false)
        return
      }
    }

    try {
      setUserInput("")
      setIsGenerating(true)
      setIsPromptPickerOpen(false)
      setIsFilePickerOpen(false)
      setNewMessageImages([])

      const newAbortController = new AbortController()
      setAbortController(newAbortController)

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
    sequenceNumber: number
  ) => {
    if (!selectedChat) return

    await deleteMessagesIncludingAndAfter(
      selectedChat.user_id,
      selectedChat.id,
      sequenceNumber
    )

    const filteredMessages = chatMessages.filter(
      chatMessage => chatMessage.message.sequence_number < sequenceNumber
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