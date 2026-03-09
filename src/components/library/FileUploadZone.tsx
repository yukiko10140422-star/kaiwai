"use client";

import { useState, useRef, useCallback } from "react";

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  uploading: boolean;
  progress?: number; // 0-100
}

export default function FileUploadZone({ onFilesSelected, uploading, progress }: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) onFilesSelected(files);
      e.target.value = "";
    },
    [onFilesSelected]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        dragOver
          ? "border-accent bg-accent/5"
          : "border-border hover:border-accent/50 hover:bg-card/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleChange}
        className="hidden"
      />

      {uploading ? (
        <div className="space-y-2">
          <svg className="w-8 h-8 mx-auto text-accent animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-muted">
            アップロード中...{progress !== undefined ? ` ${progress}%` : ""}
          </p>
        </div>
      ) : (
        <>
          <svg className="w-10 h-10 mx-auto text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm text-muted">
            ドラッグ&ドロップ、またはクリックしてファイルを選択
          </p>
        </>
      )}
    </div>
  );
}
