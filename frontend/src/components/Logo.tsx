import Image from "next/image";

export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={`group flex items-center ${className}`}>
      <Image
        src="/logo-v2.png"
        alt="mLegitymacja24"
        width={1650}
        height={203}
        priority
        className={`h-6 w-auto transition-transform duration-300 group-hover:scale-[1.02] sm:h-6 lg:h-6 ${
          light ? "brightness-0 invert" : ""
        }`}
      />
    </div>
  );
}
