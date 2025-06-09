import React, { useContext, useState } from "react";
import { ChatbotUIContext } from "@/context/context";
import { FileIcon } from "@/components/ui/file-icon";
import { FilePreview } from "@/components/ui/file-preview";
import { getFileFromStorage } from "@/db/storage/files";

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

  // Handler to open PDF in new tab
  const handlePdfClick = async (file: any) => {
    if (!file) return;
    // Try to get file_path from files context
    const fullFile = files.find((f: any) => f.name === file.name);
    if (fullFile && fullFile.file_path) {
      const signedUrl = await getFileFromStorage(fullFile.file_path);
      const a = document.createElement('a');
      a.href = signedUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = fullFile.name || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("Could not find file path for PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-primary mb-2 text-lg font-bold">History for: {topic}</div>
      {history.length === 0 && <div className="italic">No history found for this topic.</div>}
      {history.map((item, i) => {
        const file = getFileByName(item.file_name) || { name: item.file_name, type: "pdf" };
        return (
          <div key={i} className="bg-secondary rounded-xl border p-4">
            <div className="flex items-center space-x-2 mb-1">
              <FileIcon type={file.type || "pdf"} size={24} />
              <span
                className="underline text-blue-600 font-semibold cursor-pointer hover:opacity-50"
                onClick={() => handlePdfClick(file)}
              >
                {file.name}
              </span>
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
