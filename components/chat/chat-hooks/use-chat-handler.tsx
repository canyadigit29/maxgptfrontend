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
    let generatedText = "";
    const startingInput = messageContent;
    try {
      setUserInput("");
      setIsGenerating(true);
      setIsPromptPickerOpen(false);
      setIsFilePickerOpen(false);
      setNewMessageImages([]);
      const newAbortController = new AbortController();
      setAbortController(newAbortController);
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
      ].find((llm: any) => llm.modelId === chatSettings?.model);
      // --- All prompts now go directly to backend search/chat endpoint ---
      const backendSearchResults = await handleBackendSearch(
        messageContent,
        profile?.user_id || "",
        selectedChat?.id || selectedWorkspace?.id || ""
      );
      setSearchSummary?.(backendSearchResults.summary);
      const retrievedFileItems = backendSearchResults.retrieved_chunks?.slice(0, 500) || [];
      const generatedText = backendSearchResults.summary?.trim() || "[No summary available. Results injected, ready for follow-up questions.]";
      let currentChat = selectedChat ? { ...selectedChat } : null;
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
        );
      } else {
        const updatedChat = await updateChat(currentChat.id, {
          updated_at: new Date().toISOString()
        });
        setChats((prevChats: any) => {
          const updatedChats = prevChats.map((prevChat: any) =>
            prevChat.id === updatedChat.id ? updatedChat : prevChat
          );
          return updatedChats;
        });
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
      );
      setIsGenerating(false);
      setFirstTokenReceived(false);
      console.debug("[chat] handleSendMessage completed");
    } catch (error) {
      setIsGenerating(false);
      setFirstTokenReceived(false);
      setUserInput(startingInput);
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
