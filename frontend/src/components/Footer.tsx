import Link from "next/link";
import { Logo } from "./Logo";

const columns = [
  {
    title: "Platforma",
    links: [
      { href: "/dla-firm", label: "Dla firm szkoleniowych" },
      { href: "/dla-absolwentow", label: "Dla absolwentów" },
      { href: "/jak-to-dziala", label: "Jak to działa" },
      { href: "/cennik", label: "Cennik" },
    ],
  },
  {
    title: "Zaufanie",
    links: [
      { href: "/bezpieczenstwo", label: "Bezpieczeństwo" },
      { href: "/weryfikuj", label: "Weryfikuj legitymację" },
      { href: "/regulamin", label: "Regulamin" },
      { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
      { href: "/umowa-powierzenia", label: "Umowa powierzenia (DPA)" },
    ],
  },
  {
    title: "Kontakt",
    links: [
      { href: "mailto:kontakt@mlegitymacja24.pl", label: "kontakt@mlegitymacja24.pl" },
      { href: "/kontakt", label: "Formularz kontaktowy" },
      { href: "/rejestracja-firmy", label: "Zarejestruj firmę" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-brand-200/80">
              Cyfrowe legitymacje zawodowe dla firm szkoleniowych i ich
              absolwentów. Dokumenty, którym można ufać — zawsze przy Tobie.
            </p>
            
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                {column.title}
              </h4>
              <ul className="mt-5 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-brand-200/80 transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-brand-300/70 sm:flex-row">
          <p>© {new Date().getFullYear()} mLegitymacja24. Wszelkie prawa zastrzeżone.</p>
          <p className="text-brand-200/60">
            Twoje dokumenty zawsze przy Tobie
          </p>
        </div>
      </div>
    </footer>
  );
}
