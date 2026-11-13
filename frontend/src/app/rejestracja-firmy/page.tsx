"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { apiGet, apiPost } from "@/lib/api";

const initialState = {
  companyName: "",
  nip: "",
  regon: "",
  address: "",
  postalCode: "",
  city: "",
  contactEmail: "",
  contactPhone: "",
  adminFirstName: "",
  adminLastName: "",
  adminEmail: "",
  adminPassword: "",
};

const highlights = [
  {
    title: "Wystawianie w minutę",
    description: "Legitymacja gotowa w kilkanaście sekund",
  },
  {
    title: "Zarządzanie zespołem",
    description: "Konta pracowników z ograniczonymi uprawnieniami",
  },
  {
    title: "Pełna kontrola",
    description: "Historia weryfikacji i natychmiastowe unieważnienie",
  },
];

export default function RejestracjaFirmyPage() {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [nipState, setNipState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [nipMsg, setNipMsg] = useState<string | null>(null);

  function update(field: keyof typeof initialState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function lookupNip(value: string) {
    const nip = value.replace(/\D/g, "");
    if (nip.length !== 10) {
      setNipState("idle");
      setNipMsg(null);
      return;
    }
    setNipState("loading");
    setNipMsg("Pobieram dane z Białej Listy VAT...");
    try {
      const d = await apiGet<{
        name: string; regon: string; address: string; postalCode: string; city: string; vatStatus: string;
      }>(`/companies/nip-lookup?nip=${nip}`, false);
      setForm((prev) => ({
        ...prev,
        nip,
        companyName: prev.companyName || d.name,
        regon: d.regon,
        address: d.address,
        postalCode: d.postalCode,
        city: d.city,
      }));
      setNipState("ok");
      setNipMsg(
        d.vatStatus === "Czynny"
          ? "Dane pobrane z Białej Listy VAT — podmiot czynny"
          : `Dane pobrane z Białej Listy VAT (${d.vatStatus || "status nieznany"})`
      );
    } catch (err) {
      setNipState("error");
      setNipMsg(err instanceof Error ? err.message : "Nie udało się pobrać danych — uzupełnij ręcznie");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost("/companies/register", form);
      setSuccess(true);
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
          src="/images/heroes/hero-firmy.jpg"
          alt="Zespół firmy szkoleniowej przy biurku"
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
            Dołącz do platformy
          </p>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.15] tracking-tight text-white xl:text-5xl">
            Zdigitalizuj legitymacje swojej organizacji
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-brand-100/85">
            Po weryfikacji danych rejestrowych otrzymasz dostęp do panelu
            wystawiania legitymacji — dla każdej branży szkoleniowej.
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

        <div className="relative flex items-center justify-between px-6 py-5 lg:justify-end">
          <Link href="/" className="lg:hidden" aria-label="mLegitymacja24 — strona główna">
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-[13px] font-medium text-ink-mute transition-colors hover:text-ink"
          >
            ← Wróć na stronę główną
          </Link>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-6 pb-16 pt-6 sm:pt-10">
          {success ? (
            <div className="w-full max-w-md text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </span>
              <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink">
                Zgłoszenie zostało przyjęte
              </h1>
              <p className="mt-4 leading-relaxed text-ink-soft">
                Dziękujemy za rejestrację firmy szkoleniowej. Twoje zgłoszenie
                oczekuje na weryfikację przez administratora platformy. O decyzji
                poinformujemy na podany adres e-mail.
              </p>
              <Link
                href="/"
                className="group mt-8 inline-flex items-center gap-2 rounded-md bg-brand-gradient px-7 py-3.5 text-sm font-semibold text-paper transition-all duration-300 hover:brightness-110"
              >
                Wróć na stronę główną
              </Link>
            </div>
          ) : (
            <div className="w-full max-w-lg">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-600">
                <span className="h-px w-8 bg-accent-500" />
                Rejestracja
              </p>
              <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Zarejestruj firmę szkoleniową
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                Po weryfikacji danych rejestrowych otrzymasz dostęp do panelu
                wystawiania legitymacji.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <fieldset className="space-y-4 rounded-lg border border-ink/10 bg-white p-6 shadow-card sm:p-7">
                  <legend className="sr-only">Dane firmy</legend>
                  <p className="font-display text-lg font-semibold text-ink">Dane firmy</p>
                  <div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="NIP"
                        value={form.nip}
                        onChange={(v) => { update("nip", v); }}
                        onBlur={(v) => lookupNip(v)}
                        required
                      />
                      <Field label="REGON" value={form.regon} onChange={(v) => update("regon", v)} />
                    </div>
                    {nipMsg && (
                      <p
                        className={`mt-2 text-[13px] ${
                          nipState === "ok"
                            ? "text-emerald-700"
                            : nipState === "error"
                              ? "text-red-600"
                              : "text-ink-mute"
                        }`}
                      >
                        {nipMsg}
                      </p>
                    )}
                    {!nipMsg && (
                      <p className="mt-2 text-[13px] text-ink-mute">
                        Wpisz NIP — dane firmy uzupełnimy automatycznie z Białej Listy VAT.
                      </p>
                    )}
                  </div>
                  <Field label="Nazwa firmy" value={form.companyName} onChange={(v) => update("companyName", v)} required />
                  <Field label="Adres (ulica, numer)" value={form.address} onChange={(v) => update("address", v)} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Kod pocztowy" value={form.postalCode} onChange={(v) => update("postalCode", v)} />
                    <Field label="Miasto" value={form.city} onChange={(v) => update("city", v)} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Telefon kontaktowy" value={form.contactPhone} onChange={(v) => update("contactPhone", v)} />
                    <div />
                  </div>
                  <Field label="E-mail kontaktowy firmy" type="email" value={form.contactEmail} onChange={(v) => update("contactEmail", v)} required />
                </fieldset>

                <fieldset className="space-y-4 rounded-lg border border-ink/10 bg-white p-6 shadow-card sm:p-7">
                  <legend className="sr-only">Konto administratora firmy</legend>
                  <p className="font-display text-lg font-semibold text-ink">Konto administratora</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Imię" value={form.adminFirstName} onChange={(v) => update("adminFirstName", v)} required />
                    <Field label="Nazwisko" value={form.adminLastName} onChange={(v) => update("adminLastName", v)} required />
                  </div>
                  <Field label="E-mail administratora" type="email" value={form.adminEmail} onChange={(v) => update("adminEmail", v)} required />
                  <Field label="Hasło" type="password" value={form.adminPassword} onChange={(v) => update("adminPassword", v)} required />
                </fieldset>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-paper transition-all duration-300 hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? "Wysyłanie..." : "Zarejestruj firmę"}
                </button>

                <p className="text-center text-sm text-ink-soft">
                  Masz już konto?{" "}
                  <Link href="/logowanie" className="font-semibold text-accent-600 underline-offset-4 hover:underline">
                    Zaloguj się
                  </Link>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
        className="mt-1.5 w-full rounded-md border border-ink/15 bg-paper px-4 py-3 text-sm transition-colors focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/20"
      />
    </div>
  );
}
