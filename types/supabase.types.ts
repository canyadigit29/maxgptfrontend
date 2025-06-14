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
      assistant_collections: {
        Row: {
          assistant_id: string
          collection_id: string
          created_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assistant_id: string
          collection_id: string
          created_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assistant_id?: string
          collection_id?: string
          created_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_collections_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_files: {
        Row: {
          assistant_id: string
          created_at: string
          file_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          file_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          file_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_files_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_files_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_tools: {
        Row: {
          assistant_id: string
          created_at: string
          tool_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          tool_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          tool_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_tools_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_workspaces: {
        Row: {
          assistant_id: string
          created_at: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_workspaces_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assistants: {
        Row: {
          context_length: number
          created_at: string
          description: string
          embeddings_provider: string
          folder_id: string | null
          id: string
          image_path: string
          include_profile_context: boolean
          include_workspace_instructions: boolean
          model: string
          name: string
          prompt: string
          sharing: string
          temperature: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_length: number
          created_at?: string
          description: string
          embeddings_provider: string
          folder_id?: string | null
          id?: string
          image_path: string
          include_profile_context: boolean
          include_workspace_instructions: boolean
          model: string
          name: string
          prompt: string
          sharing?: string
          temperature: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_length?: number
          created_at?: string
          description?: string
          embeddings_provider?: string
          folder_id?: string | null
          id?: string
          image_path?: string
          include_profile_context?: boolean
          include_workspace_instructions?: boolean
          model?: string
          name?: string
          prompt?: string
          sharing?: string
          temperature?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistants_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_files: {
        Row: {
          chunk_index: number | null
          content: string | null
          created_at: string
          description: string | null
          embedding: string | null
          embedding_json: Json | null
          file_id: string | null
          file_name: string | null
          file_path: string
          folder_id: string | null
          id: string
          ingested: boolean | null
          ingested_at: string | null
          message_index: number | null
          name: string
          project_id: string | null
          relevant_date: string | null
          session_id: string | null
          sharing: string
          size: number
          speaker_role: string | null
          status: string | null
          timestamp: string | null
          tokens: number
          topic_id: string | null
          topic_name: string | null
          type: string
          updated_at: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          embedding_json?: Json | null
          file_id?: string | null
          file_name?: string | null
          file_path: string
          folder_id?: string | null
          id?: string
          ingested?: boolean | null
          ingested_at?: string | null
          message_index?: number | null
          name: string
          project_id?: string | null
          relevant_date?: string | null
          session_id?: string | null
          sharing?: string
          size: number
          speaker_role?: string | null
          status?: string | null
          timestamp?: string | null
          tokens: number
          topic_id?: string | null
          topic_name?: string | null
          type: string
          updated_at?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          embedding_json?: Json | null
          file_id?: string | null
          file_name?: string | null
          file_path?: string
          folder_id?: string | null
          id?: string
          ingested?: boolean | null
          ingested_at?: string | null
          message_index?: number | null
          name?: string
          project_id?: string | null
          relevant_date?: string | null
          session_id?: string | null
          sharing?: string
          size?: number
          speaker_role?: string | null
          status?: string | null
          timestamp?: string | null
          tokens?: number
          topic_id?: string | null
          topic_name?: string | null
          type?: string
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          assistant_id: string | null
          context_length: number
          created_at: string
          embeddings_provider: string
          folder_id: string | null
          id: string
          include_profile_context: boolean
          include_workspace_instructions: boolean
          is_query_embedding: boolean | null
          model: string
          name: string
          prompt: string
          query_embedding_finished_at: string | null
          query_embedding_started_at: string | null
          role: string | null
          sharing: string
          temperature: number
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          assistant_id?: string | null
          context_length: number
          created_at?: string
          embeddings_provider: string
          folder_id?: string | null
          id?: string
          include_profile_context: boolean
          include_workspace_instructions: boolean
          is_query_embedding?: boolean | null
          model: string
          name: string
          prompt: string
          query_embedding_finished_at?: string | null
          query_embedding_started_at?: string | null
          role?: string | null
          sharing?: string
          temperature: number
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          assistant_id?: string | null
          context_length?: number
          created_at?: string
          embeddings_provider?: string
          folder_id?: string | null
          id?: string
          include_profile_context?: boolean
          include_workspace_instructions?: boolean
          is_query_embedding?: boolean | null
          model?: string
          name?: string
          prompt?: string
          query_embedding_finished_at?: string | null
          query_embedding_started_at?: string | null
          role?: string | null
          sharing?: string
          temperature?: number
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_files: {
        Row: {
          collection_id: string
          created_at: string
          file_id: string
          name: string | null
          relevant_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          file_id: string
          name?: string | null
          relevant_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          file_id?: string
          name?: string | null
          relevant_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_files_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_files_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_workspaces: {
        Row: {
          collection_id: string
          created_at: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_workspaces_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string
          folder_id: string | null
          id: string
          name: string
          sharing: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          folder_id?: string | null
          id?: string
          name: string
          sharing?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          folder_id?: string | null
          id?: string
          name?: string
          sharing?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_hash: string | null
          chunk_index: number | null
          collection: string | null
          content: string | null
          created_at: string | null
          description: string | null
          embedding: string | null
          embedding_json: Json | null
          file_content: string | null
          file_id: string | null
          file_name: string | null
          file_path: string | null
          folder_id: string | null
          id: string
          ingested: boolean | null
          ingested_at: string | null
          local_embedding: string | null
          message_index: number | null
          name: string | null
          openai_embedding: string | null
          page_number: number | null
          project_id: string | null
          relevant_date: string | null
          section_header: string | null
          session_id: string | null
          sharing: string | null
          size: number | null
          speaker_role: string | null
          status: string | null
          timestamp: string | null
          tokens: number | null
          topic_id: string | null
          topic_name: string | null
          type: string | null
          updated_at: string | null
          uploaded_at: string | null
          user_id: string | null
        }
        Insert: {
          chunk_hash?: string | null
          chunk_index?: number | null
          collection?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          embedding_json?: Json | null
          file_content?: string | null
          file_id?: string | null
          file_name?: string | null
          file_path?: string | null
          folder_id?: string | null
          id?: string
          ingested?: boolean | null
          ingested_at?: string | null
          local_embedding?: string | null
          message_index?: number | null
          name?: string | null
          openai_embedding?: string | null
          page_number?: number | null
          project_id?: string | null
          relevant_date?: string | null
          section_header?: string | null
          session_id?: string | null
          sharing?: string | null
          size?: number | null
          speaker_role?: string | null
          status?: string | null
          timestamp?: string | null
          tokens?: number | null
          topic_id?: string | null
          topic_name?: string | null
          type?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Update: {
          chunk_hash?: string | null
          chunk_index?: number | null
          collection?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          embedding_json?: Json | null
          file_content?: string | null
          file_id?: string | null
          file_name?: string | null
          file_path?: string | null
          folder_id?: string | null
          id?: string
          ingested?: boolean | null
          ingested_at?: string | null
          local_embedding?: string | null
          message_index?: number | null
          name?: string | null
          openai_embedding?: string | null
          page_number?: number | null
          project_id?: string | null
          relevant_date?: string | null
          section_header?: string | null
          session_id?: string | null
          sharing?: string | null
          size?: number | null
          speaker_role?: string | null
          status?: string | null
          timestamp?: string | null
          tokens?: number | null
          topic_id?: string | null
          topic_name?: string | null
          type?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      file_items: {
        Row: {
          content: string
          created_at: string
          file_id: string
          id: string
          local_embedding: string | null
          openai_embedding: string | null
          sharing: string
          tokens: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_id: string
          id?: string
          local_embedding?: string | null
          openai_embedding?: string | null
          sharing?: string
          tokens: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_id?: string
          id?: string
          local_embedding?: string | null
          openai_embedding?: string | null
          sharing?: string
          tokens?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_items_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      file_workspaces: {
        Row: {
          created_at: string
          file_id: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          file_id: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          file_id?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_workspaces_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          chunk_index: number | null
          content: string | null
          created_at: string
          description: string | null
          embedding: string | null
          embedding_json: Json | null
          file_id: string | null
          file_name: string | null
          file_path: string
          folder_id: string | null
          id: string
          ingested: boolean | null
          ingested_at: string | null
          message_index: number | null
          name: string
          project_id: string | null
          relevant_date: string | null
          session_id: string | null
          sharing: string
          size: number
          speaker_role: string | null
          status: string | null
          timestamp: string | null
          tokens: number
          topic_id: string | null
          topic_name: string | null
          type: string
          updated_at: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          embedding_json?: Json | null
          file_id?: string | null
          file_name?: string | null
          file_path: string
          folder_id?: string | null
          id?: string
          ingested?: boolean | null
          ingested_at?: string | null
          message_index?: number | null
          name: string
          project_id?: string | null
          relevant_date?: string | null
          session_id?: string | null
          sharing?: string
          size: number
          speaker_role?: string | null
          status?: string | null
          timestamp?: string | null
          tokens: number
          topic_id?: string | null
          topic_name?: string | null
          type: string
          updated_at?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          embedding_json?: Json | null
          file_id?: string | null
          file_name?: string | null
          file_path?: string
          folder_id?: string | null
          id?: string
          ingested?: boolean | null
          ingested_at?: string | null
          message_index?: number | null
          name?: string
          project_id?: string | null
          relevant_date?: string | null
          session_id?: string | null
          sharing?: string
          size?: number
          speaker_role?: string | null
          status?: string | null
          timestamp?: string | null
          tokens?: number
          topic_id?: string | null
          topic_name?: string | null
          type?: string
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          type: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          type: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      message_file_items: {
        Row: {
          chunk_index: number | null
          content: string | null
          created_at: string
          description: string | null
          embedding: string | null
          embedding_json: Json | null
          file_id: string | null
          file_item_id: string
          file_name: string | null
          file_path: string | null
          folder_id: string | null
          id: string | null
          ingested: boolean | null
          ingested_at: string | null
          message_id: string
          message_index: number | null
          name: string | null
          project_id: string | null
          relevant_date: string | null
          session_id: string | null
          sharing: string | null
          size: number | null
          speaker_role: string | null
          status: string | null
          timestamp: string | null
          tokens: number | null
          topic_id: string | null
          topic_name: string | null
          type: string | null
          updated_at: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          embedding_json?: Json | null
          file_id?: string | null
          file_item_id: string
          file_name?: string | null
          file_path?: string | null
          folder_id?: string | null
          id?: string | null
          ingested?: boolean | null
          ingested_at?: string | null
          message_id: string
          message_index?: number | null
          name?: string | null
          project_id?: string | null
          relevant_date?: string | null
          session_id?: string | null
          sharing?: string | null
          size?: number | null
          speaker_role?: string | null
          status?: string | null
          timestamp?: string | null
          tokens?: number | null
          topic_id?: string | null
          topic_name?: string | null
          type?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          embedding_json?: Json | null
          file_id?: string | null
          file_item_id?: string
          file_name?: string | null
          file_path?: string | null
          folder_id?: string | null
          id?: string | null
          ingested?: boolean | null
          ingested_at?: string | null
          message_id?: string
          message_index?: number | null
          name?: string | null
          project_id?: string | null
          relevant_date?: string | null
          session_id?: string | null
          sharing?: string | null
          size?: number | null
          speaker_role?: string | null
          status?: string | null
          timestamp?: string | null
          tokens?: number | null
          topic_id?: string | null
          topic_name?: string | null
          type?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_file_items_file_item_id_fkey"
            columns: ["file_item_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_file_items_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          assistant_id: string | null
          chat_id: string
          content: string
          created_at: string
          id: string
          image_paths: string[]
          is_query_embedding: boolean | null
          model: string
          query_embedding_finished_at: string | null
          query_embedding_started_at: string | null
          role: string
          search_id: string | null
          sequence_number: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assistant_id?: string | null
          chat_id: string
          content: string
          created_at?: string
          id?: string
          image_paths: string[]
          is_query_embedding?: boolean | null
          model: string
          query_embedding_finished_at?: string | null
          query_embedding_started_at?: string | null
          role: string
          search_id?: string | null
          sequence_number: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assistant_id?: string | null
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          image_paths?: string[]
          is_query_embedding?: boolean | null
          model?: string
          query_embedding_finished_at?: string | null
          query_embedding_started_at?: string | null
          role?: string
          search_id?: string | null
          sequence_number?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      model_workspaces: {
        Row: {
          created_at: string
          model_id: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          model_id: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          model_id?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_workspaces_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          api_key: string
          base_url: string
          context_length: number
          created_at: string
          description: string
          folder_id: string | null
          id: string
          model_id: string
          name: string
          sharing: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          base_url: string
          context_length?: number
          created_at?: string
          description: string
          folder_id?: string | null
          id?: string
          model_id: string
          name: string
          sharing?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          base_url?: string
          context_length?: number
          created_at?: string
          description?: string
          folder_id?: string | null
          id?: string
          model_id?: string
          name?: string
          sharing?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      preset_workspaces: {
        Row: {
          created_at: string
          preset_id: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          preset_id: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          preset_id?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preset_workspaces_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preset_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      presets: {
        Row: {
          context_length: number
          created_at: string
          description: string
          embeddings_provider: string
          folder_id: string | null
          id: string
          include_profile_context: boolean
          include_workspace_instructions: boolean
          model: string
          name: string
          prompt: string
          sharing: string
          temperature: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_length: number
          created_at?: string
          description: string
          embeddings_provider: string
          folder_id?: string | null
          id?: string
          include_profile_context: boolean
          include_workspace_instructions: boolean
          model: string
          name: string
          prompt: string
          sharing?: string
          temperature: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_length?: number
          created_at?: string
          description?: string
          embeddings_provider?: string
          folder_id?: string | null
          id?: string
          include_profile_context?: boolean
          include_workspace_instructions?: boolean
          model?: string
          name?: string
          prompt?: string
          sharing?: string
          temperature?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          anthropic_api_key: string | null
          azure_openai_35_turbo_id: string | null
          azure_openai_45_turbo_id: string | null
          azure_openai_45_vision_id: string | null
          azure_openai_api_key: string | null
          azure_openai_embeddings_id: string | null
          azure_openai_endpoint: string | null
          bio: string
          created_at: string
          display_name: string
          google_gemini_api_key: string | null
          groq_api_key: string | null
          has_onboarded: boolean
          id: string
          image_path: string
          image_url: string
          mistral_api_key: string | null
          openai_api_key: string | null
          openai_organization_id: string | null
          openrouter_api_key: string | null
          perplexity_api_key: string | null
          profile_context: string
          updated_at: string | null
          use_azure_openai: boolean
          user_id: string
          username: string
        }
        Insert: {
          anthropic_api_key?: string | null
          azure_openai_35_turbo_id?: string | null
          azure_openai_45_turbo_id?: string | null
          azure_openai_45_vision_id?: string | null
          azure_openai_api_key?: string | null
          azure_openai_embeddings_id?: string | null
          azure_openai_endpoint?: string | null
          bio: string
          created_at?: string
          display_name: string
          google_gemini_api_key?: string | null
          groq_api_key?: string | null
          has_onboarded?: boolean
          id?: string
          image_path: string
          image_url: string
          mistral_api_key?: string | null
          openai_api_key?: string | null
          openai_organization_id?: string | null
          openrouter_api_key?: string | null
          perplexity_api_key?: string | null
          profile_context: string
          updated_at?: string | null
          use_azure_openai: boolean
          user_id: string
          username: string
        }
        Update: {
          anthropic_api_key?: string | null
          azure_openai_35_turbo_id?: string | null
          azure_openai_45_turbo_id?: string | null
          azure_openai_45_vision_id?: string | null
          azure_openai_api_key?: string | null
          azure_openai_embeddings_id?: string | null
          azure_openai_endpoint?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          google_gemini_api_key?: string | null
          groq_api_key?: string | null
          has_onboarded?: boolean
          id?: string
          image_path?: string
          image_url?: string
          mistral_api_key?: string | null
          openai_api_key?: string | null
          openai_organization_id?: string | null
          openrouter_api_key?: string | null
          perplexity_api_key?: string | null
          profile_context?: string
          updated_at?: string | null
          use_azure_openai?: boolean
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      prompt_workspaces: {
        Row: {
          created_at: string
          prompt_id: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          prompt_id: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          prompt_id?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_workspaces_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          content: string
          created_at: string
          folder_id: string | null
          id: string
          name: string
          sharing: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          folder_id?: string | null
          id?: string
          name: string
          sharing?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          folder_id?: string | null
          id?: string
          name?: string
          sharing?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      retrieved_chunks: {
        Row: {
          chunk_id: string
          created_at: string
          id: string
          search_id: string
          user_id: string
        }
        Insert: {
          chunk_id: string
          created_at?: string
          id?: string
          search_id: string
          user_id: string
        }
        Update: {
          chunk_id?: string
          created_at?: string
          id?: string
          search_id?: string
          user_id?: string
        }
        Relationships: []
      }
      search_settings: {
        Row: {
          created_at: string | null
          default_collection_filter: string | null
          default_description_filter: string | null
          default_end_date: string | null
          default_file_name_filter: string | null
          default_start_date: string | null
          id: string
          match_count: number | null
          match_threshold: number | null
          max_match_count: number
          similarity_threshold: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_collection_filter?: string | null
          default_description_filter?: string | null
          default_end_date?: string | null
          default_file_name_filter?: string | null
          default_start_date?: string | null
          id?: string
          match_count?: number | null
          match_threshold?: number | null
          max_match_count?: number
          similarity_threshold?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_collection_filter?: string | null
          default_description_filter?: string | null
          default_end_date?: string | null
          default_file_name_filter?: string | null
          default_start_date?: string | null
          id?: string
          match_count?: number | null
          match_threshold?: number | null
          max_match_count?: number
          similarity_threshold?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      tool_workspaces: {
        Row: {
          created_at: string
          tool_id: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          tool_id: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          tool_id?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_workspaces_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          created_at: string
          custom_headers: Json
          description: string
          folder_id: string | null
          id: string
          name: string
          schema: Json
          sharing: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_headers?: Json
          description: string
          folder_id?: string | null
          id?: string
          name: string
          schema?: Json
          sharing?: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_headers?: Json
          description?: string
          folder_id?: string | null
          id?: string
          name?: string
          schema?: Json
          sharing?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tools_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          default_context_length: number
          default_model: string
          default_prompt: string
          default_temperature: number
          description: string
          embeddings_provider: string
          id: string
          image_path: string
          include_profile_context: boolean
          include_workspace_instructions: boolean
          instructions: string
          is_home: boolean
          name: string
          sharing: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          default_context_length: number
          default_model: string
          default_prompt: string
          default_temperature: number
          description: string
          embeddings_provider: string
          id?: string
          image_path?: string
          include_profile_context: boolean
          include_workspace_instructions: boolean
          instructions: string
          is_home?: boolean
          name: string
          sharing?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          default_context_length?: number
          default_model?: string
          default_prompt?: string
          default_temperature?: number
          description?: string
          embeddings_provider?: string
          id?: string
          image_path?: string
          include_profile_context?: boolean
          include_workspace_instructions?: boolean
          instructions?: string
          is_home?: boolean
          name?: string
          sharing?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_duplicate_messages_for_new_chat: {
        Args: { old_chat_id: string; new_chat_id: string; new_user_id: string }
        Returns: undefined
      }
      delete_message_including_and_after: {
        Args: {
          p_user_id: string
          p_chat_id: string
          p_sequence_number: number
        }
        Returns: undefined
      }
      delete_messages_including_and_after: {
        Args: {
          p_user_id: string
          p_chat_id: string
          p_sequence_number: number
        }
        Returns: undefined
      }
      delete_storage_object: {
        Args: { bucket: string; object: string }
        Returns: Record<string, unknown>
      }
      delete_storage_object_from_bucket: {
        Args: { bucket_name: string; object_path: string }
        Returns: Record<string, unknown>
      }
      match_documents: {
        Args: {
          query_embedding: string
          user_id_filter?: string
          file_name_filter?: string
          collection_filter?: string
          description_filter?: string
          start_date?: string
          end_date?: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          user_id: string
          created_at: string
          content: string
          chunk_timestamp: string
          file_id: string
          chunk_index: number
          file_name: string
          openai_embedding: string
          updated_at: string
          sharing: string
          folder_id: string
          file_path: string
          type: string
          size: number
          project_id: string
          message_index: number
          topic_id: string
          embedding_json: Json
          session_id: string
          status: string
          topic_name: string
          speaker_role: string
          ingested: boolean
          ingested_at: string
          uploaded_at: string
          file_content: string
          score: number
        }[]
      }
      match_documents_with_settings: {
        Args: { query: string }
        Returns: {
          id: string
          document_id: string
          content: string
          similarity: number
        }[]
      }
      match_file_items_openai: {
        Args: {
          query_embedding: string
          match_count?: number
          file_ids?: string[]
        }
        Returns: {
          id: string
          file_id: string
          content: string
          tokens: number
          similarity: number
        }[]
      }
      non_private_assistant_exists: {
        Args: { p_name: string }
        Returns: boolean
      }
      non_private_file_exists: {
        Args: { p_name: string }
        Returns: boolean
      }
      non_private_workspace_exists: {
        Args: { p_name: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
