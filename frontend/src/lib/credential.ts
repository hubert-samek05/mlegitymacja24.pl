export function formatSecurityCode(code: string | null | undefined): string {
  return code ? (code.match(/.{1,4}/g) ?? [code]).join(" ") : "—";
}

export const PERMISSION_OPTIONS = [
  { key: "credentials.issue", label: "Wystawianie legitymacji", hint: "Może wystawiać pojedyncze legitymacje absolwentom." },
  { key: "credentials.import", label: "Import zbiorczy", hint: "Może wystawiać legitymacje z pliku CSV/Excel." },
  { key: "credentials.manage", label: "Zarządzanie legitymacjami", hint: "Może edytować, zawieszać, przywracać i unieważniać legitymacje." },
  { key: "verifications.view", label: "Historia weryfikacji", hint: "Widzi, kiedy i przez kogo sprawdzano legitymacje." },
  { key: "billing.view", label: "Podgląd subskrypcji", hint: "Widzi plan, limity i historię płatności. Zmiana planu i płatności są tylko dla administratora." },
] as const;
