import Link from "next/link";

export default function Home() {
  return (
    <div className="animated-gradient-bg flex min-h-dvh items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent-secondary/10 blur-3xl" />
      </div>

      <div className="glass rounded-3xl p-12 text-center max-w-md mx-4 relative hover-glow">
        <div className="animate-float mb-4">
          <h1 className="text-5xl font-extrabold mb-2 gradient-text tracking-tight">
            KAIWAI
          </h1>
        </div>
        <p className="text-muted mb-8 text-sm">
          チーム内連絡・タスク調整ツール
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="block w-full rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-6 py-3 text-white font-medium transition-all hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            ログイン
          </Link>
          <Link
            href="/auth/signup"
            className="block w-full rounded-xl border border-border px-6 py-3 font-medium transition-all hover:bg-card hover:border-accent/50 hover:shadow-md"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}
