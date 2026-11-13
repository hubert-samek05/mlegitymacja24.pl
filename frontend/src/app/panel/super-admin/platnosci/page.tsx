"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { superAdminNavItems } from "@/lib/superAdminNav";
import { alertError, alertOk, btnDanger, btnGhost, btnPrimary, card, pln } from "@/lib/ui";

interface AdminPayment {
  id: string;
  amountCents: number;
  status: string;
  method: "STRIPE" | "BANK_TRANSFER";
  interval: "MONTHLY" | "YEARLY" | null;
  reference: string | null;
  proformaIssuedAt: string | null;
  targetPlanName: string | null;
  createdAt: string;
  subscription: { company: { name: string; nip: string } };
}

const statusLabel: Record<string, string> = { PENDING: "Oczekuje", PAID: "Opłacona", CANCELED: "Anulowana", FAILED: "Nieudana" };

export default function PlatnosciPage() {
  const { user, loading: userLoading } = useCurrentUser(["SUPER_ADMIN"]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [sort, setSort] = useState("date_desc");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setPayments(await apiGet<AdminPayment[]>("/billing/admin/payments"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać płatności");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function act(id: string, action: "confirm" | "reject", method?: string) {
    if (action === "confirm" && !window.confirm(
      method === "BANK_TRANSFER"
        ? "Potwierdzić zaksięgowanie przelewu i aktywować subskrypcję?"
        : "Ręcznie oznaczyć płatność kartą jako opłaconą i aktywować subskrypcję? (normalnie dzieje się to automatycznie)"
    )) return;
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await apiPost(`/billing/admin/payments/${id}/${action}`, {}, true);
      setSuccess(action === "confirm" ? "Płatność potwierdzona — subskrypcja aktywna." : "Płatność odrzucona.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operacja nie powiodła się");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleProforma(id: string, issued: boolean) {
    setBusyId(id);
    setError(null);
    try {
      await apiPatch(`/billing/admin/payments/${id}/proforma`, { issued }, true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się oznaczyć płatności");
    } finally {
      setBusyId(null);
    }
  }

  if (userLoading || !user) return <div className="flex min-h-screen items-center justify-center text-sm text-ink-mute">Ładowanie...</div>;

  const visible = payments
    .filter((p) => statusFilter === "ALL" || p.status === statusFilter)
    .sort((a, b) => {
      switch (sort) {
        case "date_asc": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "amount_desc": return b.amountCents - a.amountCents;
        case "amount_asc": return a.amountCents - b.amountCents;
        case "company": return a.subscription.company.name.localeCompare(b.subscription.company.name, "pl");
        case "proforma": return Number(!!a.proformaIssuedAt) - Number(!!b.proformaIssuedAt);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <PanelShell navItems={superAdminNavItems} activeHref="/panel/super-admin/platnosci" userLabel={`${user.firstName} ${user.lastName}`} userSubtitle="Super Admin">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Płatności</h1>
      <p className="mt-2 text-sm text-ink-soft">Potwierdzaj przelewy firm — po zaksięgowaniu wpłaty aktywujesz subskrypcję. Płatności kartą księgują się automatycznie, ale możesz je też oznaczyć ręcznie lub odrzucić porzuconą sesję.</p>
      {error && <p className={`mt-4 ${alertError}`}>{error}</p>}
      {success && <p className={`mt-4 ${alertOk}`}>{success}</p>}

      <div className="mt-6 flex items-center gap-3 text-sm">
        <label className="text-ink-soft" htmlFor="status-filter">Status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm text-ink focus:border-brand-700 focus:outline-none"
        >
          <option value="PENDING">Oczekujące</option>
          <option value="ALL">Wszystkie</option>
          <option value="PAID">Opłacone</option>
          <option value="FAILED">Nieudane</option>
          <option value="CANCELED">Anulowane</option>
        </select>
        <label className="text-ink-soft" htmlFor="sort-select">Sortuj:</label>
        <select
          id="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm text-ink focus:border-brand-700 focus:outline-none"
        >
          <option value="date_desc">Data ↓ (najnowsze)</option>
          <option value="date_asc">Data ↑ (najstarsze)</option>
          <option value="amount_desc">Kwota ↓</option>
          <option value="amount_asc">Kwota ↑</option>
          <option value="company">Firma A–Z</option>
          <option value="proforma">Bez wystawionej faktury</option>
        </select>
        <p className="text-xs text-ink-mute">{visible.length} z {payments.length} płatności</p>
      </div>

      <div className={`${card} mt-4 overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-cream/60 text-left text-ink-mute">
            <tr>
              <th className="px-6 py-3 font-medium">Firma</th>
              <th className="px-6 py-3 font-medium">Plan</th>
              <th className="px-6 py-3 font-medium">Kwota</th>
              <th className="px-6 py-3 font-medium">Metoda / tytuł</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-ink-mute">Ładowanie...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-ink-mute">Brak płatności.</td></tr>
            ) : (
              visible.map((p) => (
                <tr key={p.id} className="border-t border-ink/5">
                  <td className="px-6 py-4">
                    <p className="font-medium text-ink">{p.subscription.company.name}</p>
                    <p className="text-xs text-ink-mute">NIP {p.subscription.company.nip} · {new Date(p.createdAt).toLocaleDateString("pl-PL")}</p>
                  </td>
                  <td className="px-6 py-4 text-ink-soft">{p.targetPlanName ?? "—"}{p.interval ? ` · ${p.interval === "YEARLY" ? "rocznie" : "miesięcznie"}` : ""}</td>
                  <td className="px-6 py-4 font-medium text-ink">{pln(p.amountCents)}</td>
                  <td className="px-6 py-4 text-xs text-ink-soft">
                    {p.method === "STRIPE" ? "Karta / BLIK" : "Przelew"}
                    {p.reference ? <span className="block font-mono text-ink-mute">{p.reference}</span> : null}
                    {p.proformaIssuedAt && (
                      <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                        Faktura wyst. {new Date(p.proformaIssuedAt).toLocaleDateString("pl-PL")}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-ink-soft">{statusLabel[p.status] ?? p.status}</td>
                  <td className="px-6 py-4">
                    {p.status === "PENDING" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={busyId === p.id}
                          onClick={() => act(p.id, "confirm", p.method)}
                          className={btnPrimary + " !px-3 !py-1.5 !text-xs"}
                        >
                          {p.method === "BANK_TRANSFER" ? "Potwierdź wpłatę" : "Oznacz jako opłaconą"}
                        </button>
                        {p.method === "BANK_TRANSFER" && (
                          <button
                            disabled={busyId === p.id}
                            onClick={() => toggleProforma(p.id, !p.proformaIssuedAt)}
                            className={btnGhost + " !px-3 !py-1.5 !text-xs"}
                          >
                            {p.proformaIssuedAt ? "Cofnij fakturę" : "Faktura wystawiona"}
                          </button>
                        )}
                        <button disabled={busyId === p.id} onClick={() => act(p.id, "reject", p.method)} className={btnDanger}>Odrzuć</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}
