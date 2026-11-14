"use client";

import { useEffect } from "react";

interface CapacitorAppPlugin {
  addListener: (
    event: "appUrlOpen",
    cb: (data: { url: string }) => void
  ) => Promise<{ remove: () => void }> | { remove: () => void };
  getLaunchUrl?: () => Promise<{ url: string } | undefined>;
}

interface CapacitorWindow extends Window {
  Capacitor?: {
    Plugins?: { App?: CapacitorAppPlugin };
  };
}

function navigateTo(url: string) {
  try {
    const u = new URL(url);
    if (u.origin === window.location.origin) {
      window.location.href = u.pathname + u.search + u.hash;
    } else {
      window.location.href = url;
    }
  } catch {
    /* nieprawidłowy URL — ignoruj */
  }
}

// Universal links: gdy system otwiera apkę linkiem https://mlegitymacja24.pl/...,
// przekierowujemy webview na ten adres (gorący start) lub na start (zimny start).
export function DeepLinkHandler() {
  useEffect(() => {
    const appPlugin = (window as CapacitorWindow).Capacitor?.Plugins?.App;
    if (!appPlugin) return;

    const sub = appPlugin.addListener("appUrlOpen", ({ url }) => navigateTo(url));
    appPlugin.getLaunchUrl?.().then((res) => {
      if (res?.url) navigateTo(res.url);
    });

    return () => {
      Promise.resolve(sub).then((s) => s.remove());
    };
  }, []);

  return null;
}
