"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import PageTransition from "@/components/ui/PageTransition";
import ThemeToggle from "@/components/settings/ThemeToggle";
import UsageGuide from "@/components/settings/UsageGuide";
import NotificationPermission from "@/components/notifications/NotificationPermission";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMsg("パスワードは8文字以上必要です");
      return;
    }

    setChangingPw(true);
    setPasswordMsg("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg("パスワードを変更しました");
      setNewPassword("");
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : "変更に失敗しました");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <PageTransition className="p-3 sm:p-6 max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">設定</h1>

      {/* プロフィール */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">プロフィール</h3>
            <p className="text-sm text-muted mt-0.5">表示名やアバターを変更</p>
          </div>
          <Link href="/dashboard/profile">
            <Button variant="secondary" size="sm">編集</Button>
          </Link>
        </div>
      </section>

      {/* テーマ */}
      <section className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-3">テーマ</h3>
        <ThemeToggle />
      </section>

      {/* ブラウザ通知 */}
      <NotificationPermission />

      {/* 招待管理 */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">メンバー招待</h3>
            <p className="text-sm text-muted mt-0.5">新しいメンバーを招待</p>
          </div>
          <Link href="/dashboard/settings/invite">
            <Button variant="secondary" size="sm">管理</Button>
          </Link>
        </div>
      </section>

      {/* 使い方ガイド */}
      <UsageGuide />

      {/* パスワード変更 */}
      <section className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-3">パスワード変更</h3>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <Input
            type="password"
            label="新しいパスワード"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="8文字以上"
            minLength={8}
            required
          />
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.includes("変更しました") ? "text-status-done" : "text-status-overdue"}`}>
              {passwordMsg}
            </p>
          )}
          <Button type="submit" disabled={changingPw || newPassword.length < 8}>
            {changingPw ? "変更中…" : "パスワードを変更"}
          </Button>
        </form>
      </section>
    </PageTransition>
  );
}
