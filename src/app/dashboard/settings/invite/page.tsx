"use client";

import { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import {
  createInvitation,
  getInvitations,
  deleteInvitation,
} from "@/lib/invitations";
import type { Invitation } from "@/types/database";

export default function InvitePage() {
  const [email, setEmail] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInvitations()
      .then(setInvitations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setSending(true);
    setError(null);
    try {
      const inv = await createInvitation(trimmed);
      setInvitations((prev) => [inv, ...prev]);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "招待の送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInvitation(id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err) {
      console.error("Failed to delete invitation:", err);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/auth/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatus = (inv: Invitation) => {
    if (inv.accepted_at) return { label: "受諾済み", color: "text-status-done" };
    if (new Date(inv.expires_at) < new Date()) return { label: "期限切れ", color: "text-status-overdue" };
    return { label: "保留中", color: "text-status-progress" };
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">メンバー招待</h1>
        <p className="text-sm text-muted mt-1">
          メールアドレスで新しいメンバーを招待できます
        </p>
      </div>

      {/* 招待フォーム */}
      <form onSubmit={handleSend} className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-3">新しい招待</h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>
          <Button type="submit" disabled={sending || !email.trim()}>
            {sending ? "送信中…" : "招待を送る"}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-status-overdue mt-2">{error}</p>
        )}
      </form>

      {/* 招待一覧 */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-3">送信済み招待</h3>
        {loading ? (
          <p className="text-sm text-muted py-4 text-center">読み込み中…</p>
        ) : invitations.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">
            まだ招待がありません
          </p>
        ) : (
          <div className="divide-y divide-border">
            {invitations.map((inv) => {
              const status = getStatus(inv);
              const isPending = !inv.accepted_at && new Date(inv.expires_at) >= new Date();

              return (
                <div key={inv.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                      <span className={status.color}>{status.label}</span>
                      <span>
                        {new Date(inv.created_at).toLocaleDateString("ja-JP", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>
                        期限: {new Date(inv.expires_at).toLocaleDateString("ja-JP", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isPending && (
                      <button
                        onClick={() => handleCopyLink(inv.token)}
                        className="px-2 py-1 text-xs rounded hover:bg-card transition-colors text-muted hover:text-foreground"
                        title="招待リンクをコピー"
                      >
                        {copied === inv.token ? "コピー済み" : "リンクコピー"}
                      </button>
                    )}
                    {isPending && (
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="px-2 py-1 text-xs rounded hover:bg-status-overdue/10 text-muted hover:text-status-overdue transition-colors"
                        title="削除"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
