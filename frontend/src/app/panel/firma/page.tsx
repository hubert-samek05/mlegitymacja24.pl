"use client";

import { useEffect, useMemo, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { IssueCredentialModal, type CredentialType } from "@/components/IssueCredentialModal";
import { BulkImportModal } from "@/components/BulkImportModal";
import { requireActiveSubscription } from "@/components/SubscriptionGate";
import { Modal } from "@/components/Modal";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { companyNavItems } from "@/lib/companyNav";
import { apiGet, apiPatch } from "@/lib/api";
import { alertError, btnGhost, btnPrimary, inputCls } from "@/lib/ui";
import { formatSecurityCode } from "@/lib/credential";

interface Credential {
  id: string;
  credentialNumber: string;
  companyNumber: string | null;
  securityCode: string | null;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";
  issueDate: string;
  expiryDate: string | null;
  credentialType: { name: string };
  holder: { user: { firstName: string; lastName: string; email: string } };
}

type EffectiveStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";

function effectiveStatus(c: Credential): EffectiveStatus {
  if (c.status === "ACTIVE" && c.expiryDate && new Date(c.expiryDate) < new Date()) {
    return "EXPIRED";
  }
  return c.status;
}

const statusLabels: Record<EffectiveStatus, string> = {
  ACTIVE: "Aktywna",
  EXPIRED: "Wygasła",
  REVOKED: "Unieważniona",
  SUSPENDED: "Zawieszona",
};

const statusStyles: Record<EffectiveStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  EXPIRED: "bg-amber-100 text-amber-800",
  REVOKED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-ink/[0.07] text-ink-soft",
};

const tabs: { key: EffectiveStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "Wszystkie" },
  { key: "ACTIVE", label: "Aktywne" },
  { key: "EXPIRED", label: "Wygasłe" },
  { key: "SUSPENDED", label: "Zawieszone" },
  { key: "REVOKED", label: "Unieważnione" },
];

export default function FirmaPanelPage() {
  const { user, loading: userLoading } = useCurrentUser(["COMPANY_ADMIN", "COMPANY_STAFF"]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [types, setTypes] = useState<CredentialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("ALL");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sort, setSort] = useState<"newest" | "oldest" | "expiry" | "name" | "type">("newest");
  const [issueOpen, setIssueOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [editForm, setEditForm] = useState({ companyNumber: "", expiryDate: "", noExpiry: false });
  const [savingEdit, setSavingEdit] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isAdmin = user?.role === "COMPANY_ADMIN";
  const can = (p: string) => isAdmin || !!user?.permissions?.includes(p);

  async function loadData() {
    setLoading(true);
    try {
      const [credentialsData, typesData] = await Promise.all([
        apiGet<Credential[]>("/credentials/company"),
        apiGet<CredentialType[]>("/credential-types", false),
      ]);
      setCredentials(credentialsData);
      setTypes(typesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać danych");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const counts = useMemo(() => {
    const c: Record<EffectiveStatus | "ALL", number> = { ALL: credentials.length, ACTIVE: 0, EXPIRED: 0, REVOKED: 0, SUSPENDED: 0 };
    for (const cred of credentials) c[effectiveStatus(cred)]++;
    return c;
  }, [credentials]);

  const usedTypes = useMemo(() => {
    const names = new Set(credentials.map((c) => c.credentialType.name));
    return Array.from(names).sort((a, b) => a.localeCompare(b, "pl"));
  }, [credentials]);

  const filteredCredentials = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = credentials.filter((c) => {
      if (tab !== "ALL" && effectiveStatus(c) !== tab) return false;
      if (typeFilter !== "ALL" && c.credentialType.name !== typeFilter) return false;
      if (!q) return true;
      const holder = `${c.holder.user.firstName} ${c.holder.user.lastName} ${c.holder.user.email}`.toLowerCase();
      return holder.includes(q) || (c.companyNumber ?? c.credentialNumber).toLowerCase().includes(q) || (c.securityCode ?? "").toLowerCase().includes(q.replace(/\s/g, "")) || c.credentialType.name.toLowerCase().includes(q);
    });
    return [...list].sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
        case "expiry": return (a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity) - (b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity);
        case "name": return `${a.holder.user.lastName} ${a.holder.user.firstName}`.localeCompare(`${b.holder.user.lastName} ${b.holder.user.firstName}`, "pl");
        case "type": return a.credentialType.name.localeCompare(b.credentialType.name, "pl");
        default: return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
      }
    });
  }, [credentials, tab, search, typeFilter, sort]);

  async function handleRevoke(id: string) {
    const reason = window.prompt("Podaj powód unieważnienia legitymacji:");
    if (!reason) return;
    setRevokingId(id);
    try {
      await apiPatch(`/credentials/${id}/revoke`, { reason });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się unieważnić legitymacji");
    } finally {
      setRevokingId(null);
    }
  }

  function openEdit(c: Credential) {
    setEditing(c);
    setEditForm({
      companyNumber: c.companyNumber ?? "",
      expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : "",
      noExpiry: !c.expiryDate,
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    setError(null);
    try {
      await apiPatch(`/credentials/${editing.id}`, {
        companyNumber: editForm.companyNumber,
        noExpiry: editForm.noExpiry,
        expiryDate: editForm.noExpiry ? undefined : editForm.expiryDate || undefined,
      });
      setEditing(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać zmian");
    } finally {
      setSavingEdit(false);
    }
  }

  async function setStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
    setBusyId(id);
    setError(null);
    try {
      await apiPatch(`/credentials/${id}/status`, { status });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zmienić statusu");
    } finally {
      setBusyId(null);
    }
  }

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink-mute">Ładowanie...</div>;
  }

  return (
    <PanelShell
      navItems={companyNavItems}
      activeHref="/panel/firma"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle={user.company?.name ?? "Firma"}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Legitymacje</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Wystawiaj i zarządzaj legitymacjami zawodowymi absolwentów Twojej organizacji.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {can("credentials.import") && (
            <button
              onClick={async () => { if (await requireActiveSubscription()) setImportOpen(true); }}
              className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              Import masowy
            </button>
          )}
          {can("credentials.issue") && <button
            onClick={async () => { if (await requireActiveSubscription()) setIssueOpen(true); }}
            className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-paper transition-all hover:brightness-110"
          >
            Wystaw legitymację
          </button>}
        </div>
      </div>

      {error && <p className={`mt-4 ${alertError}`}>{error}</p>}

      {/* statystyki */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tabs.slice(1).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(tab === t.key ? "ALL" : t.key)}
            className={`rounded-lg border bg-white p-4 text-left shadow-card transition-colors ${
              tab === t.key ? "border-accent-500 ring-2 ring-brand-600/20" : "border-ink/10 hover:border-accent-300"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">{t.label}</p>
            <p className="mt-1.5 font-display text-3xl font-semibold text-ink">{counts[t.key]}</p>
          </button>
        ))}
      </div>

      {/* zakładki + szukajka */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.key ? "bg-ink text-paper" : "bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink"
              }`}
            >
              {t.label} <span className="opacity-60">({counts[t.key]})</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-ink/15 bg-white py-2 px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          >
            <option value="ALL">Wszystkie zawody</option>
            {usedTypes.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-md border border-ink/15 bg-white py-2 px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          >
            <option value="newest">Najnowsze</option>
            <option value="oldest">Najstarsze</option>
            <option value="expiry">Ważność rosnąco</option>
            <option value="name">Nazwisko A–Z</option>
            <option value="type">Zawód A–Z</option>
          </select>
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj absolwenta, numeru..."
              className="w-full rounded-md border border-ink/15 bg-white py-2 px-4 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-cream/60 text-left text-ink-mute">
            <tr>
              <th className="px-6 py-3 font-medium">Absolwent</th>
              <th className="px-6 py-3 font-medium">Zawód</th>
              <th className="px-6 py-3 font-medium">Numer / identyfikator</th>
              <th className="px-6 py-3 font-medium">Ważna do</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-ink-mute">Ładowanie...</td></tr>
            ) : filteredCredentials.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-ink-mute">Brak legitymacji w tej kategorii.</td></tr>
            ) : (
              filteredCredentials.map((credential) => {
                const eff = effectiveStatus(credential);
                return (
                  <tr key={credential.id} className="border-t border-ink/5">
                    <td className="px-6 py-4">
                      <p className="font-medium text-ink">
                        {credential.holder.user.firstName} {credential.holder.user.lastName}
                      </p>
                      <p className="text-xs text-ink-mute">{credential.holder.user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-ink-soft">{credential.credentialType.name}</td>
                    <td className="px-6 py-4 text-xs text-ink-soft">
                      <p>{credential.companyNumber ?? credential.credentialNumber}</p>
                      <p className="mt-0.5 font-mono text-[11px] tracking-wide text-ink-mute">{formatSecurityCode(credential.securityCode)}</p>
                    </td>
                    <td className="px-6 py-4 text-ink-soft">
                      {credential.expiryDate ? new Date(credential.expiryDate).toLocaleDateString("pl-PL") : "Bezterminowo"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[eff]}`}>
                        {statusLabels[eff]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {eff !== "REVOKED" && can("credentials.manage") && (
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openEdit(credential)} className={btnGhost + " !px-3 !py-1.5 !text-xs"}>Edytuj</button>
                          {credential.status === "SUSPENDED" ? (
                            <button disabled={busyId === credential.id} onClick={() => setStatus(credential.id, "ACTIVE")} className={btnGhost + " !px-3 !py-1.5 !text-xs"}>Przywróć</button>
                          ) : (
                            eff === "ACTIVE" && (
                              <button disabled={busyId === credential.id} onClick={() => setStatus(credential.id, "SUSPENDED")} className={btnGhost + " !px-3 !py-1.5 !text-xs"}>Zawieś</button>
                            )
                          )}
                          <button
                            disabled={revokingId === credential.id}
                            onClick={() => handleRevoke(credential.id)}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
                          >
                            Unieważnij
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edytuj legitymację" subtitle={editing ? `${editing.holder.user.firstName} ${editing.holder.user.lastName} · ${editing.credentialType.name}` : undefined}>
        <form onSubmit={saveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Numer legitymacji</label>
            <input required value={editForm.companyNumber} onChange={(e) => setEditForm({ ...editForm, companyNumber: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Ważna do</label>
            <input type="date" disabled={editForm.noExpiry} value={editForm.expiryDate} onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })} className={inputCls} />
            <label className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={editForm.noExpiry} onChange={(e) => setEditForm({ ...editForm, noExpiry: e.target.checked })} />
              Bezterminowo
            </label>
          </div>
          <p className="text-xs text-ink-mute">Dane osobowe absolwenta i identyfikator mLegitymacji nie podlegają edycji, aby dokument zachował wartość weryfikacyjną.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditing(null)} className={btnGhost}>Anuluj</button>
            <button type="submit" disabled={savingEdit} className={btnPrimary}>{savingEdit ? "Zapisywanie..." : "Zapisz"}</button>
          </div>
        </form>
      </Modal>
      <IssueCredentialModal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        types={types}
        onIssued={loadData}
      />
      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={loadData}
      />
    </PanelShell>
  );
}
