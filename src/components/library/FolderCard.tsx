"use client";

import { useState, useRef, useEffect } from "react";
import type { LibraryFolder } from "@/types/database";

interface FolderCardProps {
  folder: LibraryFolder;
  onClick: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onMove: () => void;
}

export default function FolderCard({ folder, onClick, onRename, onDelete, onMove }: FolderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState(folder.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleRenameSubmit = () => {
    const trimmed = renameName.trim();
    if (trimmed && trimmed !== folder.name) onRename(trimmed);
    setRenaming(false);
  };

  return (
    <div
      className="glass rounded-xl p-4 cursor-pointer hover:ring-1 hover:ring-accent/30 transition-all group relative"
      onClick={renaming ? undefined : onClick}
    >
      <div className="flex items-center gap-3">
        <svg className="w-10 h-10 text-accent/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              ref={inputRef}
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") setRenaming(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium w-full bg-transparent border-b border-accent outline-none"
            />
          ) : (
            <p className="text-sm font-medium truncate">{folder.name}</p>
          )}
        </div>
      </div>

      {/* Context menu trigger */}
      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-card transition-all text-muted"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 w-36 glass rounded-lg shadow-lg py-1 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRenaming(true); setRenameName(folder.name); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-card transition-colors"
            >
              名前を変更
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onMove(); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-card transition-colors"
            >
              移動
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-card transition-colors"
            >
              削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
