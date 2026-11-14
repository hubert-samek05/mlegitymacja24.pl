"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { apiPost } from "@/lib/api";

type TwoFactorMethod = "TOTP" | "EMAIL" | null;
type Mode = "idle" | "setup-totp" | "setup-email" | "disable";

interface TwoFactorCardProps {
  enabled: boolean;
  method?: TwoFactorMethod;
  onChanged?: (enabled: boolean) => void;
}

const inputCls =
  "mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

const codeInputCls = `${inputCls} text-center font-mono text-lg tracking-[0.4em]`;

export function TwoFactorCard({
  enabled: initialEnabled,
  method = null,
  onChanged,
}: TwoFactorCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [currentMethod, setCurrentMethod] = useState<TwoFactorMethod>(method);
  const [mode, setMode] = useState<Mode>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function reset() {
    setMode("idle");
    setQrDataUrl(null);
    setSecret(null);
    setCode("");
    setPassword("");
    setError(null);
    setInfo(null);
  }

  function handleError(err: unknown, fallback: string) {
    setError(err instanceof Error ? err.message : fallback);
  }

  async function startTotpSetup() {
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
      setMode("setup-totp");
    } catch (err) {
      handleError(err, "Nie udało się rozpocząć konfiguracji");
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailCode(nextMode: Mode) {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await apiPost("/auth/2fa/email/send", {}, true);
      setInfo("Kod weryfikacyjny został wysłany na Twój adres e-mail.");
      setMode(nextMode);
    } catch (err) {
      handleError(err, "Nie udało się wysłać kodu");
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
      const newMethod: TwoFactorMethod = mode === "setup-email" ? "EMAIL" : "TOTP";
      setEnabled(true);
      setCurrentMethod(newMethod);
      onChanged?.(true);
      reset();
    } catch (err) {
      handleError(err, "Nie udało się włączyć 2FA");
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
      setCurrentMethod(null);
      onChanged?.(false);
      reset();
    } catch (err) {
      handleError(err, "Nie udało się wyłączyć 2FA");
    } finally {
      setBusy(false);
    }
  }

  const methodLabel =
    currentMethod === "EMAIL" ? "kod na e-mail" : "aplikacja uwierzytelniająca";

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-card sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">
            Weryfikacja dwuetapowa (2FA)
          </p>
          <p className="mt-0.5 text-xs text-ink-mute">
            Dodatkowy kod przy każdym logowaniu
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
      {info && !error && (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {info}
        </p>
      )}

      {mode === "idle" && !enabled && (
        <div className="mt-5">
          <p className="text-sm leading-relaxed text-ink-soft">
            Wybierz sposób weryfikacji przy logowaniu:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={startTotpSetup}
              disabled={busy}
              className="rounded-md border border-ink/15 p-4 text-left transition-colors hover:border-brand-500 hover:bg-brand-50/40 disabled:opacity-60"
            >
              <p className="text-sm font-semibold text-ink">
                Aplikacja uwierzytelniająca
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-mute">
                Kody generowane offline (Google / Microsoft Authenticator, Authy).
                Najbezpieczniejsza opcja.
              </p>
            </button>
            <button
              onClick={() => sendEmailCode("setup-email")}
              disabled={busy}
              className="rounded-md border border-ink/15 p-4 text-left transition-colors hover:border-brand-500 hover:bg-brand-50/40 disabled:opacity-60"
            >
              <p className="text-sm font-semibold text-ink">Kod na e-mail</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-mute">
                Jednorazowy kod wysyłany na Twój adres e-mail przy każdym logowaniu.
              </p>
            </button>
          </div>
        </div>
      )}

      {mode === "idle" && enabled && (
        <div className="mt-5">
          <p className="text-sm leading-relaxed text-ink-soft">
            Twoje konto jest chronione metodą: <strong>{methodLabel}</strong>.
          </p>
          <button
            onClick={() =>
              currentMethod === "EMAIL"
                ? sendEmailCode("disable")
                : setMode("disable")
            }
            disabled={busy}
            className="mt-4 rounded-md border border-red-200 px-6 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            Wyłącz weryfikację dwuetapową
          </button>
        </div>
      )}

      {mode === "setup-totp" && (
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
              className={codeInputCls}
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

      {mode === "setup-email" && (
        <form onSubmit={confirmEnable} className="mt-5 space-y-4">
          <p className="text-sm leading-relaxed text-ink-soft">
            Wpisz 6-cyfrowy kod wysłany na Twój adres e-mail, aby aktywować
            weryfikację dwuetapową kodem e-mail.
          </p>
          <div>
            <label className="block text-sm font-medium text-ink">
              Kod z e-maila
            </label>
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={codeInputCls}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="rounded-md bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-paper transition-all hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "Weryfikacja..." : "Aktywuj 2FA"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => sendEmailCode("setup-email")}
              className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-60"
            >
              Wyślij kod ponownie
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
            Aby wyłączyć weryfikację dwuetapową, potwierdź hasłem
            {currentMethod === "EMAIL"
              ? " i kodem wysłanym na Twój e-mail."
              : " i aktualnym kodem z aplikacji."}
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
              {currentMethod === "EMAIL" ? "Kod z e-maila" : "Kod z aplikacji"}
            </label>
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={codeInputCls}
            />
            {currentMethod === "EMAIL" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => sendEmailCode("disable")}
                className="mt-2 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-60"
              >
                Wyślij kod ponownie
              </button>
            )}
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
