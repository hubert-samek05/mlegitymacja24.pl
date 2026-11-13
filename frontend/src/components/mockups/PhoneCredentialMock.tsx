import { Bell, ShieldCheck, Wallet } from "lucide-react";
import { FakeQrCode } from "./FakeQrCode";

/**
 * Pionowy mock ekranu aplikacji absolwenta — tryb prezentacji legitymacji.
 * Docelowo można zastąpić prawdziwym zrzutem ekranu (PhoneFrame src).
 */
export function PhoneCredentialMock() {
  return (
    <div className="flex h-full flex-col bg-paper">
      {/* status bar */}
      <div className="flex items-center justify-between px-6 pb-1 pt-9 text-[10px] font-medium text-ink-mute">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-ink/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-ink/30" />
          <span className="h-1.5 w-3 rounded-sm bg-ink/30" />
        </div>
      </div>

      {/* app header */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-gradient">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-300" />
          </div>
          <span className="text-[11px] font-semibold text-ink">Mój portfel</span>
        </div>
        <Bell className="h-4 w-4 text-ink-mute" />
      </div>

      {/* credential */}
      <div className="mx-4 mt-1 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-card">
        <div className="bg-brand-gradient px-4 py-2.5">
          <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-brand-200">
            Szkoła Trenerów Personalnych
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-accent-600">
            Legitymacja zawodowa
          </p>
          <p className="mt-1 font-display text-base font-semibold text-ink">
            Trener personalny
          </p>
          <p className="text-[10px] text-ink-soft">Karolina Nowak</p>
          <div className="mt-2.5 flex items-center justify-between text-[9px]">
            <div>
              <p className="uppercase tracking-wider text-ink-mute">Numer</p>
              <p className="font-mono font-semibold text-ink">ML24-2026-118820</p>
            </div>
            <div className="text-right">
              <p className="uppercase tracking-wider text-ink-mute">Ważna do</p>
              <p className="font-semibold text-ink">05.06.2027</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR */}
      <div className="mx-4 mt-3 flex flex-col items-center rounded-xl border border-ink/10 bg-white px-4 py-4 shadow-card">
        <div className="rounded-lg border border-ink/10 p-1.5">
          <FakeQrCode size={104} />
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <p className="text-[10px] font-semibold text-emerald-700">Legitymacja aktywna</p>
        </div>
        <p className="mt-1 text-[9px] text-ink-mute">
          Kod odświeża się automatycznie co 45 s
        </p>
      </div>

      {/* bottom nav */}
      <div className="mt-auto flex items-center justify-around border-t border-ink/10 bg-white px-6 py-3">
        <Wallet className="h-4 w-4 text-ink" />
        <ShieldCheck className="h-4 w-4 text-ink-mute" />
        <Bell className="h-4 w-4 text-ink-mute" />
      </div>
    </div>
  );
}
