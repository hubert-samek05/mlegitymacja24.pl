"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { apiGet } from "@/lib/api";
import { absolwentNavItems } from "@/lib/absolwentNav";

interface VerificationLog {
  id: string;
  result: "VALID" | "EXPIRED" | "REVOKED" | "NOT_FOUND" | "SUSPENDED";
  ipAddress: string | null;
  location: string | null;
  verifiedAt: string;
  credential: {
    credentialNumber: string;
    companyNumber: string | null;
    securityCode: string | null;
    credentialType: { name: string };
  } | null;
}

const resultMeta: Record<
  VerificationLog["result"],
  { label: string; className: string }
> = {
  VALID: {
    label: "Zweryfikowana",
    className: "text-emerald-600",
  },
  EXPIRED: {
    label: "Wygasła",
    className: "text-amber-600",
  },
  REVOKED: {
    label: "Unieważniona",
    className: "text-red-600",
  },
  SUSPENDED: {
    label: "Zawieszona",
    className: "text-accent-600",
  },
  NOT_FOUND: {
    label: "Nie znaleziono",
    className: "text-ink-mute",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoriaPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiGet<VerificationLog[]>("/verify/my-history")
      .then(setLogs)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Nie udało się pobrać historii")
      )
      .finally(() => setLoading(false));
  }, [user]);

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-ink-mute">
        Ładowanie...
      </div>
    );
  }

  return (
    <PanelShell
      navItems={absolwentNavItems}
      activeHref="/panel/absolwent/historia"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle="Portfel absolwenta"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-600">
        Historia
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Historia weryfikacji
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Każde skanowanie Twoich legitymacji — data, wynik i lokalizacja.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-ink/[0.06]" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-lg border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
          <h2 className="mt-5 font-display text-xl font-semibold text-ink">
            Brak weryfikacji
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
            Gdy ktoś zeskanuje kod QR Twojej legitymacji, zobaczysz tutaj wpis
            z datą i wynikiem kontroli.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {logs.map((log) => {
            const meta = resultMeta[log.result];
            return (
              <div
                key={log.id}
                className="flex items-center gap-4 rounded-lg border border-ink/10 bg-white px-5 py-4 shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {log.credential?.credentialType.name ?? "Legitymacja"}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-ink-mute">
                    {log.credential ? log.credential.companyNumber ?? log.credential.credentialNumber : "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-xs font-semibold ${meta.className}`}>
                    {meta.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-mute">
                    {formatDate(log.verifiedAt)}
                  </p>
                  {log.location && (
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-ink-mute">
                      {log.location}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}
