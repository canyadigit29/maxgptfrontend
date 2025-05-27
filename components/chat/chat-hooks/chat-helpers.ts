
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { getEmbedding } from '@/lib/embedding'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function handleRetrieval({
  query,
  file_name_filter,
  collection_filter,
  description_filter,
  start_date,
  end_date,
  user_id,
  top_k = 10
}: {
  query: string
  file_name_filter?: string
  collection_filter?: string[]
  description_filter?: string
  start_date?: string
  end_date?: string
  user_id?: string
  top_k?: number
}) {
  if (!query || query.trim().length === 0) return []

  const embedding = await getEmbedding(query)
  if (!embedding) throw new Error('Failed to generate embedding.')

  let supabaseQuery = supabase.rpc('match_document_chunks', {
    query_embedding: embedding,
    match_count: top_k
  })

  if (file_name_filter) {
    supabaseQuery = supabaseQuery.ilike('file_name', `%${file_name_filter}%`)
  }

  if (collection_filter && collection_filter.length > 0) {
    supabaseQuery = supabaseQuery.in('collection', collection_filter)
  }

  if (description_filter) {
    supabaseQuery = supabaseQuery.ilike('description', `%${description_filter}%`)
  }

  if (start_date) {
    supabaseQuery = supabaseQuery.gte('relevant_date', start_date)
  }

  if (end_date) {
    supabaseQuery = supabaseQuery.lte('relevant_date', end_date)
  }

  if (user_id) {
    supabaseQuery = supabaseQuery.eq('user_id', user_id)
  }

  const { data, error } = await supabaseQuery
  if (error) {
    console.error('Supabase search error:', error)
    throw error
  }

  return data || []
}
