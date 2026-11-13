"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutElementsProvider, PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import { PanelShell } from "@/components/PanelShell";
import { Modal } from "@/components/Modal";
import { PaymentMethodUpdater, SwitchToCardSubscription } from "@/components/PlanPaymentFlow";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { companyNavItems } from "@/lib/companyNav";
import { apiGet, apiPost } from "@/lib/api";
import { alertError, alertOk, btnDanger, btnGhost, btnPrimary, card, pln } from "@/lib/ui";

type Interval = "MONTHLY" | "YEARLY";

interface Plan {
  id: string;
  name: string;
  maxCredentials: number;
  maxStaffUsers: number;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
}

interface Payment {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  method: "STRIPE" | "BANK_TRANSFER";
  interval: Interval | null;
  reference: string | null;
  invoiceUrl: string | null;
  planId: string | null;
  failureReason: string | null;
  createdAt: string;
}

interface Overview {
  plans: Plan[];
  subscription: {
    status: "INCOMPLETE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
    billingInterval: Interval;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    pendingPlanId: string | null;
    stripeSubscriptionId: string | null;
    plan: Plan;
  } | null;
  active: boolean;
  usage: { credentials: number; users: number };
  payments: Payment[];
  methods: { stripe: boolean; bankTransfer: { recipient: string; iban: string; bankName: string } | null };
}

interface TransferInfo {
  amountCents: number;
  transfer: { recipient: string; iban: string; bankName: string; title: string };
}

const paymentStatus: Record<string, string> = { PENDING: "Oczekuje", PAID: "Opłacona", CANCELED: "Anulowana", FAILED: "Nieudana" };
const methodLabel = { STRIPE: "Karta", BANK_TRANSFER: "Przelew" };
const UNLIMITED = 999999;

function Usage({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max >= UNLIMITED ? 0 : Math.min(100, (used / Math.max(1, max)) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-ink-soft">{label}</span>
        <span className="font-semibold text-ink">{used} / {max >= UNLIMITED ? "bez limitu" : max}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
        <div className={`h-full rounded-full ${pct >= 90 ? "bg-accent-500" : "bg-brand-800"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SubskrypcjaPage() {
  const { user, loading: userLoading } = useCurrentUser(["COMPANY_ADMIN", "COMPANY_STAFF"]);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [interval, setIntervalMode] = useState<Interval>("MONTHLY");
  const [chosen, setChosen] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [transfer, setTransfer] = useState<TransferInfo | null>(null);
  const [embedded, setEmbedded] = useState<{ clientSecret: string; publishableKey: string } | null>(null);
  const stripePromise = useMemo(() => (embedded ? loadStripe(embedded.publishableKey) : null), [embedded]);
  const [paid, setPaid] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showUpdateCard, setShowUpdateCard] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchDone, setSwitchDone] = useState<string | null>(null);

  const isAdmin = user?.role === "COMPANY_ADMIN";

  async function load() {
    try {
      const overview = await apiGet<Overview>("/billing/overview");
      setData(overview);
      if (overview.subscription) setIntervalMode(overview.subscription.billingInterval);
      return overview;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać danych subskrypcji");
    } finally {
      setLoading(false);
    }
    return null;
  }

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("platnosc");
    if (flag === "ok") setSuccess("Dziękujemy! Płatność została przyjęta — subskrypcja zostanie aktywowana w ciągu chwili.");
    if (flag === "anulowana") setError("Płatność została anulowana. Możesz spróbować ponownie.");
    const pick = params.get("wybierz");
    const okres = params.get("okres");
    if (okres === "YEARLY" || okres === "MONTHLY") setIntervalMode(okres);
    if (params.get("metoda") === "karta") setShowUpdateCard(true);
    load().then((overview) => {
      if (pick && overview) {
        const plan = overview.plans.find((p) => p.id === pick);
        if (plan) setChosen(plan);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function pay(method: "STRIPE" | "BANK_TRANSFER") {
    if (!chosen) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiPost<{ clientSecret?: string; publishableKey?: string } & Partial<TransferInfo>>("/billing/checkout", { planId: chosen.id, interval, method }, true);
      if (method === "STRIPE" && res.clientSecret && res.publishableKey) {
        setEmbedded({ clientSecret: res.clientSecret, publishableKey: res.publishableKey });
        return;
      }
      setTransfer(res as TransferInfo);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się rozpocząć płatności");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCancel(cancel: boolean) {
    setError(null);
    try {
      await apiPost("/billing/cancel", { cancel }, true);
      setSuccess(cancel ? "Subskrypcja nie odnowi się po zakończeniu bieżącego okresu." : "Odnawianie subskrypcji zostało wznowione.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zmienić ustawień subskrypcji");
    }
  }

  function closeModal() {
    setChosen(null);
    setTransfer(null);
    setEmbedded(null);
    setPaid(false);
  }

  async function handlePaid() {
    setEmbedded(null);
    setPaid(true);
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      await load();
    }
  }

  async function doChangePlan() {
    if (!chosen) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiPost<{ kind: string; planName?: string; effectiveAt?: string } & Partial<TransferInfo>>("/billing/change-plan", { planId: chosen.id }, true);
      if (res.kind === "UPGRADE_TRANSFER") {
        setTransfer(res as TransferInfo);
        return;
      }
      if (res.kind === "UPGRADE_CHARGED") setSuccess(`Plan zmieniony na ${res.planName}. Różnica w cenie zostanie pobrana z zapisanej karty.`);
      else if (res.kind === "DOWNGRADE_SCHEDULED") setSuccess(`Plan zmieni się na ${res.planName} od ${res.effectiveAt ? new Date(res.effectiveAt).toLocaleDateString("pl-PL") : "końca bieżącego okresu"}. Do tego czasu zachowujesz obecny plan.`);
      else if (res.kind === "DOWNGRADE_CANCELED") setSuccess("Zaplanowana zmiana planu została cofnięta.");
      closeModal();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zmienić planu");
    } finally {
      setBusy(false);
    }
  }

  function retryPayment(p: Payment) {
    const plan = data?.plans.find((pl) => pl.id === p.planId);
    if (!plan) return;
    if (p.interval) setIntervalMode(p.interval);
    setChosen(plan);
  }

  async function cancelPayment(id: string) {
    setError(null);
    try {
      await apiPost(`/billing/payments/${id}/cancel`, {}, true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się anulować płatności");
    }
  }

  async function revertPendingChange() {
    if (!sub) return;
    setError(null);
    try {
      await apiPost("/billing/change-plan", { planId: sub.plan.id }, true);
      setSuccess("Zaplanowana zmiana planu została cofnięta.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się cofnąć zmiany");
    }
  }

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink-mute">Ładowanie...</div>;
  }

  const sub = data?.subscription ?? null;
  const expired = !!sub && !data?.active && (sub.status === "ACTIVE" || sub.status === "TRIALING");
  const statusText = !sub
    ? "Brak subskrypcji"
    : expired ? "Wygasła"
    : { INCOMPLETE: "Oczekuje na płatność", TRIALING: "Okres próbny", ACTIVE: "Aktywna", PAST_DUE: "Zaległość w płatności", CANCELED: "Anulowana" }[sub.status];
  const statusCls = data?.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800";
  const pending = data?.payments.find((p) => p.status === "PENDING");
  const price = (p: Plan) => (interval === "YEARLY" ? p.yearlyPriceCents : p.monthlyPriceCents);
  const pendingPlanName = sub?.pendingPlanId ? data?.plans.find((p) => p.id === sub.pendingPlanId)?.name ?? null : null;
  const planChange = !!(sub && data?.active && sub.status === "ACTIVE" && chosen && chosen.id !== sub.plan.id && interval === sub.billingInterval);

  return (
    <PanelShell navItems={companyNavItems} activeHref="/panel/firma/subskrypcja" userLabel={`${user.firstName} ${user.lastName}`} userSubtitle={user.company?.name ?? "Firma"}>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Subskrypcja i płatności</h1>
      <p className="mt-2 text-sm text-ink-soft">Twój plan, wykorzystanie limitów i historia płatności.</p>

      {error && !(loading === false && !data) && <p className={`mt-4 ${alertError}`}>{error}</p>}
      {success && <p className={`mt-4 ${alertOk}`}>{success}</p>}

      {loading || !data ? (
        <p className="mt-8 text-sm text-ink-mute">{loading ? "Ładowanie..." : "Nie masz dostępu do informacji o subskrypcji. Poproś administratora firmy o nadanie uprawnienia „Podgląd subskrypcji”."}</p>
      ) : (
        <div className="mt-8 space-y-8">
          <div className={`${card} p-6 sm:p-8`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Aktualny plan</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">{sub ? sub.plan.name : "—"}</p>
                {sub?.currentPeriodEnd && (
                  <p className="mt-1 text-sm text-ink-soft">
                    {sub.status === "TRIALING" ? "Okres próbny do " : sub.cancelAtPeriodEnd ? "Dostęp do " : expired ? "Wygasła " : "Następne odnowienie: "}
                    {new Date(sub.currentPeriodEnd).toLocaleDateString("pl-PL")}
                    {sub.status === "ACTIVE" && ` · rozliczenie ${sub.billingInterval === "YEARLY" ? "roczne" : "miesięczne"}`}
                  </p>
                )}
              </div>
              <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${statusCls}`}>{statusText}</span>
            </div>

            {!data.active && (
              <p className={`mt-5 ${alertError}`}>
                Wystawianie legitymacji i dodawanie pracowników jest zablokowane do czasu opłacenia subskrypcji. Wybierz plan poniżej.
              </p>
            )}
            {pending && (
              <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Masz oczekującą płatność {pending.method === "BANK_TRANSFER" ? `przelewem (tytuł: ${pending.reference})` : "kartą"} na kwotę {pln(pending.amountCents)}. Po zaksięgowaniu subskrypcja zostanie aktywowana.
              </p>
            )}
            {pendingPlanName && sub?.currentPeriodEnd && (
              <p className="mt-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Zaplanowana zmiana planu na <strong>{pendingPlanName}</strong> od {new Date(sub.currentPeriodEnd).toLocaleDateString("pl-PL")}. Do tego czasu zachowujesz plan {sub.plan.name}.
                {isAdmin && <button onClick={revertPendingChange} className="ml-2 font-semibold underline underline-offset-2 hover:text-blue-900">Cofnij zmianę</button>}
              </p>
            )}
            {sub?.status === "PAST_DUE" && (
              <div className={`mt-5 ${alertError} space-y-3`}>
                <p>
                  Nie udało się pobrać płatności za odnowienie — sprawdź, czy karta nie wygasła lub nie brakuje środków.
                  Próbujemy ponownie raz dziennie — jeśli przez 7 dni płatność nie dojdzie do skutku, konto firmy zostanie zawieszone.
                </p>
                <div className="flex flex-wrap gap-2">
                  {sub.stripeSubscriptionId && (
                    <button onClick={() => setShowUpdateCard(true)} className={btnPrimary + " !px-4 !py-2 !text-xs"}>
                      Zaktualizuj kartę
                    </button>
                  )}
                  <span className="self-center text-xs">albo opłać ponownie wybierając plan poniżej</span>
                </div>
              </div>
            )}

            {sub && (
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <Usage label="Wystawione legitymacje" used={data.usage.credentials} max={sub.plan.maxCredentials} />
                <Usage label="Konta zespołu" used={data.usage.users} max={sub.plan.maxStaffUsers} />
              </div>
            )}

            {isAdmin && sub && (sub.stripeSubscriptionId || data.active) && (
              <div className="mt-4 border-t border-ink/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-mute">Metoda płatności</p>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-soft">
                    {sub.stripeSubscriptionId
                      ? "Karta — subskrypcja odnawia się automatycznie"
                      : "Przelew — każdy okres opłacasz ręcznie nową fakturą"}
                  </p>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {sub.stripeSubscriptionId && (
                      <button onClick={() => setShowUpdateCard(true)} className={btnGhost}>
                        Zmień zapisaną kartę
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSwitchDone(null);
                        setShowSwitch(true);
                      }}
                      className={btnPrimary + " !px-4 !py-2 !text-xs"}
                    >
                      {sub.stripeSubscriptionId ? "Przełącz na przelew" : "Przełącz na kartę"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isAdmin && sub && sub.status === "ACTIVE" && data.active && (
              <div className="mt-6 border-t border-ink/10 pt-5">
                {sub.cancelAtPeriodEnd ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold">Subskrypcja anulowana</p>
                      <p>Nie odnowi się — możesz korzystać z platformy do <strong>{sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("pl-PL") : "końca okresu"}</strong>. Wystawione legitymacje pozostaną ważne.</p>
                    </div>
                    <button onClick={() => toggleCancel(false)} className={btnGhost + " shrink-0"}>Wznów odnawianie</button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-ink-mute">
                      Anulowanie zatrzymuje odnowienie — firma korzysta z platformy do końca opłaconego okresu
                      {sub.currentPeriodEnd ? ` (${new Date(sub.currentPeriodEnd).toLocaleDateString("pl-PL")})` : ""}.
                    </p>
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="shrink-0 rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:border-red-400 hover:bg-red-50"
                    >
                      Anuluj subskrypcję
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-lg font-semibold text-ink">Plany</h2>
              <div className="flex rounded-md border border-ink/15 bg-white p-0.5 text-sm font-semibold">
                {(["MONTHLY", "YEARLY"] as const).map((i) => (
                  <button key={i} onClick={() => setIntervalMode(i)} className={`rounded px-4 py-1.5 transition-colors ${interval === i ? "bg-brand-900 text-white" : "text-ink-soft hover:text-ink"}`}>
                    {i === "MONTHLY" ? "Miesięcznie" : "Rocznie"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {data.plans.map((plan) => {
                const current = sub?.plan.id === plan.id && sub.billingInterval === interval && data.active && sub.status === "ACTIVE";
                const saving = plan.monthlyPriceCents * 12 - plan.yearlyPriceCents;
                return (
                  <div key={plan.id} className={`${card} p-6 ${current ? "border-brand-800 ring-1 ring-brand-800" : ""}`}>
                    <p className="font-display text-lg font-semibold text-ink">{plan.name}</p>
                    <p className="mt-2">
                      <span className="font-display text-3xl font-semibold text-ink">{pln(price(plan))}</span>
                      <span className="text-sm text-ink-mute"> / {interval === "YEARLY" ? "rok" : "mies."}</span>
                    </p>
                    <p className="mt-1 text-xs text-ink-mute">
                      {interval === "YEARLY" && saving > 0 ? `Oszczędzasz ${pln(saving)} w skali roku` : `lub ${pln(plan.yearlyPriceCents)} rocznie`}
                    </p>
                    <ul className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm text-ink-soft">
                      <li>{plan.maxCredentials >= UNLIMITED ? "Bez limitu legitymacji" : `Do ${plan.maxCredentials} legitymacji`}</li>
                      <li>{plan.maxStaffUsers >= UNLIMITED ? "Bez limitu kont zespołu" : `Do ${plan.maxStaffUsers} kont zespołu`}</li>
                    </ul>
                    {isAdmin && (
                      <button disabled={current} onClick={() => setChosen(plan)} className={`${current ? "w-full cursor-default rounded-md bg-ink/[0.06] px-4 py-2.5 text-sm font-semibold text-ink-mute" : btnPrimary + " w-full"} mt-6`}>
                        {current ? "Obecny plan" : sub && sub.plan.id === plan.id && data.active ? "Zmień okres / odnów" : "Wybierz plan"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {!isAdmin && <p className="mt-3 text-xs text-ink-mute">Plan może zmienić tylko administrator firmy.</p>}
          </div>

          <div className={`${card} overflow-hidden`}>
            <p className="border-b border-ink/10 bg-cream/60 px-6 py-3 text-sm font-semibold text-ink">Historia płatności</p>
            {data.payments.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-ink-mute">Brak zarejestrowanych płatności.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-ink-mute">
                    <tr>
                      <th className="px-6 py-3 font-medium">Data</th>
                      <th className="px-6 py-3 font-medium">Kwota</th>
                      <th className="px-6 py-3 font-medium">Metoda</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Faktura</th>
                      <th className="px-6 py-3 font-medium">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p) => (
                      <tr key={p.id} className="border-t border-ink/5">
                        <td className="px-6 py-3.5 text-ink-soft">{new Date(p.createdAt).toLocaleDateString("pl-PL")}</td>
                        <td className="px-6 py-3.5 font-medium text-ink">{pln(p.amountCents)}</td>
                        <td className="px-6 py-3.5 text-ink-soft">{methodLabel[p.method]}{p.interval ? ` · ${p.interval === "YEARLY" ? "rocznie" : "miesięcznie"}` : ""}</td>
                        <td className="px-6 py-3.5">
                          <span className={p.status === "FAILED" ? "font-medium text-red-700" : "text-ink-soft"}>{paymentStatus[p.status] ?? p.status}</span>
                          {p.status === "FAILED" && p.failureReason && <p className="mt-0.5 max-w-[220px] text-xs text-red-600">{p.failureReason}</p>}
                        </td>
                        <td className="px-6 py-3.5">
                          {p.invoiceUrl ? <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-700 hover:underline">Pobierz</a> : "—"}
                        </td>
                        <td className="px-6 py-3.5">
                          {isAdmin && (
                            <div className="flex gap-2">
                              {p.status === "FAILED" && p.planId && (
                                <button onClick={() => retryPayment(p)} className={btnGhost + " !px-3 !py-1 !text-xs"}>Spróbuj ponownie</button>
                              )}
                              {p.status === "PENDING" && (
                                <button onClick={() => cancelPayment(p.id)} className={btnDanger}>Anuluj</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={!!chosen} onClose={closeModal} wide={!!embedded} title={paid ? "Płatność przyjęta" : transfer ? "Dane do przelewu" : planChange ? "Zmiana planu" : `Plan ${chosen?.name ?? ""}`} subtitle={chosen ? `${pln(price(chosen))} / ${interval === "YEARLY" ? "rok" : "miesiąc"}` : undefined}>
        {paid ? (
          <div className="space-y-4 text-sm">
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">Dziękujemy! Płatność została przyjęta. Subskrypcja aktywuje się w ciągu kilku sekund — status odświeży się automatycznie.</p>
            <div className="flex justify-end"><button onClick={closeModal} className={btnPrimary}>Zamknij</button></div>
          </div>
        ) : embedded ? (
          <CheckoutElementsProvider
            stripe={stripePromise}
            options={{
              clientSecret: embedded.clientSecret,
              elementsOptions: {
                appearance: {
                  theme: "flat",
                  variables: {
                    fontFamily: "Inter, sans-serif",
                    fontSizeBase: "14px",
                    borderRadius: "6px",
                    spacingUnit: "4px",
                    colorPrimary: "#0b2557",
                    colorText: "#0b2557",
                    colorTextSecondary: "#3a4f78",
                    colorTextPlaceholder: "#9aa7bd",
                    colorDanger: "#d10f1a",
                  },
                  rules: {
                    ".Input": {
                      border: "1px solid rgba(11, 37, 87, 0.15)",
                      backgroundColor: "#ffffff",
                      boxShadow: "none",
                      padding: "10px 16px",
                    },
                    ".Input:hover": { border: "1px solid rgba(11, 37, 87, 0.3)" },
                    ".Input:focus": {
                      border: "1px solid #1f4585",
                      boxShadow: "0 0 0 3px rgba(31, 69, 133, 0.15)",
                      outline: "none",
                    },
                    ".Input::placeholder": { color: "#9aa7bd" },
                    ".Input--invalid": { border: "1px solid #d10f1a" },
                    ".Label": {
                      color: "#3a4f78",
                      fontSize: "13px",
                      fontWeight: "500",
                      marginBottom: "6px",
                    },
                    ".Tab, .Block": {
                      border: "1px solid rgba(11, 37, 87, 0.15)",
                      borderRadius: "6px",
                      backgroundColor: "#ffffff",
                      boxShadow: "none",
                      color: "#0b2557",
                    },
                    ".Tab:hover": { border: "1px solid rgba(11, 37, 87, 0.3)", color: "#0b2557" },
                    ".Tab--selected": {
                      border: "1px solid #1f4585",
                      boxShadow: "0 0 0 3px rgba(31, 69, 133, 0.15)",
                      backgroundColor: "#ffffff",
                      color: "#0b2557",
                    },
                    ".TabIcon--selected, .TabLabel--selected": { color: "#0b2557" },
                    ".PickerItem": {
                      border: "1px solid rgba(11, 37, 87, 0.15)",
                      borderRadius: "6px",
                      boxShadow: "none",
                      backgroundColor: "#ffffff",
                    },
                    ".PickerItem:hover": { border: "1px solid rgba(11, 37, 87, 0.3)" },
                    ".PickerItem--selected": {
                      border: "1px solid #1f4585",
                      boxShadow: "0 0 0 3px rgba(31, 69, 133, 0.15)",
                      backgroundColor: "#eef2fa",
                    },
                    ".CheckboxInput": { border: "1px solid rgba(11, 37, 87, 0.15)" },
                    ".CheckboxInput--checked": { backgroundColor: "#0b2557", borderColor: "#0b2557" },
                    ".Error": { color: "#d10f1a", fontSize: "13px" },
                  },
                },
              },
            }}
          >
            <CheckoutPaymentForm onPaid={handlePaid} onBack={() => setEmbedded(null)} />
          </CheckoutElementsProvider>
        ) : transfer ? (
          <div className="space-y-4 text-sm">
            <p className="text-ink-soft">Wykonaj przelew na poniższe dane. Subskrypcja zostanie aktywowana po zaksięgowaniu wpłaty i potwierdzeniu przez administratora platformy.</p>
            <dl className="space-y-3 rounded-lg border border-ink/10 bg-paper p-4">
              {[
                ["Odbiorca", transfer.transfer.recipient],
                ["Numer konta", transfer.transfer.iban],
                ["Bank", transfer.transfer.bankName],
                ["Tytuł przelewu", transfer.transfer.title],
                ["Kwota", pln(transfer.amountCents)],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-ink-mute">{k}</dt>
                  <dd className="break-all text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex justify-end"><button onClick={closeModal} className={btnPrimary}>Gotowe</button></div>
          </div>
        ) : planChange && chosen && sub ? (
          <div className="space-y-4 text-sm">
            {(() => {
              const curPrice = sub.billingInterval === "YEARLY" ? sub.plan.yearlyPriceCents : sub.plan.monthlyPriceCents;
              const isUpgrade = price(chosen) > curPrice;
              return (
                <>
                  <dl className="space-y-2 rounded-lg border border-ink/10 bg-paper p-4">
                    <div className="flex justify-between"><dt className="text-ink-mute">Obecny plan</dt><dd className="font-medium text-ink">{sub.plan.name} · {pln(curPrice)}</dd></div>
                    <div className="flex justify-between"><dt className="text-ink-mute">Nowy plan</dt><dd className="font-medium text-ink">{chosen.name} · {pln(price(chosen))}</dd></div>
                  </dl>
                  {isUpgrade ? (
                    <p className="text-ink-soft">
                      {sub.stripeSubscriptionId
                        ? "Plan zostanie podniesiony od razu — różnica w cenie za bieżący okres zostanie pobrana z zapisanej karty."
                        : "Plan zostanie podniesiony po opłaceniu proporcjonalnej różnicy przelewem za pozostałą część okresu."}
                    </p>
                  ) : (
                    <p className="text-ink-soft">Nowy plan zacznie obowiązywać od następnego okresu rozliczeniowego — do końca bieżącego zachowujesz plan {sub.plan.name}. Kolejna płatność będzie już niższa.</p>
                  )}
                  <div className="flex justify-end gap-3 pt-1">
                    <button onClick={closeModal} className={btnGhost}>Anuluj</button>
                    <button onClick={doChangePlan} disabled={busy} className={btnPrimary}>{busy ? "Przetwarzanie..." : isUpgrade ? "Zmień plan teraz" : "Zaplanuj zmianę"}</button>
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">Wybierz sposób płatności:</p>
            {data?.methods.stripe && (
              <button disabled={busy} onClick={() => pay("STRIPE")} className="w-full rounded-lg border border-ink/15 p-4 text-left transition-colors hover:border-brand-800 disabled:opacity-60">
                <p className="font-semibold text-ink">Karta — subskrypcja cykliczna</p>
                <p className="mt-1 text-xs text-ink-soft">Formularz płatności otworzy się w tym oknie, bez przekierowania. Subskrypcja odnawia się automatycznie.</p>
              </button>
            )}
            {data?.methods.bankTransfer && (
              <button disabled={busy} onClick={() => pay("BANK_TRANSFER")} className="w-full rounded-lg border border-ink/15 p-4 text-left transition-colors hover:border-brand-800 disabled:opacity-60">
                <p className="font-semibold text-ink">Przelew tradycyjny</p>
                <p className="mt-1 text-xs text-ink-soft">Pokażemy dane do przelewu. Aktywacja po zaksięgowaniu wpłaty; przy kolejnym okresie przelew wykonujesz ponownie.</p>
              </button>
            )}
            {!data?.methods.stripe && !data?.methods.bankTransfer && (
              <p className={alertError}>Płatności nie są jeszcze skonfigurowane. Napisz do nas w zakładce Support.</p>
            )}
          </div>
        )}
      </Modal>

      <Modal open={showUpdateCard} onClose={() => setShowUpdateCard(false)} title="Zaktualizuj kartę płatniczą" subtitle="Nowa karta zastąpi obecną — kolejne płatności będą pobierane z niej." wide>
        <PaymentMethodUpdater onDone={() => setShowUpdateCard(false)} onBack={() => setShowUpdateCard(false)} />
      </Modal>

      <Modal
        open={showSwitch}
        onClose={() => setShowSwitch(false)}
        title={sub?.stripeSubscriptionId ? "Przełącz na przelew" : "Przełącz na kartę"}
        subtitle={sub?.stripeSubscriptionId ? "Automatyczne odnawianie kartą zostanie wyłączone." : "Zapisz kartę — odnawianie włączy się od następnego okresu, teraz nic nie pobieramy."}
        wide={!sub?.stripeSubscriptionId}
      >
        {sub?.stripeSubscriptionId ? (
          <div className="space-y-4 text-sm">
            {switchDone ? (
              <>
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">{switchDone}</p>
                <div className="flex justify-end"><button onClick={() => setShowSwitch(false)} className={btnPrimary}>Zamknij</button></div>
              </>
            ) : (
              <>
                <p className="text-ink-soft leading-relaxed">
                  Przełączysz metodę na <strong className="text-ink">przelew</strong> — karta przestanie się obciążać automatycznie.
                  Korzystasz z platformy do końca opłaconego okresu
                  {sub.currentPeriodEnd ? ` (${new Date(sub.currentPeriodEnd).toLocaleDateString("pl-PL")})` : ""},
                  a kolejny okres opłacisz fakturą proforma.
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowSwitch(false)} className={btnGhost}>Anuluj</button>
                  <button
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError(null);
                      try {
                        await apiPost("/billing/switch-method", { method: "BANK_TRANSFER" }, true);
                        setSwitchDone("Przełączono na przelew — automatyczne odnawianie kartą wyłączone. Kolejny okres opłacisz fakturą.");
                        await load();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Nie udało się zmienić metody płatności");
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className={btnPrimary}
                  >
                    {busy ? "Przełączanie..." : "Przełącz na przelew"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <SwitchToCardSubscription
            onDone={() => {
              setShowSwitch(false);
              load();
            }}
            onBack={() => setShowSwitch(false)}
          />
        )}
      </Modal>

      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Anulować subskrypcję?">
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-ink/10 bg-paper p-4">
            <p className="text-ink-soft leading-relaxed">
              Subskrypcja <strong className="text-ink">{sub?.plan.name}</strong> przestanie się odnawiać —
              kolejna płatność <strong className="text-ink">nie zostanie pobrana</strong>.
            </p>
            <ul className="mt-3 space-y-1.5 text-ink-soft">
              <li className="flex gap-2"><span className="text-brand-700">✓</span> Korzystasz z platformy do <strong className="text-ink">{sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("pl-PL") : "końca okresu"}</strong></li>
              <li className="flex gap-2"><span className="text-brand-700">✓</span> Już wystawione legitymacje pozostają ważne</li>
              <li className="flex gap-2"><span className="text-brand-700">✓</span> Możesz wznowić odnawianie w każdej chwili</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmCancel(false)} className={btnGhost}>Zachowaj subskrypcję</button>
            <button
              onClick={async () => {
                setConfirmCancel(false);
                await toggleCancel(true);
              }}
              disabled={busy}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              Tak, anuluj subskrypcję
            </button>
          </div>
        </div>
      </Modal>
    </PanelShell>
  );
}

function CheckoutPaymentForm({ onPaid, onBack }: { onPaid: () => void; onBack: () => void }) {
  const state = useCheckoutElements();
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  async function submit() {
    if (state.type !== "success") return;
    setSubmitting(true);
    setPayError(null);
    const result = await state.checkout.confirm({ redirect: "if_required" });
    if (result.type === "success") {
      onPaid();
      return;
    }
    setPayError(result.error.message || "Nie udało się przetworzyć płatności. Spróbuj ponownie.");
    setSubmitting(false);
  }

  if (state.type === "error") {
    return <p className={alertError}>{state.error.message}</p>;
  }

  return (
    <div className="space-y-4">
      {state.type === "loading" ? (
        <p className="py-10 text-center text-sm text-ink-mute">Ładowanie formularza płatności...</p>
      ) : (
        <>
          <PaymentElement
            options={{
              layout: "tabs",
              paymentMethodOrder: ["card"],
              fields: { billingDetails: "never" },
              wallets: { applePay: "never", googlePay: "never", link: "never" },
            }}
          />
          {payError && <p className={alertError}>{payError}</p>}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button type="button" onClick={onBack} disabled={submitting} className={btnGhost}>Inna metoda</button>
            <button type="button" onClick={submit} disabled={submitting} className={btnPrimary}>
              {submitting ? "Przetwarzanie..." : "Zapłać i aktywuj subskrypcję"}
            </button>
          </div>
          <p className="text-xs text-ink-mute">Płatność obsługuje Stripe — dane karty nie trafiają na nasze serwery. Subskrypcja odnawia się automatycznie.</p>
        </>
      )}
    </div>
  );
}
