"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "./Logo";
import { clearTokens } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  icon?: unknown;
}

export function PanelShell({
  navItems,
  activeHref,
  userLabel,
  userSubtitle,
  children,
}: {
  navItems: NavItem[];
  activeHref: string;
  userLabel: string;
  userSubtitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const initials = userLabel
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    clearTokens();
    router.replace("/logowanie");
  }

  return (
    <div className="flex min-h-screen bg-paper">
      {/* ===== sidebar (desktop) ===== */}
      <aside className="hidden h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-ink/10 bg-white lg:sticky lg:top-0 lg:flex">
        <div className="border-b border-ink/10 px-6 py-5">
          <Link href="/" aria-label="mLegitymacja24 — strona główna">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md border-l-2 px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-accent-500 bg-brand-900 text-white"
                    : "border-transparent text-ink-soft hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink/10 p-4">
          <div className="flex items-center gap-3 rounded-md bg-cream/60 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-900 text-xs font-bold text-paper">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{userLabel}</p>
              {userSubtitle && (
                <p className="text-[11px] text-ink-mute">{userSubtitle}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              aria-label="Wyloguj się"
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-ink-mute transition-colors hover:bg-white hover:text-ink"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </aside>

      {/* ===== kolumna główna ===== */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar (mobile) */}
        <header className="sticky top-[env(safe-area-inset-top)] z-40 flex items-center justify-between border-b border-ink/10 bg-paper/90 px-5 py-3 backdrop-blur-xl lg:hidden">
          <Link href="/" aria-label="mLegitymacja24 — strona główna">
            <Logo />
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-900 text-[11px] font-bold text-paper">
              {initials}
            </span>
            <button
              onClick={handleLogout}
              aria-label="Wyloguj się"
              className="rounded-md border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-ink/5"
            >
              Wyloguj
            </button>
          </div>
        </header>

        <main className="flex-1 px-5 pb-28 pt-6 sm:px-8 lg:pb-12 lg:pt-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>

        {/* dolny pasek zakładek (mobile) */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <div className="flex items-stretch overflow-x-auto">
            {navItems.map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-[76px] flex-1 items-center justify-center border-t-2 px-2 py-3.5 text-[11px] font-semibold transition-colors ${
                    active ? "border-accent-500 text-ink" : "border-transparent text-ink-mute hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
