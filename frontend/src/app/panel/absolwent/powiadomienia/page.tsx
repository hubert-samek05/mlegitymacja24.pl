"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { apiGet, apiPatch } from "@/lib/api";
import { absolwentNavItems } from "@/lib/absolwentNav";

interface Notification {
  id: string;
  channel: "EMAIL" | "SMS" | "PUSH";
  subject: string | null;
  body: string;
  status: "PENDING" | "SENT" | "FAILED";
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PowiadomieniaPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiGet<Notification[]>("/users/me/notifications")
      .then(setNotifications)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Nie udało się pobrać powiadomień")
      )
      .finally(() => setLoading(false));
  }, [user]);

  const unreadCount = notifications.filter((n) => n.status === "PENDING").length;

  async function markAllRead() {
    setMarking(true);
    try {
      await apiPatch("/users/me/notifications/read", {});
      setNotifications((prev) =>
        prev.map((n) => (n.status === "PENDING" ? { ...n, status: "SENT" } : n))
      );
    } catch {
      // ignoruj — lista pozostaje bez zmian
    } finally {
      setMarking(false);
    }
  }

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-ink-mute">
        Ładowanie...
      </div>
    );
  }

  return (
    <PanelShell
      navItems={absolwentNavItems}
      activeHref="/panel/absolwent/powiadomienia"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle="Portfel absolwenta"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-600">
            Alerty
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Powiadomienia
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Informacje o Twoich legitymacjach i koncie.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-ink/10 bg-white px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-ink/25 disabled:opacity-60"
          >
            <span className="hidden sm:inline">Oznacz jako przeczytane</span>
            <span className="sm:hidden">Przeczytane</span>
          </button>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-ink/[0.06]" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-lg border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
          <h2 className="mt-5 font-display text-xl font-semibold text-ink">
            Brak powiadomień
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
            Poinformujemy Cię o nowych legitymacjach, zbliżającym się końcu
            ważności i zmianach statusu dokumentów.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {notifications.map((n) => {
            const unread = n.status === "PENDING";
            return (
              <div
                key={n.id}
                className={`flex gap-4 rounded-lg border px-5 py-4 shadow-card transition-colors ${
                  unread
                    ? "border-accent-500/30 border-l-2 border-l-accent-500 bg-white"
                    : "border-ink/10 bg-white"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">
                      {n.subject ?? "Powiadomienie"}
                    </p>
                    {unread && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-500" />
                    )}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                    {n.body}
                  </p>
                  <p className="mt-2 text-[11px] text-ink-mute">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}
