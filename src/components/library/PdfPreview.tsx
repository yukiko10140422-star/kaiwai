"use client";

import { useState, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  url: string;
  fileName: string;
  scale?: number;
  containerWidth?: number;
  // Page control from parent (ViewerToolbar)
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onLoadInfo?: (info: { numPages: number }) => void;
}

export default function PdfPreview({
  url,
  fileName,
  scale = 1,
  containerWidth,
  currentPage: externalPage,
  onPageChange,
  onLoadInfo,
}: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [internalPage, setInternalPage] = useState(1);
  const [loadError, setLoadError] = useState(false);

  const currentPage = externalPage ?? internalPage;
  const setCurrentPage = onPageChange ?? setInternalPage;

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setCurrentPage(1);
      onLoadInfo?.({ numPages });
    },
    [setCurrentPage, onLoadInfo]
  );

  // Reset page when URL changes
  useEffect(() => {
    setInternalPage(1);
  }, [url]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-white/70 text-sm">PDFの読み込みに失敗しました</p>
        <button
          onClick={() => window.open(url, "_blank")}
          className="px-4 py-2 text-sm rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          新しいタブで開く
        </button>
      </div>
    );
  }

  const pageWidth = containerWidth ? containerWidth * scale : 600 * scale;

  return (
    <div className="flex flex-col items-center max-h-[80vh] overflow-hidden">
      <div className="overflow-hidden rounded-lg">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={() => setLoadError(true)}
          loading={
            <div className="flex items-center justify-center w-[600px] h-[400px]">
              <div className="text-white/50 text-sm animate-pulse">PDF読み込み中...</div>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            width={pageWidth}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}
