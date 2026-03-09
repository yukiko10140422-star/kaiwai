"use client";

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import FileIcon from "@/components/shared/FileIcon";
import { formatFileSize } from "@/lib/files";
import { getLibraryFileSignedUrl, type LibraryFileWithProfile } from "@/lib/library";
import { useZoomPan } from "@/hooks/useZoomPan";
import ViewerToolbar from "@/components/ui/ViewerToolbar";

const PdfPreview = lazy(() => import("./PdfPreview"));

interface FilePreviewModalProps {
  file: LibraryFileWithProfile | null;
  files: LibraryFileWithProfile[];
  onClose: () => void;
  onOpenDetail: (file: LibraryFileWithProfile) => void;
}

export default function FilePreviewModal({ file, files, onClose, onOpenDetail }: FilePreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<LibraryFileWithProfile | null>(file);
  // PDF state
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  // Container size for fit presets
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const zoomPan = useZoomPan({ minScale: 0.25, maxScale: 5 });

  // Measure container
  useEffect(() => {
    const el = previewAreaRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ width: rect.width - 96, height: rect.height - 32 }); // minus padding for arrows
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Sync currentFile with prop
  useEffect(() => {
    setCurrentFile(file);
    zoomPan.resetZoom();
    setPdfCurrentPage(1);
    setPdfTotalPages(0);
  }, [file]);

  // Load signed URL
  useEffect(() => {
    if (!currentFile) {
      setSignedUrl(null);
      return;
    }
    setSignedUrl(null);
    setLoading(true);
    getLibraryFileSignedUrl(currentFile.storage_path)
      .then(setSignedUrl)
      .catch(() => setSignedUrl(null))
      .finally(() => setLoading(false));
  }, [currentFile]);

  const currentIndex = currentFile ? files.findIndex((f) => f.id === currentFile.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < files.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      setCurrentFile(files[currentIndex - 1]);
      zoomPan.resetZoom();
      setPdfCurrentPage(1);
      setPdfTotalPages(0);
    }
  }, [hasPrev, files, currentIndex, zoomPan]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      setCurrentFile(files[currentIndex + 1]);
      zoomPan.resetZoom();
      setPdfCurrentPage(1);
      setPdfTotalPages(0);
    }
  }, [hasNext, files, currentIndex, zoomPan]);

  // Keyboard navigation
  useEffect(() => {
    if (!currentFile) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentFile, onClose, goToPrev, goToNext]);

  // Lock body scroll
  useEffect(() => {
    if (!currentFile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [currentFile]);

  // Fit presets
  const fitToWidth = useCallback(() => {
    if (containerSize.width <= 0) return;
    const targetWidth = naturalSize.width > 0 ? naturalSize.width : 600;
    const newScale = containerSize.width / targetWidth;
    zoomPan.setScale(newScale);
    zoomPan.resetZoom();
    // Apply scale after reset (reset sets to 1)
    requestAnimationFrame(() => zoomPan.setScale(newScale));
  }, [containerSize, naturalSize, zoomPan]);

  const fitToPage = useCallback(() => {
    if (containerSize.width <= 0 || containerSize.height <= 0) return;
    const targetWidth = naturalSize.width > 0 ? naturalSize.width : 600;
    const targetHeight = naturalSize.height > 0 ? naturalSize.height : 400;
    const scaleW = containerSize.width / targetWidth;
    const scaleH = containerSize.height / targetHeight;
    const newScale = Math.min(scaleW, scaleH);
    zoomPan.resetZoom();
    requestAnimationFrame(() => zoomPan.setScale(newScale));
  }, [containerSize, naturalSize, zoomPan]);

  if (!currentFile) return null;

  const isImage = currentFile.file_type.startsWith("image/");
  const isPdf = currentFile.file_type === "application/pdf";
  const isVideo = currentFile.file_type.startsWith("video/");
  const isAudio = currentFile.file_type.startsWith("audio/");
  const isZoomable = (isImage || isPdf) && !!signedUrl;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col" onClick={onClose}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-white text-sm font-medium truncate max-w-[60%]">
            {currentFile.file_name}
          </h2>
          <span className="text-white/40 text-xs shrink-0">
            {formatFileSize(currentFile.file_size)}
            {files.length > 1 && ` · ${currentIndex + 1} / ${files.length}`}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 md:p-2 rounded-lg text-white bg-white/10 md:bg-transparent md:text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        >
          <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Preview area */}
      <div
        ref={previewAreaRef}
        className="flex-1 flex items-center justify-center relative min-h-0 px-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left arrow */}
        {hasPrev && (
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-white/50 text-sm animate-pulse">読み込み中...</div>
        ) : isImage && signedUrl ? (
          <div
            ref={zoomPan.containerRef}
            className="overflow-hidden max-h-[75vh] max-w-full flex items-center justify-center rounded-lg select-none"
            style={{ cursor: zoomPan.cursorStyle, touchAction: "none" }}
            onMouseDown={zoomPan.onMouseDown}
            onMouseMove={zoomPan.onMouseMove}
            onMouseUp={zoomPan.onMouseUp}
            onMouseLeave={zoomPan.onMouseLeave}
            onDoubleClick={zoomPan.onDoubleClick}
            onTouchStart={zoomPan.onTouchStart}
            onTouchMove={zoomPan.onTouchMove}
            onTouchEnd={zoomPan.onTouchEnd}
          >
            <img
              src={signedUrl}
              alt={currentFile.file_name}
              className="object-contain rounded-lg max-h-[75vh] max-w-full"
              style={zoomPan.transformStyle}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
              }}
            />
          </div>
        ) : isPdf && signedUrl ? (
          <div
            ref={zoomPan.containerRef}
            className="overflow-hidden max-h-[75vh] max-w-full flex items-center justify-center rounded-lg select-none"
            style={{ cursor: zoomPan.cursorStyle, touchAction: "none" }}
            onMouseDown={zoomPan.onMouseDown}
            onMouseMove={zoomPan.onMouseMove}
            onMouseUp={zoomPan.onMouseUp}
            onMouseLeave={zoomPan.onMouseLeave}
            onDoubleClick={zoomPan.onDoubleClick}
            onTouchStart={zoomPan.onTouchStart}
            onTouchMove={zoomPan.onTouchMove}
            onTouchEnd={zoomPan.onTouchEnd}
          >
            <div style={zoomPan.transformStyle}>
              <Suspense fallback={<div className="text-white/50 text-sm animate-pulse">PDF読み込み中...</div>}>
                <PdfPreview
                  url={signedUrl}
                  fileName={currentFile.file_name}
                  currentPage={pdfCurrentPage}
                  onPageChange={setPdfCurrentPage}
                  onLoadInfo={({ numPages }) => setPdfTotalPages(numPages)}
                />
              </Suspense>
            </div>
          </div>
        ) : isVideo && signedUrl ? (
          <video
            key={currentFile.id}
            src={signedUrl}
            controls
            className="max-h-[80vh] max-w-full rounded-lg"
          />
        ) : isAudio && signedUrl ? (
          <div className="flex flex-col items-center gap-4">
            <FileIcon fileType={currentFile.file_type} className="w-20 h-20" />
            <audio key={currentFile.id} src={signedUrl} controls className="w-80" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <FileIcon fileType={currentFile.file_type} className="w-20 h-20" />
            <p className="text-white/70 text-sm">{currentFile.file_name}</p>
            {signedUrl && (
              <a
                href={signedUrl}
                download={currentFile.file_name}
                className="px-4 py-2 text-sm rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                ダウンロード
              </a>
            )}
          </div>
        )}

        {/* Right arrow */}
        {hasNext && (
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Floating Toolbar (image/PDF only) */}
      {isZoomable && (
        <ViewerToolbar
          scale={zoomPan.scale}
          onZoomIn={zoomPan.zoomIn}
          onZoomOut={zoomPan.zoomOut}
          onResetZoom={zoomPan.resetZoom}
          onFitWidth={fitToWidth}
          onFitPage={fitToPage}
          currentPage={isPdf ? pdfCurrentPage : undefined}
          totalPages={isPdf && pdfTotalPages > 1 ? pdfTotalPages : undefined}
          onPageChange={isPdf ? setPdfCurrentPage : undefined}
          downloadUrl={signedUrl}
          downloadName={currentFile.file_name}
          onOpenDetail={() => onOpenDetail(currentFile)}
        />
      )}

      {/* Simple footer for non-zoomable files */}
      {!isZoomable && (
        <div
          className="flex items-center justify-end px-4 py-3 pb-20 md:pb-3 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            {signedUrl && (
              <a
                href={signedUrl}
                download={currentFile.file_name}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                ダウンロード
              </a>
            )}
            <button
              onClick={() => onOpenDetail(currentFile)}
              className="px-3 py-1.5 text-xs rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors"
            >
              詳細を開く
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
