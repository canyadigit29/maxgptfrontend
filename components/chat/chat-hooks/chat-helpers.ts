import { getEmbedding } from '@/lib/embedding'
import { searchDocs } from '@/lib/search-docs-api'

export async function performSemanticSearch({
  query,
  file_name_filter,
  collection_filter,
  description_filter,
  start_date,
  end_date,
  user_id,
  top_k = 10,
}: {
  query: string
  file_name_filter?: string
  collection_filter?: string[]
  description_filter?: string
  start_date?: string
  end_date?: string
  user_id: string
  top_k?: number
}) {
  if (!query || query.trim().length === 0) return []

  const embedding = await getEmbedding(query)
  if (!embedding) throw new Error('Failed to generate embedding.')

  // Adapt filters to backend API shape
  const params: any = {
    embedding,
    user_id,
    top_k,
  }
  if (file_name_filter) params.file_name_filter = file_name_filter
  if (collection_filter && collection_filter.length > 0) params.collection_filter = collection_filter
  if (description_filter) params.description_filter = description_filter
  if (start_date) params.start_date = start_date
  if (end_date) params.end_date = end_date

  return await searchDocs(params)
}
