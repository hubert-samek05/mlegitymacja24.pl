import Image from "next/image";
import { ImagePlus } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Pionowa ramka telefonu. Przekaż `src` (np. "/screens/portfel.png"),
 * aby wyświetlić prawdziwy zrzut ekranu aplikacji, albo `children`
 * z własną zawartością. Bez nich renderuje elegancki placeholder.
 */
export function PhoneFrame({
  src,
  alt = "Zrzut ekranu aplikacji mLegitymacja24",
  label = "Zrzut ekranu aplikacji",
  hint = "Dodaj plik do /public/screens",
  children,
  className = "",
}: {
  src?: string;
  alt?: string;
  label?: string;
  hint?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-[270px] shrink-0 rounded-[2.6rem] border border-ink/15 bg-ink p-[10px] shadow-phone sm:w-[290px] ${className}`}
    >
      {/* notch */}
      <div className="absolute left-1/2 top-[10px] z-20 h-[22px] w-[100px] -translate-x-1/2 rounded-b-2xl bg-ink" />

      <div className="relative aspect-[9/19.4] overflow-hidden rounded-[2rem] bg-paper">
        {src ? (
          <Image src={src} alt={alt} fill className="object-cover" sizes="290px" />
        ) : children ? (
          children
        ) : (
          <div className="relative flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-cream via-paper to-brand-50 px-6 text-center">
            <div className="absolute inset-3 rounded-[1.6rem] border border-dashed border-ink/15" />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/[0.06]">
              <ImagePlus className="h-6 w-6 text-ink-mute" strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-mute">{hint}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
