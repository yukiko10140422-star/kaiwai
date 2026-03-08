import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="glass rounded-3xl p-12 text-center max-w-md mx-4">
        <h1 className="text-6xl font-extrabold gradient-text mb-4">404</h1>
        <p className="text-muted mb-6">ページが見つかりませんでした</p>
        <Link
          href="/dashboard"
          className="inline-block rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-6 py-3 text-white font-medium transition-all hover:shadow-lg hover:shadow-accent/25"
        >
          ダッシュボードへ戻る
        </Link>
      </div>
    </div>
  );
}
