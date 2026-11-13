import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { PhoneFrame } from "@/components/mockups/PhoneFrame";
import { PhoneCredentialMock } from "@/components/mockups/PhoneCredentialMock";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/motion/FadeIn";

const features = [
  {
    title: "Portfel cyfrowy",
    description:
      "Wszystkie Twoje legitymacje zawodowe, wydane przez różne organizacje, w jednym uporządkowanym miejscu.",
  },
  {
    title: "Tryb prezentacji",
    description:
      "Pełnoekranowy widok zoptymalizowany do okazania legitymacji, z automatycznym podniesieniem jasności ekranu.",
  },
  {
    title: "Dynamiczny kod weryfikacyjny",
    description:
      "Kod QR odświeżany co kilkadziesiąt sekund chroni Twoją legitymację przed nieuprawnionym kopiowaniem.",
  },
  {
    title: "Powiadomienia o ważności",
    description:
      "Otrzymasz przypomnienie zanim Twoja legitymacja straci ważność, abyś mógł w porę ją odnowić.",
  },
  {
    title: "Historia weryfikacji",
    description:
      "Sprawdź, kto i kiedy zweryfikował Twoją legitymację — pełna przejrzystość dla posiadacza dokumentu.",
  },
  {
    title: "Prywatność pod kontrolą",
    description:
      "Podczas weryfikacji ujawniane są wyłącznie niezbędne dane. Pełną kontrolę nad kontem masz zawsze w ustawieniach.",
  },
];

export default function DlaAbsolwentowPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="Dla absolwentów"
          title="Twoje legitymacje zawodowe zawsze przy Tobie"
          description="Wszystkie Twoje uprawnienia w jednym, bezpiecznym miejscu — gotowe do okazania w każdej chwili, z każdego urządzenia."
          image="/images/heroes/hero-absolwenci.jpg"
          imageAlt="Absolwenci świętujący ukończenie szkolenia"
        />

        <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <FadeIn className="order-2 flex justify-center lg:order-1">
              <div className="relative">
                <div className="absolute bottom-0 left-1/2 h-[85%] w-[110%] -translate-x-1/2 rounded-t-full border border-ink/10 bg-gradient-to-b from-cream to-brand-50" />
                <PhoneFrame className="relative">
                  <PhoneCredentialMock />
                </PhoneFrame>
              </div>
            </FadeIn>
            <div className="order-1 lg:order-2">
              <SectionHeading
                eyebrow="Twój portfel"
                title="Dokumenty, które zawsze masz w kieszeni"
                description="Koniec z noszeniem plastikowych kart i wydruków. Twoja legitymacja żyje w telefonie — elegancka, czytelna i zawsze aktualna."
                className="mb-10"
              />
              <FadeInStagger className="grid gap-5 sm:grid-cols-2">
                {features.map((feature) => (
                  <FadeInStaggerItem
                    key={feature.title}
                    className="rounded-lg border border-ink/10 bg-white p-6 shadow-card transition-all duration-300  hover:border-ink/20"
                  >
                    <h3 className="mt-3 text-[15px] font-semibold text-ink">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                      {feature.description}
                    </p>
                  </FadeInStaggerItem>
                ))}
              </FadeInStagger>
            </div>
          </div>

          <FadeIn className="mt-20 text-center">
            <Link
              href="/logowanie"
              className="group inline-flex items-center gap-2 rounded-md bg-brand-gradient px-8 py-3.5 text-sm font-semibold text-paper transition-all duration-300 hover:brightness-110"
            >
              Zaloguj się do swojego konta
            </Link>
          </FadeIn>
        </section>
      </main>
      <Footer />
    </>
  );
}
