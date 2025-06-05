import React from "react"

interface AgendaEnrichResultsProps {
  results: Array<{
    title: string
    summary: string
    retrieved_chunks: Array<{ content: string }>
  }>
}

export const AgendaEnrichResults: React.FC<AgendaEnrichResultsProps> = ({ results }) => {
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
                <div key={k} className="border rounded bg-background p-2 text-xs whitespace-pre-wrap">
                  {chunk.content}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
