import dynamic from "next/dynamic";
import { FC } from "react";

// Dynamically import PdfViewer with SSR disabled
const PdfViewer = dynamic(() => import("./pdf-viewer").then(mod => mod.PdfViewer), {
  ssr: false,
  loading: () => <div>Loading PDF viewer...</div>
});

interface PdfViewerClientProps {
  fileUrl: string;
  highlightTexts?: string[];
}

export const PdfViewerClient: FC<PdfViewerClientProps> = ({ fileUrl, highlightTexts }) => {
  return <PdfViewer fileUrl={fileUrl} highlightTexts={highlightTexts} />;
};
