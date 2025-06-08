import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// You may want to move these to your env config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const bucket = "files"; // Change if your bucket is named differently

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type FileViewerProps = {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: { name: string; path: string }) => void;
};

export const FileViewer: React.FC<FileViewerProps> = ({ isOpen, onClose, onFileSelect }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    supabase.storage.from(bucket).list("", { limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setFiles(data || []);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select a File</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>
        {loading && <div>Loading files...</div>}
        {error && <div className="text-red-500">{error}</div>}
        <ul>
          {files.map((file) => (
            <li key={file.id || file.name} className="py-2 border-b flex justify-between items-center">
              <span>{file.name}</span>
              <button
                className="ml-4 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => onFileSelect({ name: file.name, path: file.name })}
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
