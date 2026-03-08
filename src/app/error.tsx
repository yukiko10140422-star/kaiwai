"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="glass rounded-3xl p-12 text-center max-w-md mx-4">
        <h1 className="text-4xl font-extrabold gradient-text mb-4">エラー</h1>
        <p className="text-muted mb-6">予期しないエラーが発生しました</p>
        <button
          onClick={reset}
          className="inline-block rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-6 py-3 text-white font-medium transition-all hover:shadow-lg hover:shadow-accent/25"
        >
          もう一度試す
        </button>
      </div>
    </div>
  );
}
