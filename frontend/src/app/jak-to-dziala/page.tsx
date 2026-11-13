import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/motion/FadeIn";

const steps = [
  {
    number: "01",
    title: "Rejestracja firmy szkoleniowej",
    description:
      "Firma zakłada konto, podając dane rejestrowe (NIP, REGON, adres). Zespół mLegitymacja24 weryfikuje zgłoszenie przed aktywacją konta.",
  },
  {
    number: "02",
    title: "Konfiguracja typów legitymacji",
    description:
      "Administrator platformy udostępnia typy legitymacji odpowiednie dla danej branży, wraz z wymaganymi polami i domyślnym okresem ważności.",
  },
  {
    number: "03",
    title: "Wystawienie legitymacji absolwentowi",
    description:
      "Firma uzupełnia dane absolwenta, dołącza zdjęcie i wybiera typ legitymacji. System generuje unikalny numer oraz zabezpieczony kod weryfikacyjny.",
  },
  {
    number: "04",
    title: "Absolwent otrzymuje dostęp",
    description:
      "Na podany adres e-mail trafia zaproszenie do założenia konta. Po zalogowaniu absolwent widzi legitymację w swoim cyfrowym portfelu.",
  },
  {
    number: "05",
    title: "Okazanie legitymacji",
    description:
      "Absolwent otwiera legitymację w trybie prezentacji, generując dynamiczny kod QR ważny przez krótki czas.",
  },
  {
    number: "06",
    title: "Weryfikacja przez stronę trzecią",
    description:
      "Osoba weryfikująca skanuje kod telefonem. System natychmiast pokazuje status legitymacji: ważna, wygasła lub unieważniona, wraz z podstawowymi danymi.",
  },
];

export default function JakToDzialaPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="Jak to działa"
          title="Od rejestracji firmy do weryfikacji legitymacji"
          description="Pełna ścieżka platformy krok po kroku — z perspektywy firmy, absolwenta i weryfikującego."
          image="/images/heroes/hero-jak-to-dziala.jpg"
          imageAlt="Uczestnicy szkolenia w sali wykładowej"
        />
        <section className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
          <FadeInStagger className="relative space-y-12">
            <div className="absolute bottom-4 left-[23px] top-4 hidden w-px bg-ink/10 sm:block" />
            {steps.map((step) => (
              <FadeInStaggerItem key={step.number} className="relative flex gap-7">
                <div className="pb-2 pt-1">
                  <p className="font-display text-sm font-semibold tracking-wide text-accent-600">
                    Krok {step.number}
                  </p>
                  <h3 className="mt-1.5 font-display text-xl font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 max-w-xl leading-relaxed text-ink-soft">
                    {step.description}
                  </p>
                </div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>

          <FadeIn className="mt-16 rounded-lg border border-ink/10 bg-white p-8 text-center shadow-card sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Gotowy, aby zacząć?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
              Rejestracja firmy zajmuje kilka minut. Po weryfikacji danych
              możesz od razu wystawiać pierwsze legitymacje.
            </p>
            <Link
              href="/rejestracja-firmy"
              className="group mt-6 inline-flex items-center gap-2 rounded-md bg-brand-gradient px-7 py-3 text-sm font-semibold text-paper transition-all duration-300 hover:brightness-110"
            >
              Zarejestruj firmę
            </Link>
          </FadeIn>
        </section>
      </main>
      <Footer />
    </>
  );
}
