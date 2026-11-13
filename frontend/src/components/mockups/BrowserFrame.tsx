import { Lock } from "lucide-react";
import type { ReactNode } from "react";

export function BrowserFrame({
  children,
  url = "app.mlegitymacja24.pl",
  className = "",
}: {
  children: ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-ink/10 bg-white shadow-card-lg ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-ink/10 bg-paper px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        </div>
        <div className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-ink/[0.04] px-3 py-1 text-[11px] text-ink-mute">
          <Lock className="h-3 w-3" />
          {url}
        </div>
        <div className="w-10" />
      </div>
      <div className="bg-paper">{children}</div>
    </div>
  );
}
