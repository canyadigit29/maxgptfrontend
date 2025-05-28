import { ChatbotUIContext } from "@/context/context";
import { getAssistantCollectionsByAssistantId } from "@/db/assistant-collections";
import { getAssistantFilesByAssistantId } from "@/db/assistant-files";
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools";
import { updateChat } from "@/db/chats";
import { getCollectionFilesByCollectionId } from "@/db/collection-files";
import { deleteMessagesIncludingAndAfter } import { createMessageFileItems } from "@/db/message-file-items";
from "@/db/messages";
import { buildFinalMessages } from "@/lib/build-prompt";
import { Tables } from "@/supabase/types";
import { ChatMessage, ChatPayload, LLMID, ModelProvider } from "@/types";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef } from "react";
import { LLM_LIST } from "../../../lib/models/llm/llm-list";
import {
  createTempMessages,
  handleCreateChat,
  handleCreateMessages,
  handleHostedChat,
  handleLocalChat,
  processResponse,
  validateChatSettings
} from "../chat-helpers";

export const useChatHandler = () => {
  const router = useRouter();

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
  } = useContext(ChatbotUIContext);

  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  /* ---------------- focus ---------------- */
  useEffect(() => {
    if (!isPromptPickerOpen || !isFilePickerOpen || !isToolPickerOpen) {
      chatInputRef.current?.focus();
    }
  }, [isPromptPickerOpen, isFilePickerOpen, isToolPickerOpen]);

  /* ------------- cmd helper -------------- */
  const parseCommandSearch = (text: string) => {
    const lower = text.toLowerCase().trim();
    return lower.startsWith("run search ") ? text.slice(10).trim() : null;
  };

  /* -------------- new chat --------------- */
  const handleNewChat = async () => {
    if (!selectedWorkspace) return;

    setUserInput("");
    setChatMessages([]);
    setSelectedChat(null);
    setChatFileItems([]);

    setIsGenerating(false);
    setFirstTokenReceived(false);

    setChatFiles([]);
    setChatImages([]);
    setNewMessageFiles([]);
    setNewMessageImages([]);
    setShowFilesDisplay(false);
    setIsPromptPickerOpen(false);
    setIsFilePickerOpen(false);

    setSelectedTools([]);
    setToolInUse("none");

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
      });

      let allFiles: { id: string; name: string; type: string }[] = [];

      const assistantFiles = (
        await getAssistantFilesByAssistantId(selectedAssistant.id)
      ).files;
      allFiles = [...assistantFiles];

      const assistantCollections = (
        await getAssistantCollectionsByAssistantId(selectedAssistant.id)
      ).collections;
      for (const collection of assistantCollections) {
        const collectionFiles = (
          await getCollectionFilesByCollectionId(collection.id)
        ).files;
        allFiles = [...allFiles, ...collectionFiles];
      }

      const assistantTools = (
        await getAssistantToolsByAssistantId(selectedAssistant.id)
      ).tools;

      setSelectedTools(assistantTools);
      setChatFiles(
        allFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          file: null
        }))
      );

      if (allFiles.length > 0) setShowFilesDisplay(true);
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
      });
    }

    return router.push(`/${selectedWorkspace.id}/chat`);
  };

  /* ------------- misc handlers ----------- */
  const handleFocusChatInput = () => chatInputRef.current?.focus();

  const handleStopMessage = () => abortController?.abort();

  /* ------------- send message ------------ */
  const handleSendMessage = async (
    messageContent: string,
    chatMessages: ChatMessage[],
    isRegeneration: boolean
  ) => {
    const startingInput = messageContent;

    try {
      /* ---------- UI prep ---------- */
      setUserInput("");
      setIsGenerating(true);
      setIsPromptPickerOpen(false);
      setIsFilePickerOpen(false);
      setNewMessageImages([]);

      const newAbortController = new AbortController();
      setAbortController(newAbortController);

      /* ---------- model data ---------- */
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
      ].find(llm => llm.modelId === chatSettings?.model);

      validateChatSettings(
        chatSettings,
        modelData,
        profile,
        selectedWorkspace,
        messageContent
      );

      let currentChat = selectedChat ? { ...selectedChat } : null;

      const b64Images = newMessageImages.map(image => image.base64);

      /* ---------- retrieval ---------- */
      let retrievedFileItems: Tables<"file_items">[] = [];

      const commandSearchQuery = parseCommandSearch(messageContent);
      const shouldDefaultRetrieve =
        !commandSearchQuery &&
        (newMessageFiles.length > 0 || chatFiles.length > 0) &&
        useRetrieval;

      if (commandSearchQuery || shouldDefaultRetrieve) {
        setToolInUse("retrieval");

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const embedText = commandSearchQuery || messageContent;
        const embedResponse = await fetch(`${backendUrl}/embed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: embedText })
        });
        const { embedding } = await embedResponse.json();

        const response = await fetch(
          `${backendUrl}/file_ops/search_docs`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              embedding,
              user_id: profile?.id || null
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          retrievedFileItems = data.retrieved_chunks || [];
        } else {
          console.error(
            "Failed to fetch retrieved documents from backend:",
            await response.text()
          );
        }
      }

      /* ---------- temp msgs ---------- */
      const { tempUserChatMessage, tempAssistantChatMessage } =
        createTempMessages(
          messageContent,
          chatMessages,
          chatSettings!,
          b64Images,
          isRegeneration,
          setChatMessages,
          selectedAssistant
        );

      /* ---------- payload ------------ */
      const payload: ChatPayload = {
        chatSettings: chatSettings!,
        workspaceInstructions: selectedWorkspace!.instructions || "",
        chatMessages: isRegeneration
          ? [...chatMessages]
          : [...chatMessages, tempUserChatMessage],
        assistant: selectedChat?.assistant_id ? selectedAssistant : null,
        messageFileItems: retrievedFileItems,
        chatFileItems
      };

      /* ---------- choose chat path ---- */
      let generatedText = "";

      if (selectedTools.length > 0) {
        setToolInUse("Tools");

        const formattedMessages = await buildFinalMessages(
          payload,
          profile!,
          chatImages
        );

        const response = await fetch("/api/chat/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatSettings: payload.chatSettings,
            messages: formattedMessages,
            selectedTools
          })
        });

        setToolInUse("none");

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
        );
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
          );
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
          );
        }
      }

      /* ---------- chat & msg db ------- */
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

        setChats(prev =>
          prev.map(c => (c.id === updatedChat.id ? updatedChat : c))
        );
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
    } catch (err) {
      setIsGenerating(false);
      setFirstTokenReceived(false);
      setUserInput(startingInput);
    }
  };

  /* ------------- edit handler ---------- */
  const handleSendEdit = async (
    editedContent: string,
    sequenceNumber: number
  ) => {
    if (!selectedChat) return;

    await deleteMessagesIncludingAndAfter(
      selectedChat.user_id,
      selectedChat.id,
      sequenceNumber
    );

    const filteredMessages = chatMessages.filter(
      m => m.message.sequence_number < sequenceNumber
    );

    setChatMessages(filteredMessages);

    handleSendMessage(editedContent, filteredMessages, false);
  };

  /* ------------- exports -------------- */
  return {
    chatInputRef,
    prompt,
    handleNewChat,
    handleSendMessage,
    handleFocusChatInput,
    handleStopMessage,
    handleSendEdit
  };
};
