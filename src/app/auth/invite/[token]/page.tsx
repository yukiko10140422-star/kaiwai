"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { validateInvitation, acceptInvitation } from "@/lib/invitations";
import { createClient } from "@/lib/supabase/client";
import type { Invitation } from "@/types/database";

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateInvitation(token)
      .then((inv) => {
        if (inv) {
          setInvitation(inv);
        } else {
          setInvalid(true);
        }
      })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Sign up with the invited email
      const { error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      // Mark invitation as accepted
      await acceptInvitation(token);

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-muted">招待を確認中…</p>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">無効な招待リンク</h1>
          <p className="text-sm text-muted mb-4">
            この招待リンクは期限切れか、既に使用されています。
          </p>
          <Button onClick={() => router.push("/auth/login")} variant="secondary">
            ログインページへ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-dvh p-4">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">KAIWAI に参加</h1>
        <p className="text-sm text-muted text-center mb-6">
          <span className="font-medium text-foreground">{invitation?.email}</span>{" "}
          として招待されました
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="表示名"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="あなたの名前"
            required
          />
          <Input
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8文字以上"
            minLength={8}
            required
          />

          {error && (
            <p className="text-sm text-status-overdue">{error}</p>
          )}

          <Button
            type="submit"
            disabled={submitting || !displayName.trim() || password.length < 8}
            className="w-full"
          >
            {submitting ? "登録中…" : "アカウントを作成"}
          </Button>
        </form>
      </div>
    </div>
  );
}
