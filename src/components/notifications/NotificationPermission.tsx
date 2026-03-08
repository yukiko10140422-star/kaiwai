"use client";

import { useState, useEffect } from "react";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
} from "@/lib/browser-notifications";
import { useI18n } from "@/lib/i18n";

export default function NotificationPermission() {
  const [permission, setPermission] = useState<string>("default");
  const [supported, setSupported] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? "granted" : "denied");
  };

  if (!supported) return null;

  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-2">{t("settings.notifications")}</h3>
      <p className="text-sm text-muted mb-3">
        {t("settings.notifications.desc")}
      </p>
      {permission === "granted" ? (
        <div className="flex items-center gap-2 text-sm text-status-done">
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t("settings.notifications.enabled")}
        </div>
      ) : permission === "denied" ? (
        <p className="text-sm text-muted">
          {t("settings.notifications.blocked")}
        </p>
      ) : (
        <button
          onClick={handleEnable}
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          {t("settings.notifications.enable")}
        </button>
      )}
    </section>
  );
}
