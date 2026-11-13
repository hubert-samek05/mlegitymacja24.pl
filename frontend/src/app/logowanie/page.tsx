"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { apiPost, saveTokens } from "@/lib/api";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "COMPANY_STAFF" | "HOLDER";
  };
}

const roleRedirects: Record<LoginResponse["user"]["role"], string> = {
  SUPER_ADMIN: "/panel/super-admin",
  COMPANY_ADMIN: "/panel/firma",
  COMPANY_STAFF: "/panel/firma",
  HOLDER: "/panel/absolwent",
};

const highlights = [
  {
    title: "Cyfrowy portfel",
    description: "Wszystkie legitymacje zawsze pod ręką",
  },
  {
    title: "Dynamiczny kod QR",
    description: "Odświeżany co 45 sekund, odporny na kopiowanie",
  },
  {
    title: "Natychmiastowa weryfikacja",
    description: "Status dokumentu widoczny w 3 sekundy",
  },
];

export default function LogowaniePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
    setInApp(
      Boolean(w.Capacitor?.isNativePlatform?.()) ||
        navigator.userAgent.includes("mLegitymacja24App")
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<LoginResponse>("/auth/login", { email, password });
      saveTokens(data.accessToken, data.refreshToken);
      router.push(roleRedirects[data.user.role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* ===== panel brandowy (desktop) ===== */}
      <div className="relative hidden overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <Image
          src="/images/heroes/hero-glowna.jpg"
          alt="Osoba z legitymacją w telefonie"
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/75 to-brand-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/50 to-transparent" />

        <Link href="/" className="relative" aria-label="mLegitymacja24 — strona główna">
          <Logo light />
        </Link>

        <div className="relative">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-200">
            <span className="h-px w-8 bg-brand-300" />
            Witaj ponownie
          </p>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.15] tracking-tight text-white xl:text-5xl">
            Twoje legitymacje czekają w portfelu
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-brand-100/85">
            Zaloguj się, aby zarządzać legitymacjami swojej organizacji lub
            okazać dokument weryfikującemu.
          </p>

          <div className="mt-10 space-y-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-[13px] text-brand-100/75">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-200/70">
          © {new Date().getFullYear()} mLegitymacja24 — cyfrowe legitymacje zawodowe
        </p>
      </div>

      {/* ===== formularz ===== */}
      <div className="relative flex flex-col bg-paper">
        <div className="absolute inset-0 bg-dots opacity-30 mask-fade-b" />

        <div className="relative flex items-center justify-between px-6 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] lg:justify-end">
          <Link href="/" className="lg:hidden" aria-label="mLegitymacja24 — strona główna">
            <Logo />
          </Link>
          {!inApp && (
            <Link
              href="/"
              className="text-[13px] font-medium text-ink-mute transition-colors hover:text-ink"
            >
              ← Wróć na stronę główną
            </Link>
          )}
        </div>

        <div className="relative flex flex-1 items-center justify-center px-6 pb-16 pt-6 sm:pt-10">
          <div className="w-full max-w-md">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-600">
              <span className="h-px w-8 bg-accent-500" />
              Logowanie
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Zaloguj się
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Dostęp dla firm szkoleniowych oraz absolwentów posiadających konto.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink">
                  Adres e-mail
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base shadow-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-ink">
                    Hasło
                  </label>
                  <Link
                    href="/reset-hasla"
                    className="text-[13px] font-medium text-accent-600 underline-offset-4 hover:underline"
                  >
                    Nie pamiętasz hasła?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base shadow-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-paper transition-all duration-300 hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Logowanie..." : "Zaloguj się"}
              </button>
            </form>

            <div className="mt-8 rounded-lg border border-ink/10 bg-white p-5 text-center shadow-card">
              <p className="text-sm text-ink-soft">
                Nie masz jeszcze konta firmowego?{" "}
                <Link
                  href="/rejestracja-firmy"
                  className="font-semibold text-accent-600 underline-offset-4 hover:underline"
                >
                  Zarejestruj firmę
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
