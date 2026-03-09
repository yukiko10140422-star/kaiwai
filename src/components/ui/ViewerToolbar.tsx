"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ViewerToolbarProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitWidth?: () => void;
  onFitPage?: () => void;
  // PDF page navigation
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // Actions
  downloadUrl?: string;
  downloadName?: string;
  onOpenDetail?: () => void;
}

export default function ViewerToolbar({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  onFitPage,
  currentPage,
  totalPages,
  onPageChange,
  downloadUrl,
  downloadName,
  onOpenDetail,
}: ViewerToolbarProps) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const showToolbar = useCallback(() => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  // Auto-hide after 3s of inactivity
  useEffect(() => {
    showToolbar();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [showToolbar]);

  // Show on any interaction in the page
  useEffect(() => {
    const handler = () => showToolbar();
    window.addEventListener("mousemove", handler);
    window.addEventListener("touchstart", handler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [showToolbar]);

  const hasPdf = totalPages != null && totalPages > 0;

  const Separator = () => <div className="w-px h-5 bg-white/20 mx-0.5 shrink-0" />;

  const Btn = ({
    onClick,
    label,
    children,
    disabled,
  }: {
    onClick?: () => void;
    label: string;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div
      ref={toolbarRef}
      onMouseEnter={() => { setVisible(true); if (timerRef.current) clearTimeout(timerRef.current); }}
      onMouseLeave={() => showToolbar()}
      className={`fixed bottom-6 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-0.5 bg-black/70 backdrop-blur-xl rounded-2xl px-3 py-1.5 shadow-2xl transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      } max-sm:bottom-20`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* PDF Page Navigation */}
      {hasPdf && onPageChange && (
        <>
          <Btn
            onClick={() => onPageChange(Math.max(1, (currentPage ?? 1) - 1))}
            label="前のページ"
            disabled={(currentPage ?? 1) <= 1}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Btn>
          <span className="text-white/80 text-xs font-mono min-w-[48px] text-center select-none">
            {currentPage}/{totalPages}
          </span>
          <Btn
            onClick={() => onPageChange(Math.min(totalPages ?? 1, (currentPage ?? 1) + 1))}
            label="次のページ"
            disabled={(currentPage ?? 1) >= (totalPages ?? 1)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Btn>
          <Separator />
        </>
      )}

      {/* Zoom controls */}
      <Btn onClick={onZoomOut} label="縮小">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </Btn>
      <button
        onClick={onResetZoom}
        className="text-white/80 hover:text-white text-xs font-mono min-w-[48px] text-center rounded-lg hover:bg-white/10 py-1 transition-colors select-none"
      >
        {Math.round(scale * 100)}%
      </button>
      <Btn onClick={onZoomIn} label="拡大">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
        </svg>
      </Btn>

      <Separator />

      {/* Fit presets */}
      {onFitWidth && (
        <Btn onClick={onFitWidth} label="幅に合わせる">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </Btn>
      )}
      {onFitPage && (
        <Btn onClick={onFitPage} label="全体表示">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        </Btn>
      )}

      {(onFitWidth || onFitPage) && <Separator />}

      {/* Download */}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download={downloadName}
          className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="ダウンロード"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </a>
      )}

      {/* Open Detail */}
      {onOpenDetail && (
        <Btn onClick={onOpenDetail} label="詳細を開く">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </Btn>
      )}
    </div>
  );
}
