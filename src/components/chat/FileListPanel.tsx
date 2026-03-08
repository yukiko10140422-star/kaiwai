"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

import { Avatar } from "@/components/ui";
import {
  getChannelFiles,
  getDmFiles,
  formatFileSize,
  categorizeFile,
  type FileWithMeta,
  type FileCategory,
} from "@/lib/files";
import FilePreviewModal from "./FilePreviewModal";
import type { MessageAttachment } from "@/types/database";

interface FileListPanelProps {
  channelId?: string;
  conversationId?: string;
  onClose: () => void;
}

const categoryLabels: Record<FileCategory, string> = {
  all: "すべて",
  image: "画像",
  video: "動画",
  document: "ドキュメント",
  other: "その他",
};

export default function FileListPanel({ channelId, conversationId, onClose }: FileListPanelProps) {
  const [files, setFiles] = useState<FileWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FileCategory>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetch = channelId
      ? getChannelFiles(channelId)
      : conversationId
        ? getDmFiles(conversationId)
        : Promise.resolve([]);

    fetch
      .then(setFiles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [channelId, conversationId]);

  const filtered = filter === "all"
    ? files
    : files.filter((f) => categorizeFile(f.file_type) === filter);

  // Collect image files for lightbox navigation
  const imageFiles = useMemo(
    () => filtered.filter((f) => f.file_type.startsWith("image/")),
    [filtered]
  );

  // Build signed URLs map and attachment-like objects for the lightbox
  const imageAttachments: MessageAttachment[] = useMemo(
    () =>
      imageFiles.map((f) => ({
        id: f.id,
        message_id: f.message_id,
        file_name: f.file_name,
        file_type: f.file_type,
        file_size: f.file_size,
        storage_path: f.storage_path,
        created_at: f.created_at,
      })),
    [imageFiles]
  );

  const imageSignedUrls: Record<string, string> = useMemo(
    () =>
      Object.fromEntries(
        imageFiles
          .filter((f) => f.signed_url)
          .map((f) => [f.id, f.signed_url!])
      ),
    [imageFiles]
  );

  const handleImageClick = useCallback(
    (fileId: string) => {
      const idx = imageFiles.findIndex((f) => f.id === fileId);
      if (idx >= 0) setLightboxIndex(idx);
    },
    [imageFiles]
  );

  return (
    <div
      className="fixed inset-0 z-40 md:relative md:inset-auto md:z-auto w-full md:w-[360px] shrink-0 border-l border-border h-full overflow-hidden flex flex-col bg-sidebar"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="font-bold text-sm">ファイル一覧</h3>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground transition-colors text-xl leading-none"
          aria-label="閉じる"
        >
          &times;
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-border shrink-0 overflow-x-auto">
        {(Object.keys(categoryLabels) as FileCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === cat
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-card"
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <p className="text-xs text-muted text-center py-8">読み込み中...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted text-center py-8">ファイルがありません</p>
        ) : (
          filtered.map((file) => (
            <FileItem key={file.id} file={file} onImageClick={handleImageClick} />
          ))
        )}
      </div>

      {/* Image lightbox */}
      {lightboxIndex !== null && imageAttachments.length > 0 && (
        <FilePreviewModal
          attachments={imageAttachments}
          initialIndex={lightboxIndex}
          signedUrls={imageSignedUrls}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

function FileItem({ file, onImageClick }: { file: FileWithMeta; onImageClick: (fileId: string) => void }) {
  const isImage = file.file_type.startsWith("image/");
  const isVideo = file.file_type.startsWith("video/");
  const isAudio = file.file_type.startsWith("audio/");
  const isPdf = file.file_type === "application/pdf";
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="glass rounded-lg p-3">
      {/* Thumbnail / preview */}
      {isImage && file.signed_url && (
        <div className="relative mb-2">
          {!imgLoaded && (
            <div className="w-full h-32 rounded-md bg-card animate-pulse flex items-center justify-center">
              <svg className="w-8 h-8 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          )}
          <img
            src={file.signed_url}
            alt={file.file_name}
            className={`w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity ${imgLoaded ? "" : "hidden"}`}
            onClick={() => onImageClick(file.id)}
            onLoad={() => setImgLoaded(true)}
          />
        </div>
      )}
      {isVideo && file.signed_url && (
        <video
          src={file.signed_url}
          controls
          className="w-full h-32 object-cover rounded-md mb-2"
        />
      )}
      {isAudio && file.signed_url && (
        <div className="mb-2">
          <audio src={file.signed_url} controls className="w-full h-8" />
        </div>
      )}
      {isPdf && file.signed_url && (
        <div className="flex items-center gap-2 mb-2 text-xs">
          <a
            href={file.signed_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            プレビュー
          </a>
        </div>
      )}

      {/* File info */}
      <div className="flex items-start gap-2">
        <FileIcon fileType={file.file_type} />
        <div className="min-w-0 flex-1">
          <a
            href={file.signed_url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium truncate block hover:text-accent transition-colors"
            title={file.file_name}
          >
            {file.file_name}
          </a>
          <p className="text-[11px] text-muted">
            {formatFileSize(file.file_size)} · {new Date(file.created_at).toLocaleDateString("ja-JP")}
          </p>
        </div>
      </div>

      {/* Sender */}
      <div className="flex items-center gap-1.5 mt-2">
        <Avatar name={file.sender.display_name} src={file.sender.avatar_url} size="sm" className="!w-4 !h-4" />
        <span className="text-[11px] text-muted">{file.sender.display_name}</span>
      </div>
    </div>
  );
}

function FileIcon({ fileType }: { fileType: string }) {
  const isPdf = fileType === "application/pdf";
  const isAudio = fileType.startsWith("audio/");
  const isSpreadsheet = fileType.includes("spreadsheet") || fileType.includes("excel") || fileType === "text/csv";
  const isArchive = fileType.includes("zip") || fileType.includes("rar") || fileType.includes("tar") || fileType.includes("gzip") || fileType.includes("7z") || fileType.includes("compressed");
  const isPresentation = fileType.includes("presentation") || fileType.includes("powerpoint");
  const isDocument = fileType.includes("word") || fileType.includes("document") || fileType === "text/plain" || fileType === "text/html" || fileType === "text/markdown";
  const cat = categorizeFile(fileType);

  let color = "text-muted";
  let iconPath: string;

  if (cat === "image") {
    color = "text-green-500";
    iconPath = "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z";
  } else if (cat === "video") {
    color = "text-purple-500";
    iconPath = "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z";
  } else if (isPdf) {
    color = "text-red-500";
    iconPath = "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z";
  } else if (isAudio) {
    color = "text-purple-500";
    iconPath = "M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z";
  } else if (isSpreadsheet) {
    color = "text-green-500";
    iconPath = "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0 0c-.621 0-1.125-.504-1.125-1.125m0 0v-1.5";
  } else if (isArchive) {
    color = "text-amber-500";
    iconPath = "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z";
  } else if (isPresentation) {
    color = "text-orange-500";
    iconPath = "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5";
  } else if (isDocument) {
    color = "text-blue-500";
    iconPath = "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z";
  } else {
    iconPath = "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z";
  }

  return (
    <svg className={`w-5 h-5 shrink-0 mt-0.5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
    </svg>
  );
}
