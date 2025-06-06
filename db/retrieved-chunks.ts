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
