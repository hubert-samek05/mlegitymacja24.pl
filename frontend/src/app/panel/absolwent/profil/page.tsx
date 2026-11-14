"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { apiGet, apiPatch, API_URL } from "@/lib/api";
import { absolwentNavItems } from "@/lib/absolwentNav";

const API_HOST = API_URL.replace(/\/api$/, "");

interface MeProfile {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  holderProfile: {
    photoUrl: string | null;
    dateOfBirth: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
  } | null;
}

const initialForm = {
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

export default function ProfilPage() {
  const { user, loading: userLoading } = useCurrentUser(["HOLDER"]);
  const [form, setForm] = useState(initialForm);
  const [identity, setIdentity] = useState({ firstName: "", lastName: "", dateOfBirth: "" });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiGet<MeProfile>("/users/me")
      .then((me) => {
        setEmail(me.email);
        setPhotoUrl(me.holderProfile?.photoUrl ?? null);
        setIdentity({
          firstName: me.firstName ?? "",
          lastName: me.lastName ?? "",
          dateOfBirth: me.holderProfile?.dateOfBirth
            ? me.holderProfile.dateOfBirth.slice(0, 10)
            : "",
        });
        setForm({
          phone: me.phone ?? "",
          address: me.holderProfile?.address ?? "",
          city: me.holderProfile?.city ?? "",
          postalCode: me.holderProfile?.postalCode ?? "",
        });
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Nie udało się pobrać profilu")
      )
      .finally(() => setLoading(false));
  }, [user]);

  function update(field: keyof typeof initialForm, value: string) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiPatch("/users/me", {
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        postalCode: form.postalCode || null,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać zmian");
    } finally {
      setSaving(false);
    }
  }

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-ink-mute">
        Ładowanie...
      </div>
    );
  }

  const photoSrc = photoUrl
    ? photoUrl.startsWith("http")
      ? photoUrl
      : `${API_HOST}${photoUrl}`
    : null;
  const initials = `${identity.firstName[0] ?? ""}${identity.lastName[0] ?? ""}`.toUpperCase();

  return (
    <PanelShell
      navItems={absolwentNavItems}
      activeHref="/panel/absolwent/profil"
      userLabel={`${user.firstName} ${user.lastName}`}
      userSubtitle="Portfel absolwenta"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-600">
        Profil
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Moje dane
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Dane widoczne na Twoich legitymacjach i dane kontaktowe konta.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-8 h-96 animate-pulse rounded-lg bg-ink/[0.06]" />
      ) : (
        <div className="mt-8 max-w-2xl space-y-6">
          {/* zdjęcie + email */}
          <div className="flex items-center gap-5 rounded-lg border border-ink/10 bg-white p-6 shadow-card">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-paper">
              {photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoSrc} alt="Zdjęcie profilowe" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-gradient font-display text-2xl font-semibold text-paper">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold text-ink">
                {identity.firstName} {identity.lastName}
              </p>
              <p className="mt-0.5 truncate text-sm text-ink-soft">{email}</p>
              <p className="mt-1.5 text-[11px] text-ink-mute">
                Zdjęcie na legitymację dodaje firma szkoleniowa
              </p>
            </div>
          </div>

          {/* dane tożsamości — tylko do odczytu */}
          <fieldset className="space-y-4 rounded-lg border border-ink/10 bg-white p-6 shadow-card sm:p-7">
            <legend className="sr-only">Dane tożsamości</legend>
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-lg font-semibold text-ink">Dane tożsamości</p>
              <span className="flex items-center gap-1.5 rounded-md bg-ink/[0.05] px-3 py-1 text-[11px] font-semibold text-ink-mute">
                Tylko do odczytu
              </span>
            </div>
            <p className="text-xs leading-relaxed text-ink-mute">
              Imię, nazwisko i data urodzenia widnieją na Twoich legitymacjach —
              ustala je firma szkoleniowa przy wystawianiu dokumentu. Jeśli dane
              są błędne, skontaktuj się z organizacją, która wydała legitymację.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Imię" value={identity.firstName} />
              <ReadOnlyField label="Nazwisko" value={identity.lastName} />
            </div>
            <ReadOnlyField
              label="Data urodzenia"
              value={
                identity.dateOfBirth
                  ? new Date(identity.dateOfBirth).toLocaleDateString("pl-PL")
                  : "—"
              }
            />
          </fieldset>

          {/* dane kontaktowe — edytowalne */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset className="space-y-4 rounded-lg border border-ink/10 bg-white p-6 shadow-card sm:p-7">
              <legend className="sr-only">Dane kontaktowe</legend>
              <p className="font-display text-lg font-semibold text-ink">Dane kontaktowe</p>
              <Field label="Telefon" type="tel" value={form.phone} onChange={(v) => update("phone", v)} />
              <Field label="Ulica i numer" value={form.address} onChange={(v) => update("address", v)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Kod pocztowy" value={form.postalCode} onChange={(v) => update("postalCode", v)} />
                <Field label="Miasto" value={form.city} onChange={(v) => update("city", v)} />
              </div>
            </fieldset>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-brand-gradient px-8 py-3.5 text-sm font-semibold text-paper transition-all duration-300 hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "Zapisywanie..." : "Zapisz zmiany"}
              </button>
              {saved && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  Zapisano
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </PanelShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-ink/15 bg-paper px-4 py-3 text-sm transition-colors focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/20"
      />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-mute">{label}</label>
      <div className="mt-1.5 flex items-center justify-between rounded-md border border-ink/10 bg-ink/[0.03] px-4 py-3 text-sm text-ink">
        {value || "—"}
      </div>
    </div>
  );
}
