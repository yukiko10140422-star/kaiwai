"use client";

import type { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export default function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Keep the export for backward compatibility but as a no-op
export const animatedListItemVariants = {};
