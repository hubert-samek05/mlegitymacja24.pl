"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Expand, X } from "lucide-react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { apiGet, API_URL } from "@/lib/api";
import { formatSecurityCode } from "@/lib/credential";

interface CredentialDetail {
  id: string;
  credentialNumber: string;
  companyNumber: string | null;
  securityCode: string | null;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";
  issueDate: string;
  expiryDate: string | null;
  photoUrl: string | null;
  credentialType: { name: string };
  company: {
    name: string;
    logoUrl: string | null;
    nip: string;
    regon: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
  };
  holder: {
    photoUrl: string | null;
    dateOfBirth: string | null;
    placeOfBirth: string | null;
    user: { firstName: string; lastName: string; phone: string | null };
  };
}

const TOKEN_TTL_SECONDS = 45;
const API_HOST = API_URL.replace(/\/api$/, "");

const statusMeta: Record<
  CredentialDetail["status"],
  { label: string; dot: string; text: string }
> = {
  ACTIVE: { label: "Ważna", dot: "bg-emerald-500", text: "text-emerald-600" },
  EXPIRED: { label: "Wygasła", dot: "bg-amber-500", text: "text-amber-600" },
  REVOKED: { label: "Unieważniona", dot: "bg-red-500", text: "text-red-600" },
  SUSPENDED: { label: "Zawieszona", dot: "bg-ink-mute", text: "text-ink-mute" },
};

function resolvePhoto(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_HOST}${url}`;
}

export default function PrezentacjaLegitymacjiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser(["HOLDER"]);

  const [credential, setCredential] = useState<CredentialDetail | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TOKEN_TTL_SECONDS);
  const [qrOpen, setQrOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || !params.id) return;
    apiGet<CredentialDetail>(`/credentials/${params.id}`)
      .then(setCredential)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Nie znaleziono legitymacji")
      );
  }, [user, params.id]);

  async function refreshToken() {
    if (!params.id) return;
    try {
      const data = await apiGet<{ token: string; expiresInSeconds: number }>(
        `/credentials/${params.id}/qr-token`
      );
      const verifyUrl = `https://mlegitymacja24.pl/weryfikuj?t=${data.token}`;
      const dataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 480,
        color: { dark: "#071638", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      setSecondsLeft(data.expiresInSeconds);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się wygenerować kodu QR"
      );
    }
  }

  useEffect(() => {
    if (!credential || credential.status !== "ACTIVE") return;
    refreshToken();
    refreshTimer.current = setInterval(refreshToken, TOKEN_TTL_SECONDS * 1000);
    countdownTimer.current = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credential]);

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-950 text-sm text-brand-300">
        Ładowanie...
      </div>
    );
  }

  const progress = Math.max(0, Math.min(1, secondsLeft / TOKEN_TTL_SECONDS));
  const photoSrc = credential
    ? resolvePhoto(credential.photoUrl ?? credential.holder.photoUrl)
    : null;
  const holderName = credential
    ? `${credential.holder.user.firstName} ${credential.holder.user.lastName}`
    : "";
  const initials = holderName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const status = credential ? statusMeta[credential.status] : null;

  return (
    <div className="relative -mt-[env(safe-area-inset-top)] flex min-h-screen flex-col overflow-hidden bg-brand-950 pt-[env(safe-area-inset-top)] text-paper">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute -top-32 left-1/2 h-80 w-[560px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />

      {/* ===== nagłówek ===== */}
      <header className="relative flex items-center justify-between px-5 py-4 sm:px-8">
        <button
          onClick={() => router.push("/panel/absolwent")}
          className="flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-xs font-semibold text-paper transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Portfel
        </button>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-300">
          Podgląd dokumentu
        </p>
      </header>

      {/* ===== dokument ===== */}
      <main className="relative flex flex-1 items-start justify-center px-5 pb-14 pt-2 sm:items-center">
        {error && !credential ? (
          <p className="rounded-md border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-200">
            {error}
          </p>
        ) : credential && status ? (
          <div className="w-full max-w-[22rem] sm:max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-lg bg-white text-ink shadow-2xl shadow-black/40"
            >
              {/* nagłówek dokumentu */}
              <div className="flex items-center justify-between border-b border-ink/[0.08] px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
                  Legitymacja zawodowa
                </p>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${status.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              {/* treść: mobile pionowo / desktop poziomo */}
              <div className="sm:flex">
                <div className="min-w-0 flex-1 px-6 py-6">
                  {/* tożsamość */}
                  <div className="flex items-center gap-4">
                    <div className="h-[104px] w-[82px] shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-paper">
                      {photoSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoSrc}
                          alt={`Zdjęcie — ${holderName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-brand-950 font-display text-xl font-semibold text-paper">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="break-words font-display text-xl font-semibold leading-tight tracking-tight">
                        {holderName}
                      </h2>
                      <dl className="mt-2 space-y-1 text-[13px]">
                        {credential.holder.dateOfBirth && (
                          <div className="flex gap-2">
                            <dt className="text-ink-mute">ur.</dt>
                            <dd className="font-medium">
                              {new Date(credential.holder.dateOfBirth).toLocaleDateString("pl-PL")}
                            </dd>
                          </div>
                        )}
                        {credential.holder.placeOfBirth && (
                          <div className="flex gap-2">
                            <dt className="text-ink-mute">miejsce ur.</dt>
                            <dd className="font-medium">{credential.holder.placeOfBirth}</dd>
                          </div>
                        )}
                        {credential.holder.user.phone && (
                          <div className="flex gap-2">
                            <dt className="text-ink-mute">tel.</dt>
                            <dd className="break-all font-medium">
                              {credential.holder.user.phone}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>

                  {/* uprawnienie */}
                  <div className="mt-6 border-t border-ink/[0.08] pt-5">
                    <p className="break-words font-display text-lg font-semibold leading-snug">
                      {credential.credentialType.name}
                    </p>
                    <div className="mt-2.5 flex items-start gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-ink/10 bg-paper">
                        {resolvePhoto(credential.company.logoUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolvePhoto(credential.company.logoUrl)!}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] font-semibold text-ink-mute">
                            {credential.company.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="break-words text-[13px] font-medium text-ink">
                          {credential.company.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-mute">
                          NIP {credential.company.nip}
                          {credential.company.regon ? ` · REGON ${credential.company.regon}` : ""}
                        </p>
                        {(credential.company.address || credential.company.city) && (
                          <p className="mt-0.5 break-words text-[11px] text-ink-mute">
                            {[credential.company.address, [credential.company.postalCode, credential.company.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* meta */}
                  <div className="mt-5 grid grid-cols-3 gap-4 border-t border-ink/[0.08] pt-5">
                    <div className="col-span-3 sm:col-span-1">
                      <p className="text-[11px] text-ink-mute">Nr legitymacji</p>
                      <p className="mt-0.5 break-all text-xs font-medium">
                        {credential.companyNumber ?? credential.credentialNumber}
                      </p>
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <p className="text-[11px] text-ink-mute">Identyfikator mLegitymacji</p>
                      <p className="mt-0.5 font-mono text-xs font-medium tracking-wider">
                        {formatSecurityCode(credential.securityCode)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-ink-mute">Wystawiona</p>
                      <p className="mt-0.5 text-xs font-medium">
                        {new Date(credential.issueDate).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-ink-mute">Ważna do</p>
                      <p className="mt-0.5 text-xs font-medium">
                        {credential.expiryDate
                          ? new Date(credential.expiryDate).toLocaleDateString("pl-PL")
                          : "Bezterminowo"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR */}
                <div className="flex flex-col items-center justify-center border-t border-ink/[0.08] px-6 py-6 sm:w-[220px] sm:shrink-0 sm:border-l sm:border-t-0">
                  {credential.status === "ACTIVE" ? (
                    <>
                      <button
                        onClick={() => qrDataUrl && setQrOpen(true)}
                        className="group relative rounded-md border border-ink/10 p-2.5 transition-colors hover:border-ink/25"
                        aria-label="Powiększ kod QR"
                      >
                        {qrDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={qrDataUrl}
                            alt="Kod weryfikacyjny"
                            className="h-[140px] w-[140px]"
                          />
                        ) : (
                          <div className="flex h-[140px] w-[140px] items-center justify-center text-xs text-ink-mute">
                            Generowanie...
                          </div>
                        )}
                        <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-ink/10 bg-white text-ink-mute shadow-sm transition-colors group-hover:text-ink">
                          <Expand className="h-3 w-3" />
                        </span>
                      </button>
                      <p className="mt-3 text-center text-[11px] text-ink-mute">
                        Dotknij, aby powiększyć
                      </p>
                      <div className="mt-3 w-full max-w-[140px]">
                        <div className="h-px w-full bg-ink/10">
                          <div
                            className="h-px bg-accent-500 transition-all duration-1000 ease-linear"
                            style={{ width: `${progress * 100}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-center text-[10px] text-ink-mute">
                          odświeżenie za {secondsLeft} s
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center py-4 text-center">
                      <p className="mt-2 text-[13px] font-medium">
                        Dokument {status.label.toLowerCase()}
                      </p>
                      <p className="mt-1 max-w-[160px] text-[11px] leading-relaxed text-ink-mute">
                        Weryfikacja kodem QR jest obecnie niedostępna.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* stopka */}
              <div className="border-t border-ink/[0.08] px-6 py-3">
                <p className="text-center text-[10px] text-ink-mute">
                  mLegitymacja24 · Dokument cyfrowy
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          <p className="text-sm text-brand-300">Ładowanie legitymacji...</p>
        )}
      </main>

      {/* ===== QR na pełny ekran ===== */}
      <AnimatePresence>
        {qrOpen && qrDataUrl && credential && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col bg-brand-950"
          >
            <div className="absolute inset-0 bg-grid opacity-30" />
            <div className="absolute -top-32 left-1/2 h-80 w-[560px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />

            <header className="relative flex items-center justify-between px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-300">
                Weryfikacja
              </p>
              <button
                onClick={() => setQrOpen(false)}
                aria-label="Zamknij podgląd kodu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-paper transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-16">
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-lg bg-white p-5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Kod weryfikacyjny — widok pełnoekranowy"
                  className="h-[min(72vw,360px)] w-[min(72vw,360px)]"
                />
              </motion.div>

              <p className="mt-6 break-words text-center font-display text-xl font-semibold text-paper">
                {holderName}
              </p>
              <p className="mt-1 break-all text-center text-xs text-brand-300">
                Nr {credential.companyNumber ?? credential.credentialNumber}
              </p>
              <p className="mt-1 text-center font-mono text-xs tracking-wider text-brand-300">
                {formatSecurityCode(credential.securityCode)}
              </p>

              <div className="mt-6 w-full max-w-[240px]">
                <div className="h-px w-full bg-white/15">
                  <div
                    className="h-px bg-accent-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-[11px] text-brand-300">
                  Kod odświeży się za {secondsLeft} s
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
