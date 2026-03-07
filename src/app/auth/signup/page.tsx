"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="animated-gradient-bg flex min-h-screen items-center justify-center relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="glass rounded-3xl p-8 w-full max-w-sm mx-4 text-center relative hover-glow">
          <h1 className="text-2xl font-bold mb-2 gradient-text">確認メールを送信しました</h1>
          <p className="text-muted text-sm mb-4">
            {email} に確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。
          </p>
          <Link
            href="/auth/login"
            className="text-accent hover:underline text-sm"
          >
            ログインページへ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animated-gradient-bg flex min-h-screen items-center justify-center relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent-secondary/10 blur-3xl pointer-events-none" />

      <div className="glass rounded-3xl p-8 w-full max-w-sm mx-4 relative hover-glow">
        <h1 className="text-2xl font-bold mb-1 gradient-text">新規登録</h1>
        <p className="text-muted text-sm mb-6">アカウントを作成する</p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1">
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus-glow transition-all"
              placeholder="あなたの名前"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus-glow transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus-glow transition-all"
              placeholder="6文字以上"
            />
          </div>

          {error && (
            <p className="text-sm text-status-overdue">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-4 py-2.5 text-white font-medium transition-all hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "登録中..." : "アカウント作成"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          既にアカウントをお持ちの方は{" "}
          <Link href="/auth/login" className="text-accent hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
