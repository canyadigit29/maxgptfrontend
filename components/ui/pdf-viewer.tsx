import { Document, Page, pdfjs } from 'react-pdf';
import { useEffect, useRef, useState } from 'react';
import React from 'react';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  fileUrl: string;
  highlightTexts?: string[];
}

export const PdfViewer = ({ fileUrl, highlightTexts }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchPage, setSearchPage] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlightLocations, setHighlightLocations] = useState<{page: number, idx: number, text: string}[]>([]);
  const [currentHighlightIdx, setCurrentHighlightIdx] = useState(0);
  const textLayerRef = useRef<HTMLDivElement>(null);
  // Ref for scrolling to first highlight
  const firstHighlightRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Find all highlight locations in the PDF
  useEffect(() => {
    if (!highlightTexts || highlightTexts.length === 0) return;
    setSearchError(null);
    (async () => {
      try {
        const loadingTask = pdfjs.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        let found: {page: number, idx: number, text: string}[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => (item as any).str).join(' ');
          highlightTexts.forEach(ht => {
            let idx = -1;
            let offset = 0;
            while ((idx = pageText.indexOf(ht, offset)) !== -1) {
              found.push({ page: i, idx, text: ht });
              offset = idx + ht.length;
            }
          });
        }
        setHighlightLocations(found);
        if (found.length > 0) {
          setSearchPage(found[0].page);
          setPageNumber(found[0].page);
          setCurrentHighlightIdx(0);
        } else {
          setSearchError('Could not find highlighted text in PDF.');
        }
      } catch (e) {
        setSearchError('Error searching PDF.');
      }
    })();
  }, [fileUrl, highlightTexts]);

  // Navigation between highlights
  const goToHighlight = (idx: number) => {
    if (highlightLocations.length === 0) return;
    const loc = highlightLocations[idx];
    setPageNumber(loc.page);
    setCurrentHighlightIdx(idx);
  };

  // Utility to normalize text for robust matching
  function normalizeText(str: string) {
    return str.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  // Custom text renderer to highlight all matches, with debug logging and robust matching
  const customTextRenderer = (textItem: any) => {
    if (!highlightTexts || highlightTexts.length === 0) return textItem.str;
    let str = textItem.str;
    const normStr = normalizeText(str);
    let matched = false;
    highlightTexts.forEach(ht => {
      const normHt = normalizeText(ht);
      if (normHt && normStr.includes(normHt)) {
        matched = true;
        // For debug: log the actual text and highlight text
        console.log('Highlighting:', { actual: str, highlight: ht, normStr, normHt });
        // Highlight all occurrences (case/whitespace insensitive)
        // Use a regex to replace all matches
        const regex = new RegExp(normHt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        str = str.replace(regex, (match: string) => `<mark style='background: yellow; color: black;'>${match}</mark>`);
      }
    });
    return <span dangerouslySetInnerHTML={{ __html: str }} />;
  };

  // Auto-scroll to first highlight page after rendering
  useEffect(() => {
    if (firstHighlightRef.current) {
      firstHighlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchPage]);

  return (
    <div style={{ width: '100%', height: '80vh', overflow: 'auto' }}>
      <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading="Loading PDF...">
        {numPages && Array.from({ length: numPages }, (_, index) => {
          const pageIdx = index + 1;
          const isFirstHighlightPage = searchPage === pageIdx;
          return (
            <div key={`page_wrap_${pageIdx}`} ref={isFirstHighlightPage ? firstHighlightRef : undefined}>
              <Page
                pageNumber={pageIdx}
                width={800}
                renderTextLayer={true}
                customTextRenderer={customTextRenderer}
              />
            </div>
          );
        })}
      </Document>
      {highlightTexts && highlightTexts.length > 0 && (
        <div className="mt-2 text-sm text-yellow-700">
          {searchError
            ? searchError
            : searchPage
            ? `Showing page ${searchPage} containing highlighted text.`
            : 'Searching for highlighted text...'}
        </div>
      )}
      {highlightLocations.length > 0 && (
        <div className="flex gap-2 mt-2 items-center">
          <button
            onClick={() => goToHighlight((currentHighlightIdx - 1 + highlightLocations.length) % highlightLocations.length)}
            disabled={highlightLocations.length === 0}
          >
            Previous Highlight
          </button>
          <span>
            Highlight {currentHighlightIdx + 1} of {highlightLocations.length}
          </span>
          <button
            onClick={() => goToHighlight((currentHighlightIdx + 1) % highlightLocations.length)}
            disabled={highlightLocations.length === 0}
          >
            Next Highlight
          </button>
        </div>
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setPageNumber(p => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
        >
          Previous Page
        </button>
        <span>
          Page {pageNumber} of {numPages}
        </span>
        <button
          onClick={() => setPageNumber(p => (numPages ? Math.min(numPages, p + 1) : p))}
          disabled={numPages ? pageNumber >= numPages : true}
        >
          Next Page
        </button>
      </div>
    </div>
  );
};
