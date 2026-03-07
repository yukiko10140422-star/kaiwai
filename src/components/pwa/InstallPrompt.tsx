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
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        maxWidth: '90vw',
        color: '#e2e8f0',
        fontSize: '0.875rem',
      }}
    >
      <span style={{ flex: 1 }}>
        KAIWAIをホーム画面に追加して、アプリとして使えます
      </span>
      <button
        onClick={handleInstall}
        style={{
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
        }}
      >
        インストール
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          color: '#94a3b8',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.25rem',
          lineHeight: 1,
          padding: '0.25rem',
        }}
        aria-label="閉じる"
      >
        x
      </button>
    </div>
  );
}
