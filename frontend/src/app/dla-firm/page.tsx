import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { BrowserFrame } from "@/components/mockups/BrowserFrame";
import { DashboardMock } from "@/components/mockups/DashboardMock";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/motion/FadeIn";

const features = [
  {
    title: "Wystawianie legitymacji",
    description:
      "Uzupełnij dane absolwenta, wybierz typ legitymacji i okres jej ważności. Numer dokumentu generowany jest automatycznie.",
  },
  {
    title: "Import masowy",
    description:
      "Dla dużych grup kursantów udostępniamy import danych z pliku — bez ręcznego wprowadzania każdej osoby.",
  },
  {
    title: "Zarządzanie zespołem",
    description:
      "Nadawaj dostęp pracownikom firmy z ograniczonymi uprawnieniami do wystawiania i edycji legitymacji.",
  },
  {
    title: "Historia i audyt",
    description:
      "Każda zmiana statusu legitymacji oraz każda jej weryfikacja jest rejestrowana i dostępna w panelu firmy.",
  },
  {
    title: "Branding",
    description:
      "Dodaj logo swojej organizacji, aby legitymacje wystawiane przez Twoją firmę były łatwo rozpoznawalne.",
  },
  {
    title: "Rozliczenia",
    description:
      "Przejrzysty panel subskrypcji, faktur i historii płatności dopasowany do skali Twojej działalności.",
  },
];

export default function DlaFirmPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="Dla firm szkoleniowych"
          title="Zarządzaj legitymacjami swoich absolwentów z jednego miejsca"
          description="Wystawiaj, aktualizuj i unieważniaj cyfrowe legitymacje zawodowe — z pełną kontrolą i historią każdego dokumentu."
          image="/images/heroes/hero-firmy.jpg"
          imageAlt="Zespół firmy szkoleniowej przy biurku"
        />

        <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <SectionHeading
            eyebrow="Możliwości"
            title="Wszystko, czego potrzebuje Twoja organizacja"
            className="mb-14"
          />
          <FadeInStagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FadeInStaggerItem
                key={feature.title}
                className="group rounded-lg border border-ink/10 bg-white p-8 shadow-card transition-all duration-300  hover:border-ink/20 hover:shadow-card"
              >
                <h3 className="mt-5 text-lg font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {feature.description}
                </p>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </section>

        <section className="border-t border-ink/10 bg-cream/60 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              align="center"
              eyebrow="Panel firmy"
              title="Praca w panelu — prosta i przejrzysta"
              description="Lista legitymacji, statusy, wystawianie jednym kliknięciem. Tak wygląda codzienne zarządzanie dokumentami."
              className="mb-12"
            />
            <FadeIn delay={0.1}>
              <BrowserFrame url="app.mlegitymacja24.pl/panel/firma">
                <DashboardMock />
              </BrowserFrame>
            </FadeIn>
            <FadeIn delay={0.2} className="mt-14 text-center">
              <Link
                href="/rejestracja-firmy"
                className="group inline-flex items-center gap-2 rounded-md bg-brand-gradient px-8 py-3.5 text-sm font-semibold text-paper transition-all duration-300 hover:brightness-110"
              >
                Zarejestruj firmę szkoleniową
              </Link>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
