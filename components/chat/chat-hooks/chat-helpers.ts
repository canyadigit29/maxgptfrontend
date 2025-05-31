import { getEmbedding } from '@/lib/embedding'

/**
 * Patched performSemanticSearch to use FastAPI backend for semantic search instead of direct Supabase RPC.
 * Calls /file_ops/search_docs on your backend for all queries.
 */
export async function performSemanticSearch({
  query,
  file_name_filter,
  collection_filter,
  description_filter,
  start_date,
  end_date,
  user_id,
  top_k = 10,
  expected_phrase,
}: {
  query: string
  file_name_filter?: string
  collection_filter?: string[]
  description_filter?: string
  start_date?: string
  end_date?: string
  user_id?: string
  top_k?: number
  expected_phrase?: string
}) {
  if (!query || query.trim().length === 0) return []

  const embedding = await getEmbedding(query)
  if (!embedding) throw new Error('Failed to generate embedding.')

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://backendsearch-production.up.railway.app/api'

  const response = await fetch(
    `${backendUrl}/file_ops/search_docs`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embedding,
        user_id,
        file_name_filter,
        collection_filter,
        description_filter,
        start_date,
        end_date,
        expected_phrase,
        top_k,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Semantic search failed')
  }
  const data = await response.json()
  return data.retrieved_chunks || []
}

// You can keep or add any other helpers below as needed.
