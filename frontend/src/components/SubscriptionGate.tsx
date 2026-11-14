"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Clock, Hourglass, LogOut, MessageSquare, ShieldX, X } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { Modal } from "@/components/Modal";
import { Logo } from "@/components/Logo";
import { PlanPaymentFlow, type PaymentMethods } from "@/components/PlanPaymentFlow";
import { logout } from "@/lib/useCurrentUser";
import { btnPrimary, btnGhost, pln } from "@/lib/ui";

// Strony dostępne dla firmy, która jeszcze nie jest aktywna (w tym płatność!)
const OPEN_PATHS = ["/panel/firma/subskrypcja", "/panel/firma/support", "/panel/firma/moja-firma"];

// Zdarzenie wywoływane przy próbie akcji wymagającej subskrypcji (np. wystawienie legitymacji)
export const SUBSCRIPTION_REQUIRED_EVENT = "ml24:subscription-required";
export function requestSubscriptionPopup() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SUBSCRIPTION_REQUIRED_EVENT));
}

// Sprawdza przed akcją (np. klik "Wystaw legitymację"), czy firma ma aktywną subskrypcję.
// Brak dostępu -> od razu pokazuje popup z planami i zwraca false.
export async function requireActiveSubscription(): Promise<boolean> {
  try {
    const s = await apiGet<{ blocked: boolean; companyStatus: string | null }>("/billing/status");
    if (s.companyStatus === "ACTIVE" && !s.blocked) return true;
  } catch {
    // błąd sprawdzania statusu -> pokaż popup zamiast wypuścić akcję
  }
  requestSubscriptionPopup();
  return false;
}

interface PendingPayment {
  id: string;
  method: "STRIPE" | "BANK_TRANSFER";
  amountCents: number;
  reference: string | null;
}

interface BillingStatus {
  blocked: boolean;
  status: string | null;
  planName: string | null;
  role: string;
  companyStatus: string | null;
  verificationNote: string | null;
  inGrace: boolean;
  periodEnd: string | null;
  pendingPayment: PendingPayment | null;
}

interface Plan {
  id: string;
  name: string;
  maxCredentials: number;
  maxStaffUsers: number;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
}

const UNLIMITED = 999999;
type Interval = "MONTHLY" | "YEARLY";

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<BillingStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [methods, setMethods] = useState<PaymentMethods | null>(null);
  const [sub, setSub] = useState<{ planId: string; billingInterval: Interval; status: string } | null>(null);
  const [chosen, setChosen] = useState<Plan | null>(null);
  const [open, setOpen] = useState(false);
  const [interval, setInterval] = useState<Interval>("MONTHLY");
  const wasBlocked = useRef(false);

  async function refreshStatus() {
    try {
      const s = await apiGet<BillingStatus>("/billing/status");
      setState(s);
    } catch {
      /* stan pozostaje */
    }
  }

  async function loadOverview() {
    try {
      const o = await apiGet<{
        plans: Plan[];
        methods: PaymentMethods;
        subscription: { planId: string; billingInterval: Interval; status: string } | null;
      }>("/billing/overview");
      setPlans(o.plans);
      setMethods(o.methods);
      setSub(o.subscription ?? null);
    } catch {
      /* brak uprawnień billing.view — popup pokaże info bez planów */
    }
  }

  useEffect(() => {
    // Na stronach otwartych (subskrypcja, support, moja firma) popup musi być zamknięty
    if (!open) setChosen(null);
    if (OPEN_PATHS.includes(pathname)) setOpen(false);
    apiGet<BillingStatus>("/billing/status")
      .then((s) => {
        setState(s);
        const needsPopup = s.companyStatus === "ACTIVE" && (s.blocked || s.inGrace);
        if (needsPopup && !wasBlocked.current && !OPEN_PATHS.includes(pathname)) {
          setOpen(true);
        }
        wasBlocked.current = needsPopup;
        if (s.role === "COMPANY_ADMIN" && needsPopup) {
          loadOverview();
        }
      })
      .catch(() => setState(null));
  }, [pathname]);

  useEffect(() => {
    function reopen() {
      if (OPEN_PATHS.includes(window.location.pathname)) return;
      setOpen(true);
      refreshStatus();
      loadOverview();
    }
    window.addEventListener(SUBSCRIPTION_REQUIRED_EVENT, reopen);
    return () => window.removeEventListener(SUBSCRIPTION_REQUIRED_EVENT, reopen);
  }, []);

  const companyStatusNow = state?.companyStatus;
  const clickGateOn = !!state && state.blocked && companyStatusNow === "ACTIVE";

  // Brak aktywnej subskrypcji: każde kliknięcie w panelu otwiera popup z planami.
  // Przepuszczamy tylko: popup, wylogowanie, nawigację do stron otwartych i strony publiczne.
  useEffect(() => {
    if (!clickGateOn) return;
    function onClick(e: MouseEvent) {
      // Na stronach otwartych (płatność, support, dane firmy) nic nie przechwytujemy
      if (OPEN_PATHS.includes(window.location.pathname)) return;
      const el = e.target as HTMLElement;
      if (el.closest("#sub-gate-modal")) return;
      if (el.closest('[data-gate-allow], [aria-label="Wyloguj się"]')) return;
      const link = el.closest("a[href]") as HTMLAnchorElement | null;
      const href = link?.getAttribute("href") ?? "";
      if (
        href.startsWith("/panel/firma/subskrypcja") ||
        href.startsWith("/panel/firma/support") ||
        href.startsWith("/panel/firma/moja-firma") ||
        (!href.startsWith("/panel") && href !== "")
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [clickGateOn]);

  if (!state) return <>{children}</>;

  const companyStatus = state.companyStatus;
  const isAdmin = state.role === "COMPANY_ADMIN";
  const openPath = OPEN_PATHS.includes(pathname);

  // ---------- Firma jeszcze nieaktywna: pełny ekran informacyjny ----------
  if (companyStatus && companyStatus !== "ACTIVE") {
    if (openPath) return <>{children}</>;

    const pending = companyStatus === "PENDING_VERIFICATION";
    const rejected = companyStatus === "REJECTED";
    const icon = pending ? (
      <Hourglass className="h-8 w-8 text-amber-600" />
    ) : (
      <ShieldX className="h-8 w-8 text-red-600" />
    );
    const title = pending
      ? "Konto oczekuje na akceptację"
      : rejected
        ? "Zgłoszenie wymaga uzupełnienia"
        : "Konto firmy zawieszone";
    const message = pending
      ? "Administrator platformy weryfikuje dane Twojej firmy. Poinformujemy Cię o akceptacji — po niej wybierzesz plan subskrypcji i zaczniesz wystawiać legitymacje."
      : rejected
        ? "Administrator odrzucił zgłoszenie Twojej firmy. Popraw dane w zakładce Moja firma i poczekaj na ponowną weryfikację."
        : "Konto firmy zostało zawieszone przez administratora platformy. Skontaktuj się z supportem, aby poznać szczegóły.";

    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-4">
        <div className="w-full max-w-lg rounded-xl border border-ink/10 bg-white p-10 text-center shadow-card">
          <div className="mx-auto flex justify-center">
            <Logo className="[&_img]:!h-8" />
          </div>
          <div className={`mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full ${pending ? "bg-amber-50" : "bg-red-50"}`}>
            {icon}
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{message}</p>
          {rejected && state.verificationNote && (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
              <span className="font-semibold">Uwagi administratora:</span> {state.verificationNote}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-2">
            {rejected && (
              <button onClick={() => router.push("/panel/firma/moja-firma")} className={btnPrimary}>
                Uzupełnij dane firmy
              </button>
            )}
            <button onClick={() => router.push("/panel/firma/support")} className={btnGhost}>
              <MessageSquare className="h-4 w-4" /> Kontakt z supportem
            </button>
            <button onClick={() => logout(router)} className="mt-1 inline-flex items-center justify-center gap-2 text-sm font-medium text-ink-mute transition-colors hover:text-ink">
              <LogOut className="h-4 w-4" /> Wyloguj się
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Firma aktywna: ekran wyboru planu / przypomnienie o płatności ----------
  // upgradeMode: popup otwarty przy aktywnej subskrypcji (np. osiągnięty limit) — pokaż plany do rozszerzenia
  const upgradeMode = open && !state.blocked && !state.inGrace;
  const showPlans = state.blocked || upgradeMode;
  const isOverdue = state.status === "PAST_DUE" || state.status === "CANCELED";

  if (!isAdmin) {
    return (
      <>
        {children}
        <Modal open={open} onClose={() => setOpen(false)} title={upgradeMode ? "Limit planu osiągnięty" : "Subskrypcja nieaktywna"}>
          <p className="text-sm leading-relaxed text-ink-soft">
            {upgradeMode
              ? "Firma osiągnęła limit w obecnym planie — poproś administratora firmy o zmianę na wyższy plan w zakładce Subskrypcja."
              : state.blocked
                ? "Subskrypcja firmy nie jest aktywna — wystawianie legitymacji jest zablokowane. Poproś administratora firmy o wybranie i opłacenie planu."
                : "Minął termin płatności subskrypcji firmy — poproś administratora o uregulowanie faktury, zanim dostęp zostanie zawieszony."}
          </p>
        </Modal>
      </>
    );
  }

  const featured = plans.length > 1 ? plans[Math.min(1, plans.length - 1)] : null;

  return (
    <>
      {children}
      {open && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-ink/55 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-8 sm:pb-8">
            <div id="sub-gate-modal" className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
              <button
                onClick={() => setOpen(false)}
                aria-label="Zamknij"
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="border-b border-ink/[0.07] px-8 pb-7 pt-9 text-center sm:px-12">
                <div className="flex justify-center">
                  <Logo className="[&_img]:!h-9" />
                </div>
                <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {state?.pendingPayment ? "Płatność w toku" : upgradeMode ? "Potrzebujesz wyższego planu" : isOverdue ? "Odnów subskrypcję" : "Witamy w mLegitymacja24!"}
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                  {state?.pendingPayment
                    ? "Twoja płatność czeka na zaksięgowanie — dostęp włączy się automatycznie po jej potwierdzeniu."
                    : upgradeMode
                      ? "Osiągnięto limit obecnego planu — wybierz wyższy, aby wystawiać dalej. Doliczymy tylko różnicę w cenie."
                      : isOverdue
                        ? "Subskrypcja nie została opłacona — wystawianie legitymacji jest zablokowane. Wybierz plan, aby odblokować konto."
                        : "Wybierz plan, aby zacząć wystawiać legitymacje dla swoich absolwentów."}
                </p>
                {showPlans && !state?.pendingPayment && (
                  <div className="mx-auto mt-6 inline-flex rounded-full border border-ink/15 bg-paper p-1 text-sm font-semibold">
                    {(["MONTHLY", "YEARLY"] as const).map((i) => (
                      <button
                        key={i}
                        onClick={() => setInterval(i)}
                        className={`rounded-full px-5 py-2 transition-all ${
                          interval === i ? "bg-brand-gradient text-white shadow-sm" : "text-ink-soft hover:text-ink"
                        }`}
                      >
                        {i === "MONTHLY" ? "Miesięcznie" : "Rocznie"}
                        {i === "YEARLY" && <span className={`ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${interval === "YEARLY" ? "bg-white/20" : "bg-emerald-100 text-emerald-700"}`}>−17%</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-8 py-8 sm:px-12">
                {state?.pendingPayment ? (
                  <div className="mx-auto max-w-md">
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                      <p className="font-semibold">Płatność w trakcie realizacji</p>
                      <p className="mt-1.5 leading-relaxed">
                        {state.pendingPayment.method === "BANK_TRANSFER"
                          ? "Wybrano przelew — zaksięgujemy wpłatę i aktywujemy dostęp zaraz po jej potwierdzeniu. Jeśli nie otrzymałeś faktury proforma, napisz do nas w zakładce Support."
                          : "Płatność kartą została rozpoczęta — dostęp aktywuje się automatycznie po jej zakończeniu. Jeśli płatność się nie powiodła (np. brak środków), anuluj ją poniżej i spróbuj ponownie."}
                      </p>
                      <p className="mt-3 flex items-center justify-between border-t border-amber-200 pt-3">
                        <span className="text-amber-800/70">
                          {state.pendingPayment.reference ? `Ref. ${state.pendingPayment.reference}` : "Płatność oczekująca"}
                        </span>
                        <span className="font-semibold">{pln(state.pendingPayment.amountCents)}</span>
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await apiPost(`/billing/payments/${state.pendingPayment!.id}/cancel`, {}, true);
                        } catch {
                          /* płatność mogła się już rozliczyć */
                        }
                        await refreshStatus();
                      }}
                      className="mt-4 w-full rounded-md border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand-700 hover:bg-brand-50"
                    >
                      Anuluj i wybierz inny plan lub metodę
                    </button>
                  </div>
                ) : showPlans ? chosen && methods ? (
                  <div className="mx-auto max-w-lg">
                    <div className="mb-5 flex items-center justify-between rounded-lg border border-brand-700/30 bg-brand-50 px-5 py-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Wybrany plan</p>
                        <p className="font-display text-lg font-semibold text-ink">{chosen.name}</p>
                      </div>
                      <p className="font-display text-xl font-semibold text-brand-800">
                        {pln(interval === "YEARLY" ? chosen.yearlyPriceCents : chosen.monthlyPriceCents)}
                        <span className="text-sm font-normal text-ink-mute"> / {interval === "YEARLY" ? "rok" : "mies."}</span>
                      </p>
                    </div>
                    <PlanPaymentFlow
                      planId={chosen.id}
                      interval={interval}
                      methods={methods}
                      activeSub={sub}
                      onBack={() => setChosen(null)}
                      onDone={() => {
                        setChosen(null);
                        setOpen(false);
                        refreshStatus();
                      }}
                    />
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {plans.map((p) => {
                      const price = interval === "YEARLY" ? p.yearlyPriceCents : p.monthlyPriceCents;
                      const isFeatured = featured?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`relative flex flex-col rounded-xl border p-6 transition-all ${
                            isFeatured
                              ? "border-brand-700 shadow-card ring-1 ring-brand-700"
                              : "border-ink/15 hover:border-brand-700/50 hover:shadow-sm"
                          }`}
                        >
                          {isFeatured && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                              Polecany
                            </span>
                          )}
                          <p className="font-display text-lg font-semibold text-ink">{p.name}</p>
                          <p className="mt-3">
                            <span className="font-display text-3xl font-semibold text-ink">{pln(price)}</span>
                            <span className="text-sm text-ink-mute"> / {interval === "YEARLY" ? "rok" : "mies."}</span>
                          </p>
                          {interval === "YEARLY" && (
                            <p className="mt-0.5 text-xs font-medium text-emerald-700">
                              {pln(Math.round(p.yearlyPriceCents / 12))} / mies. przy płatności rocznej
                            </p>
                          )}
                          <ul className="mt-4 flex-1 space-y-2 border-t border-ink/10 pt-4 text-sm text-ink-soft">
                            <li className="flex items-start gap-2">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                              {p.maxCredentials >= UNLIMITED ? "Bez limitu legitymacji" : `Do ${p.maxCredentials} legitymacji`}
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                              {p.maxStaffUsers >= UNLIMITED ? "Bez limitu kont zespołu" : `Do ${p.maxStaffUsers} kont zespołu`}
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                              Weryfikacja QR i branding firmy
                            </li>
                          </ul>
                          <button
                            onClick={() => setChosen(p)}
                            className={`mt-6 w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${
                              isFeatured
                                ? "bg-brand-gradient text-white hover:brightness-110"
                                : "border border-ink/15 text-ink hover:border-brand-700 hover:bg-brand-50"
                            }`}
                          >
                            Wybierz {p.name}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : state.status === "PAST_DUE" ? (
                  <div className="mx-auto max-w-md">
                    <div className="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
                      <p className="font-semibold">Nie udało się pobrać płatności</p>
                      <p className="mt-1.5 leading-relaxed">
                        Płatność za odnowienie została odrzucona — sprawdź kartę lub zmień metodę płatności.
                        Dostęp działa jeszcze przez kilka dni, potem konto zostanie zawieszone.
                      </p>
                    </div>
                    <button
                      onClick={() => { setOpen(false); router.push("/panel/firma/subskrypcja?metoda=karta"); }}
                      className={`${btnPrimary} mt-4 w-full`}
                    >
                      Zaktualizuj metodę płatności
                    </button>
                    <button
                      onClick={() => { setOpen(false); router.push("/panel/firma/subskrypcja"); }}
                      className="mt-2 w-full rounded-md border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand-700 hover:bg-brand-50"
                    >
                      Opłać ponownie lub wybierz przelew
                    </button>
                  </div>
                ) : (
                  <div className="mx-auto max-w-md">
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <Clock className="mr-1.5 inline h-4 w-4 align-[-2px]" />
                      Okres rozliczeniowy zakończył się {state.periodEnd ? new Date(state.periodEnd).toLocaleDateString("pl-PL") : "niedawno"}.
                      Opłać nową fakturę w ciągu kilku dni — po tym czasie konto firmy zostanie zawieszone.
                    </p>
                    <button onClick={() => { setOpen(false); router.push("/panel/firma/subskrypcja"); }} className={`${btnPrimary} mt-4 w-full`}>
                      Opłać subskrypcję
                    </button>
                  </div>
                )}

                <div className="mt-7 flex items-center justify-center gap-2 text-xs text-ink-mute">
                  <Clock className="h-3.5 w-3.5" />
                  {showPlans
                    ? upgradeMode
                      ? "Zmiana na wyższy plan zwiększy limity od razu — dopłacasz tylko różnicę."
                      : "Bez aktywnego planu firma nie może wystawiać legitymacji."
                    : "Dostęp działa jeszcze przez kilka dni — ureguluj płatność, aby uniknąć blokady."}
                  <button onClick={() => { setOpen(false); router.push("/panel/firma/subskrypcja"); }} className="font-semibold text-brand-700 hover:underline">
                    Szczegóły planów
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
