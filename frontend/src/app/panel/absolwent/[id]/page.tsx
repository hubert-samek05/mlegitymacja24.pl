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

function mrz(input: string): string {
  const clean = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .toUpperCase()
    .replace(/[^A-Z0-9<]/g, "<");
  return (clean + "<".repeat(38)).slice(0, 38);
}

function Guilloche({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M-20 ${10 + i * 8} C 60 ${-14 + i * 8}, 140 ${34 + i * 8}, 220 ${
            10 + i * 8
          } S 380 ${-14 + i * 8}, 440 ${10 + i * 8}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}

function Seal({
  status,
  label,
}: {
  status: CredentialDetail["status"];
  label: string;
}) {
  const color =
    status === "ACTIVE"
      ? "#059669"
      : status === "EXPIRED"
        ? "#d97706"
        : status === "REVOKED"
          ? "#dc2626"
          : "#6b7280";
  const arc = `MLEGITYMACJA24 · ${label.toUpperCase()} · `;
  return (
    <svg
      viewBox="0 0 96 96"
      className="absolute -top-1 right-0 h-[72px] w-[72px] -rotate-12 opacity-90"
      aria-hidden
    >
      <defs>
        <path
          id="sealArcTop"
          d="M48,48 m-34,0 a34,34 0 1,1 68,0 a34,34 0 1,1 -68,0"
        />
      </defs>
      <circle cx="48" cy="48" r="44" fill="none" stroke={color} strokeWidth="1.6" />
      <circle
        cx="48"
        cy="48"
        r="26"
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <text
        fill={color}
        fontSize="9"
        fontWeight="700"
        letterSpacing="1.6"
        fontFamily="inherit"
      >
        <textPath href="#sealArcTop" startOffset="0">
          {arc + arc}
        </textPath>
      </text>
      {status === "ACTIVE" ? (
        <path
          d="M36 49 l8 8 l16 -17"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M38 38 l20 20 M58 38 l-20 20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
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
      <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-ink-mute">
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
    <div className="relative -mt-[env(safe-area-inset-top)] flex min-h-screen flex-col overflow-hidden bg-paper pt-[env(safe-area-inset-top)] text-ink">
      <div className="absolute inset-0 bg-grid-light opacity-60" />
      <div className="absolute -top-32 left-1/2 h-80 w-[560px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />

      {/* ===== nagłówek ===== */}
      <header className="relative flex items-center justify-between px-5 py-4 sm:px-8">
        <button
          onClick={() => router.push("/panel/absolwent")}
          className="flex items-center gap-2 rounded-md border border-ink/15 bg-white px-4 py-2 text-xs font-semibold text-ink shadow-sm transition-colors hover:bg-paper"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Portfel
        </button>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-mute">
          Podgląd dokumentu
        </p>
      </header>

      {/* ===== dokument ===== */}
      <main className="relative flex flex-1 items-start justify-center px-5 pb-14 pt-2 sm:items-center">
        {error && !credential ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </p>
        ) : credential && status ? (
          <div className="w-full max-w-[24rem] sm:max-w-[26rem]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl bg-white text-ink shadow-2xl shadow-black/50 ring-1 ring-black/10"
            >
              {/* pasek urzędowy */}
              <div className="relative overflow-hidden bg-brand-950 px-5 py-4 text-paper">
                <Guilloche className="absolute inset-0 h-full w-full text-brand-300/25" />
                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo-white.png"
                      alt="mLegitymacja24"
                      className="h-6 w-auto"
                    />
                    <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.28em] text-brand-300">
                      Dokument cyfrowy
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[13px] font-semibold uppercase tracking-[0.14em]">
                      Legitymacja zawodowa
                    </p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-brand-300">
                      {credential.credentialType.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* korpus dokumentu */}
              <div className="relative">
                {/* znak wodny */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-v2.png"
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 w-[85%] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.05]"
                />
                <Guilloche className="pointer-events-none absolute inset-x-0 top-0 h-10 w-full text-brand-900/[0.06]" />

                <div className="relative px-5 py-5">
                  <div className="flex gap-4">
                    {/* zdjęcie */}
                    <div className="h-[108px] w-[84px] shrink-0 overflow-hidden rounded-md border border-ink/15 bg-paper shadow-sm">
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

                    {/* dane */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-mute">
                        Imię i nazwisko
                      </p>
                      <h2 className="mt-0.5 break-words font-display text-[19px] font-semibold leading-tight tracking-tight">
                        {holderName}
                      </h2>
                      <dl className="mt-3 space-y-1.5 text-[12px]">
                        {credential.holder.dateOfBirth && (
                          <div className="flex justify-between gap-3 border-b border-ink/[0.07] pb-1.5">
                            <dt className="text-ink-mute">Data urodzenia</dt>
                            <dd className="font-medium">
                              {new Date(credential.holder.dateOfBirth).toLocaleDateString("pl-PL")}
                            </dd>
                          </div>
                        )}
                        {credential.holder.placeOfBirth && (
                          <div className="flex justify-between gap-3 border-b border-ink/[0.07] pb-1.5">
                            <dt className="text-ink-mute">Miejsce ur.</dt>
                            <dd className="break-words text-right font-medium">
                              {credential.holder.placeOfBirth}
                            </dd>
                          </div>
                        )}
                        <div className="flex justify-between gap-3 border-b border-ink/[0.07] pb-1.5">
                          <dt className="text-ink-mute">Uprawnienie</dt>
                          <dd className="break-words text-right font-medium">
                            {credential.credentialType.name}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 border-b border-ink/[0.07] pb-1.5">
                          <dt className="text-ink-mute">Wystawiona</dt>
                          <dd className="font-medium">
                            {new Date(credential.issueDate).toLocaleDateString("pl-PL")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-mute">Ważna do</dt>
                          <dd className="font-medium">
                            {credential.expiryDate
                              ? new Date(credential.expiryDate).toLocaleDateString("pl-PL")
                              : "Bezterminowo"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* wystawca + pieczęć + QR */}
                  <div className="relative mt-5 flex items-end gap-4 border-t border-ink/[0.09] pt-4">
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-ink/10 bg-white">
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
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
                          Wystawca
                        </p>
                        <p className="mt-0.5 break-words text-[12px] font-medium leading-snug">
                          {credential.company.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-ink-mute">
                          NIP {credential.company.nip}
                        </p>
                      </div>
                    </div>

                    {credential.status === "ACTIVE" ? (
                      <button
                        onClick={() => qrDataUrl && setQrOpen(true)}
                        className="group relative shrink-0 rounded-md border border-ink/15 bg-white p-1.5 transition-colors hover:border-ink/30"
                        aria-label="Powiększ kod QR"
                      >
                        {qrDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={qrDataUrl}
                            alt="Kod weryfikacyjny"
                            className="h-[76px] w-[76px]"
                          />
                        ) : (
                          <div className="flex h-[76px] w-[76px] items-center justify-center text-[9px] text-ink-mute">
                            QR...
                          </div>
                        )}
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-ink/10 bg-white text-ink-mute shadow-sm transition-colors group-hover:text-ink">
                          <Expand className="h-2.5 w-2.5" />
                        </span>
                      </button>
                    ) : null}

                    {/* pieczęć statusu */}
                    <Seal status={credential.status} label={status.label} />
                  </div>
                </div>
              </div>

              {/* strefa odczytu maszynowego */}
              <div className="border-t border-ink/10 bg-[#eef1f6] px-5 py-3">
                <p className="truncate font-mono text-[11px] tracking-[0.14em] text-ink-soft">
                  {mrz(`ML24<${holderName.replace(" ", "<<")}`)}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] tracking-[0.14em] text-ink-soft">
                  {mrz(
                    `${credential.companyNumber ?? credential.credentialNumber}<${
                      (credential.securityCode ?? "").replace(/-/g, "")
                    }`
                  )}
                </p>
              </div>
            </motion.div>

            {/* pasek odświeżania QR pod dokumentem */}
            {credential.status === "ACTIVE" && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <div className="h-px w-24 bg-ink/10">
                  <div
                    className="h-px bg-accent-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-ink-mute">
                  Kod odświeżany co {TOKEN_TTL_SECONDS} s · dotknij QR, aby powiększyć
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-mute">Ładowanie legitymacji...</p>
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
