export type FileItemChunk = {
  content: string
  tokens: number
  file_id?: string // Add file_id field
  metadata?: Record<string, any>
}
