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
import { useContext, useEffect, useRef, useState } from "react"
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
import Fuse from "fuse.js"

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
    setSearchSummary,
    files // Destructure files from context
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

  // Helper to classify user intent using the LLM intent endpoint
  async function detectIntent(messageContent: string, previousSummary?: string): Promise<string> {
    try {
      const response = await fetch("/api/chat/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageContent, previousSummary })
      })
      const data = await response.json()
      return data.intent || "general chat"
    } catch (e) {
      return "general chat"
    }
  }

  // Add state for last search summary and chunks
  const [lastSearchSummary, setLastSearchSummary] = useState<string | null>(null)
  const [lastSearchChunks, setLastSearchChunks] = useState<any[]>([])

  const handleSendMessage = async (
    messageContent: string,
    chatMessages: ChatMessage[],
    isRegeneration: boolean
  ) => {
    // Special command: run ingestion
    if (messageContent.trim().toLowerCase() === "run ingestion") {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const response = await fetch(`${backendUrl}/api/run-ingestion`, {
          method: "POST"
        });
        if (response.ok) {
          toast.success("Ingestion triggered on backend.");
        } else {
          toast.error("Failed to trigger ingestion on backend.");
        }
      } catch (e) {
        toast.error("Error triggering ingestion: " + (e as Error).message);
      }
      setUserInput("");
      setIsGenerating(false);
      setFirstTokenReceived(false);
      return;
    }

    // Special command: run score test
    if (messageContent.trim().toLowerCase() === "run score test") {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const response = await fetch(`${backendUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: "run_score_test", user_id: profile?.user_id || "", chat_id: selectedChat?.id || selectedWorkspace?.id || "" })
        });
        if (response.ok) {
          const result = await response.json();
          setChatMessages(prev => [
            ...prev,
            {
              message: {
                id: `sys-score-test-result-${Date.now()}`,
                role: "assistant",
                content: result.recommendation || "Score test completed. No recommendation returned.",
                created_at: new Date().toISOString(),
                sequence_number: prev.length,
                chat_id: selectedChat?.id || "",
                assistant_id: null,
                user_id: "",
                model: chatSettings?.model || "",
                image_paths: [],
                updated_at: ""
              },
              fileItems: []
            }
          ]);
        } else {
          toast.error("Failed to run score test on backend.");
        }
      } catch (e) {
        toast.error("Error running score test: " + (e as Error).message);
      }
      setUserInput("");
      setIsGenerating(false);
      setFirstTokenReceived(false);
      return;
    }

    let generatedText = ""; // Ensure generatedText is always declared before use
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

      // Move modelData declaration to the top so it is available for all branches
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

      // INTENT DETECTION: Use LLM to classify the user's intent
      const intent = await detectIntent(messageContent, lastSearchSummary || undefined)
      console.debug("[intent] classified as:", intent)

      // Route based on intent
      if (intent === "semantic search") {
        // Call backend_search /chat endpoint for semantic search
        const backendSearchResults = await handleBackendSearch(
          messageContent,
          profile?.user_id || "",
          selectedChat?.id || selectedWorkspace?.id || ""
        )
        setSearchSummary?.(backendSearchResults.summary)
        setLastSearchSummary(backendSearchResults.summary)
        setLastSearchChunks(backendSearchResults.retrieved_chunks || [])
        console.log('[DEBUG] backendSearchResults.retrieved_chunks.length:', backendSearchResults.retrieved_chunks?.length)
        const retrievedFileItems = backendSearchResults.retrieved_chunks.slice(0, 500)
        console.log('[DEBUG] retrievedFileItems.length:', retrievedFileItems.length)
        const generatedText = backendSearchResults.summary?.trim() || "[No summary available. Results injected, ready for follow-up questions.]"

        // Always create or update chat and messages, so context is preserved
        let currentChat = selectedChat ? { ...selectedChat } : null

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
          selectedAssistant
          // searchId argument removed to match handleCreateMessages signature
        )
        setIsGenerating(false)
        setFirstTokenReceived(false)
        console.debug("[chat] handleSendMessage completed")
        return
      }

      // --- FOLLOW-UP DETECTION LOGIC ---
      if (intent === "follow-up" && lastSearchChunks.length > 0) {
        // Build a system prompt with both summary and chunks
        const chunksText = lastSearchChunks.map(chunk => chunk.content).join("\n\n")
        const followupPrompt = `You are an assistant. Answer the user's question using only the following previous search results and content chunks. Do not use outside knowledge.\n\nSummary:\n${lastSearchSummary}\n\nChunks:\n${chunksText}`
        const chatSettingsWithFollowupPrompt = {
          ...chatSettings!,
          prompt: followupPrompt
        }
        let payload: ChatPayload = {
          chatSettings: chatSettingsWithFollowupPrompt,
          workspaceInstructions: selectedWorkspace!.instructions || "",
          chatMessages: isRegeneration ? [...chatMessages] : [...chatMessages],
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
        // Use the normal LLM call with the followup prompt
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
        // Save the message as usual
        let currentChat = selectedChat ? { ...selectedChat } : null
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
          [], // No new retrievedChunks for follow-up
          setChatMessages,
          setChatFileItems,
          setChatImages,
          selectedAssistant
        )
        setIsGenerating(false)
        setFirstTokenReceived(false)
        console.debug("[chat] handleSendMessage completed (follow-up)")
        return
      }

      // --- FILE RETRIEVAL INTENT LOGIC ---
      if (intent === "file retrieval") {
        // Preprocess files to add nameNoExt (name without extension) and lowercase fields
        const filesWithNoExt = (files ?? []).map(file => {
          const extIndex = file.name.lastIndexOf(".");
          const nameNoExt = extIndex > 0 ? file.name.substring(0, extIndex) : file.name;
          return {
            ...file,
            name: file.name.toLowerCase(),
            nameNoExt: nameNoExt.toLowerCase(),
            description: (file.description || "").toLowerCase()
          };
        });
        // Lowercase the search query
        const searchQuery = messageContent.toLowerCase();
        // Use Fuse.js for fuzzy file name and description matching, including nameNoExt
        const fuse = new Fuse(filesWithNoExt, {
          keys: ["name", "nameNoExt", "description"],
          threshold: 0.5, // Looser matching
          ignoreLocation: true,
          ignoreFieldNorm: true
        });
        const results = fuse.search(searchQuery);
        const matchingFiles = results.map(r => r.item);
        if (matchingFiles.length > 0) {
          setChatFiles(matchingFiles.map((file: { id: string; name: string; type: string }) => ({
            id: file.id,
            name: file.name,
            type: file.type,
            file: null
          })));
          setShowFilesDisplay(true);
          setChatMessages(prev => ([
            ...prev,
            {
              message: {
                id: `sys-file-retrieval-${Date.now()}`,
                role: "assistant",
                content: `Here are the files matching your request:`,
                created_at: new Date().toISOString(),
                sequence_number: prev.length,
                chat_id: selectedChat?.id || "",
                assistant_id: null,
                user_id: "",
                model: chatSettings?.model || "",
                image_paths: [],
                updated_at: ""
              },
              fileItems: []
            }
          ]));
        } else {
          setChatMessages(prev => ([
            ...prev,
            {
              message: {
                id: `sys-file-retrieval-none-${Date.now()}`,
                role: "assistant",
                content: `No files found matching your request.`,
                created_at: new Date().toISOString(),
                sequence_number: prev.length,
                chat_id: selectedChat?.id || "",
                assistant_id: null,
                user_id: "",
                model: chatSettings?.model || "",
                image_paths: [],
                updated_at: ""
              },
              fileItems: []
            }
          ]));
        }
        setIsGenerating(false);
        setFirstTokenReceived(false);
        return;
      }

      // For general chat, ensure the LLM gets a ChatGPT-style system prompt
      // Add/override the prompt in chatSettings
      const chatSettingsWithSystemPrompt = {
        ...chatSettings!,
        prompt: chatSettings?.prompt || "You are a helpful AI assistant. Answer the user's questions conversationally and helpfully, just like ChatGPT."
      }
      let payload: ChatPayload = {
        chatSettings: chatSettingsWithSystemPrompt,
        workspaceInstructions: selectedWorkspace!.instructions || "",
        chatMessages: isRegeneration ? [...chatMessages] : [...chatMessages],
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

      // Move b64Images declaration above its first use
      const b64Images = newMessageImages.map((image: any) => image.base64)

      // Removed the old isRunSearch block and related variables
      // (No longer needed, intent detection now handles semantic search)
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
        [], // No retrievedChunks for general chat
        setChatMessages,
        setChatFileItems,
        setChatImages,
        selectedAssistant
        // searchId argument removed to match handleCreateMessages signature
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
