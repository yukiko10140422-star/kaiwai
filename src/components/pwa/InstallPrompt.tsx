'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'kaiwai-pwa-dismiss';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShow(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISS_KEY, '1');
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-sidebar border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg max-w-[90vw] text-foreground text-sm safe-bottom"
    >
      <span className="flex-1">
        KAIWAIをホーム画面に追加して、アプリとして使えます
      </span>
      <button
        onClick={handleInstall}
        className="bg-accent text-white border-none rounded-lg px-4 py-2 cursor-pointer font-semibold text-sm whitespace-nowrap hover:bg-accent/90 transition-colors"
      >
        インストール
      </button>
      <button
        onClick={handleDismiss}
        className="bg-transparent text-muted border-none cursor-pointer text-xl leading-none p-1 hover:text-foreground transition-colors"
        aria-label="閉じる"
      >
        x
      </button>
    </div>
  );
}
