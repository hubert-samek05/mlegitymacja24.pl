"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { companyNavItems } from "@/lib/companyNav";
import { apiGet } from "@/lib/api";

interface VerificationLog {
  id: string;
  result: "VALID" | "EXPIRED" | "REVOKED" | "NOT_FOUND" | "SUSPENDED";
  ipAddress: string | null;
  location: string | null;
  verifiedAt: string;
  credential: {
    credentialNumber: string;
    credentialType: { name: string };
    holder: { user: { firstName: string; lastName: string } };
  } | null;
}

const resultLabels: Record<VerificationLog["result"], string> = {
  VALID: "Pozytywna",
  EXPIRED: "Dokument wygasł",
  REVOKED: "Dokument unieważniony",
  NOT_FOUND: "Nie znaleziono",
  SUSPENDED: "Dokument zawieszony",
};

const resultStyles: Record<VerificationLog["result"], string> = {
  VALID: "bg-emerald-100 text-emerald-800",
  EXPIRED: "bg-amber-100 text-amber-800",
  REVOKED: "bg-red-100 text-red-800",
  NOT_FOUND: "bg-ink/[0.07] text-ink-soft",
  SUSPENDED: "bg-ink/[0.07] text-ink-soft",
};

export default function WeryfikacjePage() {
  const { user, loading: userLoading } = useCurrentUser(["COMPANY_ADMIN", "COMPANY_STAFF"]);
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiGet<VerificationLog[]>("/credentials/company/verifications")
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : "Nie udało się pobrać historii"))
      .finally(() => setLoading(false));
  }, [user]);

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-ink-soft">Ładowanie...</div>;
  }

  return (
    <PanelShell
      navItems={companyNavItems}
      activeHref="/panel/firma/weryfikacje"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle={user.company?.name ?? "Firma"}
    >
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Historia weryfikacji</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Każde skanowanie kodu QR legitymacji wystawionej przez Twoją organizację — widzisz, kto, kiedy i gdzie weryfikował dokument.
      </p>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-8 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-cream/60 text-left text-ink-mute">
            <tr>
              <th className="px-6 py-3 font-medium">Data</th>
              <th className="px-6 py-3 font-medium">Absolwent</th>
              <th className="px-6 py-3 font-medium">Zawód</th>
              <th className="px-6 py-3 font-medium">Wynik</th>
              <th className="px-6 py-3 font-medium">Lokalizacja</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-ink-mute">Ładowanie...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-ink-mute">Brak weryfikacji — żadna legitymacja nie została jeszcze zeskanowana.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-ink/5">
                  <td className="px-6 py-4 text-ink-soft">
                    {new Date(log.verifiedAt).toLocaleString("pl-PL")}
                  </td>
                  <td className="px-6 py-4 font-medium text-ink">
                    {log.credential
                      ? `${log.credential.holder.user.firstName} ${log.credential.holder.user.lastName}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-ink-soft">{log.credential?.credentialType.name ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${resultStyles[log.result]}`}>
                      {resultLabels[log.result]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink-soft">{log.location ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}
