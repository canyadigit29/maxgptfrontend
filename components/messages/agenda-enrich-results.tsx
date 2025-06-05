import React from "react"

interface AgendaEnrichResultsProps {
  results: Array<{
    group_title: string
    summary: string
    subtopics: Array<{
      title: string
      summary: string
      sources: Array<any>
    }>
  }>
}

export const AgendaEnrichResults: React.FC<AgendaEnrichResultsProps> = ({ results }) => {
  return (
    <div className="space-y-8">
      {results.map((group, i) => (
        <div key={i} className="border rounded-lg p-4 bg-muted/50">
          <div className="text-xl font-bold mb-2">{group.group_title}</div>
          <div className="mb-4 text-base text-muted-foreground">{group.summary}</div>
          {group.subtopics.length > 0 && (
            <div className="space-y-4">
              {group.subtopics.map((sub, j) => (
                <div key={j} className="border-l-4 border-primary pl-4">
                  <div className="font-semibold text-lg mb-1">{sub.title}</div>
                  <div className="mb-2 text-sm text-muted-foreground">{sub.summary}</div>
                  {sub.sources && sub.sources.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <div className="font-bold text-xs text-primary">Relevant Chunks:</div>
                      {sub.sources.map((chunk, k) => (
                        <div key={k} className="bg-background border rounded p-2 text-xs whitespace-pre-wrap">
                          {chunk.content}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
