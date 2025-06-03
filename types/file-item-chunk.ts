// This type is no longer needed for raw result display. Consider removing or archiving.

export type FileItemChunk = {
  content: string
  tokens: number
  file_id?: string // Add file_id field
  metadata?: Record<string, any>
}
