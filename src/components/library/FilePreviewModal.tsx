"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import FileIcon from "@/components/shared/FileIcon";
import { formatFileSize } from "@/lib/files";
import { getLibraryFileSignedUrl, type LibraryFileWithProfile } from "@/lib/library";

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
  const [scale, setScale] = useState(1);

  // Sync currentFile with prop
  useEffect(() => {
    setCurrentFile(file);
    setScale(1);
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
      setScale(1);
    }
  }, [hasPrev, files, currentIndex]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      setCurrentFile(files[currentIndex + 1]);
      setScale(1);
    }
  }, [hasNext, files, currentIndex]);

  // Ctrl+Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setScale((s) => Math.min(3, Math.max(0.25, s + (e.deltaY > 0 ? -0.1 : 0.1))));
    }
  }, []);

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

  if (!currentFile) return null;

  const isImage = currentFile.file_type.startsWith("image/");
  const isPdf = currentFile.file_type === "application/pdf";
  const isVideo = currentFile.file_type.startsWith("video/");
  const isAudio = currentFile.file_type.startsWith("audio/");

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col" onClick={onClose}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white text-sm font-medium truncate max-w-[60%]">
          {currentFile.file_name}
        </h2>
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
        className="flex-1 flex items-center justify-center relative min-h-0 px-12"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
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
          <div className="overflow-auto max-h-[70vh] max-w-full flex items-center justify-center rounded-lg">
            <img
              src={signedUrl}
              alt={currentFile.file_name}
              className="object-contain rounded-lg transition-transform"
              style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
            />
          </div>
        ) : isPdf && signedUrl ? (
          <Suspense fallback={<div className="text-white/50 text-sm animate-pulse">PDF読み込み中...</div>}>
            <PdfPreview url={signedUrl} fileName={currentFile.file_name} scale={scale} />
          </Suspense>
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

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-3 pb-20 md:pb-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zoom controls (image/PDF only) */}
        {(isImage || isPdf) && signedUrl ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setScale((s) => Math.max(0.25, +(s - 0.25).toFixed(2)))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-bold"
            >
              −
            </button>
            <span className="text-white/70 text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((s) => Math.min(3, +(s + 0.25).toFixed(2)))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-bold"
            >
              +
            </button>
            {scale !== 1 && (
              <button
                onClick={() => setScale(1)}
                className="px-2 py-1 text-xs rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors ml-1"
              >
                リセット
              </button>
            )}
          </div>
        ) : (
          <p className="text-white/50 text-xs">
            {formatFileSize(currentFile.file_size)} · {new Date(currentFile.created_at).toLocaleDateString("ja-JP")}
            {currentFile.uploader && ` · ${currentFile.uploader.display_name}`}
            {files.length > 1 && ` · ${currentIndex + 1} / ${files.length}`}
          </p>
        )}
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
    </div>
  );
}
