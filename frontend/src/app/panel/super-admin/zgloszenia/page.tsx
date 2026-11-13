"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { superAdminNavItems } from "@/lib/superAdminNav";
import { apiGet, apiPatch } from "@/lib/api";

interface TypeRequest {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  defaultValidityMonths: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  createdAt: string;
  company: { name: string; nip: string };
  createdByUser: { firstName: string; lastName: string; email: string };
}

const statusLabels: Record<TypeRequest["status"], { label: string; cls: string }> = {
  PENDING: { label: "Oczekuje", cls: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Zatwierdzony", cls: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Odrzucony", cls: "bg-red-100 text-red-800" },
};

const tabs = [
  { key: "PENDING", label: "Oczekujące" },
  { key: "APPROVED", label: "Zatwierdzone" },
  { key: "REJECTED", label: "Odrzucone" },
  { key: "", label: "Wszystkie" },
] as const;

export default function ZgloszeniaPage() {
  const { user, loading: userLoading } = useCurrentUser(["SUPER_ADMIN"]);
  const [requests, setRequests] = useState<TypeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("PENDING");
  const [actionId, setActionId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<TypeRequest[]>(`/credential-types/requests${tab ? `?status=${tab}` : ""}`);
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać zgłoszeń");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    const reviewNote = status === "REJECTED"
      ? window.prompt("Powód odrzucenia (widoczny dla firmy):") ?? undefined
      : undefined;
    if (status === "REJECTED" && !reviewNote) return;
    setActionId(id);
    setError(null);
    try {
      await apiPatch(`/credential-types/requests/${id}`, { status, reviewNote });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się rozpatrzyć zgłoszenia");
    } finally {
      setActionId(null);
    }
  }

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-ink-soft">Ładowanie...</div>;
  }

  return (
    <PanelShell
      navItems={superAdminNavItems}
      activeHref="/panel/super-admin/zgloszenia"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle="Administrator platformy"
    >
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Zgłoszenia zawodów</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Firmy zgłaszają własne zawody do katalogu legitymacji — po akceptacji typ pojawia się automatycznie.
      </p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key ? "bg-ink text-paper" : "bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-card">
        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-ink-mute">Ładowanie...</p>
        ) : requests.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-ink-mute">Brak zgłoszeń w tej kategorii.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {requests.map((r) => (
              <li key={r.id} className="px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium text-ink">{r.name}</p>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusLabels[r.status].cls}`}>
                        {statusLabels[r.status].label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-mute">
                      {r.company.name} (NIP {r.company.nip}) · zgłosił {r.createdByUser.firstName} {r.createdByUser.lastName},{" "}
                      {new Date(r.createdAt).toLocaleDateString("pl-PL")}
                    </p>
                    <p className="mt-1 text-xs text-ink-mute">
                      Kategoria: {r.category ?? "—"} · ważność: {r.defaultValidityMonths ? `${r.defaultValidityMonths} mies.` : "bezterminowo"}
                    </p>
                    {r.description && <p className="mt-1.5 text-sm text-ink-soft">{r.description}</p>}
                    {r.reviewNote && <p className="mt-1.5 text-xs text-red-700">Uwaga: {r.reviewNote}</p>}
                  </div>
                  {r.status === "PENDING" && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        disabled={actionId === r.id}
                        onClick={() => review(r.id, "APPROVED")}
                        className="rounded-md bg-brand-gradient px-4 py-2 text-xs font-semibold text-paper transition-all hover:brightness-110 disabled:opacity-60"
                      >
                        Zatwierdź
                      </button>
                      <button
                        disabled={actionId === r.id}
                        onClick={() => review(r.id, "REJECTED")}
                        className="rounded-md border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
                      >
                        Odrzuć
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PanelShell>
  );
}
