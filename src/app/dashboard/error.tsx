"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="glass rounded-2xl p-8 text-center max-w-sm">
        <h2 className="text-xl font-bold mb-2">エラーが発生しました</h2>
        <p className="text-sm text-muted mb-4">
          {error.message || "データの読み込みに失敗しました"}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2 text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          再読み込み
        </button>
      </div>
    </div>
  );
}
