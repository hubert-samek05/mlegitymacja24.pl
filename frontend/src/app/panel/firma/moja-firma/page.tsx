"use client";

import { useEffect, useRef, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { companyNavItems } from "@/lib/companyNav";
import { apiDelete, apiGet, apiPatch, apiUpload, API_URL } from "@/lib/api";
import { ImagePlus, Trash2 } from "lucide-react";

const API_HOST = API_URL.replace(/\/api$/, "");

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  nip: string;
  regon: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  website: string | null;
  contactEmail: string;
  contactPhone: string | null;
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  verificationNote: string | null;
  verifiedAt: string | null;
  createdAt: string;
  _count?: { credentials: number; users: number };
}

const statusLabels: Record<Company["status"], { label: string; cls: string }> = {
  PENDING_VERIFICATION: { label: "Oczekuje na weryfikację", cls: "bg-amber-100 text-amber-800" },
  ACTIVE: { label: "Zweryfikowana", cls: "bg-emerald-100 text-emerald-800" },
  SUSPENDED: { label: "Zawieszona", cls: "bg-red-100 text-red-800" },
  REJECTED: { label: "Odrzucona", cls: "bg-red-100 text-red-800" },
};

export default function MojaFirmaPage() {
  const { user, loading: userLoading } = useCurrentUser(["COMPANY_ADMIN", "COMPANY_STAFF"]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    regon: "", address: "", city: "", postalCode: "", website: "", contactEmail: "", contactPhone: "",
  });
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "COMPANY_ADMIN";
  const isLocked = company?.status === "ACTIVE" || company?.status === "SUSPENDED";

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Plik logo jest za duży — maksymalny rozmiar to 10 MB.");
      return;
    }
    setLogoBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await apiUpload<{ logoUrl: string }>("/companies/me/logo", fd);
      setCompany((prev) => (prev ? { ...prev, logoUrl: res.logoUrl } : prev));
      setSuccess("Logo firmy zostało zaktualizowane.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się przesłać logo");
    } finally {
      setLogoBusy(false);
    }
  }

  async function handleLogoRemove() {
    setLogoBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await apiDelete("/companies/me/logo");
      setCompany((prev) => (prev ? { ...prev, logoUrl: null } : prev));
      setSuccess("Logo firmy zostało usunięte.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć logo");
    } finally {
      setLogoBusy(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    apiGet<Company>("/companies/me")
      .then((c) => {
        setCompany(c);
        setForm({
          regon: c.regon ?? "",
          address: c.address ?? "",
          city: c.city ?? "",
          postalCode: c.postalCode ?? "",
          website: c.website ?? "",
          contactEmail: c.contactEmail ?? "",
          contactPhone: c.contactPhone ?? "",
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nie udało się pobrać danych firmy"))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await apiPatch<Company>("/companies/me", form);
      setCompany((prev) => (prev ? { ...prev, ...updated } : prev));
      setSuccess("Dane firmy zostały zaktualizowane.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać zmian");
    } finally {
      setSaving(false);
    }
  }

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-ink-soft">Ładowanie...</div>;
  }

  const inputCls = "mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-mute";

  return (
    <PanelShell
      navItems={companyNavItems}
      activeHref="/panel/firma/moja-firma"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle={user.company?.name ?? "Firma"}
    >
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Moja firma</h1>
      <p className="mt-2 text-sm text-ink-soft">Dane organizacji widoczne na wystawianych legitymacjach i przy weryfikacji.</p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-ink-mute">Ładowanie...</p>
      ) : !company ? (
        <p className="mt-8 text-sm text-ink-mute">Brak danych firmy.</p>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-card">
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-semibold text-ink">{company.name}</p>
              <p className="text-sm text-ink-mute">NIP {company.nip}{company.regon ? ` · REGON ${company.regon}` : ""}</p>
            </div>
            <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${statusLabels[company.status].cls}`}>
              {statusLabels[company.status].label}
            </span>
          </div>

          {company.status === "REJECTED" && company.verificationNote && (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Powód odrzucenia: {company.verificationNote}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-5 rounded-lg border border-ink/10 bg-white p-6 shadow-card">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-paper">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${API_HOST}${company.logoUrl}`} alt={`Logo — ${company.name}`} className="h-full w-full object-contain" />
              ) : (
                <span className="font-display text-xl font-semibold text-ink-mute">
                  {company.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold text-ink">Logo firmy</h2>
              <p className="mt-1 text-xs text-ink-mute">
                Logo pojawia się na legitymacjach absolwentów i w wyniku weryfikacji. PNG, JPG lub WebP, maks. 10 MB.
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoFile}
                />
                <button
                  type="button"
                  disabled={logoBusy}
                  onClick={() => logoInput.current?.click()}
                  className="inline-flex items-center gap-2 rounded-md border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/30 disabled:opacity-60"
                >
                  <ImagePlus className="h-4 w-4" />
                  {company.logoUrl ? "Zmień logo" : "Dodaj logo"}
                </button>
                {company.logoUrl && (
                  <button
                    type="button"
                    disabled={logoBusy}
                    onClick={handleLogoRemove}
                    aria-label="Usuń logo"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Legitymacje</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">{company._count?.credentials ?? 0}</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Użytkownicy</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">{company._count?.users ?? 0}</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Na platformie od</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {new Date(company.createdAt).toLocaleDateString("pl-PL")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-ink/10 bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Dane kontaktowe i adres</h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-mute">
                  {isLocked
                    ? "Dane zweryfikowanej firmy są zablokowane — zmiana wymaga kontaktu z administratorem platformy."
                    : "Po weryfikacji firmy wszystkie dane zostaną zablokowane — zmiana będzie wymagała kontaktu z administratorem platformy."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink">REGON</label>
                <input disabled={!isAdmin || isLocked} value={form.regon} onChange={(e) => setForm((p) => ({ ...p, regon: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Strona www</label>
                <input disabled={!isAdmin || isLocked} value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} className={inputCls} placeholder="https://" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">E-mail kontaktowy</label>
                <input disabled={!isAdmin || isLocked} required type="email" value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Telefon kontaktowy</label>
                <input disabled={!isAdmin || isLocked} value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Adres</label>
                <input disabled={!isAdmin || isLocked} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink">Kod pocztowy</label>
                  <input disabled={!isAdmin || isLocked} value={form.postalCode} onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">Miasto</label>
                  <input disabled={!isAdmin || isLocked} value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className={inputCls} />
                </div>
              </div>
            </div>

            {isLocked ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Firma jest zweryfikowana — dane rejestrowe widoczne na legitymacjach są zablokowane. Aby je zmienić, skontaktuj się z administratorem platformy.
              </p>
            ) : isAdmin ? (
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-brand-gradient px-7 py-3 text-sm font-semibold text-paper transition-all hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "Zapisywanie..." : "Zapisz zmiany"}
              </button>
            ) : (
              <p className="text-xs text-ink-mute">Edycję danych firmy może wykonać wyłącznie administrator firmy.</p>
            )}
          </form>
        </div>
      )}
    </PanelShell>
  );
}
