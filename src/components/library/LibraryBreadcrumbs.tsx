"use client";

import type { BreadcrumbItem } from "@/lib/library";

interface LibraryBreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
}

export default function LibraryBreadcrumbs({ items, onNavigate }: LibraryBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.id ?? "root"} className="flex items-center gap-1 shrink-0">
            {i > 0 && (
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
            {isLast ? (
              <span className="font-medium">{item.name}</span>
            ) : (
              <button
                onClick={() => onNavigate(item.id)}
                className="text-muted hover:text-accent transition-colors"
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
