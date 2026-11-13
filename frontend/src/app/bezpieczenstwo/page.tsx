import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { FadeInStagger, FadeInStaggerItem } from "@/components/motion/FadeIn";

const sections = [
  {
    title: "Ochrona kont użytkowników",
    points: [
      "Hasła przechowywane wyłącznie w postaci zaszyfrowanej (bcrypt)",
      "Uwierzytelnianie dwuskładnikowe dla kont administracyjnych firm i platformy",
      "Tokeny dostępowe o krótkim czasie życia wraz z mechanizmem odświeżania",
    ],
  },
  {
    title: "Ochrona legitymacji przed podrobieniem",
    points: [
      "Kod weryfikacyjny podpisywany kryptograficznie po stronie serwera",
      "Automatyczne wygasanie kodu QR po kilkudziesięciu sekundach",
      "Każda próba weryfikacji jest rejestrowana wraz z wynikiem",
    ],
  },
  {
    title: "Ochrona danych osobowych",
    points: [
      "Zasada minimalizacji danych — publiczna weryfikacja pokazuje wyłącznie niezbędne informacje",
      "Zgodność z RODO, w tym prawo do wglądu, poprawy i usunięcia danych",
      "Regularne, niezależne kopie zapasowe bazy danych",
    ],
  },
  {
    title: "Ochrona infrastruktury",
    points: [
      "Nagłówki bezpieczeństwa HTTP oraz ograniczanie liczby zapytań (rate limiting)",
      "Pełny rejestr zdarzeń administracyjnych (audit log)",
      "Rozdzielenie uprawnień w architekturze ról (super administrator, firma, absolwent)",
    ],
  },
];

export default function BezpieczenstwoPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="Bezpieczeństwo"
          title="Zaufanie jako fundament platformy"
          description="Legitymacja zawodowa musi być wiarygodna — dlatego bezpieczeństwo jest fundamentem mLegitymacja24."
          image="/images/heroes/hero-bezpieczenstwo.jpg"
          imageAlt="Telefon z symbolem zabezpieczenia leżący na biurku"
        />
        <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <FadeInStagger className="grid gap-6 md:grid-cols-2">
            {sections.map((section, index) => (
              <FadeInStaggerItem
                key={section.title}
                className="group rounded-lg border border-ink/10 bg-white p-8 shadow-card transition-all duration-300  hover:border-ink/20 hover:shadow-card"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-display text-xs font-semibold tracking-wide text-accent-600">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="text-lg font-semibold text-ink">
                      {section.title}
                    </h3>
                  </div>
                </div>
                <ul className="mt-6 space-y-3 border-t border-ink/10 pt-6">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
                      <span className="mt-2 h-1 w-4 shrink-0 rounded-full bg-accent-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </section>
      </main>
      <Footer />
    </>
  );
}
