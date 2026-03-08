"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import PageTransition from "@/components/ui/PageTransition";
import ThemeToggle from "@/components/settings/ThemeToggle";
import LanguageSelector from "@/components/settings/LanguageSelector";
import UsageGuide from "@/components/settings/UsageGuide";
import NotificationPermission from "@/components/notifications/NotificationPermission";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const { t } = useI18n();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMsg(t("settings.password.min"));
      return;
    }

    setChangingPw(true);
    setPasswordMsg("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg(t("settings.password.success"));
      setNewPassword("");
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : t("settings.password.error"));
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <PageTransition className="p-3 sm:p-6 max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">{t("settings.title")}</h1>

      {/* プロフィール */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{t("settings.profile")}</h3>
            <p className="text-sm text-muted mt-0.5">{t("settings.profile.desc")}</p>
          </div>
          <Link href="/dashboard/profile">
            <Button variant="secondary" size="sm">{t("settings.profile.edit")}</Button>
          </Link>
        </div>
      </section>

      {/* テーマ */}
      <section className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-3">{t("settings.theme")}</h3>
        <ThemeToggle />
      </section>

      {/* 言語 */}
      <LanguageSelector />

      {/* ブラウザ通知 */}
      <NotificationPermission />

      {/* 招待管理 */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{t("settings.invite")}</h3>
            <p className="text-sm text-muted mt-0.5">{t("settings.invite.desc")}</p>
          </div>
          <Link href="/dashboard/settings/invite">
            <Button variant="secondary" size="sm">{t("settings.invite.manage")}</Button>
          </Link>
        </div>
      </section>

      {/* 使い方ガイド */}
      <UsageGuide />

      {/* パスワード変更 */}
      <section className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-3">{t("settings.password")}</h3>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <Input
            type="password"
            label={t("settings.password.label")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("settings.password.placeholder")}
            minLength={8}
            required
          />
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg === t("settings.password.success") ? "text-status-done" : "text-status-overdue"}`}>
              {passwordMsg}
            </p>
          )}
          <Button type="submit" disabled={changingPw || newPassword.length < 8}>
            {changingPw ? t("settings.password.changing") : t("settings.password.submit")}
          </Button>
        </form>
      </section>
    </PageTransition>
  );
}
