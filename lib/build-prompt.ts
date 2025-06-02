import { Tables } from "@/supabase/types"
import { ChatPayload, MessageImage } from "@/types"
import { encode } from "gpt-tokenizer"
import { getBase64FromDataURL, getMediaTypeFromDataURL } from "@/lib/utils"

/**
 * Builds the base system prompt for the chat.
 */
const buildBasePrompt = (
  prompt: string,
  profileContext: string,
  workspaceInstructions: string,
  assistant: Tables<"assistants"> | null
) => {
  let fullPrompt = ""

  if (assistant) {
    fullPrompt += `<INJECT ROLE>\nYou are not an AI. You are ${assistant.name}.\n</INJECT ROLE>\n\n`
  }

  fullPrompt += `Today is ${new Date().toLocaleDateString()}.\n\n`

  if (profileContext) {
    fullPrompt += `User Info:\n${profileContext}\n\n`
  }

  if (workspaceInstructions) {
    fullPrompt += `System Instructions:\n${workspaceInstructions}\n\n`
  }

  fullPrompt += `User Instructions:\n${prompt}`

  return fullPrompt
}

/**
 * Optionally builds retrieval text from file items (if required in your system).
 * You may already have this elsewhere; if not, adjust accordingly.
 */
const buildRetrievalText = (fileItems: Tables<"file_items">[]) => {
  if (!fileItems || fileItems.length === 0) return ""
  return (
    "Relevant knowledge from your files:\n" +
    fileItems.map((item, idx) => `(${idx + 1}) ${item.content}`).join("\n---\n") +
    "\n"
  )
}

/**
 * Builds the final messages array for the LLM, including system prompt,
 * chat history, and (if present) retrievalContext as a system message.
 */
export async function buildFinalMessages(
  payload: ChatPayload,
  profile: Tables<"profiles">,
  chatImages: MessageImage[]
) {
  const {
    chatSettings,
    workspaceInstructions,
    chatMessages,
    assistant,
    messageFileItems,
    chatFileItems,
    retrievalContext // <-- Now included in ChatPayload
  } = payload

  const BUILT_PROMPT = buildBasePrompt(
    chatSettings.prompt,
    chatSettings.includeProfileContext ? profile.profile_context || "" : "",
    chatSettings.includeWorkspaceInstructions ? workspaceInstructions : "",
    assistant
  )

  const CHUNK_SIZE = chatSettings.contextLength
  const PROMPT_TOKENS = encode(chatSettings.prompt).length

  let remainingTokens = CHUNK_SIZE - PROMPT_TOKENS
  let usedTokens = 0
  usedTokens += PROMPT_TOKENS

  // File-aware message postprocessing
  const processedChatMessages = chatMessages.map((chatMessage, index) => {
    const nextChatMessage = chatMessages[index + 1]

    if (nextChatMessage === undefined) {
      return chatMessage
    }

    const nextChatMessageFileItems = nextChatMessage.fileItems

    if (nextChatMessageFileItems.length > 0) {
      const findFileItems = nextChatMessageFileItems
        .map(fileItemId =>
          chatFileItems.find(chatFileItem => chatFileItem.id === fileItemId)
        )
        .filter(item => item !== undefined) as Tables<"file_items">[]

      const retrievalText = buildRetrievalText(findFileItems)

      return {
        message: {
          ...chatMessage.message,
          content:
            `${chatMessage.message.content}\n\n${retrievalText}` as string
        },
        fileItems: []
      }
    }

    return chatMessage
  })

  let finalMessages: any[] = []

  // Add up message tokens in reverse until out of space
  for (let i = processedChatMessages.length - 1; i >= 0; i--) {
    const message = processedChatMessages[i].message
    const messageTokens = encode(message.content).length

    if (messageTokens <= remainingTokens) {
      remainingTokens -= messageTokens
      usedTokens += messageTokens
      finalMessages.unshift(message)
    } else {
      break
    }
  }

  // Always inject the system message from BUILT_PROMPT as the first message
  let tempSystemMessage: Tables<"messages"> = {
    chat_id: "",
    assistant_id: null,
    content: BUILT_PROMPT,
    created_at: "",
    id: processedChatMessages.length + "",
    image_paths: [],
    model: payload.chatSettings.model,
    role: "system",
    sequence_number: processedChatMessages.length,
    user_id: ""
  }

  finalMessages.unshift(tempSystemMessage)

  // PATCH: If retrievalContext is present, inject it as an additional system message (at the front)
  if (retrievalContext && retrievalContext.trim().length > 0) {
    const retrievalSystemMessage: Tables<"messages"> = {
      chat_id: "",
      assistant_id: null,
      content: retrievalContext,
      created_at: "",
      id: (processedChatMessages.length + 1) + "",
      image_paths: [],
      model: payload.chatSettings.model,
      role: "system",
      sequence_number: processedChatMessages.length + 1,
      user_id: ""
    }
    finalMessages.unshift(retrievalSystemMessage)
  }

  return finalMessages
}
