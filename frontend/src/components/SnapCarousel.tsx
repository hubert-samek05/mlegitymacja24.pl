"use client";

import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Karuzela scroll-snap dla urządzeń mobilnych.
 * Każde dziecko to jeden slajd na pełną szerokość.
 * `dark` — wariant na ciemnym tle (jasne strzałki i kropki).
 */
export function SnapCarousel({
  children,
  dark = false,
  ariaLabel = "Karuzela",
}: {
  children: ReactNode[];
  dark?: boolean;
  ariaLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = children.length;

  const scrollTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(count - 1, i));
      track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    },
    [count]
  );

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  const arrowClass = dark
    ? "border-white/20 bg-white/10 text-paper hover:bg-white/20"
    : "border-ink/10 bg-white/90 text-ink shadow-card hover:bg-white";
  const dotActive = dark ? "bg-accent-300" : "bg-accent-500";
  const dotIdle = dark ? "bg-white/25" : "bg-ink/15";

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={ariaLabel}
        role="region"
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="flex w-full shrink-0 snap-center justify-center px-2"
          >
            {child}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            onClick={() => scrollTo(index - 1)}
            disabled={index === 0}
            aria-label="Poprzedni slajd"
            className={`absolute -left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur transition-all disabled:opacity-0 ${arrowClass}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollTo(index + 1)}
            disabled={index === count - 1}
            aria-label="Następny slajd"
            className={`absolute -right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur transition-all disabled:opacity-0 ${arrowClass}`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mt-7 flex items-center justify-center gap-2">
            {children.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                aria-label={`Slajd ${i + 1} z ${count}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? `w-6 ${dotActive}` : `w-1.5 ${dotIdle}`
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
