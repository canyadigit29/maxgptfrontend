
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string | null
          sharing: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string | null
          sharing: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string | null
          sharing?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          chat_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          chat_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          chat_id?: string
          content?: string
          created_at?: string
        }
      }
      assistants: {
        Row: {
          id: string
          user_id: string
          name: string
          prompt: string
          model: string
          image_path: string
          temperature: number
          include_profile_context: boolean
          include_workspace_instructions: boolean
          embeddings_provider: string
          context_length: number
          description: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          prompt: string
          model: string
          image_path: string
          temperature: number
          include_profile_context: boolean
          include_workspace_instructions: boolean
          embeddings_provider: string
          context_length: number
          description: string
          created_at?: string
          updated_at?: string | null
        }
        Update: Partial<Insert>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
