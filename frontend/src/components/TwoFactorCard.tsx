"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { apiPost } from "@/lib/api";

interface TwoFactorCardProps {
  enabled: boolean;
  onChanged?: (enabled: boolean) => void;
}

const inputCls =
  "mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export function TwoFactorCard({ enabled: initialEnabled, onChanged }: TwoFactorCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [mode, setMode] = useState<"idle" | "setup" | "disable">("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setMode("idle");
    setQrDataUrl(null);
    setSecret(null);
    setCode("");
    setPassword("");
    setError(null);
  }

  async function startSetup() {
    setError(null);
    setBusy(true);
    try {
      const data = await apiPost<{ secret: string; otpauthUrl: string }>(
        "/auth/2fa/setup",
        {},
        true
      );
      setSecret(data.secret);
      setQrDataUrl(
        await QRCode.toDataURL(data.otpauthUrl, { margin: 1, width: 220 })
      );
      setMode("setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się rozpocząć konfiguracji");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiPost("/auth/2fa/enable", { code }, true);
      setEnabled(true);
      onChanged?.(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się włączyć 2FA");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiPost("/auth/2fa/disable", { password, code }, true);
      setEnabled(false);
      onChanged?.(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wyłączyć 2FA");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-card sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">
            Weryfikacja dwuetapowa (2FA)
          </p>
          <p className="mt-0.5 text-xs text-ink-mute">
            Dodatkowy kod z aplikacji uwierzytelniającej przy logowaniu
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
            enabled
              ? "bg-emerald-50 text-emerald-600"
              : "bg-ink/[0.06] text-ink-mute"
          }`}
        >
          {enabled ? "Włączona" : "Wyłączona"}
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {mode === "idle" && !enabled && (
        <div className="mt-5">
          <p className="text-sm leading-relaxed text-ink-soft">
            Po włączeniu, przy każdym logowaniu będzie wymagany 6-cyfrowy kod z
            aplikacji uwierzytelniającej (np. Google Authenticator, Microsoft
            Authenticator).
          </p>
          <button
            onClick={startSetup}
            disabled={busy}
            className="mt-4 rounded-md bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-paper transition-all hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Przygotowywanie..." : "Włącz weryfikację dwuetapową"}
          </button>
        </div>
      )}

      {mode === "idle" && enabled && (
        <div className="mt-5">
          <p className="text-sm leading-relaxed text-ink-soft">
            Twoje konto jest chronione kodem z aplikacji uwierzytelniającej.
          </p>
          <button
            onClick={() => setMode("disable")}
            className="mt-4 rounded-md border border-red-200 px-6 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Wyłącz weryfikację dwuetapową
          </button>
        </div>
      )}

      {mode === "setup" && (
        <form onSubmit={confirmEnable} className="mt-5 space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
            <li>
              Zainstaluj aplikację uwierzytelniającą (Google Authenticator,
              Microsoft Authenticator, Authy).
            </li>
            <li>Zeskanuj kod QR albo wpisz klucz ręcznie.</li>
            <li>Wpisz 6-cyfrowy kod z aplikacji, aby potwierdzić.</li>
          </ol>

          <div className="flex flex-col items-center gap-3 rounded-md border border-ink/10 bg-paper p-5">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Kod QR konfiguracji 2FA" className="h-44 w-44" />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center text-xs text-ink-mute">
                Generowanie...
              </div>
            )}
            {secret && (
              <p className="break-all text-center font-mono text-xs tracking-widest text-ink-soft">
                {secret.match(/.{1,4}/g)?.join(" ")}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Kod z aplikacji
            </label>
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={`${inputCls} text-center font-mono text-lg tracking-[0.4em]`}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="rounded-md bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-paper transition-all hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "Weryfikacja..." : "Aktywuj 2FA"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-ink/15 px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              Anuluj
            </button>
          </div>
        </form>
      )}

      {mode === "disable" && (
        <form onSubmit={confirmDisable} className="mt-5 space-y-4">
          <p className="text-sm leading-relaxed text-ink-soft">
            Aby wyłączyć weryfikację dwuetapową, potwierdź hasłem i aktualnym
            kodem z aplikacji.
          </p>
          <div>
            <label className="block text-sm font-medium text-ink">Hasło</label>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Kod z aplikacji
            </label>
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={`${inputCls} text-center font-mono text-lg tracking-[0.4em]`}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy || !password || code.length !== 6}
              className="rounded-md border border-red-300 bg-red-50 px-6 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
            >
              {busy ? "Wyłączanie..." : "Wyłącz 2FA"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-ink/15 px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              Anuluj
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
