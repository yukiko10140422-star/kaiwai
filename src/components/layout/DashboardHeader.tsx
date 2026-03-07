"use client";

import { useState, useEffect, useCallback } from "react";
import { NotificationBell } from "@/components/notifications";
import GlobalSearchDialog from "@/components/search/GlobalSearchDialog";

interface DashboardHeaderProps {
  userId: string;
}

export default function DashboardHeader({ userId }: DashboardHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Global "/" shortcut — only when no input/textarea is focused
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !searchOpen) {
        const tag = (e.target as HTMLElement)?.tagName;
        const isEditable =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          (e.target as HTMLElement)?.isContentEditable;
        if (!isEditable) {
          e.preventDefault();
          openSearch();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [searchOpen, openSearch]);

  return (
    <>
      <header className="flex items-center justify-end gap-1 h-12 px-3 sm:px-4 border-b border-border bg-sidebar/80 backdrop-blur-md shrink-0">
        {/* Search button */}
        <button
          onClick={openSearch}
          className="p-1.5 rounded-lg hover:bg-border/30 text-muted hover:text-foreground transition-colors"
          aria-label="検索を開く"
          title="検索 (/)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        <NotificationBell userId={userId} />
      </header>

      <GlobalSearchDialog open={searchOpen} onClose={closeSearch} />
    </>
  );
}
