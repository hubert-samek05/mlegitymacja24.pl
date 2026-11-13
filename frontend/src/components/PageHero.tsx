import Image from "next/image";
import { FadeIn } from "./motion/FadeIn";

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt = "mLegitymacja24",
}: {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-paper">
      {image ? (
        <>
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* ciepły gradient — tekst zostaje czytelny, zdjęcie wyłania się z prawej */}
          <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/90 to-paper/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-paper/80 via-transparent to-paper/30" />
        </>
      ) : (
        <>
        </>
      )}
      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-20 sm:pb-20 sm:pt-24">
        <FadeIn className="max-w-2xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600 sm:text-xs">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-[1.8rem] font-semibold leading-[1.15] tracking-tight text-ink text-balance sm:mt-5 sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft text-pretty sm:mt-6 sm:text-lg">
            {description}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
