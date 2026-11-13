"use client";

import { useEffect, useMemo, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { Modal } from "@/components/Modal";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { companyNavItems } from "@/lib/companyNav";
import { apiGet, apiPost } from "@/lib/api";
import { btnGhost, btnPrimary } from "@/lib/ui";

interface CredentialType {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  defaultValidityMonths: number | null;
}

interface TypeRequest {
  id: string;
  name: string;
  category: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  createdAt: string;
}

const requestStatus: Record<TypeRequest["status"], { label: string; cls: string }> = {
  PENDING: { label: "Oczekuje na weryfikację", cls: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Zatwierdzony", cls: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Odrzucony", cls: "bg-red-100 text-red-800" },
};

const initialRequest = { name: "", category: "", description: "", defaultValidityMonths: 24, noValidity: false };

export default function ZawodyPage() {
  const { user, loading: userLoading } = useCurrentUser(["COMPANY_ADMIN", "COMPANY_STAFF"]);
  const [types, setTypes] = useState<CredentialType[]>([]);
  const [requests, setRequests] = useState<TypeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [form, setForm] = useState(initialRequest);
  const [sending, setSending] = useState(false);

  const isAdmin = user?.role === "COMPANY_ADMIN";

  async function load() {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([
        apiGet<CredentialType[]>("/credential-types", false),
        apiGet<TypeRequest[]>("/credential-types/requests"),
      ]);
      setTypes(t);
      setRequests(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać danych");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const categories = useMemo(() => {
    const cats = new Set(types.map((t) => t.category ?? "Inne"));
    return Array.from(cats).sort((a, b) => a.localeCompare(b, "pl"));
  }, [types]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return types.filter((t) => {
      if (category !== "ALL" && (t.category ?? "Inne") !== category) return false;
      if (q && !t.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [types, query, category]);

  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1
  );

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await apiPost("/credential-types/requests", {
        name: form.name,
        category: form.category || undefined,
        description: form.description || undefined,
        defaultValidityMonths: form.noValidity ? null : form.defaultValidityMonths,
      });
      setSuccess(`Zgłoszono zawód „${form.name}" do weryfikacji.`);
      setForm(initialRequest);
      setRequestOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać zgłoszenia");
    } finally {
      setSending(false);
    }
  }

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-ink-soft">Ładowanie...</div>;
  }

  const inputCls = "mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

  return (
    <PanelShell
      navItems={companyNavItems}
      activeHref="/panel/firma/zawody"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle={user.company?.name ?? "Firma"}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Katalog zawodów</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Zawody dostępne do wystawiania legitymacji. Nie znajdujesz swojego? Zgłoś go — po weryfikacji dodamy go do katalogu.
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setRequestOpen(true)} className={btnPrimary}>Zgłoś nowy zawód</button>
        )}
      </div>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}

      <div className="mt-8 space-y-8">
        <div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Wyszukaj zawód, np. instruktor jazdy konnej..."
                className="w-full rounded-md border border-ink/15 bg-white py-2.5 px-4 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
            </div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            >
              <option value="ALL">Wszystkie kategorie</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <p className="mt-3 text-xs text-ink-mute">{filtered.length} zawodów</p>

          <div className="mt-3 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-card">
            {loading ? (
              <p className="px-6 py-8 text-center text-sm text-ink-mute">Ładowanie...</p>
            ) : filtered.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-ink-mute">Brak zawodów spełniających kryteria.</p>
            ) : (
              <ul className="divide-y divide-ink/5">
                {pageItems.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-ink">{t.name}</p>
                      <p className="text-xs text-ink-mute">{t.category ?? "Inne"}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-cream px-3 py-1 text-xs font-medium text-ink-soft">
                      {t.defaultValidityMonths ? `${t.defaultValidityMonths} mies.` : "Bezterminowo"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Paginacja" className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Poprzednia strona"
                className="rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 disabled:opacity-40"
              >
                &larr;
              </button>
              {pageNumbers.map((n, i) => (
                <span key={n} className="flex items-center gap-1.5">
                  {i > 0 && n - pageNumbers[i - 1] > 1 && <span className="px-1 text-ink-mute">…</span>}
                  <button
                    onClick={() => setPage(n)}
                    aria-current={n === currentPage ? "page" : undefined}
                    className={`min-w-[2.25rem] rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                      n === currentPage ? "bg-brand-900 text-white" : "border border-ink/15 bg-white text-ink hover:bg-ink/5"
                    }`}
                  >
                    {n}
                  </button>
                </span>
              ))}
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Następna strona"
                className="rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 disabled:opacity-40"
              >
                &rarr;
              </button>
            </nav>
          )}
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-card">
            <p className="border-b border-ink/10 bg-cream/60 px-5 py-3 text-sm font-semibold text-ink">Twoje zgłoszenia</p>
            {requests.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-mute">Brak zgłoszeń.</p>
            ) : (
              <ul className="divide-y divide-ink/5">
                {requests.map((r) => (
                  <li key={r.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-ink">{r.name}</p>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${requestStatus[r.status].cls}`}>
                        {requestStatus[r.status].label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-mute">
                      {new Date(r.createdAt).toLocaleDateString("pl-PL")}
                      {r.category ? ` · ${r.category}` : ""}
                    </p>
                    {r.reviewNote && <p className="mt-1.5 text-xs text-ink-soft">Uwagi: {r.reviewNote}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Zgłoś nowy zawód" subtitle="Zgłoszenie weryfikuje administrator platformy — zwykle w ciągu 1–2 dni roboczych.">
        <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink">Nazwa zawodu</label>
                <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="np. Instruktor wspinaczki" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Kategoria</label>
                <select required value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={inputCls}>
                  <option value="" disabled>Wybierz kategorię…</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  {!categories.includes("Inne") && <option value="Inne">Inne</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Domyślna ważność (miesiące)</label>
                <input type="number" min={1} max={600} required={!form.noValidity} disabled={form.noValidity} value={form.defaultValidityMonths} onChange={(e) => setForm((p) => ({ ...p, defaultValidityMonths: parseInt(e.target.value, 10) || 24 }))} className={`${inputCls} disabled:opacity-50`} />
                <label className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                  <input type="checkbox" checked={form.noValidity} onChange={(e) => setForm((p) => ({ ...p, noValidity: e.target.checked }))} className="h-4 w-4 rounded border-ink/30 text-ink focus:ring-ink" />
                  Bezterminowo — legitymacje nie wygasają
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Opis (opcjonalnie)</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setRequestOpen(false)} className={btnGhost}>Anuluj</button>
                <button type="submit" disabled={sending} className={btnPrimary}>{sending ? "Wysyłanie..." : "Wyślij zgłoszenie"}</button>
              </div>
            </form>
      </Modal>
    </PanelShell>
  );
}
