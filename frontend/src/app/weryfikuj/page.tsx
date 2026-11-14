"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatSecurityCode } from "@/lib/credential";
import { AlertTriangle, Camera, Eye, EyeOff, KeyRound, ScanLine, ShieldCheck, ShieldX, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { apiPost, API_URL } from "@/lib/api";

const API_HOST = API_URL.replace(/\/api$/, "");

function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_HOST}${url}`;
}

interface VerifyResponse {
  result: "VALID" | "EXPIRED" | "REVOKED" | "SUSPENDED" | "NOT_FOUND";
  verifiedAt?: string;
  credential?: {
    holderName: string;
    dateOfBirth: string | null;
    placeOfBirth: string | null;
    credentialType: string;
    credentialCategory: string | null;
    credentialNumber: string;
    companyNumber: string | null;
    securityCode: string | null;
    companyName: string;
    companyLogoUrl: string | null;
    companyNip: string | null;
    companyRegon: string | null;
    companyAddress: string | null;
    companyCity: string | null;
    companyPostalCode: string | null;
    issueDate: string;
    expiryDate: string | null;
    photoUrl: string | null;
    additionalData: Record<string, unknown>;
  };
}

const resultLabels: Record<VerifyResponse["result"], string> = {
  VALID: "Legitymacja ważna",
  EXPIRED: "Legitymacja wygasła",
  REVOKED: "Legitymacja unieważniona",
  SUSPENDED: "Legitymacja zawieszona",
  NOT_FOUND: "Nie znaleziono legitymacji lub kod jest nieprawidłowy",
};

const resultHints: Record<VerifyResponse["result"], string | null> = {
  VALID: null,
  EXPIRED: "Dokument jest autentyczny, ale minął jego termin ważności.",
  REVOKED: "Dokument został unieważniony przez wystawcę — nie uprawnia do wykonywania zawodu.",
  SUSPENDED: "Dokument jest autentyczny, ale został tymczasowo zawieszony przez wystawcę.",
  NOT_FOUND: "Sprawdź poprawność kodu lub poproś posiadacza o odświeżenie kodu QR na legitymacji.",
};

const statusTones = {
  ok: {
    banner: "bg-emerald-600",
    icon: "bg-emerald-500/20 text-emerald-100",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  warn: {
    banner: "bg-amber-500",
    icon: "bg-amber-400/20 text-amber-50",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
  bad: {
    banner: "bg-red-600",
    icon: "bg-red-500/20 text-red-100",
    dot: "bg-red-500",
    text: "text-red-700",
  },
};

function resultTone(result: VerifyResponse["result"]) {
  if (result === "VALID") return statusTones.ok;
  if (result === "EXPIRED" || result === "SUSPENDED") return statusTones.warn;
  return statusTones.bad;
}

function WeryfikujContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"code" | "token">("code");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoVerified = useRef(false);

  async function verify(endpoint: string, payload: object) {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const data = await apiPost<VerifyResponse>(endpoint, payload);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  // Otwarcie bezpośrednio z kodu QR - token w adresie, weryfikacja automatyczna
  useEffect(() => {
    const t = searchParams.get("t");
    if (t && !autoVerified.current) {
      autoVerified.current = true;
      setMode("token");
      setToken(t);
      verify("/verify/token", { token: t });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "code") {
      verify("/verify/code", { code });
    } else {
      verify("/verify/token", { token });
    }
  }

  // Rozpoznanie zeskanowanej treści: link weryfikacyjny, identyfikator lub surowy token
  function parseScanned(text: string): { endpoint: string; payload: Record<string, string>; mode: "code" | "token"; value: string } {
    try {
      const t = new URL(text.trim()).searchParams.get("t");
      if (t) return { endpoint: "/verify/token", payload: { token: t }, mode: "token", value: t };
    } catch { /* nie jest adresem URL */ }
    const cleaned = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (/^[A-Z0-9]{16}$/.test(cleaned)) {
      return { endpoint: "/verify/code", payload: { code: cleaned }, mode: "code", value: cleaned };
    }
    return { endpoint: "/verify/token", payload: { token: text.trim() }, mode: "token", value: text.trim() };
  }

  function handleScan(text: string) {
    setScanOpen(false);
    const parsed = parseScanned(text);
    setMode(parsed.mode);
    if (parsed.mode === "code") setCode(parsed.value);
    else setToken(parsed.value);
    verify(parsed.endpoint, parsed.payload);
  }

  useEffect(() => {
    if (!scanOpen || !videoRef.current) return;
    let cancelled = false;
    let scanner: import("qr-scanner").default | null = null;
    setScanError(null);

    (async () => {
      try {
        const { default: QrScanner } = await import("qr-scanner");
        if (cancelled || !videoRef.current) return;
        if (!(await QrScanner.hasCamera())) {
          setScanError("Nie wykryto kamery w tym urządzeniu.");
          return;
        }
        scanner = new QrScanner(
          videoRef.current,
          (res) => handleScan(res.data),
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: "environment",
          }
        );
        await scanner.start();
      } catch {
        if (!cancelled) setScanError("Brak dostępu do kamery. Zezwól na dostęp w ustawieniach przeglądarki.");
      }
    })();

    return () => {
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanOpen]);

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-30 mask-fade-b" />
      <div className="relative mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-20">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-600">
          <span className="h-px w-8 bg-accent-500" />
          Weryfikacja
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Zweryfikuj legitymację
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Zeskanuj kod QR na legitymacji — wynik pojawi się automatycznie.
          Możesz też wpisać 16-znakowy identyfikator mLegitymacji. Weryfikacja
          nie wymaga konta.
        </p>

        <button
          type="button"
          onClick={() => setScanOpen(true)}
          className="mt-8 flex w-full items-center gap-4 rounded-lg border border-brand-600/25 bg-white px-5 py-4 text-left shadow-card transition-colors hover:border-brand-600/50"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-gradient text-paper">
            <Camera className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Skanuj kod QR kamerą</span>
            <span className="mt-0.5 block text-xs text-ink-mute">
              Skieruj aparat na kod — wynik pojawi się automatycznie
            </span>
          </span>
        </button>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg border border-ink/10 bg-paper p-1">
          <button
            type="button"
            onClick={() => { setMode("code"); setResult(null); setError(null); }}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              mode === "code" ? "bg-brand-gradient text-paper" : "text-ink-soft hover:text-ink"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            Identyfikator
          </button>
          <button
            type="button"
            onClick={() => { setMode("token"); setResult(null); setError(null); }}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              mode === "token" ? "bg-brand-gradient text-paper" : "text-ink-soft hover:text-ink"
            }`}
          >
            <ScanLine className="h-4 w-4" />
            Token z QR
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === "code" ? (
            <>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="np. AB3N 4TVY CBB6 28D2"
                maxLength={19}
                className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 font-mono text-sm uppercase tracking-widest shadow-sm transition-colors placeholder:text-ink-mute focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
              <p className="text-xs text-ink-mute">
                Identyfikator znajdziesz na legitymacji — 16 znaków (cyfry i litery).
              </p>
            </>
          ) : (
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token weryfikacyjny odczytany z kodu QR"
              className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-ink-mute focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-paper transition-colors duration-300 hover:brightness-110 disabled:opacity-60"
          >
            <ScanLine className="h-4 w-4" />
            {loading ? "Sprawdzanie..." : "Sprawdź legitymację"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {result && <VerificationResult result={result} />}
      </div>

      {/* Skaner QR — pełny ekran */}
      {scanOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-brand-950">
          <div className="flex items-center justify-between px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
            <p className="text-sm font-semibold text-paper">Skanowanie legitymacji</p>
            <button
              type="button"
              onClick={() => setScanOpen(false)}
              aria-label="Zamknij skaner"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-paper transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            {scanError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-950/80 px-8 text-center">
                <p className="text-sm leading-relaxed text-paper/90">{scanError}</p>
                <button
                  type="button"
                  onClick={() => setScanOpen(false)}
                  className="mt-2 rounded-md bg-white/10 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-white/20"
                >
                  Zamknij
                </button>
              </div>
            )}
          </div>
          <p className="px-6 py-5 text-center text-xs leading-relaxed text-brand-300">
            Skieruj kamerę na kod QR na legitymacji — weryfikacja rozpocznie się automatycznie.
          </p>
        </div>
      )}
    </main>
  );
}

function VerificationResult({ result }: { result: VerifyResponse }) {
  const [reveal, setReveal] = useState(false);
  const tone = resultTone(result.result);
  const c = result.credential;
  const hint = resultHints[result.result];
  const verifiedAt = result.verifiedAt ? new Date(result.verifiedAt) : new Date();
  const initials = c?.holderName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const photoSrc = resolveUrl(c?.photoUrl);
  const logoSrc = resolveUrl(c?.companyLogoUrl);
  const additional = c?.additionalData ? Object.entries(c.additionalData) : [];
  const statusLabel =
    result.result === "VALID" ? "Ważna"
    : result.result === "EXPIRED" ? "Wygasła"
    : result.result === "REVOKED" ? "Unieważniona"
    : result.result === "SUSPENDED" ? "Zawieszona"
    : null;

  return (
    <div className="mt-8">
      {/* Banner statusu */}
      <div className={`flex items-center gap-3.5 rounded-t-lg px-6 py-4 ${tone.banner}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
          {result.result === "VALID" ? (
            <ShieldCheck className="h-5 w-5" />
          ) : result.result === "NOT_FOUND" ? (
            <ShieldX className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold leading-tight text-white">
            {resultLabels[result.result]}
          </p>
          <p className="mt-0.5 text-xs text-white/80">
            Zweryfikowano w mLegitymacja24 · {verifiedAt.toLocaleDateString("pl-PL")},{" "}
            {verifiedAt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* Dokument */}
      {c ? (
        <div className="overflow-hidden rounded-b-lg border border-t-0 border-ink/10 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-ink/[0.08] px-6 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
              Legitymacja zawodowa
            </p>
            {statusLabel && (
              <span className={`flex items-center gap-1.5 text-xs font-medium ${tone.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                {statusLabel}
              </span>
            )}
          </div>

          <div className="px-6 py-6">
            {/* Tożsamość */}
            <div className="flex items-center gap-4">
              <div className="h-[104px] w-[82px] shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-paper">
                {photoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoSrc}
                    alt={`Zdjęcie — ${c.holderName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-950 font-display text-xl font-semibold text-paper">
                    {initials}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-display text-xl font-semibold leading-tight tracking-tight text-ink">
                  {c.holderName}
                </h2>
                <div className="mt-2 flex items-center gap-3">
                  <dl className="space-y-1 text-[13px]">
                    {c.dateOfBirth && (
                      <div className="flex gap-2">
                        <dt className="text-ink-mute">ur.</dt>
                        <dd className="font-medium text-ink">
                          {reveal
                            ? new Date(c.dateOfBirth).toLocaleDateString("pl-PL")
                            : "••.••.••••"}
                        </dd>
                      </div>
                    )}
                    {c.placeOfBirth && (
                      <div className="flex gap-2">
                        <dt className="text-ink-mute">miejsce ur.</dt>
                        <dd className="font-medium text-ink">
                          {reveal ? c.placeOfBirth : "••••••••"}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {(c.dateOfBirth || c.placeOfBirth) && (
                    <button
                      type="button"
                      onClick={() => setReveal((v) => !v)}
                      aria-label={reveal ? "Ukryj dane wrażliwe" : "Pokaż dane wrażliwe"}
                      title={reveal ? "Ukryj dane wrażliwe" : "Pokaż dane wrażliwe"}
                      className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink-mute transition-colors hover:border-ink/25 hover:text-ink"
                    >
                      {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Uprawnienie */}
            <div className="mt-6 border-t border-ink/[0.08] pt-5">
              <p className="break-words font-display text-lg font-semibold leading-snug text-ink">
                {c.credentialType}
              </p>
              {c.credentialCategory && (
                <p className="mt-0.5 text-xs text-ink-mute">{c.credentialCategory}</p>
              )}
              <div className="mt-2.5 flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-ink/10 bg-paper">
                  {logoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoSrc} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[10px] font-semibold text-ink-mute">
                      {c.companyName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="break-words text-[13px] font-medium text-ink">{c.companyName}</p>
                  {c.companyNip && (
                    <p className="mt-0.5 text-[11px] text-ink-mute">
                      NIP {c.companyNip}
                      {c.companyRegon ? ` · REGON ${c.companyRegon}` : ""}
                    </p>
                  )}
                  {(c.companyAddress || c.companyCity) && (
                    <p className="mt-0.5 break-words text-[11px] text-ink-mute">
                      {[c.companyAddress, [c.companyPostalCode, c.companyCity].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Numery i daty */}
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ink/[0.08] pt-5">
              <div>
                <p className="text-[11px] text-ink-mute">Nr legitymacji</p>
                <p className="mt-0.5 break-all text-xs font-medium text-ink">
                  {c.companyNumber ?? c.credentialNumber}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-ink-mute">Nr systemowy</p>
                <p className="mt-0.5 break-all text-xs font-medium text-ink">
                  {c.credentialNumber}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] text-ink-mute">Identyfikator mLegitymacji</p>
                <p className="mt-0.5 font-mono text-xs font-medium tracking-wider text-ink">
                  {formatSecurityCode(c.securityCode)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-ink-mute">Wystawiona</p>
                <p className="mt-0.5 text-xs font-medium text-ink">
                  {new Date(c.issueDate).toLocaleDateString("pl-PL")}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-ink-mute">Ważna do</p>
                <p className="mt-0.5 text-xs font-medium text-ink">
                  {c.expiryDate
                    ? new Date(c.expiryDate).toLocaleDateString("pl-PL")
                    : "Bezterminowo"}
                </p>
              </div>
            </div>

            {/* Dane dodatkowe */}
            {additional.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ink/[0.08] pt-5">
                {additional.map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[11px] capitalize text-ink-mute">{key}</p>
                    <p className="mt-0.5 break-words text-xs font-medium text-ink">
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {hint && (
              <p className={`mt-5 rounded-md border border-ink/[0.08] bg-paper px-4 py-3 text-[13px] leading-relaxed ${tone.text}`}>
                {hint}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-b-lg border border-t-0 border-ink/10 bg-white px-6 py-6 shadow-card">
          {hint && <p className="text-sm leading-relaxed text-ink-soft">{hint}</p>}
        </div>
      )}

      <p className="mt-3 text-center text-[11px] text-ink-mute">
        Dane pochodzą z rejestru mLegitymacja24 i były aktualne w chwili weryfikacji.
      </p>
    </div>
  );
}

export default function WeryfikujPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<main className="min-h-[70vh]" />}>
        <WeryfikujContent />
      </Suspense>
      <Footer />
    </>
  );
}
