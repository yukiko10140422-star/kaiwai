"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError("メールアドレスまたはパスワードが正しくありません");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-gradient-bg flex min-h-dvh items-center justify-center relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent-secondary/10 blur-3xl pointer-events-none" />

      <div className="glass rounded-3xl p-8 w-full max-w-sm mx-4 relative hover-glow">
        <h1 className="text-2xl font-bold mb-1 gradient-text">ログイン</h1>
        <p className="text-muted text-sm mb-6">アカウントにサインインする</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              minLength={8}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus-glow transition-all"
              placeholder="••••••••"
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
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          アカウントをお持ちでない方は{" "}
          <Link href="/auth/signup" className="text-accent hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
