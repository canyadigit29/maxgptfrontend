import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert } from "@/types/supabase.types"

// Insert a retrieved chunk link (for a search or message)
export const createRetrievedChunk = async (retrievedChunk: TablesInsert<"retrieved_chunks">) => {
  const { data, error } = await supabase
    .from("retrieved_chunks")
    .insert([retrievedChunk])
    .select("*")
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Get all chunk IDs for a search/message
export const getRetrievedChunksBySearchId = async (searchId: string) => {
  const { data, error } = await supabase
    .from("retrieved_chunks")
    .select("chunk_id")
    .eq("search_id", searchId)
  if (error) throw new Error(error.message)
  return data?.map(row => row.chunk_id) || []
}

// Fetch full chunk content for a list of chunk IDs from document_chunks
export const getChunkContentsByIds = async (chunkIds: string[]) => {
  if (!chunkIds.length) return [];
  const { data, error } = await supabase
    .from("document_chunks")
    .select("id, content")
    .in("id", chunkIds)
  if (error) throw new Error(error.message)
  return data || [];
}
