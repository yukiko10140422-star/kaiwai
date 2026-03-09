"use client";

import { useState } from "react";
import type { BreadcrumbItem } from "@/lib/library";

interface LibraryBreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
  onDropOnBreadcrumb?: (folderId: string | null, e: React.DragEvent) => void;
}

export default function LibraryBreadcrumbs({ items, onNavigate, onDropOnBreadcrumb }: LibraryBreadcrumbsProps) {
  const [dragOverId, setDragOverId] = useState<string | null | undefined>(undefined);

  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const isDragOver = dragOverId === (item.id ?? "__root__");
        return (
          <span key={item.id ?? "root"} className="flex items-center gap-1 shrink-0">
            {i > 0 && (
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
            {isLast ? (
              <span
                className={`font-medium px-1.5 py-0.5 rounded transition-colors ${isDragOver ? "ring-2 ring-accent bg-accent/10" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverId(item.id ?? "__root__");
                }}
                onDragLeave={() => setDragOverId(undefined)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverId(undefined);
                  onDropOnBreadcrumb?.(item.id, e);
                }}
              >
                {item.name}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(item.id)}
                className={`text-muted hover:text-accent transition-colors px-1.5 py-0.5 rounded ${isDragOver ? "ring-2 ring-accent bg-accent/10 text-accent" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverId(item.id ?? "__root__");
                }}
                onDragLeave={() => setDragOverId(undefined)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverId(undefined);
                  onDropOnBreadcrumb?.(item.id, e);
                }}
              >
                {item.name}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
