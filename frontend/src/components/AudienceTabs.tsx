"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Audience {
  key: string;
  title: string;
  description: string;
  points: string[];
}

const audiences: Audience[] = [
  {
    key: "firmy",
    title: "Firmy szkoleniowe",
    description:
      "Wystawiasz i zarządzasz legitymacjami absolwentów z jednego, prostego panelu. Masz pełną kontrolę nad każdym wydanym uprawnieniem — od wystawienia po unieważnienie.",
    points: [
      "Dodawanie absolwentów pojedynczo lub masowo",
      "Własne typy legitymacji dopasowane do Twojej branży",
      "Historia weryfikacji każdej wydanej legitymacji",
    ],
  },
  {
    key: "absolwenci",
    title: "Absolwenci",
    description:
      "Wszystkie Twoje legitymacje zawodowe w jednym miejscu — w telefonie, który i tak masz zawsze przy sobie. Gotowe do okazania w każdej chwili.",
    points: [
      "Cyfrowy portfel dostępny z każdego telefonu",
      "Tryb prezentacji stworzony do okazywania dokumentu",
      "Przypomnienia o zbliżającym się końcu ważności",
    ],
  },
  {
    key: "weryfikujacy",
    title: "Osoby weryfikujące",
    description:
      "Skanujesz kod i od razu wiesz, czy legitymacja jest autentyczna i ważna. Bez zakładania konta, bez instalowania czegokolwiek.",
    points: [
      "Weryfikacja w przeglądarce — wystarczy aparat w telefonie",
      "Widzisz tylko to, co niezbędne do sprawdzenia dokumentu",
      "Dynamiczny kod chroni przed podróbkami i zrzutami ekranu",
    ],
  },
];

export function AudienceTabs() {
  const [active, setActive] = useState(audiences[0].key);
  const current = audiences.find((a) => a.key === active) ?? audiences[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {audiences.map((audience) => {
          const isActive = audience.key === active;
          return (
            <button
              key={audience.key}
              onClick={() => setActive(audience.key)}
              className={`relative flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-300 ${
                isActive
                  ? "border-transparent text-white"
                  : "border-ink/15 bg-white text-ink-soft hover:border-brand-300 hover:text-ink"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="audience-pill"
                  className="absolute inset-0 rounded-full bg-brand-gradient"
                  transition={{ type: "spring", duration: 0.55, bounce: 0.15 }}
                />
              )}
              <span className="relative z-10">{audience.title}</span>
            </button>
          );
        })}
      </div>

      <div className="relative mt-8 min-h-[260px] overflow-hidden rounded-lg border border-ink/[0.08] bg-white p-8 shadow-card sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-10 md:items-center"
          >
            <div>
              <p className="font-display text-sm font-semibold text-accent-600">{current.title}</p>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                {current.description}
              </p>
              <ul className="mt-6 space-y-3">
                {current.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-ink">
                    <span className="mt-2 h-px w-4 shrink-0 bg-accent-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
