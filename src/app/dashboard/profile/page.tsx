"use client";

import { useState, useEffect, useRef } from "react";
import PageTransition from "@/components/ui/PageTransition";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/database";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name);
        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setMessage("");

    let avatarUrl = profile.avatar_url;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });

      if (uploadError) {
        setMessage(`アップロードエラー: ${uploadError.message}`);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      avatarUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);

    if (error) {
      setMessage(`保存エラー: ${error.message}`);
    } else {
      setMessage("プロフィールを更新しました");
      setProfile({ ...profile, display_name: displayName, avatar_url: avatarUrl });
      setAvatarFile(null);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">読み込み中...</p>
      </div>
    );
  }

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <PageTransition className="flex min-h-screen items-center justify-center">
      <div className="glass rounded-2xl p-8 w-full max-w-md mx-4">
        <h1 className="text-2xl font-bold mb-6">プロフィール設定</h1>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* アバター */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border hover:border-accent transition-colors"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
                  {initials || "?"}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                変更
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-xs text-muted">クリックして画像を変更</p>
          </div>

          {/* 表示名 */}
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
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* メールアドレス（読み取り専用） */}
          <div>
            <label className="block text-sm font-medium mb-1">
              メールアドレス
            </label>
            <p className="text-sm text-muted px-4 py-2.5">
              {email}
            </p>
          </div>

          {/* メッセージ */}
          {message && (
            <p className={`text-sm ${message.includes("エラー") ? "text-status-overdue" : "text-status-done"}`}>
              {message}
            </p>
          )}

          {/* ボタン */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-card"
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-white text-sm font-medium transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
