"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { apiPost } from "@/lib/api";

function ResetHaslaForm() {
  const params = useSearchParams();
  const token = params.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost("/auth/forgot-password", { email });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError("Hasła nie są identyczne");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-600">
        <span className="h-px w-8 bg-accent-500" />
        {token ? "Nowe hasło" : "Reset hasła"}
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {token ? "Ustaw nowe hasło" : "Nie pamiętasz hasła?"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        {token
          ? "Wpisz nowe hasło do swojego konta. Po zmianie wszystkie sesje zostaną wylogowane."
          : "Podaj adres e-mail powiązany z kontem — wyślemy link do ustawienia nowego hasła."}
      </p>

      {done ? (
        <div className="mt-8 rounded-lg border border-green-600/20 bg-green-50 p-5">
          <p className="text-sm font-semibold text-green-800">
            {token ? "Hasło zostało zmienione" : "Sprawdź skrzynkę e-mail"}
          </p>
          <p className="mt-1 text-sm text-green-700">
            {token
              ? "Możesz się teraz zalogować nowym hasłem."
              : "Jeśli konto z tym adresem istnieje, wysłaliśmy link do resetu hasła (ważny 60 minut)."}
          </p>
          <Link
            href="/logowanie"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-brand-gradient px-6 py-3 text-sm font-semibold text-paper transition-all hover:brightness-110"
          >
            Przejdź do logowania
          </Link>
        </div>
      ) : token ? (
        <form onSubmit={handleReset} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink">Nowe hasło</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            />
            <p className="mt-1 text-xs text-ink-mute">Minimum 8 znaków</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Powtórz nowe hasło</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-paper transition-all duration-300 hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Zapisywanie..." : "Ustaw nowe hasło"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRequest} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink">Adres e-mail</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-paper transition-all duration-300 hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Wysyłanie..." : "Wyślij link do resetu"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link href="/logowanie" className="font-medium text-accent-600 underline-offset-4 hover:underline">
          ← Wróć do logowania
        </Link>
      </p>
    </div>
  );
}

export default function ResetHaslaPage() {
  return (
    <main className="relative flex min-h-screen flex-col bg-paper">
      <div className="absolute inset-0 bg-dots opacity-30 mask-fade-b" />
      <div className="relative flex items-center justify-between px-6 py-5">
        <Link href="/" aria-label="mLegitymacja24 — strona główna">
          <Logo />
        </Link>
        <Link href="/" className="text-[13px] font-medium text-ink-mute transition-colors hover:text-ink">
          ← Wróć na stronę główną
        </Link>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-6 pb-16">
        <Suspense>
          <ResetHaslaForm />
        </Suspense>
      </div>
    </main>
  );
}
