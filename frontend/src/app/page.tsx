import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { AudienceTabs } from "@/components/AudienceTabs";
import { ProfessionMarquee } from "@/components/ProfessionMarquee";
import { ComparisonSwitch } from "@/components/ComparisonSwitch";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { FaqAccordion } from "@/components/FaqAccordion";
import { SnapCarousel } from "@/components/SnapCarousel";
import { PhoneFrame } from "@/components/mockups/PhoneFrame";
import { CredentialCard } from "@/components/mockups/CredentialCard";
import {
  FadeIn,
  FadeInStagger,
  FadeInStaggerItem,
} from "@/components/motion/FadeIn";

const trustChips = [
  { label: "Szyfrowane połączenie TLS" },
  { label: "Zgodność z RODO" },
  { label: "Weryfikacja dostępna 24/7" },
];

const stats = [
  { value: "<1 min", label: "tyle trwa wystawienie legitymacji" },
  { value: "3 s", label: "tyle trwa jej weryfikacja" },
  { value: "0", label: "aplikacji do instalowania" },
  { value: "24/7", label: "dostęp do cyfrowego portfela" },
];

const steps = [
  {
    title: "Zarejestruj swoją firmę",
    description:
      "Podajesz podstawowe dane firmy — my je sprawdzamy i aktywujemy konto. Dzięki temu każda legitymacja w systemie ma wiarygodnego wystawcę.",
  },
  {
    title: "Wystaw legitymację",
    description:
      "Uzupełniasz dane absolwenta, wybierasz typ dokumentu i okres ważności. To kilka kliknięć — mniej niż minuta.",
  },
  {
    title: "Absolwent ma ją w telefonie",
    description:
      "Legitymacja od razu trafia do cyfrowego portfela absolwenta. Zawsze pod ręką, gotowa do okazania.",
  },
  {
    title: "Każdy może ją sprawdzić",
    description:
      "Wystarczy zeskanować kod QR — status dokumentu widać od razu. Bez konta, bez aplikacji, bez dzwonienia do wystawcy.",
  },
];

const securityPoints = [
  {
    title: "Kod, którego nie da się podrobić",
    description:
      "Kod QR jest podpisany cyfrowo i odświeża się co 45 sekund. Zrzut ekranu przestaje działać, zanim ktokolwiek zdąży go wykorzystać.",
  },
  {
    title: "Szyfrowane hasła i połączenia",
    description:
      "Hasła przechowujemy wyłącznie w postaci zaszyfrowanej, a cały ruch szyfrujemy protokołem TLS. Nikt niepowołany nie zobaczy danych.",
  },
  {
    title: "Wszystko zostawia ślad",
    description:
      "Każde wystawienie, unieważnienie i weryfikacja są rejestrowane. W razie wątpliwości wszystko można prześledzić — krok po kroku.",
  },
  {
    title: "Szacunek dla prywatności",
    description:
      "Przy weryfikacji pokazujemy tylko to, co naprawdę potrzebne. Każdy ma prawo wglądu w swoje dane i ich usunięcia — zgodnie z RODO.",
  },
];

const screenshots = [
  {
    label: "Portfel absolwenta",
    caption: "Wszystkie legitymacje w jednym miejscu",
    src: "/screens/preview-portfel.png",
    imgW: 738,
    imgH: 1515,
  },
  {
    label: "Tryb prezentacji",
    caption: "Pełny ekran z dynamicznym kodem QR",
    src: "/screens/hero-device.png",
    imgW: 733,
    imgH: 1514,
  },
  {
    label: "Weryfikacja",
    caption: "Wynik kontroli widoczny od razu",
    src: "/screens/preview-weryfikacja.png",
    imgW: 717,
    imgH: 1493,
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden bg-paper">
          {/* zdjęcie w tle + ciepły gradient dla czytelności */}
          <div className="absolute inset-0">
            <Image
              src="/images/heroes/hero-glowna.jpg"
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/95 to-paper/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/20 to-paper/40" />

          <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
              {/* tekst */}
              <FadeIn className="text-center lg:text-left">
                <h1 className="font-display text-[2.2rem] font-semibold leading-[1.15] tracking-tight text-ink text-balance sm:text-5xl lg:text-[3.4rem]">
                  Twoje dokumenty{" "}
                  <span className="text-gradient">zawsze przy Tobie</span>
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg lg:mx-0">
                  Koniec z noszeniem papierowych legitymacji i zgadywaniem, czy
                  dokument jest prawdziwy. Wystawiasz ją w kilkanaście sekund,
                  absolwent nosi ją w telefonie, a sprawdzenie autentyczności
                  trwa 3 sekundy — dla każdego i bez żadnej aplikacji.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
                  <Link
                    href="/rejestracja-firmy"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-7 py-3.5 text-sm font-semibold text-white shadow-card transition-all duration-300 hover:brightness-110 sm:w-auto"
                  >
                    Zarejestruj swoją firmę
                  </Link>
                  <Link
                    href="/jak-to-dziala"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-ink/15 bg-white/70 px-7 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-ink/30 hover:bg-white sm:w-auto"
                  >
                    Zobacz, jak to działa
                  </Link>
                </div>
                <p className="mt-4 text-xs text-ink-mute">
                  Rejestracja trwa kilka minut · Bez zobowiązań
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  <a
                    href="https://play.google.com/store/apps/details?id=mLegitymacja24.pl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-lg bg-ink px-4 py-2.5 text-white shadow-card transition-all duration-300 hover:brightness-125"
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden="true">
                      <path fill="#4285F4" d="M3.6 1.8 13.8 12 3.6 22.2c-.3-.2-.5-.6-.5-1V2.8c0-.4.2-.8.5-1z" />
                      <path fill="#FBBC05" d="m17.4 8.4-3.6 3.6L3.6 1.8c.4-.3.9-.4 1.4-.1l12.4 6.7z" />
                      <path fill="#EA4335" d="m17.4 15.6-12.4 6.7c-.5.3-1 .2-1.4-.1l10.2-10.2 3.6 3.6z" />
                      <path fill="#34A853" d="m17.4 8.4 3.7 2.1c1 .6 1 2.3 0 2.9l-3.7 2.2-4-3.6 4-3.6z" />
                    </svg>
                    <span className="text-left leading-tight">
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-white/70">
                        Pobierz z
                      </span>
                      <span className="block text-[15px] font-semibold">Google Play</span>
                    </span>
                  </a>
                  <a
                    href="https://apps.apple.com/us/app/mlegitymacja24-pl/id6834377120"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-lg bg-ink px-4 py-2.5 text-white shadow-card transition-all duration-300 hover:brightness-125"
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden="true">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <span className="text-left leading-tight">
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-white/70">
                        Pobierz z
                      </span>
                      <span className="block text-[15px] font-semibold">App Store</span>
                    </span>
                  </a>
                </div>

                <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
                  {trustChips.map((chip) => (
                    <li
                      key={chip.label}
                      className="flex items-center gap-2 text-[13px] font-medium text-ink-soft"
                    >
                      {chip.label}
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* wizualizacja produktu */}
              <FadeIn delay={0.15} className="relative">
                <div className="relative mx-auto flex max-w-md justify-center pb-10 pt-4 lg:max-w-none">
                  {/* karta legitymacji za telefonem */}
                  <div className="absolute -left-2 top-16 hidden w-60 -rotate-6 md:block lg:-left-4 lg:w-64">
                    <CredentialCard />
                  </div>

                  <Image
                    src="/screens/hero-device.png"
                    alt="Legitymacja zawodowa w aplikacji mLegitymacja24"
                    width={733}
                    height={1514}
                    priority
                    className="relative z-10 h-auto w-[240px] sm:w-[255px]"
                  />

                  {/* odznaka wiarygodności */}
                  <div className="absolute -bottom-0 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-md border border-ink/10 bg-white px-4 py-2 shadow-card">
                    <p className="text-xs font-semibold text-ink">
                      Legitymacja zweryfikowana{" "}
                      <span className="font-normal text-ink-mute">· 3 s temu</span>
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* liczby */}
            <dl className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-8 rounded-lg border border-ink/[0.08] bg-white/70 px-6 py-8 text-center shadow-sm sm:grid-cols-4 sm:px-10">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="font-display text-3xl font-semibold text-ink">
                    {stat.value}
                  </dd>
                  <dt className="mt-1.5 text-xs leading-snug text-ink-mute">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ============ BRANŻE ============ */}
        <section className="border-y border-ink/[0.07] bg-white py-8">
          <FadeIn className="mx-auto mb-5 max-w-2xl px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-mute">
              Jedna platforma — każda branża
            </p>
          </FadeIn>
          <ProfessionMarquee />
        </section>

        {/* ============ DLA KOGO ============ */}
        <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <SectionHeading
            align="center"
            eyebrow="Dla kogo"
            title="Dla tych, którzy wystawiają — i tych, którzy noszą"
            description="Niezależnie od tego, czy prowadzisz firmę szkoleniową, ukończyłeś kurs, czy musisz sprawdzić czyjeś uprawnienia — mLegitymacja24 jest po Twojej stronie."
            className="mb-12"
          />
          <FadeIn delay={0.1}>
            <AudienceTabs />
          </FadeIn>
        </section>

        {/* ============ JAK TO DZIAŁA ============ */}
        <section
          id="jak-to-dziala"
          className="border-y border-ink/[0.07] bg-cream/70 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading
              align="center"
              eyebrow="Proces"
              title="Od rejestracji do pierwszej legitymacji w jeden dzień"
              description="Zaprojektowaliśmy cały proces tak, żeby był prosty i zrozumiały — dla firmy, dla absolwenta i dla osoby weryfikującej."
              className="mb-14"
            />
            <FadeInStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <FadeInStaggerItem
                  key={step.title}
                  className="relative rounded-lg border border-ink/[0.08] bg-white p-7 shadow-sm transition-all duration-300  hover:shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-4xl font-light text-brand-200">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {step.description}
                  </p>
                </FadeInStaggerItem>
              ))}
            </FadeInStagger>
          </div>
        </section>

        {/* ============ PODGLĄD PLATFORMY ============ */}
        <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <SectionHeading
            align="center"
            eyebrow="Zobacz jak to wygląda"
            title="Prawdziwy panel, prawdziwa legitymacja"
            description="Bez ozdobników i śladowych ilustracji — tak mLegitymacja24 wygląda na co dzień, po stronie firmy szkoleniowej i po stronie absolwenta."
          />

          {/* mobile: karuzela */}
          <div className="mt-12 lg:hidden">
            <SnapCarousel ariaLabel="Podgląd platformy">
              <div className="w-full max-w-md">
                <Image src="/screens/preview-imac.png" alt="Panel firmy mLegitymacja24 na komputerze" width={1302} height={964} className="h-auto w-full" />
                <p className="mt-4 text-center text-xs text-ink-mute">
                  Panel firmy — wystawianie i zarządzanie legitymacjami
                </p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <Image src="/screens/preview-portfel.png" alt="Cyfrowy portfel legitymacji mLegitymacja24" width={738} height={1515} className="h-auto w-[220px]" />
                <p className="text-center text-xs text-ink-mute">
                  Widok absolwenta — legitymacja z dynamicznym kodem QR
                </p>
              </div>
            </SnapCarousel>
          </div>

          {/* desktop: obok siebie */}
          <div className="mt-14 hidden items-center gap-12 lg:grid lg:grid-cols-[1.35fr_0.65fr]">
            <FadeIn delay={0.1}>
              <Image src="/screens/preview-imac.png" alt="Panel firmy mLegitymacja24 na komputerze" width={1302} height={964} className="h-auto w-full" />
              <p className="mt-4 text-center text-xs text-ink-mute">
                Panel firmy — wystawianie i zarządzanie legitymacjami
              </p>
            </FadeIn>

            <FadeIn delay={0.2} className="flex flex-col items-center gap-4">
              <Image src="/screens/preview-portfel.png" alt="Cyfrowy portfel legitymacji mLegitymacja24" width={738} height={1515} className="h-auto w-[255px]" />
              <p className="text-center text-xs text-ink-mute">
                Widok absolwenta — legitymacja z dynamicznym kodem QR
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ============ BEZPIECZEŃSTWO ============ */}
        <section className="border-y border-ink/[0.07] bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div className="lg:sticky lg:top-28">
                <SectionHeading
                  eyebrow="Bezpieczeństwo"
                  title="Dbamy o bezpieczeństwo, żebyś Ty nie musiał"
                  description="Legitymacja to dokument — musi budzić zaufanie. Dlatego zabezpieczenia nie są u nas dodatkiem, tylko fundamentem całej platformy."
                />
                <FadeIn delay={0.15}>
                  <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <Link
                      href="/bezpieczenstwo"
                      className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-ink"
                    >
                      Poznaj wszystkie zabezpieczenia
                    </Link>
                  </div>
                </FadeIn>
              </div>

              <FadeInStagger className="grid gap-5 sm:grid-cols-2">
                {securityPoints.map((point) => (
                  <FadeInStaggerItem
                    key={point.title}
                    className="group rounded-lg border border-ink/[0.08] bg-paper p-7 transition-all duration-300  hover:border-brand-200 hover:shadow-card"
                  >
                    <h3 className="mt-5 font-display text-[15px] font-semibold text-ink">
                      {point.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                      {point.description}
                    </p>
                  </FadeInStaggerItem>
                ))}
              </FadeInStagger>
            </div>
          </div>
        </section>

        {/* ============ SCREENY APLIKACJI ============ */}
        <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <SectionHeading
            align="center"
            eyebrow="W telefonie"
            title="Legitymacja zawsze pod ręką"
            description="Portfel absolwenta, tryb prezentacji z dynamicznym kodem i ekran weryfikacji — wszystko w przeglądarce telefonu."
            className="mb-14"
          />
          {/* mobile: karuzela */}
          <div className="sm:hidden">
            <SnapCarousel ariaLabel="Widoki aplikacji">
              {screenshots.map((shot) => (
                <div key={shot.label} className="flex flex-col items-center">
                  {shot.src ? (
                    <Image src={shot.src} alt={shot.label} width={shot.imgW} height={shot.imgH} className="h-auto w-[230px]" />
                  ) : (
                    <PhoneFrame label={shot.label} />
                  )}
                  <p className="mt-5 font-display text-sm font-semibold text-ink">{shot.label}</p>
                  <p className="mt-1 max-w-[220px] text-center text-xs text-ink-mute">
                    {shot.caption}
                  </p>
                </div>
              ))}
            </SnapCarousel>
          </div>

          {/* tablet/desktop: rząd telefonów */}
          <FadeInStagger className="hidden items-end justify-center gap-8 sm:flex lg:gap-14">
            {screenshots.map((shot, index) => (
              <FadeInStaggerItem
                key={shot.label}
                className={`flex flex-col items-center ${index === 1 ? "sm:-translate-y-6" : ""}`}
              >
                {shot.src ? (
                  <Image src={shot.src} alt={shot.label} width={shot.imgW} height={shot.imgH} className="h-auto w-[240px]" />
                ) : (
                  <PhoneFrame label={shot.label} />
                )}
                <p className="mt-5 font-display text-sm font-semibold text-ink">{shot.label}</p>
                <p className="mt-1 max-w-[220px] text-center text-xs text-ink-mute">
                  {shot.caption}
                </p>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </section>

        {/* ============ PORÓWNANIE ============ */}
        <section className="border-y border-ink/[0.07] bg-cream/70 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading
              align="center"
              eyebrow="Dlaczego cyfrowo"
              title="Papier kontra mLegitymacja24"
              description="Przełącz widok i zobacz, co naprawdę zmienia się w codziennej pracy Twojej organizacji."
              className="mb-12"
            />
            <FadeIn delay={0.1}>
              <ComparisonSwitch />
            </FadeIn>
          </div>
        </section>

        {/* ============ OPINIE ============ */}
        <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <SectionHeading
            align="center"
            eyebrow="Opinie"
            title="Zaufali nam ludzie z różnych branż"
            className="mb-12"
          />
          <FadeIn delay={0.1}>
            <TestimonialsCarousel />
          </FadeIn>
        </section>

        {/* ============ FAQ ============ */}
        <section className="border-t border-ink/[0.07] bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading
              align="center"
              eyebrow="Najczęstsze pytania"
              title="Masz pytania? Chętnie odpowiemy"
              className="mb-12"
            />
            <FadeIn delay={0.1}>
              <FaqAccordion />
            </FadeIn>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-4 sm:pb-24">
          <FadeIn>
            <div className="relative overflow-hidden rounded-lg bg-brand-gradient px-6 py-16 text-center text-white shadow-card sm:px-12 sm:py-20">
              <div className="relative mx-auto max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-100">
                  Dołącz do mLegitymacja24
                </p>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl">
                  Zacznij wystawiać legitymacje, którym można ufać
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-brand-100/90">
                  Rejestracja firmy zajmie Ci kilka minut. A jeśli masz pytania —
                  napisz do nas, chętnie pomożemy.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/rejestracja-firmy"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-8 py-3.5 text-sm font-bold text-brand-800 transition-all duration-300 hover:bg-brand-50 sm:w-auto"
                  >
                    Zarejestruj firmę
                  </Link>
                  <Link
                    href="/kontakt"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/10 sm:w-auto"
                  >
                    Napisz do nas
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>
      <Footer />
    </>
  );
}
