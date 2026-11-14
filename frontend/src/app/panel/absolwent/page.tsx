"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { apiGet, API_URL } from "@/lib/api";
import { mrz } from "@/lib/credential";
import { Guilloche } from "@/components/SecurityDecor";
import { QrCode } from "lucide-react";
import { absolwentNavItems } from "@/lib/absolwentNav";

interface Credential {
  id: string;
  credentialNumber: string;
  companyNumber: string | null;
  securityCode: string | null;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";
  issueDate: string;
  expiryDate: string | null;
  credentialType: { name: string };
  company: { name: string; logoUrl: string | null };
  photoUrl: string | null;
}

const API_HOST = API_URL.replace(/\/api$/, "");

function resolvePhoto(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_HOST}${url}`;
}

const statusMeta: Record<
  Credential["status"],
  { label: string; dot: string; text: string }
> = {
  ACTIVE: { label: "Ważna", dot: "bg-emerald-500", text: "text-emerald-600" },
  EXPIRED: { label: "Wygasła", dot: "bg-amber-500", text: "text-amber-600" },
  REVOKED: { label: "Unieważniona", dot: "bg-red-500", text: "text-red-600" },
  SUSPENDED: { label: "Zawieszona", dot: "bg-ink-mute", text: "text-ink-mute" },
};

const filters = [
  { value: "ALL", label: "Wszystkie" },
  { value: "ACTIVE", label: "Ważne" },
  { value: "EXPIRED", label: "Wygasłe" },
  { value: "REVOKED", label: "Unieważnione" },
] as const;

export default function AbsolwentPanelPage() {
  const { user, loading: userLoading } = useCurrentUser(["HOLDER"]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("ALL");

  useEffect(() => {
    if (!user) return;
    apiGet<Credential[]>("/credentials/my")
      .then(setCredentials)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Nie udało się pobrać legitymacji")
      )
      .finally(() => setLoading(false));
  }, [user]);

  const visible = useMemo(
    () =>
      filter === "ALL"
        ? credentials
        : credentials.filter((c) => c.status === filter),
    [credentials, filter]
  );

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
      activeHref="/panel/absolwent"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle="Portfel absolwenta"
    >
      {/* ===== nagłówek ===== */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-600">
            Portfel
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Witaj, {user.firstName}
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Twoje legitymacje zawodowe — zawsze pod ręką.
          </p>
        </div>
        {!loading && credentials.length > 0 && (
          <span className="hidden shrink-0 rounded-md border border-ink/10 bg-white px-4 py-1.5 text-xs font-semibold text-ink-soft shadow-sm sm:block">
            {credentials.length}{" "}
            {credentials.length === 1
              ? "legitymacja"
              : credentials.length < 5
                ? "legitymacje"
                : "legitymacji"}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ===== filtry ===== */}
      {!loading && credentials.length > 0 && (
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                filter === f.value
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/10 bg-white text-ink-soft hover:border-ink/25 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ===== lista legitymacji ===== */}
      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-xl bg-ink/[0.06]"
            />
          ))}
        </div>
      ) : credentials.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-lg border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
          <h2 className="mt-5 font-display text-xl font-semibold text-ink">
            Portfel jest pusty
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
            Gdy firma szkoleniowa wystawi Ci legitymację, pojawi się tutaj
            automatycznie — gotowa do okazania.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-mute">
          Brak legitymacji w tej kategorii.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((credential) => (
            <Link
              key={credential.id}
              href={`/panel/absolwent/${credential.id}`}
              className={`group block overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-950/10 ${
                credential.status !== "ACTIVE" ? "opacity-80" : ""
              }`}
            >
              {/* pasek dokumentu */}
              <div className="relative flex items-center justify-between overflow-hidden bg-brand-950 px-4 py-2.5">
                <Guilloche className="absolute inset-0 h-full w-full text-brand-300/20" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-white.png"
                  alt=""
                  className="relative h-3.5 w-auto opacity-95"
                />
                <span className="relative flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${statusMeta[credential.status].dot}`}
                  />
                  <span className="text-paper/90">
                    {statusMeta[credential.status].label}
                  </span>
                </span>
              </div>

              {/* korpus */}
              <div className="p-4">
                <div className="flex gap-4">
                  {/* miniaturka zdjęcia */}
                  <div className="h-[68px] w-[52px] shrink-0 overflow-hidden rounded border border-ink/15 bg-paper">
                    {resolvePhoto(credential.photoUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolvePhoto(credential.photoUrl)!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-950 font-display text-sm font-semibold text-paper">
                        {`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
                      Legitymacja zawodowa
                    </p>
                    <h3 className="mt-0.5 break-words font-display text-[15px] font-semibold leading-snug text-ink">
                      {credential.credentialType.name}
                    </h3>
                    <p className="mt-1 truncate text-xs text-ink-soft">
                      {credential.company.name}
                    </p>
                    <p className="mt-1 text-[10px] text-ink-mute">
                      {credential.expiryDate
                        ? `Ważna do ${new Date(credential.expiryDate).toLocaleDateString("pl-PL")}`
                        : "Ważna bezterminowo"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <span className="flex items-center gap-1.5 rounded-md border border-ink/15 bg-paper px-2.5 py-1.5 text-[10px] font-semibold text-ink transition-colors group-hover:border-accent-500/50 group-hover:text-accent-600">
                    <QrCode className="h-3 w-3" />
                    Okaż
                  </span>
                </div>
              </div>

              {/* strefa MRZ */}
              <div className="border-t border-ink/10 bg-[#eef1f6] px-4 py-2">
                <p className="truncate font-mono text-[9.5px] tracking-[0.12em] text-ink-mute">
                  {mrz(`ML24<${user.lastName}<<${user.firstName}`, 30)}
                </p>
                <p className="mt-0.5 truncate font-mono text-[9.5px] tracking-[0.12em] text-ink-mute">
                  {mrz(
                    `${credential.companyNumber ?? credential.credentialNumber}<${
                      (credential.securityCode ?? "").replace(/-/g, "")
                    }`,
                    30
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
