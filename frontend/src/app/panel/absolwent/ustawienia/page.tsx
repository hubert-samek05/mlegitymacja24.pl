"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser, logout } from "@/lib/useCurrentUser";
import { apiPost } from "@/lib/api";
import { absolwentNavItems } from "@/lib/absolwentNav";
import { TwoFactorCard } from "@/components/TwoFactorCard";

export default function UstawieniaPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (newPassword !== repeatPassword) {
      setError("Nowe hasła nie są identyczne");
      return;
    }

    setSaving(true);
    try {
      await apiPost("/users/me/password", { currentPassword, newPassword });
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zmienić hasła");
    } finally {
      setSaving(false);
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
      activeHref="/panel/absolwent/ustawienia"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle="Portfel absolwenta"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-600">
        Ustawienia
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Konto i bezpieczeństwo
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Zarządzaj hasłem i bezpieczeństwem swojego konta.
      </p>

      <div className="mt-8 max-w-2xl space-y-6">
        {/* zmiana hasła */}
        <form
          onSubmit={handlePasswordChange}
          className="rounded-lg border border-ink/10 bg-white p-6 shadow-card sm:p-7"
        >
          <div className="flex items-center gap-3">
            <div>
              <p className="font-display text-lg font-semibold text-ink">Zmiana hasła</p>
              <p className="text-xs text-ink-mute">Minimum 8 znaków</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink">Obecne hasło</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-ink/15 bg-paper px-4 py-3 text-sm transition-colors focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink">Nowe hasło</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-ink/15 bg-paper px-4 py-3 text-sm transition-colors focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Powtórz nowe hasło</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-ink/15 bg-paper px-4 py-3 text-sm transition-colors focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                />
              </div>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-5 flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand-gradient px-7 py-3 text-sm font-semibold text-paper transition-all duration-300 hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Zapisywanie..." : "Zmień hasło"}
            </button>
            {saved && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                Hasło zmienione
              </p>
            )}
          </div>
        </form>

        {/* bezpieczeństwo */}
        <TwoFactorCard enabled={user.twoFactorEnabled} />

        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-card sm:p-7">
          <div className="flex items-center gap-3">
            <p className="font-display text-lg font-semibold text-ink">Bezpieczeństwo</p>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-md bg-paper px-4 py-3.5">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-ink">Adres e-mail</p>
              </div>
              <p className="text-sm text-ink-soft">{user.email}</p>
            </div>
          </div>
        </div>

        {/* wylogowanie */}
        <button
          onClick={() => logout(router)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-6 py-4 text-sm font-semibold text-red-600 shadow-card transition-colors hover:bg-red-50"
        >
          Wyloguj się z konta
        </button>
      </div>
    </PanelShell>
  );
}
