import { FadeIn } from "./motion/FadeIn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
}) {
  const alignClass = align === "center" ? "mx-auto text-center items-center" : "text-left items-start";
  return (
    <FadeIn className={`flex max-w-2xl flex-col ${alignClass} ${className}`}>
      <p
        className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] ${
          dark ? "text-brand-200" : "text-accent-600"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-5 font-display text-3xl font-semibold leading-[1.18] tracking-tight sm:text-4xl ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${
            dark ? "text-brand-100/80" : "text-ink-soft"
          }`}
        >
          {description}
        </p>
      )}
    </FadeIn>
  );
}
