import { ChatSettings } from "./chat-settings"
import { ChatMessage } from "./chat-message"
import { Assistant } from "./assistant"

export interface ChatPayload {
  chatSettings: ChatSettings
  workspaceInstructions: string
  chatMessages: ChatMessage[]
  assistant: Assistant | null
  messageFileItems: any[]
  chatFileItems: any[]
  project_id: string
}

export * from "./chat-message"
export * from "./chat-settings"
export * from "./message"
export * from "./assistant"
export * from "./tool"
export * from "./preset"
export * from "./profile"
export * from "./workspace"
export * from "./collection"
export * from "./file"
export * from "./folder"
export * from "./prompt"
export * from "./model"
export * from "./source"
