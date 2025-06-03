export type FileItemChunk = {
  content: string
  tokens: number
  file_name?: string
  metadata?: Record<string, any>
}
