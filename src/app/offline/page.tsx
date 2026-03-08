"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <svg
        className="w-16 h-16 text-slate-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <h1 className="text-xl font-bold mb-2">オフラインです</h1>
      <p className="text-sm text-slate-500 text-center mb-6">
        インターネットに接続されていません。
        <br />
        接続を確認して、もう一度お試しください。
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-blue-500 text-white px-6 py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors"
      >
        再読み込み
      </button>
    </div>
  );
}
