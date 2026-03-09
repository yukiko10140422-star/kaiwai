"use client";

import { useState, useEffect } from "react";
import FileIcon from "@/components/shared/FileIcon";
import { formatFileSize } from "@/lib/files";
import { getLibraryFileSignedUrl, type LibraryFileWithProfile } from "@/lib/library";

interface LibraryFileCardProps {
  file: LibraryFileWithProfile;
  onClick: () => void;
}

export default function LibraryFileCard({ file, onClick }: LibraryFileCardProps) {
  const isImage = file.file_type.startsWith("image/");
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (isImage) {
      getLibraryFileSignedUrl(file.storage_path)
        .then(setThumbUrl)
        .catch(() => {});
    }
  }, [file.storage_path, isImage]);

  return (
    <div
      className="glass rounded-xl overflow-hidden cursor-pointer hover:ring-1 hover:ring-accent/30 transition-all group"
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
      {/* Thumbnail area */}
      <div className="h-32 bg-card/50 flex items-center justify-center overflow-hidden">
        {isImage && thumbUrl ? (
          <>
            {!imgLoaded && (
              <div className="w-full h-full bg-card animate-pulse" />
            )}
            <img
              src={thumbUrl}
              alt={file.file_name}
              className={`w-full h-full object-cover ${imgLoaded ? "" : "hidden"}`}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <FileIcon fileType={file.file_type} className="w-12 h-12" />
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium truncate" title={file.file_name}>{file.file_name}</p>
        <p className="text-[11px] text-muted mt-0.5">
          {formatFileSize(file.file_size)} · {new Date(file.created_at).toLocaleDateString("ja-JP")}
        </p>
        {file.uploader && (
          <p className="text-[11px] text-muted mt-0.5 truncate">{file.uploader.display_name}</p>
        )}
      </div>
    </div>
  );
}
