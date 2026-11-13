"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutElementsProvider, PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import { apiPost } from "@/lib/api";
import { alertError, btnGhost, btnPrimary, pln } from "@/lib/ui";

export type Interval = "MONTHLY" | "YEARLY";

// Wspólna konfiguracja wyglądu Stripe Elements dla wszystkich formularzy
const elementsAppearance = {
  theme: "flat" as const,
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
};

export interface PaymentMethods {
  stripe: boolean;
  bankTransfer: { recipient: string; iban: string; bankName: string } | null;
}

interface TransferInfo {
  amountCents: number;
  transfer: { recipient: string; iban: string; bankName: string; title: string };
}

interface Props {
  planId: string;
  interval: Interval;
  methods: PaymentMethods;
  onBack?: () => void;
  onDone?: () => void;
  // Gdy firma ma aktywną subskrypcję i wybiera INNY plan w tym samym okresie —
  // zamiast nowej płatności wywołujemy zmianę planu (doliczenie różnicy / downgrade)
  activeSub?: { planId: string; billingInterval: Interval; status: string } | null;
}

// Kompletny przepływ płatności za plan: wybór metody -> Stripe (embedded) lub przelew -> sukces
export function PlanPaymentFlow({ planId, interval, methods, onBack, onDone, activeSub }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<TransferInfo | null>(null);
  const [embedded, setEmbedded] = useState<{ clientSecret: string; publishableKey: string } | null>(null);
  const [paid, setPaid] = useState(false);
  const [changeResult, setChangeResult] = useState<string | null>(null);
  const stripePromise = useMemo(() => (embedded ? loadStripe(embedded.publishableKey) : null), [embedded]);
  const isPlanChange =
    activeSub?.status === "ACTIVE" && activeSub.planId !== planId && activeSub.billingInterval === interval;

  async function changePlan() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiPost<{ kind: string; planName?: string; effectiveAt?: string } & Partial<TransferInfo>>(
        "/billing/change-plan",
        { planId },
        true
      );
      if (res.kind === "UPGRADE_TRANSFER") {
        setTransfer(res as TransferInfo);
        return;
      }
      const msg =
        res.kind === "UPGRADE_CHARGED"
          ? `Plan zmieniony na ${res.planName}. Różnica w cenie zostanie pobrana z zapisanej karty.`
          : res.kind === "DOWNGRADE_SCHEDULED"
            ? `Plan zmieni się na ${res.planName} od ${res.effectiveAt ? new Date(res.effectiveAt).toLocaleDateString("pl-PL") : "końca bieżącego okresu"}. Do tego czasu zachowujesz obecny plan.`
            : "Zaplanowana zmiana planu została cofnięta.";
      setChangeResult(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zmienić planu");
    } finally {
      setBusy(false);
    }
  }

  async function pay(method: "STRIPE" | "BANK_TRANSFER") {
    setBusy(true);
    setError(null);
    try {
      const res = await apiPost<{ clientSecret?: string; publishableKey?: string } & Partial<TransferInfo>>(
        "/billing/checkout",
        { planId, interval, method },
        true
      );
      if (method === "STRIPE" && res.clientSecret && res.publishableKey) {
        setEmbedded({ clientSecret: res.clientSecret, publishableKey: res.publishableKey });
        return;
      }
      setTransfer(res as TransferInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się rozpocząć płatności");
    } finally {
      setBusy(false);
    }
  }

  async function handlePaid() {
    setEmbedded(null);
    setPaid(true);
    onDone?.();
  }

  if (paid || changeResult) {
    return (
      <div className="space-y-4 text-sm">
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          {changeResult ??
            "Dziękujemy! Płatność została przyjęta. Subskrypcja aktywuje się w ciągu kilku sekund — status odświeży się automatycznie."}
        </p>
        <div className="flex justify-end">
          <button onClick={onDone} className={btnPrimary}>Zamknij</button>
        </div>
      </div>
    );
  }

  if (embedded) {
    return (
      <CheckoutElementsProvider
        stripe={stripePromise}
        options={{
          clientSecret: embedded.clientSecret,
          elementsOptions: { appearance: elementsAppearance },
        }}
      >
        <CheckoutPaymentForm onPaid={handlePaid} onBack={() => setEmbedded(null)} />
      </CheckoutElementsProvider>
    );
  }

  if (transfer) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-ink-soft">
          Wykonaj przelew na poniższe dane. Subskrypcja zostanie aktywowana po zaksięgowaniu wpłaty i potwierdzeniu
          przez administratora platformy.
        </p>
        <dl className="space-y-3 rounded-lg border border-ink/10 bg-paper p-4">
          {[
            ["Odbiorca", transfer.transfer.recipient],
            ["Numer konta", transfer.transfer.iban],
            ["Bank", transfer.transfer.bankName],
            ["Tytuł przelewu", transfer.transfer.title],
            ["Kwota", pln(transfer.amountCents)],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-ink-mute">{k}</dt>
                <dd className="break-all text-right font-medium text-ink">{v}</dd>
              </div>
            ))}
        </dl>
        <div className="flex justify-between gap-3">
          {onBack && <button onClick={onBack} className={btnGhost}>Wróć</button>}
          <button onClick={onDone} className={btnPrimary}>Gotowe</button>
        </div>
      </div>
    );
  }

  if (isPlanChange) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-soft">
          Zmieniamy Twój obecny plan — doliczymy tylko proporcjonalną różnicę w cenie do końca bieżącego okresu
          (przy przejściu na niższy plan zmiana obowiąże od następnego okresu, bez dopłaty).
        </p>
        <button disabled={busy} onClick={changePlan} className={`${btnPrimary} w-full`}>
          {busy ? "Przetwarzanie..." : "Potwierdź zmianę planu"}
        </button>
        {error && <p className={alertError}>{error}</p>}
        {onBack && (
          <button onClick={onBack} className="text-sm font-medium text-ink-mute transition-colors hover:text-ink">
            ← Wróć do wyboru planu
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">Wybierz sposób płatności:</p>
      {methods.stripe && (
        <button
          disabled={busy}
          onClick={() => pay("STRIPE")}
          className="w-full rounded-lg border border-ink/15 p-4 text-left transition-colors hover:border-brand-800 disabled:opacity-60"
        >
          <p className="font-semibold text-ink">Karta — subskrypcja cykliczna</p>
          <p className="mt-1 text-xs text-ink-soft">
            Formularz płatności otworzy się w tym oknie, bez przekierowania. Subskrypcja odnawia się automatycznie.
          </p>
        </button>
      )}
      {methods.bankTransfer && (
        <button
          disabled={busy}
          onClick={() => pay("BANK_TRANSFER")}
          className="w-full rounded-lg border border-ink/15 p-4 text-left transition-colors hover:border-brand-800 disabled:opacity-60"
        >
          <p className="font-semibold text-ink">Przelew tradycyjny</p>
          <p className="mt-1 text-xs text-ink-soft">
            Pokażemy dane do przelewu (faktura proforma). Aktywacja po zaksięgowaniu wpłaty.
          </p>
        </button>
      )}
      {!methods.stripe && !methods.bankTransfer && (
        <p className={alertError}>Płatności nie są jeszcze skonfigurowane. Napisz do nas w zakładce Support.</p>
      )}
      {error && <p className={alertError}>{error}</p>}
      {onBack && (
        <button onClick={onBack} className="text-sm font-medium text-ink-mute transition-colors hover:text-ink">
          ← Wróć do wyboru planu
        </button>
      )}
    </div>
  );
}

function CheckoutPaymentForm({ onPaid, onBack, submitLabel }: { onPaid: () => void; onBack: () => void; submitLabel?: string }) {
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
            <button type="button" onClick={onBack} disabled={submitting} className={btnGhost}>Wróć</button>
            <button type="button" onClick={submit} disabled={submitting} className={btnPrimary}>
              {submitting ? "Przetwarzanie..." : submitLabel ?? "Zapłać i aktywuj subskrypcję"}
            </button>
          </div>
          <p className="text-xs text-ink-mute">
            Płatność obsługuje Stripe — dane karty nie trafiają na nasze serwery. Subskrypcja odnawia się automatycznie.
          </p>
        </>
      )}
    </div>
  );
}

// Wspólny komponent embedded Stripe dla sesji typu setup / subscription — wywołuje endpoint
// i renderuje formularz; po potwierdzeniu pokazuje komunikat sukcesu.
function EmbeddedStripeAction({
  endpoint,
  body,
  submitLabel,
  successText,
  onDone,
  onBack,
}: {
  endpoint: string;
  body?: Record<string, unknown>;
  submitLabel: string;
  successText: string;
  onDone?: () => void;
  onBack?: () => void;
}) {
  const [embedded, setEmbedded] = useState<{ clientSecret: string; publishableKey: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const stripePromise = useMemo(() => (embedded ? loadStripe(embedded.publishableKey) : null), [embedded]);

  useEffect(() => {
    apiPost<{ clientSecret: string; publishableKey: string }>(endpoint, body ?? {}, true)
      .then((res) => setEmbedded({ clientSecret: res.clientSecret, publishableKey: res.publishableKey }))
      .catch((err) => setError(err instanceof Error ? err.message : "Nie udało się rozpocząć operacji"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) {
    return (
      <div className="space-y-4 text-sm">
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">{successText}</p>
        <div className="flex justify-end">
          <button onClick={onDone} className={btnPrimary}>Zamknij</button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-sm">
        <p className={alertError}>{error}</p>
        {onBack && <button onClick={onBack} className={btnGhost}>Wróć</button>}
      </div>
    );
  }

  if (!embedded) {
    return <p className="py-10 text-center text-sm text-ink-mute">Ładowanie formularza...</p>;
  }

  return (
    <CheckoutElementsProvider
      stripe={stripePromise}
      options={{
        clientSecret: embedded.clientSecret,
        elementsOptions: { appearance: elementsAppearance },
      }}
    >
      <CheckoutPaymentForm
        submitLabel={submitLabel}
        onPaid={() => {
          setDone(true);
          onDone?.();
        }}
        onBack={() => onBack?.()}
      />
    </CheckoutElementsProvider>
  );
}

// Aktualizacja karty dla subskrypcji opłacanej kartą (Stripe Checkout w trybie setup, embedded).
// Po zapisaniu karty webhook podpina nową metodę pod subskrypcję i ponawia zaległe faktury.
export function PaymentMethodUpdater({ onDone, onBack }: { onDone?: () => void; onBack?: () => void }) {
  return (
    <EmbeddedStripeAction
      endpoint="/billing/update-payment-method"
      submitLabel="Zapisz nową kartę"
      successText="Karta została zaktualizowana. Jeśli była zaległość w płatności, system ponowi jej pobranie automatycznie."
      onDone={onDone}
      onBack={onBack}
    />
  );
}

// Przejście przelew -> karta: zapis karty + automatyczne odnawianie od końca bieżącego okresu
export function SwitchToCardSubscription({ onDone, onBack }: { onDone?: () => void; onBack?: () => void }) {
  return (
    <EmbeddedStripeAction
      endpoint="/billing/switch-method"
      body={{ method: "STRIPE" }}
      submitLabel="Zapisz kartę i włącz odnawianie"
      successText="Karta została zapisana — automatyczne odnawianie rozpocznie się od końca bieżącego opłaconego okresu. Teraz nic nie pobieramy."
      onDone={onDone}
      onBack={onBack}
    />
  );
}
