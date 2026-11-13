"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { companyNavItems } from "@/lib/companyNav";
import { apiPatch, apiPost } from "@/lib/api";

const roleLabels: Record<string, string> = {
  COMPANY_ADMIN: "Administrator firmy",
  COMPANY_STAFF: "Pracownik",
};

export default function MojeKontoPage() {
  const { user, loading: userLoading } = useCurrentUser(["COMPANY_ADMIN", "COMPANY_STAFF"]);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ firstName: user.firstName, lastName: user.lastName, phone: "" });
    }
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setSuccess(null);
    try {
      await apiPatch("/users/me", profile);
      setSuccess("Dane konta zostały zaktualizowane.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać zmian");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (passwords.newPassword !== passwords.confirm) {
      setError("Nowe hasła nie są identyczne.");
      return;
    }
    setSavingPassword(true);
    try {
      await apiPost("/users/me/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setSuccess("Hasło zostało zmienione.");
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zmienić hasła");
    } finally {
      setSavingPassword(false);
    }
  }

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-ink-soft">Ładowanie...</div>;
  }

  const inputCls = "mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

  return (
    <PanelShell
      navItems={companyNavItems}
      activeHref="/panel/firma/moje-konto"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle={user.company?.name ?? "Firma"}
    >
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Moje konto</h1>
      <p className="mt-2 text-sm text-ink-soft">Twoje dane osobowe i ustawienia bezpieczeństwa.</p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="h-fit space-y-4 rounded-lg border border-ink/10 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink">Dane osobowe</h2>
          <div className="rounded-md bg-cream/60 px-4 py-3 text-sm">
            <p className="text-ink-mute">E-mail: <span className="font-medium text-ink">{user.email}</span></p>
            <p className="mt-1 text-ink-mute">Rola: <span className="font-medium text-ink">{roleLabels[user.role] ?? user.role}</span></p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Imię</label>
              <input required value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Nazwisko</label>
              <input required value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Telefon</label>
            <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-md bg-brand-gradient px-7 py-3 text-sm font-semibold text-paper transition-all hover:brightness-110 disabled:opacity-60"
          >
            {savingProfile ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>
        </form>

        <form onSubmit={savePassword} className="h-fit space-y-4 rounded-lg border border-ink/10 bg-white p-6 shadow-card sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink">Zmiana hasła</h2>
          <div>
            <label className="block text-sm font-medium text-ink">Obecne hasło</label>
            <input required type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Nowe hasło</label>
            <input required type="password" minLength={8} autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} className={inputCls} />
            <p className="mt-1 text-xs text-ink-mute">Minimum 8 znaków.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Powtórz nowe hasło</label>
            <input required type="password" autoComplete="new-password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} className={inputCls} />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-md border border-ink/15 px-7 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 disabled:opacity-60"
          >
            {savingPassword ? "Zmienianie..." : "Zmień hasło"}
          </button>
        </form>
      </div>
    </PanelShell>
  );
}
