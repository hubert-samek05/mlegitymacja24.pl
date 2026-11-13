"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { apiGet, apiPatch } from "@/lib/api";
import { superAdminNavItems } from "@/lib/superAdminNav";

interface Company {
  id: string;
  name: string;
  nip: string;
  regon: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  website: string | null;
  contactEmail: string;
  contactPhone: string | null;
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  createdAt: string;
  _count?: { credentials: number; users: number };
}

interface CompanyDetails extends Company {
  logoUrl: string | null;
  verificationNote: string | null;
  verifiedAt: string | null;
  updatedAt: string;
  users?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
  }[];
  subscription?: {
    status: "INCOMPLETE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
    billingInterval: "MONTHLY" | "YEARLY";
    currentPeriodStart: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    pastDueSince: string | null;
    createdAt: string;
    plan: {
      name: string;
      maxCredentials: number;
      maxStaffUsers: number;
      monthlyPriceCents: number;
      yearlyPriceCents: number;
    } | null;
    payments?: {
      id: string;
      amountCents: number;
      currency: string;
      status: string;
      method: "STRIPE" | "BANK_TRANSFER";
      reference: string | null;
      failureReason: string | null;
      paidAt: string | null;
      createdAt: string;
    }[];
  } | null;
  _count?: { credentials: number; users: number; supportTickets?: number; credentialTypeRequests?: number };
}

const statusLabels: Record<Company["status"], string> = {
  PENDING_VERIFICATION: "Oczekuje na weryfikację",
  ACTIVE: "Aktywna",
  SUSPENDED: "Zawieszona",
  REJECTED: "Odrzucona",
};

const statusStyles: Record<Company["status"], string> = {
  PENDING_VERIFICATION: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  SUSPENDED: "bg-red-100 text-red-800",
  REJECTED: "bg-ink/[0.07] text-ink-soft",
};

const subStatusLabels: Record<string, string> = {
  INCOMPLETE: "Nieaktywna",
  TRIALING: "Okres próbny",
  ACTIVE: "Aktywna",
  PAST_DUE: "Zaległość",
  CANCELED: "Zakończona",
};

const subStatusStyles: Record<string, string> = {
  INCOMPLETE: "bg-ink/[0.07] text-ink-soft",
  TRIALING: "bg-sky-100 text-sky-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  PAST_DUE: "bg-amber-100 text-amber-800",
  CANCELED: "bg-ink/[0.07] text-ink-soft",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Oczekuje",
  COMPLETED: "Opłacona",
  PAID: "Opłacona",
  FAILED: "Nieudana",
  CANCELED: "Anulowana",
};

const paymentStatusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  PAID: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELED: "bg-ink/[0.07] text-ink-soft",
};

const roleLabels: Record<string, string> = {
  COMPANY_ADMIN: "Administrator",
  COMPANY_STAFF: "Pracownik",
  GRADUATE: "Absolwent",
  SUPER_ADMIN: "Super Admin",
};

function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("pl-PL");
}

function fmtMoney(cents: number, currency = "PLN") {
  return `${(cents / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2 })} ${currency}`;
}

export default function SuperAdminPage() {
  const { user, loading: userLoading } = useCurrentUser(["SUPER_ADMIN"]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", nip: "", regon: "", address: "", city: "", postalCode: "",
    website: "", contactEmail: "", contactPhone: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailsModal, setDetailsModal] = useState<{
    loading: boolean;
    data: CompanyDetails | null;
    error: string | null;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Company["status"]>("ALL");
  const [sortBy, setSortBy] = useState<"created_desc" | "created_asc" | "name_asc" | "name_desc" | "nip" | "credentials" | "status">("created_desc");

  const visibleCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = companies.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (!q) return true;
      return [c.name, c.nip, c.contactEmail, c.contactPhone ?? "", c.city ?? "", c.regon ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const statusOrder: Record<Company["status"], number> = {
      PENDING_VERIFICATION: 0, ACTIVE: 1, SUSPENDED: 2, REJECTED: 3,
    };
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name_asc": return a.name.localeCompare(b.name, "pl");
        case "name_desc": return b.name.localeCompare(a.name, "pl");
        case "nip": return a.nip.localeCompare(b.nip);
        case "credentials": return (b._count?.credentials ?? 0) - (a._count?.credentials ?? 0);
        case "status": return statusOrder[a.status] - statusOrder[b.status];
        case "created_asc": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [companies, search, statusFilter, sortBy]);

  async function openDetails(id: string) {
    setDetailsModal({ loading: true, data: null, error: null });
    try {
      const data = await apiGet<CompanyDetails>(`/companies/${id}`);
      setDetailsModal({ loading: false, data, error: null });
    } catch (err) {
      setDetailsModal({
        loading: false,
        data: null,
        error: err instanceof Error ? err.message : "Nie udało się pobrać danych firmy",
      });
    }
  }

  async function loadCompanies() {
    setLoading(true);
    try {
      const data = await apiGet<Company[]>("/companies");
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać listy firm");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function updateStatus(id: string, status: Company["status"]) {
    let note: string | undefined;
    if (status === "REJECTED") {
      const input = window.prompt(
        "Powód odrzucenia / czego brakuje? (firma zobaczy tę wiadomość w swoim panelu — zostaw puste, aby odrzucić bez uwag)"
      );
      if (input === null) return;
      if (input.trim()) note = input.trim();
    }
    setActionId(id);
    try {
      await apiPatch(`/companies/${id}/status`, { status, note });
      await loadCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zaktualizować statusu");
    } finally {
      setActionId(null);
    }
  }

  function openEdit(company: Company) {
    setEditing(company);
    setEditError(null);
    setEditForm({
      name: company.name,
      nip: company.nip,
      regon: company.regon ?? "",
      address: company.address ?? "",
      city: company.city ?? "",
      postalCode: company.postalCode ?? "",
      website: company.website ?? "",
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone ?? "",
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setEditError(null);
    try {
      await apiPatch(`/companies/${editing.id}`, editForm);
      setEditing(null);
      await loadCompanies();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Nie udało się zapisać danych firmy");
    } finally {
      setSaving(false);
    }
  }

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-ink-soft">Ładowanie...</div>;
  }

  const inputCls = "mt-1 w-full rounded-md border border-ink/15 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

  return (
    <PanelShell
      navItems={superAdminNavItems}
      activeHref="/panel/super-admin"
      userLabel={`${user.firstName} ${user.lastName} (Super Admin)`}
    >
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Firmy szkoleniowe</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Zatwierdzaj nowe zgłoszenia oraz zarządzaj statusem firm korzystających z platformy.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj: nazwa, NIP, e-mail, miasto..."
            className="w-full rounded-md border border-ink/15 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        >
          <option value="ALL">Wszystkie statusy</option>
          <option value="PENDING_VERIFICATION">Oczekuje na weryfikację</option>
          <option value="ACTIVE">Aktywna</option>
          <option value="SUSPENDED">Zawieszona</option>
          <option value="REJECTED">Odrzucona</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        >
          <option value="created_desc">Najnowsze zgłoszenia</option>
          <option value="created_asc">Najstarsze zgłoszenia</option>
          <option value="name_asc">Nazwa A–Z</option>
          <option value="name_desc">Nazwa Z–A</option>
          <option value="nip">NIP rosnąco</option>
          <option value="credentials">Najwięcej legitymacji</option>
          <option value="status">Według statusu</option>
        </select>
        <p className="ml-auto text-xs text-ink-mute">
          {visibleCompanies.length} z {companies.length} firm
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-cream/60 text-left text-ink-mute">
            <tr>
              <th className="px-6 py-3 font-medium">Nazwa firmy</th>
              <th className="px-6 py-3 font-medium">NIP</th>
              <th className="px-6 py-3 font-medium">Kontakt</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Legitymacje</th>
              <th className="px-6 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-ink-mute">
                  Ładowanie...
                </td>
              </tr>
            ) : visibleCompanies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-ink-mute">
                  {companies.length === 0
                    ? "Brak zarejestrowanych firm."
                    : "Brak wyników dla podanych kryteriów."}
                </td>
              </tr>
            ) : (
              visibleCompanies.map((company) => (
                <tr key={company.id} className="border-t border-ink/10">
                  <td className="px-6 py-4 font-medium text-ink">
                    <button
                      onClick={() => openDetails(company.id)}
                      className="text-left font-medium text-brand-800 hover:underline"
                      title="Zobacz szczegóły firmy"
                    >
                      {company.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-ink-soft">{company.nip}</td>
                  <td className="px-6 py-4 text-ink-soft">{company.contactEmail}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[company.status]}`}>
                      {statusLabels[company.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink-soft">{company._count?.credentials ?? 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(company)}
                        className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5"
                      >
                        Edytuj
                      </button>
                      {company.status !== "ACTIVE" && (
                        <button
                          disabled={actionId === company.id}
                          onClick={() => updateStatus(company.id, "ACTIVE")}
                          className="rounded-md bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                        >
                          Zatwierdź
                        </button>
                      )}
                      {company.status !== "SUSPENDED" && (
                        <button
                          disabled={actionId === company.id}
                          onClick={() => updateStatus(company.id, "SUSPENDED")}
                          className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5 disabled:opacity-60"
                        >
                          Zawieś
                        </button>
                      )}
                      {company.status !== "REJECTED" && (
                        <button
                          disabled={actionId === company.id}
                          onClick={() => updateStatus(company.id, "REJECTED")}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          Odrzuć
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setEditing(null)}>
          <form
            onSubmit={saveEdit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="font-display text-lg font-semibold text-ink">Edycja danych firmy</h2>
            <p className="mt-1 text-xs text-ink-mute">
              {editing.name} — zmiany wykonane przez administratora są odnotowywane w dzienniku zdarzeń.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-ink">Nazwa firmy</label>
                <input required value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink">NIP</label>
                <input required value={editForm.nip} onChange={(e) => setEditForm((p) => ({ ...p, nip: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink">REGON</label>
                <input value={editForm.regon} onChange={(e) => setEditForm((p) => ({ ...p, regon: e.target.value }))} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-ink">Adres</label>
                <input value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink">Kod pocztowy</label>
                <input value={editForm.postalCode} onChange={(e) => setEditForm((p) => ({ ...p, postalCode: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink">Miasto</label>
                <input value={editForm.city} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink">E-mail kontaktowy</label>
                <input required type="email" value={editForm.contactEmail} onChange={(e) => setEditForm((p) => ({ ...p, contactEmail: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink">Telefon</label>
                <input value={editForm.contactPhone} onChange={(e) => setEditForm((p) => ({ ...p, contactPhone: e.target.value }))} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-ink">Strona www</label>
                <input value={editForm.website} onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))} className={inputCls} placeholder="https://" />
              </div>
            </div>
            {editError && <p className="mt-3 text-sm text-red-600">{editError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? "Zapisywanie..." : "Zapisz zmiany"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setDetailsModal(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  {detailsModal.data?.name ?? "Szczegóły firmy"}
                </h2>
                {detailsModal.data && (
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[detailsModal.data.status]}`}>
                    {statusLabels[detailsModal.data.status]}
                  </span>
                )}
              </div>
              <button
                onClick={() => setDetailsModal(null)}
                className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5"
              >
                Zamknij
              </button>
            </div>

            {detailsModal.loading ? (
              <p className="mt-6 text-sm text-ink-mute">Ładowanie danych firmy...</p>
            ) : detailsModal.error ? (
              <p className="mt-6 text-sm text-red-600">{detailsModal.error}</p>
            ) : detailsModal.data ? (
              (() => {
                const c = detailsModal.data;
                const sub = c.subscription;
                return (
                  <div className="mt-5 space-y-6">
                    <section>
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Dane rejestrowe</p>
                      <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                        <div><dt className="text-ink-mute">NIP</dt><dd className="font-medium text-ink">{c.nip}</dd></div>
                        <div><dt className="text-ink-mute">REGON</dt><dd className="font-medium text-ink">{c.regon || "—"}</dd></div>
                        <div className="sm:col-span-2">
                          <dt className="text-ink-mute">Adres</dt>
                          <dd className="font-medium text-ink">
                            {[c.address, [c.postalCode, c.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-ink-mute">Strona www</dt>
                          <dd className="font-medium text-ink">
                            {c.website ? (
                              <a href={c.website} target="_blank" rel="noreferrer" className="text-brand-800 hover:underline">{c.website}</a>
                            ) : "—"}
                          </dd>
                        </div>
                        <div><dt className="text-ink-mute">Zarejestrowana</dt><dd className="font-medium text-ink">{fmtDate(c.createdAt)}</dd></div>
                        <div><dt className="text-ink-mute">Zweryfikowana</dt><dd className="font-medium text-ink">{fmtDate(c.verifiedAt)}</dd></div>
                      </dl>
                      {c.verificationNote && (
                        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          Uwaga weryfikacyjna: {c.verificationNote}
                        </p>
                      )}
                    </section>

                    <section>
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Kontakt</p>
                      <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                        <div><dt className="text-ink-mute">E-mail</dt><dd className="font-medium text-ink">{c.contactEmail}</dd></div>
                        <div><dt className="text-ink-mute">Telefon</dt><dd className="font-medium text-ink">{c.contactPhone || "—"}</dd></div>
                      </dl>
                    </section>

                    <section>
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Subskrypcja</p>
                      {sub ? (
                        <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                          <div><dt className="text-ink-mute">Plan</dt><dd className="font-medium text-ink">{sub.plan?.name ?? "—"}</dd></div>
                          <div>
                            <dt className="text-ink-mute">Status</dt>
                            <dd>
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${subStatusStyles[sub.status] ?? "bg-ink/[0.07] text-ink-soft"}`}>
                                {subStatusLabels[sub.status] ?? sub.status}
                              </span>
                            </dd>
                          </div>
                          <div><dt className="text-ink-mute">Rozliczenie</dt><dd className="font-medium text-ink">{sub.billingInterval === "YEARLY" ? "Roczne" : "Miesięczne"}</dd></div>
                          <div><dt className="text-ink-mute">Koniec okresu</dt><dd className="font-medium text-ink">{fmtDate(sub.currentPeriodEnd)}</dd></div>
                          {sub.cancelAtPeriodEnd && (
                            <div className="sm:col-span-2">
                              <p className="text-xs text-amber-700">Subskrypcja anulowana — nie odnowi się po zakończeniu bieżącego okresu.</p>
                            </div>
                          )}
                          {sub.pastDueSince && (
                            <div className="sm:col-span-2">
                              <p className="text-xs text-red-700">Zaległość płatnicza od {fmtDate(sub.pastDueSince)}.</p>
                            </div>
                          )}
                          {sub.plan && (
                            <div className="sm:col-span-2">
                              <dt className="text-ink-mute">Limity planu</dt>
                              <dd className="font-medium text-ink">
                                {sub.plan.maxCredentials} legitymacji/mies., {sub.plan.maxStaffUsers} użytkowników — {fmtMoney(sub.plan.monthlyPriceCents)}/mies.
                              </dd>
                            </div>
                          )}
                        </dl>
                      ) : (
                        <p className="mt-2 text-sm text-ink-mute">Brak subskrypcji.</p>
                      )}
                    </section>

                    {sub?.payments && sub.payments.length > 0 && (
                      <section>
                        <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Ostatnie płatności</p>
                        <div className="mt-2 overflow-hidden rounded-md border border-ink/10">
                          <table className="w-full text-xs">
                            <thead className="bg-cream/60 text-left text-ink-mute">
                              <tr>
                                <th className="px-3 py-2 font-medium">Data</th>
                                <th className="px-3 py-2 font-medium">Kwota</th>
                                <th className="px-3 py-2 font-medium">Metoda</th>
                                <th className="px-3 py-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sub.payments.map((p) => (
                                <tr key={p.id} className="border-t border-ink/10">
                                  <td className="px-3 py-2 text-ink-soft">{fmtDate(p.paidAt ?? p.createdAt)}</td>
                                  <td className="px-3 py-2 font-medium text-ink">{fmtMoney(p.amountCents, p.currency)}</td>
                                  <td className="px-3 py-2 text-ink-soft">{p.method === "STRIPE" ? "Karta" : "Przelew"}</td>
                                  <td className="px-3 py-2">
                                    <span className={`rounded-full px-2 py-0.5 font-semibold ${paymentStatusStyles[p.status] ?? "bg-ink/[0.07] text-ink-soft"}`}>
                                      {paymentStatusLabels[p.status] ?? p.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}

                    <section>
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                        Użytkownicy ({c.users?.length ?? c._count?.users ?? 0})
                      </p>
                      {c.users && c.users.length > 0 ? (
                        <ul className="mt-2 divide-y divide-ink/10 rounded-md border border-ink/10">
                          {c.users.map((u) => (
                            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                              <div>
                                <p className="font-medium text-ink">{u.firstName} {u.lastName}</p>
                                <p className="text-xs text-ink-mute">{u.email}</p>
                              </div>
                              <div className="text-right text-xs">
                                <p className="font-medium text-ink-soft">{roleLabels[u.role] ?? u.role}</p>
                                <p className={u.isActive ? "text-ink-mute" : "text-red-600"}>
                                  {u.isActive ? `Ost. logowanie: ${fmtDate(u.lastLoginAt)}` : "Konto nieaktywne"}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-ink-mute">Brak użytkowników.</p>
                      )}
                    </section>

                    <section>
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Statystyki</p>
                      <div className="mt-2 grid gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded-md border border-ink/10 bg-paper px-3 py-2">
                          <p className="text-xs text-ink-mute">Legitymacje</p>
                          <p className="font-display text-lg font-semibold text-ink">{c._count?.credentials ?? 0}</p>
                        </div>
                        <div className="rounded-md border border-ink/10 bg-paper px-3 py-2">
                          <p className="text-xs text-ink-mute">Użytkownicy</p>
                          <p className="font-display text-lg font-semibold text-ink">{c._count?.users ?? 0}</p>
                        </div>
                        <div className="rounded-md border border-ink/10 bg-paper px-3 py-2">
                          <p className="text-xs text-ink-mute">Zgłoszenia support</p>
                          <p className="font-display text-lg font-semibold text-ink">{c._count?.supportTickets ?? 0}</p>
                        </div>
                      </div>
                    </section>

                    <div className="flex justify-end gap-2 border-t border-ink/10 pt-4">
                      <button
                        onClick={() => { setDetailsModal(null); openEdit(c); }}
                        className="rounded-md border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5"
                      >
                        Edytuj dane
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>
        </div>
      )}
    </PanelShell>
  );
}
