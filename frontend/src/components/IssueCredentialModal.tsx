"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ImagePlus, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import { requestSubscriptionPopup } from "./SubscriptionGate";
import { apiPost, apiUpload } from "@/lib/api";

export interface CredentialType {
  id: string;
  name: string;
  category: string | null;
  defaultValidityMonths: number | null;
}

export interface NewAccountInfo {
  email: string;
  temporaryPassword: string;
}

const initialForm = {
  companyNumber: "",
  holderFirstName: "",
  holderLastName: "",
  holderEmail: "",
  holderPhone: "",
  holderDateOfBirth: "",
  holderPlaceOfBirth: "",
  issueDate: new Date().toISOString().slice(0, 10),
};

const initialTypeRequest = { name: "", category: "", description: "", defaultValidityMonths: 24 };

type ExpiryMode = "DEFAULT" | "DATE" | "NONE";

export function IssueCredentialModal({
  open,
  onClose,
  types,
  onIssued,
}: {
  open: boolean;
  onClose: () => void;
  types: CredentialType[];
  onIssued: () => Promise<void>;
}) {
  const [form, setForm] = useState(initialForm);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [expiryMode, setExpiryMode] = useState<ExpiryMode>("DEFAULT");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState<NewAccountInfo | null>(null);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);

  const [typeQuery, setTypeQuery] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const typeBoxRef = useRef<HTMLDivElement>(null);

  const [typeRequestOpen, setTypeRequestOpen] = useState(false);
  const [typeRequest, setTypeRequest] = useState(initialTypeRequest);
  const [typeRequestSending, setTypeRequestSending] = useState(false);
  const [typeRequestSent, setTypeRequestSent] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (typeBoxRef.current && !typeBoxRef.current.contains(e.target as Node)) setTypeOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setError(null);
      setNewAccount(null);
      setExistingEmail(null);
      setTypeRequestSent(null);
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }, [open]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  function pickPhoto(file: File | null) {
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  const groupedTypes = useMemo(() => {
    const q = typeQuery.trim().toLowerCase();
    const list = q ? types.filter((t) => t.name.toLowerCase().includes(q)) : types;
    const groups = new Map<string, CredentialType[]>();
    for (const t of list) {
      const cat = t.category ?? "Inne";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(t);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, "pl"));
  }, [types, typeQuery]);

  const selectedType = types.find((t) => t.id === selectedTypeId);

  function update(field: keyof typeof initialForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTypeId) {
      setError("Wybierz zawód z listy.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setNewAccount(null);
    setExistingEmail(null);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        const uploaded = await apiUpload<{ photoUrl: string }>("/credentials/photo", fd);
        photoUrl = uploaded.photoUrl;
      }
      const created = await apiPost<{ holderAccount: { email: string; temporaryPassword?: string; isNewAccount: boolean } }>(
        "/credentials",
        {
          ...form,
          credentialTypeId: selectedTypeId,
          noExpiry: expiryMode === "NONE",
          expiryDate: expiryMode === "DATE" && expiryDate ? expiryDate : undefined,
          photoUrl,
        },
        true
      );
      if (created.holderAccount.isNewAccount && created.holderAccount.temporaryPassword) {
        setNewAccount({ email: created.holderAccount.email, temporaryPassword: created.holderAccount.temporaryPassword });
      }
      setForm(initialForm);
      setSelectedTypeId("");
      setExpiryMode("DEFAULT");
      setExpiryDate("");
      await onIssued();
      if (!created.holderAccount.isNewAccount) setExistingEmail(created.holderAccount.email);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Nie udało się wystawić legitymacji";
      setError(msg);
      if (/subskrypcj|aktywne|limit/i.test(msg)) requestSubscriptionPopup();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTypeRequest() {
    if (!typeRequest.name.trim()) return;
    setTypeRequestSending(true);
    setError(null);
    try {
      await apiPost("/credential-types/requests", {
        name: typeRequest.name,
        category: typeRequest.category || undefined,
        description: typeRequest.description || undefined,
        defaultValidityMonths: typeRequest.defaultValidityMonths,
      });
      setTypeRequestSent(typeRequest.name);
      setTypeRequest(initialTypeRequest);
      setTypeRequestOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać zgłoszenia");
    } finally {
      setTypeRequestSending(false);
    }
  }

  const inputCls = "mt-1.5 w-full rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Wystaw nową legitymację"
      subtitle="Wpisz dane absolwenta — jeśli nie ma konta, utworzymy je automatycznie i podamy hasło tymczasowe."
      wide
    >
      {newAccount ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-semibold text-emerald-900">Legitymacja wystawiona — utworzono konto absolwenta</p>
            <p className="mt-2 text-sm text-emerald-800">
              Przekaż absolwentowi dane do pierwszego logowania:
            </p>
            <div className="mt-3 space-y-1 rounded-md bg-white/70 p-4 font-mono text-sm text-ink">
              <p>E-mail: {newAccount.email}</p>
              <p>Hasło tymczasowe: {newAccount.temporaryPassword}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setNewAccount(null)}
              className="flex-1 rounded-md border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              Wystaw kolejną
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-paper transition-all hover:brightness-110"
            >
              Zamknij
            </button>
          </div>
        </div>
      ) : existingEmail ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-display text-base font-semibold text-emerald-900">Legitymacja wystawiona</p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-900/80">
              Absolwent ma już konto pod adresem <strong>{existingEmail}</strong>, dlatego nie tworzymy nowego — legitymacja trafiła bezpośrednio do jego portfela i została wysłana powiadomieniem.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setExistingEmail(null)} className="flex-1 rounded-md border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5">Wystaw kolejną</button>
            <button onClick={onClose} className="flex-1 rounded-md bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Zamknij</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {typeRequestSent && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Zgłoszono zawód „{typeRequestSent}” — pojawi się w katalogu po weryfikacji administratora.
            </p>
          )}

          {/* zawód */}
          <div ref={typeBoxRef} className="relative">
            <label className="block text-sm font-medium text-ink">Zawód / kategoria legitymacji</label>
            <button
              type="button"
              onClick={() => setTypeOpen((o) => !o)}
              className="mt-1.5 flex w-full items-center justify-between rounded-md border border-ink/15 bg-white px-4 py-2.5 text-left text-sm transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            >
              <span className={selectedType ? "text-ink" : "text-ink-mute"}>
                {selectedType ? selectedType.name : "Wybierz zawód z listy..."}
              </span>
              <ChevronDown className="h-4 w-4 text-ink-mute" />
            </button>

            {typeOpen && (
              <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-md border border-ink/15 bg-white shadow-lg">
                <div className="border-b border-ink/10 p-2">
                  <input
                    autoFocus
                    value={typeQuery}
                    onChange={(e) => setTypeQuery(e.target.value)}
                    placeholder="Wpisz, aby wyszukać zawód..."
                    className="w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {groupedTypes.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-ink-mute">Nie znaleziono zawodu — możesz zgłosić własny poniżej.</p>
                  ) : (
                    groupedTypes.map(([category, items]) => (
                      <div key={category}>
                        <p className="sticky top-0 bg-cream/90 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-mute backdrop-blur-sm">
                          {category}
                        </p>
                        {items.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => { setSelectedTypeId(t.id); setTypeOpen(false); setTypeQuery(""); }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent-50 ${
                              selectedTypeId === t.id ? "bg-accent-50 font-semibold text-accent-700" : "text-ink"
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {selectedType && (
              <p className="mt-1 text-xs text-ink-mute">
                Kategoria: {selectedType.category ?? "Inne"} · domyślna ważność: {selectedType.defaultValidityMonths ? `${selectedType.defaultValidityMonths} mies.` : "bezterminowo"}
              </p>
            )}

            <button
              type="button"
              onClick={() => setTypeRequestOpen((o) => !o)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-600 hover:underline"
            >
              Nie ma zawodu na liście? Zgłoś własny
            </button>

            {typeRequestOpen && (
              <div className="mt-3 space-y-3 rounded-md border border-accent-200 bg-accent-50/50 p-4">
                <p className="text-xs leading-relaxed text-ink-soft">
                  Zgłoszenie trafi do weryfikacji administratora platformy — po akceptacji zawód pojawi się w katalogu.
                </p>
                <input
                  value={typeRequest.name}
                  onChange={(e) => setTypeRequest((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nazwa zawodu, np. Instruktor wspinaczki"
                  className={inputCls}
                />
                <input
                  value={typeRequest.category}
                  onChange={(e) => setTypeRequest((p) => ({ ...p, category: e.target.value }))}
                  placeholder="Kategoria (opcjonalnie)"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={handleTypeRequest}
                  disabled={typeRequestSending || !typeRequest.name.trim()}
                  className="w-full rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-500 disabled:opacity-60"
                >
                  {typeRequestSending ? "Wysyłanie..." : "Wyślij zgłoszenie"}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Numer legitymacji</label>
            <input required value={form.companyNumber} onChange={(e) => update("companyNumber", e.target.value)} className={inputCls} placeholder="Numer nadawany przez Twoją firmę, np. 123/2026" />
            <p className="mt-1 text-xs text-ink-mute">Identyfikator mLegitymacji (16 znaków) zostanie nadany automatycznie.</p>
          </div>

          {/* dane absolwenta */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Imię absolwenta</label>
              <input required value={form.holderFirstName} onChange={(e) => update("holderFirstName", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Nazwisko absolwenta</label>
              <input required value={form.holderLastName} onChange={(e) => update("holderLastName", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">E-mail absolwenta</label>
              <input required type="email" value={form.holderEmail} onChange={(e) => update("holderEmail", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Telefon (opcjonalnie)</label>
              <input value={form.holderPhone} onChange={(e) => update("holderPhone", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Data urodzenia</label>
              <input required type="date" value={form.holderDateOfBirth} onChange={(e) => update("holderDateOfBirth", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Miejsce urodzenia</label>
              <input required value={form.holderPlaceOfBirth} onChange={(e) => update("holderPlaceOfBirth", e.target.value)} className={inputCls} placeholder="np. Warszawa" />
            </div>
          </div>

          {/* zdjęcie na legitymację */}
          <div>
            <label className="block text-sm font-medium text-ink">Zdjęcie na legitymację (opcjonalnie)</label>
            <div className="mt-1.5 flex items-center gap-4">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md border border-ink/15 bg-paper">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="Zdjęcie na legitymację" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-mute">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="rounded-md border border-ink/15 px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink/5"
                >
                  {photoPreview ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Usuń
                  </button>
                )}
                <p className="text-[11px] leading-snug text-ink-mute">
                  PNG/JPG/WebP, maks. 10 MB — pojawi się na legitymacji i przy weryfikacji.
                </p>
              </div>
            </div>
          </div>

          {/* daty */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Data wystawienia</label>
              <input required type="date" value={form.issueDate} onChange={(e) => update("issueDate", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Ważność</label>
              <div className="mt-1.5 flex rounded-md border border-ink/15 p-1">
                {(
                  [
                    { key: "DEFAULT", label: selectedType?.defaultValidityMonths == null ? "Bezterminowo" : `${selectedType.defaultValidityMonths} mies.` },
                    { key: "DATE", label: "Data" },
                    { key: "NONE", label: "Bezterminowo" },
                  ] as { key: ExpiryMode; label: string }[]
                ).map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setExpiryMode(o.key)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                      expiryMode === o.key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {expiryMode === "DATE" && (
                <input
                  required
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className={inputCls}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand-gradient px-4 py-3 text-sm font-semibold text-paper transition-all hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? "Wystawianie..." : "Wystaw legitymację"}
          </button>
        </form>
      )}
    </Modal>
  );
}
