"use client";

import { useEffect, useMemo, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { superAdminNavItems } from "@/lib/superAdminNav";
import { apiGet } from "@/lib/api";
import { inputCls } from "@/lib/ui";

type Role = "SUPER_ADMIN" | "COMPANY_ADMIN" | "COMPANY_STAFF" | "HOLDER";

interface AccountUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  company: { id: string; name: string; status: string } | null;
  holderProfile: { _count: { credentials: number } } | null;
}

const roleLabels: Record<Role, { label: string; cls: string }> = {
  SUPER_ADMIN: { label: "Administrator", cls: "bg-brand-900 text-paper" },
  COMPANY_ADMIN: { label: "Admin firmy", cls: "bg-ink/10 text-ink" },
  COMPANY_STAFF: { label: "Pracownik", cls: "bg-cream text-ink-soft" },
  HOLDER: { label: "Absolwent", cls: "bg-emerald-100 text-emerald-800" },
};

const tabs = [
  { key: "", label: "Wszyscy" },
  { key: "COMPANY_ADMIN", label: "Admini firm" },
  { key: "COMPANY_STAFF", label: "Pracownicy" },
  { key: "HOLDER", label: "Absolwenci" },
  { key: "SUPER_ADMIN", label: "Administratorzy" },
] as const;

export default function UzytkownicyPage() {
  const { user, loading: userLoading } = useCurrentUser(["SUPER_ADMIN"]);
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<AccountUser[]>("/users");
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać użytkowników");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (tab && u.role !== tab) return false;
      if (q && !`${u.firstName} ${u.lastName} ${u.email} ${u.company?.name ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, tab, query]);

  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1
  );

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-ink-soft">Ładowanie...</div>;
  }

  return (
    <PanelShell
      navItems={superAdminNavItems}
      activeHref="/panel/super-admin/uzytkownicy"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle="Administrator platformy"
    >
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Użytkownicy</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Wszystkie konta w systemie — administratorzy, pracownicy firm i absolwenci.
      </p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.key ? "bg-ink text-paper" : "bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Szukaj: nazwisko, e-mail, firma…"
          className={`${inputCls} w-64`}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10 bg-white shadow-card">
        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-ink-mute">Ładowanie...</p>
        ) : pageItems.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-ink-mute">Brak użytkowników spełniających kryteria.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-mute">
                <th className="px-6 py-3 font-semibold">Użytkownik</th>
                <th className="px-6 py-3 font-semibold">Rola</th>
                <th className="px-6 py-3 font-semibold">Firma</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Ostatnie logowanie</th>
                <th className="px-6 py-3 font-semibold">Konto od</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {pageItems.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-ink">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-ink-mute">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${roleLabels[u.role].cls}`}>
                      {roleLabels[u.role].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink-soft">{u.company?.name ?? "—"}</td>
                  <td className="px-6 py-4">
                    {u.isActive ? (
                      <span className="text-xs font-semibold text-emerald-700">Aktywne</span>
                    ) : (
                      <span className="text-xs font-semibold text-red-700">Zablokowane</span>
                    )}
                    {u.holderProfile && (
                      <p className="mt-0.5 text-[11px] text-ink-mute">legitymacji: {u.holderProfile._count.credentials}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-ink-soft">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("pl-PL") : "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-ink-soft">
                    {new Date(u.createdAt).toLocaleDateString("pl-PL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {pageNumbers.map((n, i) => (
            <span key={n} className="flex items-center gap-1.5">
              {i > 0 && pageNumbers[i - 1] !== n - 1 && <span className="px-1 text-xs text-ink-mute">…</span>}
              <button
                onClick={() => setPage(n)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  currentPage === n ? "bg-ink text-paper" : "bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink"
                }`}
              >
                {n}
              </button>
            </span>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
