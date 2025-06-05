import { Document, Page, pdfjs } from 'react-pdf';
import { useEffect, useRef, useState } from 'react';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  fileUrl: string;
  highlightText?: string;
}

export const PdfViewer = ({ fileUrl, highlightText }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchPage, setSearchPage] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Try to find the page containing the highlightText
  useEffect(() => {
    if (!highlightText) return;
    setSearchError(null);
    (async () => {
      try {
        const loadingTask = pdfjs.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => (item as any).str).join(' ');
          if (pageText.includes(highlightText)) {
            setSearchPage(i);
            setPageNumber(i);
            return;
          }
        }
        setSearchError('Could not find highlighted text in PDF.');
      } catch (e) {
        setSearchError('Error searching PDF.');
      }
    })();
  }, [fileUrl, highlightText]);

  return (
    <div style={{ width: '100%', height: '80vh', overflow: 'auto' }}>
      <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading="Loading PDF...">
        <Page pageNumber={pageNumber} width={800} renderTextLayer />
      </Document>
      {highlightText && (
        <div className="mt-2 text-sm text-yellow-700">
          {searchError
            ? searchError
            : searchPage
            ? `Showing page ${searchPage} containing highlighted text.`
            : 'Searching for highlighted text...'}
        </div>
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setPageNumber(p => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
        >
          Previous
        </button>
        <span>
          Page {pageNumber} of {numPages}
        </span>
        <button
          onClick={() => setPageNumber(p => (numPages ? Math.min(numPages, p + 1) : p))}
          disabled={numPages ? pageNumber >= numPages : true}
        >
          Next
        </button>
      </div>
    </div>
  );
};
