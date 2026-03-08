"use client";

import { useI18n, type Locale } from "@/lib/i18n";

export default function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-3">{t("settings.language")}</h3>
      <div className="flex gap-2">
        {([
          { value: "ja", label: "日本語" },
          { value: "en", label: "English" },
        ] as { value: Locale; label: string }[]).map((lang) => (
          <button
            key={lang.value}
            onClick={() => setLocale(lang.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
              locale === lang.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-border hover:bg-card text-muted"
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </section>
  );
}
