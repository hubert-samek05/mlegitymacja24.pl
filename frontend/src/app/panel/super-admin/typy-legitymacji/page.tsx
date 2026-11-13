"use client";

import { useEffect, useMemo, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { apiGet, apiPost } from "@/lib/api";
import { superAdminNavItems } from "@/lib/superAdminNav";

interface CredentialType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  defaultValidityMonths: number | null;
  isActive: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CredentialTypesPage() {
  const { user, loading: userLoading } = useCurrentUser(["SUPER_ADMIN"]);
  const [types, setTypes] = useState<CredentialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [validity, setValidity] = useState(24);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);

  async function loadTypes() {
    setLoading(true);
    try {
      const data = await apiGet<CredentialType[]>("/credential-types", false);
      setTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać typów legitymacji");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setPage(1);
  }, [query, category]);

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

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPost(
        "/credential-types",
        { name, slug: slugify(name), description, defaultValidityMonths: validity },
        true
      );
      setName("");
      setDescription("");
      setValidity(24);
      await loadTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać typu legitymacji");
    } finally {
      setSubmitting(false);
    }
  }

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-ink-soft">Ładowanie...</div>;
  }

  return (
    <PanelShell
      navItems={superAdminNavItems}
      activeHref="/panel/super-admin/typy-legitymacji"
      userLabel={`${user.firstName} ${user.lastName} (Super Admin)`}
    >
      <h1 className="text-2xl font-bold text-ink">Typy legitymacji</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Zdefiniuj kategorie legitymacji dostępne dla firm szkoleniowych na platformie.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj zawodu..."
              className="flex-1 rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm focus:border-brand-600 focus:outline-none"
            >
              <option value="ALL">Wszystkie kategorie ({filtered.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-md border border-ink/10 bg-white shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-left text-ink-mute">
                <tr>
                  <th className="px-6 py-3 font-medium">Nazwa</th>
                  <th className="px-6 py-3 font-medium">Kategoria</th>
                  <th className="px-6 py-3 font-medium">Domyślna ważność</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-ink-mute">Ładowanie...</td></tr>
                ) : pageItems.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-ink-mute">Brak zdefiniowanych typów.</td></tr>
                ) : (
                  pageItems.map((type) => (
                    <tr key={type.id} className="border-t border-ink/10">
                      <td className="px-6 py-4">
                        <p className="font-medium text-ink">{type.name}</p>
                        {type.description && <p className="text-xs text-ink-mute">{type.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-ink-soft">{type.category ?? "Inne"}</td>
                      <td className="px-6 py-4 text-ink-soft">{type.defaultValidityMonths ? `${type.defaultValidityMonths} mies.` : "Bezterminowo"}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${type.isActive ? "bg-green-100 text-green-800" : "bg-ink/[0.06] text-ink-soft"}`}>
                          {type.isActive ? "Aktywny" : "Nieaktywny"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-ink-mute">
                {filtered.length} typów · strona {currentPage} z {totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                {pageNumbers.map((n, i) => (
                  <span key={n} className="flex items-center gap-1.5">
                    {i > 0 && pageNumbers[i - 1] !== n - 1 && <span className="text-ink-mute">…</span>}
                    <button
                      type="button"
                      onClick={() => setPage(n)}
                      className={`h-8 min-w-8 rounded-md px-2 text-xs font-medium ${n === currentPage ? "bg-brand-gradient text-paper" : "border border-ink/15 text-ink hover:border-ink/30"}`}
                    >
                      {n}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="h-fit rounded-md border border-ink/10 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Dodaj nowy typ</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink">Nazwa</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-ink/15 px-4 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Opis</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-ink/15 px-4 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Domyślna ważność (miesiące)</label>
              <input
                type="number"
                min={1}
                required
                value={validity}
                onChange={(e) => setValidity(parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded-md border border-ink/15 px-4 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? "Dodawanie..." : "Dodaj typ legitymacji"}
            </button>
          </div>
        </form>
      </div>
    </PanelShell>
  );
}
