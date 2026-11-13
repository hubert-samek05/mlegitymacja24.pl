"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const paperPoints = [
  { text: "Łatwa do podrobienia lub zgubienia" },
  { text: "Druk i wysyłka zajmują dni, nie sekundy" },
  { text: "Unieważnionej legitymacji nie da się „odwołać” z czyjejś kieszeni" },
  { text: "Sprawdzenie dokumentu wymaga telefonu do wystawcy" },
];

const digitalPoints = [
  { text: "Wystawiona i dostępna w mniej niż minutę" },
  { text: "Dynamiczny kod QR, którego nie da się skopiować" },
  { text: "Unieważnienie widoczne natychmiast — wszędzie" },
  { text: "Weryfikacja w przeglądarce, bez dzwonienia i czekania" },
];

export function ComparisonSwitch() {
  const [mode, setMode] = useState<"paper" | "digital">("digital");
  const points = mode === "paper" ? paperPoints : digitalPoints;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-ink/10 bg-white p-1 shadow-card">
        <button
          onClick={() => setMode("paper")}
          className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300 ${
            mode === "paper" ? "text-paper" : "text-ink-mute hover:text-ink"
          }`}
        >
          {mode === "paper" && (
            <motion.span
              layoutId="comparison-pill"
              className="absolute inset-0 rounded-full bg-ink-mute"
              transition={{ type: "spring", duration: 0.55, bounce: 0.15 }}
            />
          )}
          <span className="relative z-10">Papierowa legitymacja</span>
        </button>
        <button
          onClick={() => setMode("digital")}
          className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300 ${
            mode === "digital" ? "text-paper" : "text-ink-mute hover:text-ink"
          }`}
        >
          {mode === "digital" && (
            <motion.span
              layoutId="comparison-pill"
              className="absolute inset-0 rounded-full bg-brand-gradient"
              transition={{ type: "spring", duration: 0.55, bounce: 0.15 }}
            />
          )}
          <span className="relative z-10">mLegitymacja24</span>
        </button>
      </div>

      <div className="relative mt-8 min-h-[220px] overflow-hidden rounded-lg border border-ink/[0.08] bg-white p-8 shadow-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-5 sm:grid-cols-2"
          >
            {points.map((point) => (
              <div key={point.text} className="flex items-start gap-3">
                <span className={`mt-2 h-px w-4 shrink-0 ${mode === "paper" ? "bg-ink-mute" : "bg-accent-500"}`} />
                <p className="text-sm leading-relaxed text-ink">{point.text}</p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
