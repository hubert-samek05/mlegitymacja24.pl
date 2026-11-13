import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/motion/FadeIn";

const channels = [
  {
    title: "Napisz do nas",
    value: "kontakt@mlegitymacja24.pl",
    href: "mailto:kontakt@mlegitymacja24.pl",
    description: "Odpowiadamy zazwyczaj w ciągu jednego dnia roboczego.",
  },
  {
    title: "Wsparcie dla firm",
    value: "Wdrożenie i pytania o plany",
    href: "mailto:kontakt@mlegitymacja24.pl",
    description: "Pomożemy dobrać plan i przeprowadzić wdrożenie w Twojej organizacji.",
  },
  {
    title: "Weryfikacja legitymacji",
    value: "Sprawdź dokument online",
    href: "/weryfikuj",
    description: "Weryfikacja jest dostępna publicznie, bez logowania i bez konta.",
  },
];

export default function KontaktPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          image="/images/heroes/hero-kontakt.jpg"
          imageAlt="Osoba korzystająca z laptopa i telefonu"
          eyebrow="Kontakt"
          title="Skontaktuj się z nami"
          description="Masz pytania dotyczące platformy mLegitymacja24? Jesteśmy do dyspozycji — wybierz najwygodniejszą drogę kontaktu."
        />
        <section className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
          <FadeInStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <FadeInStaggerItem key={channel.title}>
                <a
                  href={channel.href}
                  className="group flex h-full flex-col rounded-lg border border-ink/10 bg-white p-8 shadow-card transition-all duration-300  hover:border-ink/20 hover:shadow-card"
                >
                  <h3 className="mt-5 text-base font-semibold text-ink">
                    {channel.title}
                  </h3>
                  <p className="mt-1.5 text-sm font-medium text-accent-600">
                    {channel.value}
                  </p>
                  <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
                    {channel.description}
                  </p>
                </a>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>

          <FadeIn className="mt-14 rounded-lg border border-ink/10 bg-cream/60 p-8 text-center sm:p-10">
            <h2 className="font-display text-xl font-semibold text-ink">
              Formularz kontaktowy
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              Formularz kontaktowy oraz pełne dane teleadresowe zostaną
              uzupełnione przed uruchomieniem produkcyjnym serwisu. Do tego
              czasu zapraszamy do kontaktu mailowego.
            </p>
          </FadeIn>
        </section>
      </main>
      <Footer />
    </>
  );
}
