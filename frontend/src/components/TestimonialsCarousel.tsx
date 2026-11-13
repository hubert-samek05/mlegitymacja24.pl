"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  org: string;
  initials: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Wystawiamy legitymacje kosmetologom i fryzjerom w kilkanaście sekund. Wcześniej papierowe druki i pieczątki zajmowały nam całe popołudnia miesięcznie.",
    name: "Magdalena Krawczyk",
    role: "Dyrektor szkoły branżowej",
    org: "Centrum Edukacji Zawodowej",
    initials: "MK",
  },
  {
    quote:
      "Jako specjalista SEO często muszę potwierdzać swoje certyfikaty klientom. Teraz wystarczy pokazać telefon — kod QR i po sprawie.",
    name: "Tomasz Górski",
    role: "Absolwent, Specjalista SEO",
    org: "Akademia Marketingu Cyfrowego",
    initials: "TG",
  },
  {
    quote:
      "Weryfikacja uprawnień pierwszej pomocy naszych trenerów zajmuje dosłownie 3 sekundy skanowania. Zero telefonów do wystawcy, zero wątpliwości.",
    name: "Aleksandra Lis",
    role: "Kierownik działu HR",
    org: "Sieć klubów fitness",
    initials: "AL",
  },
  {
    quote:
      "Zarządzamy legitymacjami dla ponad 200 absolwentów kilku kierunków jednocześnie. Panel firmy daje nam pełną kontrolę i historię każdej z nich.",
    name: "Robert Sikora",
    role: "Właściciel",
    org: "Instytut Terapii Zajęciowej",
    initials: "RS",
  },
];

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  function go(direction: 1 | -1) {
    setIndex((prev) => (prev + direction + testimonials.length) % testimonials.length);
  }

  const current = testimonials[index];

  return (
    <div className="relative mx-auto max-w-3xl">
      <span className="mx-auto block w-fit font-display text-6xl leading-none text-brand-300">
        &bdquo;
      </span>
      <div className="relative mt-2 min-h-[190px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <p className="font-display text-xl font-semibold leading-relaxed text-ink sm:text-2xl">
              {current.quote}&rdquo;
            </p>
            <div className="mt-7 flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-brand-50 font-display text-sm font-semibold text-brand-700">
                {current.initials}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">{current.name}</p>
                <p className="text-xs text-ink-mute">
                  {current.role} · {current.org}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={() => go(-1)}
          aria-label="Poprzednia opinia"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-2">
          {testimonials.map((testimonial, dotIndex) => (
            <button
              key={testimonial.name}
              onClick={() => setIndex(dotIndex)}
              aria-label={`Pokaż opinię: ${testimonial.name}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                dotIndex === index ? "w-6 bg-ink" : "w-1.5 bg-ink/20 hover:bg-ink/40"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          aria-label="Następna opinia"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
