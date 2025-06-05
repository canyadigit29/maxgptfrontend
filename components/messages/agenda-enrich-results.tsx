import React, { useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import { getFileFromStorage } from "@/db/storage/files"

interface AgendaEnrichResultsProps {
  results: Array<{
    title: string
    summary: string
    retrieved_chunks: Array<any>
  }>
}

export const AgendaEnrichResults: React.FC<AgendaEnrichResultsProps> = ({ results }) => {
  const { files } = useContext(ChatbotUIContext)

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

  // Helper to open file in new tab
  const handleFileClick = async (chunk: any) => {
    const fileId = getFileId(chunk)
    if (!fileId) return
    const file = files.find(f => f.id === fileId)
    if (!file || !file.file_path) return
    const url = await getFileFromStorage(file.file_path)
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-6">
      {results.map((topic, i) => (
        <div key={i} className="border rounded bg-secondary p-4">
          <div className="font-bold mb-2 text-primary">{topic.title}</div>
          <div className="mb-2 whitespace-pre-wrap">{topic.summary}</div>
          {topic.retrieved_chunks && topic.retrieved_chunks.length > 0 && (
            <div>
              <div className="font-bold text-primary text-xs">Relevant Chunks:</div>
              {topic.retrieved_chunks.map((chunk, k) => (
                <div key={k} className="border rounded bg-background p-2 text-xs whitespace-pre-wrap mt-2">
                  <div className="flex items-center gap-2">
                    {getFileId(chunk) ? (
                      <span
                        className="underline text-blue-600 cursor-pointer hover:opacity-60"
                        title={getFileName(chunk)}
                        onClick={() => handleFileClick(chunk)}
                      >
                        {getFileName(chunk)}
                      </span>
                    ) : (
                      <span className="text-gray-400">[No file link]</span>
                    )}
                  </div>
                  <div className="mt-1">{chunk.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
