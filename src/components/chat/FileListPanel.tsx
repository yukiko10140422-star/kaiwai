"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui";
import {
  getChannelFiles,
  getDmFiles,
  formatFileSize,
  categorizeFile,
  type FileWithMeta,
  type FileCategory,
} from "@/lib/files";

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

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 340, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
            <FileItem key={file.id} file={file} />
          ))
        )}
      </div>
    </motion.div>
  );
}

function FileItem({ file }: { file: FileWithMeta }) {
  const isImage = file.file_type.startsWith("image/");
  const isVideo = file.file_type.startsWith("video/");

  return (
    <div className="glass rounded-lg p-3">
      {/* Thumbnail / preview */}
      {isImage && file.signed_url && (
        <a href={file.signed_url} target="_blank" rel="noopener noreferrer">
          <img
            src={file.signed_url}
            alt={file.file_name}
            className="w-full h-32 object-cover rounded-md mb-2"
          />
        </a>
      )}
      {isVideo && file.signed_url && (
        <video
          src={file.signed_url}
          controls
          className="w-full h-32 object-cover rounded-md mb-2"
        />
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
  const cat = categorizeFile(fileType);
  const colors: Record<string, string> = {
    image: "text-green-500",
    video: "text-purple-500",
    document: "text-blue-500",
    other: "text-muted",
  };

  return (
    <svg className={`w-5 h-5 shrink-0 mt-0.5 ${colors[cat]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {cat === "image" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      ) : cat === "video" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      )}
    </svg>
  );
}
