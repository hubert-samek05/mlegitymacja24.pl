import Link from "next/link";
import { Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/motion/FadeIn";

const plans = [
  {
    name: "Starter",
    price: "99 zł",
    period: "/ miesiąc",
    description: "Dla mniejszych organizacji szkoleniowych rozpoczynających cyfryzację legitymacji.",
    features: [
      "Do 50 aktywnych legitymacji",
      "Do 2 kont pracowników firmy",
      "Panel wystawiania i zarządzania legitymacjami",
      "Podstawowa historia weryfikacji",
    ],
  },
  {
    name: "Professional",
    price: "299 zł",
    period: "/ miesiąc",
    description: "Dla organizacji o większej skali, potrzebujących rozszerzonego zespołu i limitów.",
    features: [
      "Do 300 aktywnych legitymacji",
      "Do 10 kont pracowników firmy",
      "Import masowy absolwentów",
      "Branding firmowy na legitymacjach",
      "Rozszerzona historia i eksport danych",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Indywidualnie",
    period: "",
    description: "Dla dużych sieci szkoleniowych i instytucji branżowych z niestandardowymi wymaganiami.",
    features: [
      "Bez limitu liczby legitymacji i kont",
      "Dedykowany opiekun wdrożenia",
      "Integracja API z systemami partnera",
      "Umowa SLA i indywidualne ustalenia bezpieczeństwa",
    ],
  },
];

export default function CennikPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="Cennik"
          title="Plany dopasowane do skali Twojej organizacji"
          description="Wybierz plan dopasowany do liczby legitymacji i wielkości zespołu — zmienisz go w każdej chwili."
          image="/images/heroes/hero-cennik.jpg"
          imageAlt="Dokumenty rozliczeniowe i kalkulator na biurku"
        />
        <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <FadeInStagger className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {plans.map((plan) => (
              <FadeInStaggerItem
                key={plan.name}
                className={`relative flex flex-col rounded-lg border p-8 transition-all duration-300  ${
                  plan.highlighted
                    ? "border-ink bg-ink text-paper shadow-card"
                    : "border-ink/10 bg-white text-ink shadow-card hover:border-ink/20 hover:shadow-card"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-md border border-accent-400/40 bg-cream px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-600 shadow-sm">
                    Najpopularniejszy
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-semibold">{plan.price}</span>
                  <span className={plan.highlighted ? "text-brand-200/80" : "text-ink-mute"}>
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`mt-4 text-sm leading-relaxed ${
                    plan.highlighted ? "text-brand-200/80" : "text-ink-soft"
                  }`}
                >
                  {plan.description}
                </p>
                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <span
                        className={`mt-0.5 flex h-4.5 w-4.5 h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          plan.highlighted
                            ? "bg-accent-400/20 text-accent-300"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/rejestracja-firmy"
                  className={`mt-8 block rounded-full px-6 py-3 text-center text-sm font-semibold transition-colors duration-300 ${
                    plan.highlighted
                      ? "bg-paper text-ink hover:bg-white"
                      : "bg-ink text-paper hover:brightness-110"
                  }`}
                >
                  Wybierz plan
                </Link>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>

          <FadeIn className="mx-auto mt-16 max-w-2xl text-center">
            <p className="text-sm text-ink-soft">
              Nie wiesz, który plan wybrać?{" "}
              <Link href="/kontakt" className="font-semibold text-accent-600 underline-offset-4 hover:underline">
                Skontaktuj się z nami
              </Link>{" "}
              — pomożemy dobrać rozwiązanie do Twojej organizacji.
            </p>
          </FadeIn>
        </section>
      </main>
      <Footer />
    </>
  );
}
