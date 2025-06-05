import { Dialog, DialogContent } from "./dialog";
import { PdfViewer } from "./pdf-viewer";
import { ChatFile } from "@/types";
import { FC } from "react";

interface PdfViewerDialogProps {
  file: ChatFile;
  highlightText?: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const PdfViewerDialog: FC<PdfViewerDialogProps> = ({ file, highlightText, isOpen, onOpenChange }) => {
  // Assume file.file_path is a public URL or can be fetched
  // You may need to adjust this to fetch from storage if needed
  const fileUrl = file.file_path || file.url || file.path;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex items-center justify-center outline-none border-transparent bg-transparent min-w-[900px] min-h-[80vh]">
        <PdfViewer fileUrl={fileUrl} highlightText={highlightText} />
      </DialogContent>
    </Dialog>
  );
};
