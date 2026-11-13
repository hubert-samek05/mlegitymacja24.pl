export const inputCls =
  "mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-mute";
export const btnPrimary =
  "rounded-md bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60";
export const btnGhost =
  "rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 disabled:opacity-60";
export const btnDanger =
  "rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60";
export const card = "rounded-lg border border-ink/10 bg-white shadow-card";
export const alertError = "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";
export const alertOk = "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800";

export function pln(cents: number): string {
  return `${(cents / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
}
