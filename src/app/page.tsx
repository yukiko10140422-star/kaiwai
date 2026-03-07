import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass rounded-2xl p-12 text-center max-w-md mx-4">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
          KAIWAI
        </h1>
        <p className="text-muted mb-8">
          チーム内連絡・タスク調整ツール
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="block w-full rounded-xl bg-accent px-6 py-3 text-white font-medium transition-colors hover:bg-accent-hover"
          >
            ログイン
          </Link>
          <Link
            href="/auth/signup"
            className="block w-full rounded-xl border border-border px-6 py-3 font-medium transition-colors hover:bg-card"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}
