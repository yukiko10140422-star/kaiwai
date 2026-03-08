"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MessageAttachment } from "@/types/database";

interface FilePreviewModalProps {
  attachments: MessageAttachment[];
  initialIndex: number;
  signedUrls: Record<string, string>; // attachment.id -> signed url
  onClose: () => void;
}

export default function FilePreviewModal({
  attachments,
  initialIndex,
  signedUrls,
  onClose,
}: FilePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, tx: 0, ty: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const current = attachments[currentIndex];
  const url = signedUrls[current?.id];
  const hasMultiple = attachments.length > 1;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % attachments.length);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [attachments.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + attachments.length) % attachments.length);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [attachments.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && hasMultiple) goNext();
      if (e.key === "ArrowLeft" && hasMultiple) goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev, hasMultiple]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Mouse wheel zoom (passive: false to allow preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => {
        const next = prev - e.deltaY * 0.001;
        return Math.min(Math.max(0.25, next), 5);
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Pan with mouse drag when zoomed
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y });
    },
    [scale, translate]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setTranslate({
        x: dragStart.tx + (e.clientX - dragStart.x),
        y: dragStart.ty + (e.clientY - dragStart.y),
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handleDownload = useCallback(() => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = current.file_name;
    a.click();
  }, [url, current?.file_name]);

  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Top toolbar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
          <div className="text-white/70 text-sm">
            {hasMultiple && (
              <span className="mr-3">{currentIndex + 1} / {attachments.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <button
              onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="縮小"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
              </svg>
            </button>
            <button
              onClick={resetZoom}
              className="px-2 py-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-xs font-mono min-w-[48px] text-center"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={() => setScale((s) => Math.min(5, s + 0.25))}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="拡大"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
              </svg>
            </button>

            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="ダウンロード"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="閉じる"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
              aria-label="前の画像"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
              aria-label="次の画像"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        {/* Image */}
        <motion.div
          ref={containerRef}
          key={current.id}
          className="relative z-[1] flex items-center justify-center max-w-[90vw] max-h-[80vh]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          {url ? (
            <img
              src={url}
              alt={current.file_name}
              className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg select-none"
              style={{
                transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              draggable={false}
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-white/50">
              読み込み中...
            </div>
          )}
        </motion.div>

        {/* Bottom file name */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-4 py-4 z-10">
          <span className="text-white/80 text-sm bg-black/40 rounded-lg px-4 py-2 backdrop-blur-sm">
            {current.file_name}
          </span>
        </div>

        {/* Dot indicators for multiple images */}
        {hasMultiple && (
          <div className="absolute bottom-14 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
            {attachments.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentIndex(i);
                  setScale(1);
                  setTranslate({ x: 0, y: 0 });
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`画像 ${i + 1}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
