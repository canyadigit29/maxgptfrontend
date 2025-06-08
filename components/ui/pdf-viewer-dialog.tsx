import { Dialog, DialogContent } from "./dialog";
import { PdfViewerClient } from "./pdf-viewer-client";
import { ChatFile } from "@/types";
import { FC, useEffect, useState } from "react";
import { getFileFromStorage } from "@/db/storage/files";

interface PdfViewerDialogProps {
  file: ChatFile;
  highlightTexts?: string[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const PdfViewerDialog: FC<PdfViewerDialogProps> = ({ file, highlightTexts, isOpen, onOpenChange }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('PdfViewerDialog file:', file);
    if (!file || !(file as any).file_path) {
      setError('No file_path found on file object.');
      return;
    }
    setLoading(true);
    setError(null);
    getFileFromStorage((file as any).file_path)
      .then(url => {
        console.log('Generated signed PDF URL:', url);
        setSignedUrl(url);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load PDF file.");
        setLoading(false);
      });
  }, [file]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex items-center justify-center outline-none border-transparent bg-transparent min-w-[900px] min-h-[80vh]">
        {loading && <div>Loading PDF...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {signedUrl && !loading && !error && (
          <PdfViewerClient fileUrl={signedUrl} highlightTexts={highlightTexts} />
        )}
      </DialogContent>
    </Dialog>
  );
};
