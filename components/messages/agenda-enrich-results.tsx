import React, { useContext, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { getFileFromStorage } from "@/db/storage/files"
import { FileIcon } from "@/components/ui/file-icon"
import { FilePreview } from "@/components/ui/file-preview"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"

interface AgendaEnrichResultsProps {
  results: Array<{
    title: string
    summary: string
    retrieved_chunks: Array<any>
  }>
}

export const AgendaEnrichResults: React.FC<AgendaEnrichResultsProps> = ({ results }) => {
  const { files } = useContext(ChatbotUIContext)
  const { FileViewerComponent, openFileViewerForLLM } = useChatHandler();
  const [openSources, setOpenSources] = useState<{ [key: number]: boolean }>({})
  const [showFilePreview, setShowFilePreview] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [highlightedChunks, setHighlightedChunks] = useState<string[]>([])

  // Helper to get file name from chunk metadata
  const getFileName = (chunk: any) => {
    if (chunk.file_metadata && chunk.file_metadata.name) return chunk.file_metadata.name
    if (chunk.name) return chunk.name
    return "[Unknown file]"
  }
  // Helper to get file id from chunk metadata
  const getFileId = (chunk: any) => {
    if (chunk.file_metadata && chunk.file_metadata.id) return chunk.file_metadata.id
    if (chunk.file_id) return chunk.file_id
    return null
  }
  // Helper to get file type from chunk metadata
  const getFileType = (chunk: any) => {
    if (chunk.file_metadata && chunk.file_metadata.type) return chunk.file_metadata.type
    if (chunk.type) return chunk.type
    return ""
  }
  // Helper to open file in new tab
  const handleFileClick = async (file: any, chunks: string[]) => {
    setSelectedFile(file)
    setHighlightedChunks(chunks)
    setShowFilePreview(true)
  }

  // Group chunks by file for each topic
  const groupChunksByFile = (chunks: any[]) => {
    const grouped: { [fileId: string]: { file: any; chunks: any[] } } = {}
    for (const chunk of chunks) {
      const fileId = getFileId(chunk)
      if (!fileId) continue
      if (!grouped[fileId]) {
        const file = files.find(f => f.id === fileId) || { id: fileId, name: getFileName(chunk), type: getFileType(chunk) }
        grouped[fileId] = { file, chunks: [] }
      }
      grouped[fileId].chunks.push(chunk)
    }
    return grouped
  }

  return (
    <div className="space-y-6">
      {/* Render the file viewer modal if needed */}
      {FileViewerComponent}
      {results.map((topic, i) => {
        const grouped = groupChunksByFile(topic.retrieved_chunks)
        const fileCount = Object.keys(grouped).length
        const chunkCount = topic.retrieved_chunks.length
        return (
          <div key={i} className="border rounded-xl bg-secondary p-4">
            <div className="font-bold mb-2 text-primary text-lg">{topic.title}</div>
            <div className="mb-2 whitespace-pre-wrap">{topic.summary}</div>
            {chunkCount > 0 && (
              <div className="border-t pt-4 mt-4 font-bold">
                {!openSources[i] ? (
                  <div
                    className="flex cursor-pointer items-center text-lg hover:opacity-50"
                    onClick={() => setOpenSources(prev => ({ ...prev, [i]: true }))}
                  >
                    {chunkCount} {chunkCount > 1 ? "Sources" : "Source"} from {fileCount} {fileCount > 1 ? "Files" : "File"}
                    <span className="ml-1">▶</span>
                  </div>
                ) : (
                  <>
                    <div
                      className="flex cursor-pointer items-center text-lg hover:opacity-50"
                      onClick={() => setOpenSources(prev => ({ ...prev, [i]: false }))}
                    >
                      {chunkCount} {chunkCount > 1 ? "Sources" : "Source"} from {fileCount} {fileCount > 1 ? "Files" : "File"}
                      <span className="ml-1">▼</span>
                    </div>
                    <div className="mt-3 space-y-4">
                      {Object.values(grouped).map(({ file, chunks }, idx) => (
                        <div key={file.id || idx}>
                          <div className="flex items-center space-x-2">
                            <div>
                              <FileIcon type={file.type || ""} size={24} />
                            </div>
                            <div
                              className="cursor-pointer underline text-blue-600 truncate hover:opacity-50"
                              onClick={() => handleFileClick(file, chunks.map((c: any) => c.content))}
                            >
                              {file.name}
                            </div>
                          </div>
                          {chunks.map((chunk, cidx) => (
                            <div
                              key={cidx}
                              className="ml-8 mt-1.5 flex items-center space-x-2"
                            >
                              <div className="text-sm font-normal">
                                <span className="mr-1 text-lg font-bold">-</span>{" "}
                                {chunk.content.substring(0, 200)}...
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {/* File preview dialog */}
            {showFilePreview && selectedFile && (
              <FilePreview
                type="file"
                item={selectedFile}
                isOpen={showFilePreview}
                onOpenChange={setShowFilePreview}
                highlightedChunks={highlightedChunks}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
