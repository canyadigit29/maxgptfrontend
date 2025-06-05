import { Dialog, DialogContent } from "./dialog";
import { PdfViewerClient } from "./pdf-viewer-client";
import { ChatFile } from "@/types";
import { FC } from "react";

interface PdfViewerDialogProps {
  file: ChatFile;
  highlightTexts?: string[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const PdfViewerDialog: FC<PdfViewerDialogProps> = ({ file, highlightTexts, isOpen, onOpenChange }) => {
  // Use file.file_path for Tables<'files'>, fallback to file.name if needed
  const fileUrl = (file as any).file_path || file.name;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex items-center justify-center outline-none border-transparent bg-transparent min-w-[900px] min-h-[80vh]">
        <PdfViewerClient fileUrl={fileUrl} highlightTexts={highlightTexts} />
      </DialogContent>
    </Dialog>
  );
};
