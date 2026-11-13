import { CreditCard, LayoutGrid, ShieldCheck, Users } from "lucide-react";

const rows = [
  { name: "Anna Wiśniewska", type: "Specjalista SEO", number: "ML24-2026-773102", status: "Aktywna" },
  { name: "Michał Zieliński", type: "Kosmetolog", number: "ML24-2026-482913", status: "Aktywna" },
  { name: "Karolina Nowak", type: "Trener personalny", number: "ML24-2026-118820", status: "Wygasa wkrótce" },
];

const navItems = [
  { icon: LayoutGrid, label: "Legitymacje", active: true },
  { icon: Users, label: "Pracownicy", active: false },
  { icon: ShieldCheck, label: "Weryfikacje", active: false },
];

export function DashboardMock() {
  return (
    <div className="flex min-h-[320px] text-xs">
      <aside className="hidden w-40 flex-col gap-1 border-r border-ink/10 bg-white p-3 sm:flex">
        <div className="mb-3 flex items-center gap-2 px-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-gradient text-[10px] font-bold text-accent-300">
            m
          </div>
          <span className="text-[11px] font-semibold text-ink">Panel firmy</span>
        </div>
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 rounded-md px-3 py-2 ${
              item.active ? "bg-brand-gradient text-paper" : "text-ink-mute"
            }`}
          >
            <item.icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
          </div>
        ))}
      </aside>

      <div className="flex-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-ink">Legitymacje</p>
            <p className="text-ink-mute">Zarządzaj legitymacjami absolwentów</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-brand-gradient px-3 py-1.5 font-semibold text-paper">
            <CreditCard className="h-3 w-3" />
            Wystaw legitymację
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
          <div className="grid grid-cols-4 gap-2 border-b border-ink/10 bg-paper px-3 py-2 font-medium text-ink-mute">
            <span>Absolwent</span>
            <span>Typ</span>
            <span>Numer</span>
            <span>Status</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.number}
              className="grid grid-cols-4 gap-2 border-b border-ink/5 px-3 py-2.5 last:border-b-0"
            >
              <span className="font-medium text-ink">{row.name}</span>
              <span className="text-ink-soft">{row.type}</span>
              <span className="font-mono text-ink-mute">{row.number}</span>
              <span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    row.status === "Aktywna"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {row.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
