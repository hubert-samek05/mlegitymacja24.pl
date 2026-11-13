"use client";

import { useRef, useState } from "react";
import { Modal } from "./Modal";
import { requestSubscriptionPopup } from "./SubscriptionGate";
import { apiPost } from "@/lib/api";

interface Row {
  companyNumber: string;
  holderEmail: string;
  holderFirstName: string;
  holderLastName: string;
  holderPhone?: string;
  holderDateOfBirth: string;
  holderPlaceOfBirth: string;
  credentialTypeName: string;
  issueDate?: string;
  expiryDate?: string;
  noExpiry?: boolean;
}

interface BulkResult {
  row: number;
  ok: boolean;
  credentialNumber?: string;
  securityCode?: string;
  email?: string | null;
  temporaryPassword?: string;
  error?: string;
}

const HEADER_MAP: Record<string, keyof Row> = {
  numer: "companyNumber",
  numer_legitymacji: "companyNumber",
  "numer legitymacji": "companyNumber",
  nr: "companyNumber",
  companynumber: "companyNumber",
  email: "holderEmail",
  "e-mail": "holderEmail",
  mail: "holderEmail",
  imie: "holderFirstName",
  "imię": "holderFirstName",
  firstname: "holderFirstName",
  nazwisko: "holderLastName",
  lastname: "holderLastName",
  telefon: "holderPhone",
  phone: "holderPhone",
  data_urodzenia: "holderDateOfBirth",
  "data urodzenia": "holderDateOfBirth",
  dataurodzenia: "holderDateOfBirth",
  dateofbirth: "holderDateOfBirth",
  miejsce_urodzenia: "holderPlaceOfBirth",
  "miejsce urodzenia": "holderPlaceOfBirth",
  miejsceurodzenia: "holderPlaceOfBirth",
  placeofbirth: "holderPlaceOfBirth",
  zawod: "credentialTypeName",
  "zawód": "credentialTypeName",
  typ: "credentialTypeName",
  credentialtypename: "credentialTypeName",
  data_wystawienia: "issueDate",
  "data wystawienia": "issueDate",
  datawystawienia: "issueDate",
  issuedate: "issueDate",
  data_waznosci: "expiryDate",
  "data ważności": "expiryDate",
  "data waznosci": "expiryDate",
  datawaznosci: "expiryDate",
  expirydate: "expiryDate",
};

function normalizeHeader(h: string): keyof Row | undefined {
  return HEADER_MAP[h.trim().toLowerCase().replace(/\s+/g, "_").replace(/_/g, "_")]
    ?? HEADER_MAP[h.trim().toLowerCase()];
}

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  const sep = (text.split("\n")[0].match(/;/g)?.length ?? 0) >= (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      current.push(field.trim());
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      current.push(field.trim());
      field = "";
      if (current.some((c) => c !== "")) rows.push(current);
      current = [];
    } else {
      field += ch;
    }
  }
  current.push(field.trim());
  if (current.some((c) => c !== "")) rows.push(current);
  return rows;
}

function cellsToRows(cells: string[][]): { rows: Row[]; skipped: number } {
  if (cells.length < 2) return { rows: [], skipped: 0 };
  const headers = cells[0].map(normalizeHeader);
  const rows: Row[] = [];
  let skipped = 0;

  for (let i = 1; i < cells.length; i++) {
    const row: Record<string, string> = {};
    cells[i].forEach((cell, j) => {
      const key = headers[j];
      if (key) row[key] = cell;
    });
    if (!row.holderEmail) { skipped++; continue; }

    const expiryRaw = (row.expiryDate ?? "").trim().toLowerCase();
    const noExpiry = ["bezterminowo", "bez terminu", "never", "-", "brak"].includes(expiryRaw);
    rows.push({
      companyNumber: row.companyNumber ?? "",
      holderEmail: row.holderEmail,
      holderFirstName: row.holderFirstName ?? "",
      holderLastName: row.holderLastName ?? "",
      holderPhone: row.holderPhone || undefined,
      holderDateOfBirth: row.holderDateOfBirth ?? "",
      holderPlaceOfBirth: row.holderPlaceOfBirth ?? "",
      credentialTypeName: row.credentialTypeName ?? "",
      issueDate: row.issueDate || undefined,
      expiryDate: !noExpiry && expiryRaw ? row.expiryDate : undefined,
      noExpiry: noExpiry || undefined,
    });
  }
  return { rows, skipped };
}

export function BulkImportModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFileName(null);
    setRows([]);
    setSkipped(0);
    setParseError(null);
    setResults(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(file: File) {
    reset();
    setFileName(file.name);
    try {
      const ext = file.name.toLowerCase().split(".").pop();
      let cells: string[][];

      if (ext === "xlsx" || ext === "xls") {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        cells = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false, defval: "" });
      } else {
        const text = await file.text();
        cells = parseCsvText(text);
      }

      const { rows: parsed, skipped } = cellsToRows(cells);
      if (parsed.length === 0) {
        setParseError("Nie znaleziono poprawnych wierszy. Sprawdź nagłówki kolumn — pobierz wzór poniżej.");
        return;
      }
      setRows(parsed);
      setSkipped(skipped);
    } catch {
      setParseError("Nie udało się odczytać pliku. Obsługiwane formaty: CSV, XLSX, XLS.");
    }
  }

  async function handleImport() {
    setSending(true);
    setError(null);
    try {
      const res = await apiPost<{ results: BulkResult[] }>("/credentials/bulk", { rows }, true);
      setResults(res.results);
      await onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Nie udało się wykonać importu";
      setError(msg);
      if (/subskrypcj|aktywne|limit/i.test(msg)) requestSubscriptionPopup();
    } finally {
      setSending(false);
    }
  }

  function downloadTemplate() {
    const csv = [
      "numer_legitymacji;email;imie;nazwisko;telefon;data_urodzenia;miejsce_urodzenia;zawod;data_wystawienia;data_waznosci",
      "123/2026;jan.kowalski@example.com;Jan;Kowalski;+48600100200;1994-03-15;Warszawa;Trener personalny;2026-01-15;2028-01-15",
      "124/2026;anna.nowak@example.com;Anna;Nowak;;1990-07-22;Kraków;Instruktor jogi;;bezterminowo",
    ].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wzor-importu-legitymacji.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const okCount = results?.filter((r) => r.ok).length ?? 0;
  const failCount = results?.filter((r) => !r.ok).length ?? 0;

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Import masowy legitymacji"
      subtitle="Wystaw legitymacje dla wielu absolwentów naraz — plik CSV lub Excel."
      wide
    >
      {results ? (
        <div className="space-y-5">
          <div className="flex gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div>
                <p className="font-semibold text-emerald-900">{okCount} wystawiono</p>
                <p className="text-xs text-emerald-700">legitymacji pomyślnie</p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <div>
                <p className="font-semibold text-red-900">{failCount} błędów</p>
                <p className="text-xs text-red-700">wierszy pominięto</p>
              </div>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border border-ink/10">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-cream/90 text-left text-ink-mute">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Wiersz</th>
                  <th className="px-4 py-2.5 font-medium">Wynik</th>
                  <th className="px-4 py-2.5 font-medium">Szczegóły</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.row} className="border-t border-ink/5">
                    <td className="px-4 py-2.5 text-ink-mute">{r.row}</td>
                    <td className="px-4 py-2.5">
                      {r.ok
                        ? <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">OK</span>
                        : <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Błąd</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-soft">
                      {r.ok
                        ? `${r.email} → ${r.credentialNumber} (ID: ${r.securityCode ?? "—"})${r.temporaryPassword ? ` · hasło tymczasowe: ${r.temporaryPassword}` : " · konto już istniało — legitymacja trafiła do portfela"}`
                        : `${r.email ?? ""} — ${r.error}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results.some((r) => r.temporaryPassword) && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              Zapisz hasła tymczasowe nowych kont — są widoczne tylko w tym raporcie.
            </p>
          )}

          <button
            onClick={() => { reset(); onClose(); }}
            className="w-full rounded-md bg-brand-gradient px-4 py-3 text-sm font-semibold text-paper transition-all hover:brightness-110"
          >
            Zamknij
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {parseError && <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{parseError}</p>}

          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 rounded-md border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            Pobierz wzór pliku CSV
          </button>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-ink/15 bg-paper px-6 py-10 text-center transition-colors hover:border-accent-400 hover:bg-accent-50/40"
          >
            {fileName ? (
              <p className="text-sm font-medium text-ink">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-ink">Przeciągnij plik lub kliknij, aby wybrać</p>
                <p className="text-xs text-ink-mute">CSV, XLSX, XLS · maks. 500 wierszy</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {skipped > 0 && (
            <p className="text-xs text-amber-700">Pominięto {skipped} wierszy bez adresu e-mail.</p>
          )}

          {rows.length > 0 && (
            <>
              <p className="text-sm font-medium text-ink">Podgląd ({rows.length} wierszy):</p>
              <div className="max-h-56 overflow-y-auto rounded-md border border-ink/10">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-cream/90 text-left text-ink-mute">
                    <tr>
                      <th className="px-3 py-2 font-medium">E-mail</th>
                      <th className="px-3 py-2 font-medium">Imię i nazwisko</th>
                      <th className="px-3 py-2 font-medium">Zawód</th>
                      <th className="px-3 py-2 font-medium">Urodz.</th>
                      <th className="px-3 py-2 font-medium">Ważność</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-t border-ink/5">
                        <td className="px-3 py-2 text-ink">{r.holderEmail}</td>
                        <td className="px-3 py-2 text-ink">{r.holderFirstName} {r.holderLastName}</td>
                        <td className="px-3 py-2 text-ink-soft">{r.credentialTypeName}</td>
                        <td className="px-3 py-2 text-ink-soft">{r.holderDateOfBirth || "—"}</td>
                        <td className="px-3 py-2 text-ink-soft">
                          {r.noExpiry ? "Bezterminowo" : r.expiryDate || "domyślna"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 50 && <p className="text-xs text-ink-mute">...i {rows.length - 50} kolejnych wierszy</p>}

              <button
                onClick={handleImport}
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-4 py-3 text-sm font-semibold text-paper transition-all hover:brightness-110 disabled:opacity-60"
              >
                {sending ? "Importowanie..." : `Importuj ${rows.length} legitymacji`}
              </button>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
