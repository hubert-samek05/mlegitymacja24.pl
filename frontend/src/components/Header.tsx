"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { apiGet, getAccessToken } from "@/lib/api";
import { logout, type CurrentUser } from "@/lib/useCurrentUser";

const navItems = [
  { href: "/dla-firm", label: "Dla firm" },
  { href: "/dla-absolwentow", label: "Dla absolwentów" },
  { href: "/jak-to-dziala", label: "Jak to działa" },
  { href: "/weryfikuj", label: "Weryfikuj" },
  { href: "/bezpieczenstwo", label: "Bezpieczeństwo" },
  { href: "/cennik", label: "Cennik" },
];

function panelHref(role: CurrentUser["role"]): string {
  if (role === "SUPER_ADMIN") return "/panel/super-admin";
  if (role === "HOLDER") return "/panel/absolwent";
  return "/panel/firma";
}

export function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (getAccessToken()) {
      apiGet<CurrentUser>("/users/me").then(setUser).catch(() => setUser(null));
    }
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // zamknięcie dropdownu po kliknięciu poza nim
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // blokada scrolla przy otwartym sidebarze
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function handleLogout() {
    setAccountOpen(false);
    setMenuOpen(false);
    setUser(null);
    logout(router);
  }

  const initials = user ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() : "";

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-ink/[0.08] bg-paper/90 shadow-[0_1px_0_rgba(10,43,78,0.04)] backdrop-blur-xl"
            : "border-b border-transparent bg-paper/60 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="mLegitymacja24 — strona główna">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-4 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:bg-brand-50 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {user ? (
            <div ref={accountRef} className="relative hidden sm:block">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-2.5 rounded-md py-1.5 pl-1.5 pr-3 transition-colors hover:bg-brand-50"
                aria-label="Menu konta"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-[13px] font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden text-left lg:block">
                  <span className="block max-w-[150px] truncate text-[13px] font-semibold leading-tight text-ink">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="block max-w-[150px] truncate text-[11px] leading-tight text-ink-mute">
                    {user.company?.name ?? "Moje konto"}
                  </span>
                </span>
                <ChevronDown className={`h-4 w-4 text-ink-mute transition-transform ${accountOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-lg border border-ink/10 bg-white py-1.5 shadow-card"
                  >
                    <div className="border-b border-ink/[0.07] px-4 py-3">
                      <p className="truncate text-sm font-semibold text-ink">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-xs text-ink-mute">{user.email}</p>
                    </div>
                    <Link
                      href={panelHref(user.role)}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-brand-50"
                    >
                      <LayoutDashboard className="h-4 w-4 text-ink-mute" />
                      Moje konto
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Wyloguj się
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/logowanie"
                className="rounded-md px-4 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:bg-brand-50 hover:text-ink"
              >
                Zaloguj się
              </Link>
              <Link
                href="/rejestracja-firmy"
                className="group inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all duration-300 hover:brightness-110"
              >
                Zarejestruj firmę
              </Link>
            </div>
          )}

          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 lg:hidden"
            aria-label="Otwórz menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ============ MOBILE SIDEBAR ============ */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-[70] flex w-[85%] max-w-sm flex-col bg-paper shadow-card lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
                <Logo />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-ink transition-colors hover:bg-ink/5"
                  aria-label="Zamknij menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-6 py-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
                  Nawigacja
                </p>
                <div className="flex flex-col">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between border-b border-ink/[0.07] py-4 font-display text-xl font-semibold text-ink transition-colors hover:text-brand-700"
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </nav>

              <div className="border-t border-ink/[0.08] bg-cream/50 px-6 py-6">
                {user ? (
                  <>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="truncate text-xs text-ink-mute">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href={panelHref(user.role)}
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110"
                    >
                      Moje konto
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="mt-3 flex w-full items-center justify-center rounded-md border border-red-200 px-6 py-3.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                    >
                      Wyloguj się
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/rejestracja-firmy"
                      onClick={() => setMenuOpen(false)}
                      className="group flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110"
                    >
                      Zarejestruj firmę
                    </Link>
                    <Link
                      href="/logowanie"
                      onClick={() => setMenuOpen(false)}
                      className="mt-3 flex w-full items-center justify-center rounded-md border border-ink/15 px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-white"
                    >
                      Zaloguj się
                    </Link>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
