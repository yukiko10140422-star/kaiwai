"use client";

import FileIcon from "@/components/shared/FileIcon";
import { formatFileSize } from "@/lib/files";
import type { LibraryFileWithProfile } from "@/lib/library";

interface LibraryFileRowProps {
  file: LibraryFileWithProfile;
  onClick: () => void;
}

export default function LibraryFileRow({ file, onClick }: LibraryFileRowProps) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card/50 cursor-pointer transition-colors group"
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/json", JSON.stringify({ type: "file", id: file.id }));
        e.dataTransfer.effectAllowed = "move";
        (e.currentTarget as HTMLElement).style.opacity = "0.5";
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
    >
      <FileIcon fileType={file.file_type} className="w-5 h-5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{file.file_name}</p>
      </div>
      <span className="text-xs text-muted whitespace-nowrap hidden sm:block">
        {formatFileSize(file.file_size)}
      </span>
      <span className="text-xs text-muted whitespace-nowrap hidden md:block">
        {file.uploader?.display_name ?? ""}
      </span>
      <span className="text-xs text-muted whitespace-nowrap">
        {new Date(file.created_at).toLocaleDateString("ja-JP")}
      </span>
    </div>
  );
}
