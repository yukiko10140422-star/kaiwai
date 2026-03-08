"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui";
import PageTransition from "@/components/ui/PageTransition";
import {
  fetchFeatureRequests,
  createFeatureRequest,
  voteFeatureRequest,
  deleteFeatureRequest,
  type FeatureRequestWithAuthor,
} from "@/lib/feature-requests";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/lib/toast";

const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: "募集中", color: "bg-accent/10 text-accent" },
  planned: { label: "対応予定", color: "bg-green-500/10 text-green-500" },
  done: { label: "実装済み", color: "bg-status-done/10 text-status-done" },
  rejected: { label: "見送り", color: "bg-muted/20 text-muted" },
};

export default function FeatureRequestsPage() {
  const [requests, setRequests] = useState<FeatureRequestWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchFeatureRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
      const msg =
        e instanceof Error ? e.message : "データの読み込みに失敗しました";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        setCurrentUserId(data.user?.id ?? null);
      });
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await createFeatureRequest(title.trim(), description.trim());
      setTitle("");
      setDescription("");
      setShowForm(false);
      showToast("リクエストを投稿しました", "success");
      await load();
    } catch {
      showToast("投稿に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (id: string) => {
    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              voted_by_me: !r.voted_by_me,
              votes: r.voted_by_me ? r.votes - 1 : r.votes + 1,
            }
          : r
      )
    );
    try {
      await voteFeatureRequest(id);
    } catch {
      await load(); // Revert on error
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このリクエストを削除しますか？")) return;
    try {
      await deleteFeatureRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      showToast("削除に失敗しました", "error");
    }
  };

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <PageTransition className="p-3 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">機能リクエスト</h1>
          <p className="text-sm text-muted mt-1">
            ほしい機能を提案・投票できます
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          + 提案する
        </button>
      </div>

      {/* New request form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 mb-6">
          <h3 className="font-semibold mb-3">新しいリクエスト</h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ほしい機能のタイトル"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
              required
              autoFocus
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="詳しい説明（任意）"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none min-h-[44px]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {submitting ? "投稿中..." : "投稿"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { key: "all", label: "すべて" },
          { key: "open", label: "募集中" },
          { key: "planned", label: "対応予定" },
          { key: "done", label: "実装済み" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
              filter === f.key
                ? "border-accent bg-accent/10 text-accent"
                : "border-border hover:bg-card"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <p className="text-sm text-status-overdue mb-2">
            データの読み込みに失敗しました
          </p>
          <p className="text-xs text-muted mb-4">
            テーブルが未作成の可能性があります。SQL を実行してください。
          </p>
          <button
            onClick={load}
            className="text-sm text-accent hover:underline"
          >
            再試行
          </button>
        </div>
      )}

      {/* Request list */}
      {!error && loading ? (
        <p className="text-sm text-muted text-center py-8">読み込み中...</p>
      ) : !error && filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted mb-2">まだリクエストがありません</p>
          <p className="text-sm text-muted">
            「+ 提案する」から機能を提案してみましょう
          </p>
        </div>
      ) : (
        !error && (
          <div className="flex flex-col gap-3">
            {filtered.map((req) => {
              const status = statusLabels[req.status] ?? statusLabels.open;
              return (
                <div key={req.id} className="glass rounded-xl p-4 flex gap-3">
                  {/* Vote button */}
                  <button
                    onClick={() => handleVote(req.id)}
                    className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border transition-colors ${
                      req.voted_by_me
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border hover:bg-card text-muted"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                    <span className="text-sm font-bold">{req.votes}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold">{req.title}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    {req.description && (
                      <p className="text-sm text-muted mt-1 line-clamp-2">
                        {req.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Avatar
                          name={req.author.display_name}
                          src={req.author.avatar_url}
                          size="xs"
                        />
                        <span className="text-[11px] text-muted">
                          {req.author.display_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted">
                        {new Date(req.created_at).toLocaleDateString("ja-JP")}
                      </span>
                      {currentUserId === req.user_id && (
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="text-[10px] text-muted hover:text-status-overdue transition-colors ml-auto"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </PageTransition>
  );
}
