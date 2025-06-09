import React, { useContext, useState } from "react";
import { ChatbotUIContext } from "@/context/context";
import { FileIcon } from "@/components/ui/file-icon";
import { FilePreview } from "@/components/ui/file-preview";

interface ItemHistory {
  date: string;
  file_name: string;
  summary: string;
  sources: string[];
}

interface ItemHistoryResultsProps {
  topic: string;
  history: ItemHistory[];
}

export const ItemHistoryResults: React.FC<ItemHistoryResultsProps> = ({ topic, history }) => {
  const { files } = useContext(ChatbotUIContext);
  const [showSources, setShowSources] = useState<{ [key: number]: boolean }>({});
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [highlightedChunks, setHighlightedChunks] = useState<string[]>([]);

  // Helper to get file info from file_name
  const getFileByName = (fileName: string) => files.find(f => f.name === fileName);

  return (
    <div className="space-y-6">
      <div className="mb-2 text-lg font-bold text-primary">History for: {topic}</div>
      {history.length === 0 && <div className="italic">No history found for this topic.</div>}
      {history.map((item, i) => {
        const file = getFileByName(item.file_name) || { name: item.file_name, type: "pdf" };
        return (
          <div key={i} className="rounded-xl border bg-secondary p-4">
            <div className="mb-1 flex items-center space-x-2">
              <FileIcon type={file.type || "pdf"} size={24} />
              <span className="font-semibold">{file.name}</span>
              <span className="text-xs text-gray-400">({item.date})</span>
            </div>
            <div className="mb-2 whitespace-pre-wrap">{item.summary}</div>
            {item.sources && item.sources.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <span className="font-bold">Sources used:</span>
                <ul className="ml-6 mt-1 list-disc">
                  {item.sources.map((src, idx) => (
                    <li key={idx} className="truncate text-xs text-gray-500">{src}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
      {/* File preview dialog (future: if you want to preview files) */}
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
  );
};
