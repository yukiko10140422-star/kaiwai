"use client";

import { useState } from "react";
import type { LibraryFileCategory } from "@/lib/library";
import type { Project } from "@/types/database";

interface LibraryToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  fileType: LibraryFileCategory;
  onFileTypeChange: (v: LibraryFileCategory) => void;
  projectFilter: string | null;
  onProjectFilterChange: (v: string | null) => void;
  projects: Project[];
  viewMode: "grid" | "list";
  onViewModeChange: (v: "grid" | "list") => void;
  onNewFolder: () => void;
  onUpload: () => void;
}

const categories: { value: LibraryFileCategory; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "image", label: "画像" },
  { value: "video", label: "動画" },
  { value: "audio", label: "音声" },
  { value: "pdf", label: "PDF" },
  { value: "document", label: "文書" },
  { value: "other", label: "その他" },
];

export default function LibraryToolbar({
  search,
  onSearchChange,
  fileType,
  onFileTypeChange,
  projectFilter,
  onProjectFilterChange,
  projects,
  viewMode,
  onViewModeChange,
  onNewFolder,
  onUpload,
}: LibraryToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-2">
      {/* Top row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ファイルを検索..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-card border border-border focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg border border-border transition-colors ${showFilters ? "bg-accent/10 text-accent" : "hover:bg-card text-muted"}`}
          title="フィルター"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
        </button>

        {/* View mode */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 transition-colors ${viewMode === "grid" ? "bg-accent/10 text-accent" : "hover:bg-card text-muted"}`}
            title="グリッド"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 transition-colors ${viewMode === "list" ? "bg-accent/10 text-accent" : "hover:bg-card text-muted"}`}
            title="リスト"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <button
          onClick={onNewFolder}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border hover:bg-card text-muted hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          新規フォルダ
        </button>
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          アップロード
        </button>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category filter */}
          <div className="flex gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onFileTypeChange(cat.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  fileType === cat.value
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-card"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Project filter */}
          {projects.length > 0 && (
            <select
              value={projectFilter ?? ""}
              onChange={(e) => onProjectFilterChange(e.target.value || null)}
              className="px-2 py-1 text-xs rounded-lg bg-card border border-border text-foreground"
            >
              <option value="">全プロジェクト</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
