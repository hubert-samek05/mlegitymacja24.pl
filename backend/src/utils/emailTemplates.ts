import { env } from '../config/env';

// ---------------------------------------------------------------------------
// Szablony e-maili mLegitymacja24 — profesjonalne, bez ikon/emoji.
// Układ tabelaryzowany z inline CSS (kompatybilny z klientami pocztowymi).
// ---------------------------------------------------------------------------

const NAVY = '#0b2557';
const NAVY_DARK = '#071a3f';
const RED = '#c1121f';
const INK = '#1e3054';
const SOFT = '#45598a';
const MUTE = '#7a89a8';
const LINE = '#e3e8f2';
const PAPER = '#f4f6fa';
const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

export const APP_STORE_URL = 'https://apps.apple.com/us/app/mlegitymacja24-pl/id6834377120';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=mLegitymacja24.pl';

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function pln(cents: number): string {
  return `${(cents / 100).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
}

export interface EmailRow {
  label: string;
  value: string;
}

interface BaseOptions {
  title: string;
  greeting?: string;
  paragraphs: string[];
  rows?: EmailRow[];
  highlight?: { text: string; tone?: 'info' | 'warn' | 'ok' };
  cta?: { label: string; url: string };
  afterCta?: string[];
}

function baseEmail(o: BaseOptions): string {
  const appUrl = env.frontendUrl;
  const logoUrl = `${appUrl}/logo-v2.png`;

  const highlightHtml = o.highlight
    ? `<tr><td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;background:${
          o.highlight.tone === 'warn' ? '#fdf3e7' : o.highlight.tone === 'ok' ? '#edf7f0' : '#eef3fb'
        };border-left:3px solid ${
          o.highlight.tone === 'warn' ? '#c97b12' : o.highlight.tone === 'ok' ? '#1e7a45' : NAVY
        };border-radius:0 6px 6px 0;">
          <tr><td style="padding:14px 18px;font-family:${FONT};font-size:14px;line-height:1.55;color:${
            o.highlight.tone === 'warn' ? '#7c4a08' : o.highlight.tone === 'ok' ? '#14532d' : INK
          };">${o.highlight.text}</td></tr>
        </table>
      </td></tr>`
    : '';

  const rowsHtml = o.rows?.length
    ? `<tr><td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;border:1px solid ${LINE};border-radius:8px;overflow:hidden;">
          ${o.rows
            .map(
              (r, i) => `<tr>
                <td style="padding:11px 16px;font-family:${FONT};font-size:13px;color:${MUTE};${i ? `border-top:1px solid ${LINE};` : ''}width:45%;">${esc(r.label)}</td>
                <td align="right" style="padding:11px 16px;font-family:${FONT};font-size:13px;font-weight:600;color:${INK};${i ? `border-top:1px solid ${LINE};` : ''}">${esc(r.value)}</td>
              </tr>`
            )
            .join('')}
        </table>
      </td></tr>`
    : '';

  const ctaHtml = o.cta
    ? `<tr><td align="center" style="padding:6px 0 8px;">
        <a href="${o.cta.url}" style="display:inline-block;background:${NAVY};color:#ffffff;font-family:${FONT};font-size:15px;font-weight:600;text-decoration:none;padding:13px 34px;border-radius:8px;">${esc(o.cta.label)}</a>
      </td></tr>
      <tr><td align="center" style="padding:0 0 14px;">
        <p style="margin:0;font-family:${FONT};font-size:12px;color:${MUTE};">Jeśli przycisk nie działa, otwórz ten link: <a href="${o.cta.url}" style="color:${NAVY_DARK};word-break:break-all;">${o.cta.url}</a></p>
      </td></tr>`
    : '';

  const paragraphs = (o.greeting ? [o.greeting, ...o.paragraphs] : o.paragraphs)
    .map((p) => `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.65;color:${SOFT};">${p}</p>`)
    .join('');

  const afterCta = (o.afterCta ?? [])
    .map((p) => `<p style="margin:0 0 14px;font-family:${FONT};font-size:14px;line-height:1.6;color:${MUTE};">${p}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(o.title)} — mLegitymacja24</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:26px 24px 20px;border-bottom:3px solid ${NAVY};background:#ffffff;">
      <a href="${appUrl}"><img src="${logoUrl}" alt="mLegitymacja24" height="36" style="display:block;height:36px;border:0;"></a>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:36px 24px 40px;background:#ffffff;">
      <table role="presentation" width="720" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;">
        <tr><td style="padding:0;">
          <h1 style="margin:0 0 20px;font-family:${FONT};font-size:22px;font-weight:700;color:${NAVY};line-height:1.3;">${esc(o.title)}</h1>
          ${paragraphs}
        </td></tr>
        ${highlightHtml}
        ${rowsHtml}
        ${ctaHtml}
        ${afterCta ? `<tr><td style="padding:4px 0 0;">${afterCta}</td></tr>` : ''}
      </table>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:24px 24px 30px;border-top:1px solid ${LINE};background:#ffffff;">
      <table role="presentation" width="720" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;">
        <tr><td>
          <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTE};">
            <strong style="color:${INK};">mLegitymacja24</strong> — cyfrowe legitymacje zawodowe ·
            <a href="mailto:kontakt@mlegitymacja24.pl" style="color:${NAVY_DARK};text-decoration:none;">kontakt@mlegitymacja24.pl</a> ·
            <a href="${appUrl}" style="color:${NAVY_DARK};text-decoration:none;">mlegitymacja24.pl</a>
          </p>
          <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;line-height:1.6;">
            <strong style="color:${INK};">Zainstaluj aplikację mobilną:</strong>&nbsp;
            <a href="${APP_STORE_URL}" style="color:${NAVY};font-weight:600;text-decoration:none;">App Store (iPhone)</a>
            <span style="color:${MUTE};">&nbsp;·&nbsp;</span>
            <a href="${PLAY_STORE_URL}" style="color:${NAVY};font-weight:600;text-decoration:none;">Google Play (Android)</a>
          </p>
          <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.6;color:${MUTE};">
            <a href="${appUrl}/regulamin" style="color:${MUTE};text-decoration:underline;">Regulamin</a> ·
            <a href="${appUrl}/polityka-prywatnosci" style="color:${MUTE};text-decoration:underline;">Polityka prywatności</a> ·
            <a href="${appUrl}/kontakt" style="color:${MUTE};text-decoration:underline;">Kontakt</a><br>
            To automatyczna wiadomość systemowa — prosimy na nią nie odpowiadać.
          </p>
        </td></tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

const panel = (path: string) => `${env.frontendUrl}${path}`;

export interface EmailContent {
  subject: string;
  html: string;
}

// ---------------------------------------------------------------------------
// SZABLONY — FIRMY
// ---------------------------------------------------------------------------

export function tplCompanyRegistered(companyName: string, adminName: string): EmailContent {
  return {
    subject: 'Dziękujemy za rejestrację — konto oczekuje na weryfikację',
    html: baseEmail({
      title: 'Rejestracja przyjęta',
      greeting: `Dzień dobry ${esc(adminName)},`,
      paragraphs: [
        `dziękujemy za rejestrację firmy <strong>${esc(companyName)}</strong> na platformie mLegitymacja24.`,
        'Twoje zgłoszenie trafiło do weryfikacji przez administratora platformy. Zazwyczaj trwa to do 1–2 dni roboczych — poinformujemy Cię o decyzji osobną wiadomością.',
        'Jeśli potrzebne będą dodatkowe informacje lub dokumenty, skontaktujemy się z Tobą.',
      ],
      highlight: { text: 'Po akceptacji konta wybierzesz plan subskrypcji i zaczniesz wystawiać cyfrowe legitymacje swoim absolwentom.' },
      cta: { label: 'Przejdź do panelu firmy', url: panel('/panel/firma') },
    }),
  };
}

export function tplCompanyApproved(companyName: string, adminName: string): EmailContent {
  return {
    subject: 'Twoje konto firmy zostało zatwierdzone',
    html: baseEmail({
      title: 'Konto firmy jest aktywne',
      greeting: `Dzień dobry ${esc(adminName)},`,
      paragraphs: [
        `konto firmy <strong>${esc(companyName)}</strong> zostało zweryfikowane i aktywowane.`,
        'Ostatni krok to wybór planu subskrypcji — po jego opłaceniu będziesz mógł wystawiać cyfrowe legitymacje, zapraszać pracowników i korzystać z pełni platformy.',
      ],
      cta: { label: 'Wybierz plan subskrypcji', url: panel('/panel/firma/subskrypcja') },
    }),
  };
}

export function tplCompanyRejected(companyName: string, adminName: string, note: string | null): EmailContent {
  return {
    subject: 'Zgłoszenie firmy wymaga uzupełnienia',
    html: baseEmail({
      title: 'Zgłoszenie wymaga uzupełnienia',
      greeting: `Dzień dobry ${esc(adminName)},`,
      paragraphs: [
        `zgłoszenie firmy <strong>${esc(companyName)}</strong> zostało odrzucone podczas weryfikacji.`,
      ],
      ...(note ? { highlight: { text: `<strong>Uwagi administratora:</strong> ${esc(note)}`, tone: 'warn' as const } } : {}),
      cta: { label: 'Uzupełnij dane firmy', url: panel('/panel/firma/moja-firma') },
      afterCta: [
        'Popraw lub uzupełnij dane firmy w zakładce „Moja firma”, a zgłoszenie trafi do ponownej weryfikacji. W razie pytań skorzystaj z zakładki Support w panelu.',
      ],
    }),
  };
}

export function tplCompanySuspendedByAdmin(companyName: string, adminName: string): EmailContent {
  return {
    subject: 'Konto firmy zostało zawieszone',
    html: baseEmail({
      title: 'Konto firmy zawieszone',
      greeting: `Dzień dobry ${esc(adminName)},`,
      paragraphs: [
        `konto firmy <strong>${esc(companyName)}</strong> zostało zawieszone przez administratora platformy.`,
        'Aby poznać przyczynę i odzyskać dostęp, skontaktuj się z nami przez zakładkę Support w panelu firmy.',
      ],
      highlight: {
        text: 'Wystawione wcześniej legitymacje pozostają ważne — zawieszenie konta nie wpływa na dokumenty Twoich absolwentów.',
      },
      cta: { label: 'Kontakt z supportem', url: panel('/panel/firma/support') },
    }),
  };
}

export function tplSubscriptionActivated(
  companyName: string,
  planName: string,
  interval: string,
  periodEnd: Date,
  amountCents: number | null
): EmailContent {
  return {
    subject: `Subskrypcja ${planName} aktywna`,
    html: baseEmail({
      title: 'Subskrypcja została aktywowana',
      greeting: 'Dzień dobry,',
      paragraphs: [
        `potwierdziliśmy płatność — subskrypcja firmy <strong>${esc(companyName)}</strong> jest aktywna.`,
      ],
      rows: [
        { label: 'Plan', value: planName },
        { label: 'Okres rozliczeniowy', value: interval === 'YEARLY' ? 'roczny' : 'miesięczny' },
        ...(amountCents != null ? [{ label: 'Kwota', value: pln(amountCents) }] : []),
        { label: 'Dostęp do', value: periodEnd.toLocaleDateString('pl-PL') },
      ],
      highlight: { text: 'Możesz już wystawiać legitymacje, dodawać pracowników i korzystać z pełni platformy.', tone: 'ok' },
      cta: { label: 'Przejdź do panelu firmy', url: panel('/panel/firma') },
    }),
  };
}

export function tplSubscriptionRenewed(planName: string, periodEnd: Date, amountCents: number): EmailContent {
  return {
    subject: `Subskrypcja ${planName} odnowiona`,
    html: baseEmail({
      title: 'Subskrypcja odnowiona',
      greeting: 'Dzień dobry,',
      paragraphs: ['pobraliśmy płatność za kolejny okres rozliczeniowy — Twoja subskrypcja jest nadal aktywna.'],
      rows: [
        { label: 'Plan', value: planName },
        { label: 'Kwota', value: pln(amountCents) },
        { label: 'Następne odnowienie', value: periodEnd.toLocaleDateString('pl-PL') },
      ],
      cta: { label: 'Zobacz subskrypcję', url: panel('/panel/firma/subskrypcja') },
    }),
  };
}

export function tplTransferInstructions(
  companyName: string,
  planName: string,
  amountCents: number,
  transfer: { recipient: string; iban: string; bankName: string; title: string }
): EmailContent {
  return {
    subject: `Dane do przelewu — plan ${planName}`,
    html: baseEmail({
      title: 'Wybrano płatność przelewem',
      greeting: 'Dzień dobry,',
      paragraphs: [
        `wybrano plan <strong>${esc(planName)}</strong> dla firmy <strong>${esc(companyName)}</strong> z płatnością przelewem.`,
        'Wykonaj przelew na poniższe dane — subskrypcja aktywuje się po zaksięgowaniu wpłaty.',
      ],
      rows: [
        { label: 'Odbiorca', value: transfer.recipient },
        { label: 'Numer konta', value: transfer.iban },
        { label: 'Bank', value: transfer.bankName },
        { label: 'Tytuł przelewu', value: transfer.title },
        { label: 'Kwota', value: pln(amountCents) },
      ],
      highlight: { text: 'Podaj dokładnie ten tytuł przelewu — pozwala nam automatycznie powiązać wpłatę z Twoim kontem.' },
      cta: { label: 'Status subskrypcji', url: panel('/panel/firma/subskrypcja') },
    }),
  };
}

export function tplPaymentFailed(companyName: string, planName: string): EmailContent {
  return {
    subject: 'Nie udało się pobrać płatności — zaktualizuj metodę płatności',
    html: baseEmail({
      title: 'Płatność została odrzucona',
      greeting: 'Dzień dobry,',
      paragraphs: [
        `nie udało się pobrać płatności za odnowienie planu <strong>${esc(planName)}</strong> firmy ${esc(companyName)}.`,
        'Przyczyną może być wygasła karta lub brak środków na koncie. Spróbujemy ponowić pobranie automatycznie — możesz też od razu zaktualizować metodę płatności.',
      ],
      highlight: {
        text: `Jeśli w ciągu ${env.billingGraceDays} dni płatność nie dojdzie do skutku, konto firmy zostanie zawieszone do czasu uregulowania.`,
        tone: 'warn',
      },
      cta: { label: 'Zaktualizuj metodę płatności', url: panel('/panel/firma/subskrypcja?metoda=karta') },
    }),
  };
}

export function tplPastDue(companyName: string, planName: string): EmailContent {
  return {
    subject: 'Minął termin płatności subskrypcji',
    html: baseEmail({
      title: 'Subskrypcja wymaga odnowienia',
      greeting: 'Dzień dobry,',
      paragraphs: [
        `minął okres rozliczeniowy planu <strong>${esc(planName)}</strong> firmy ${esc(companyName)}.`,
      ],
      highlight: {
        text: `Masz ${env.billingGraceDays} dni na opłacenie nowej faktury — po tym czasie konto firmy zostanie zawieszone do momentu zapłaty.`,
        tone: 'warn',
      },
      cta: { label: 'Opłać subskrypcję', url: panel('/panel/firma/subskrypcja') },
    }),
  };
}

export function tplSubscriptionBlocked(companyName: string, planName: string): EmailContent {
  return {
    subject: 'Konto firmy zawieszone — nieopłacona subskrypcja',
    html: baseEmail({
      title: 'Konto firmy zawieszone',
      greeting: 'Dzień dobry,',
      paragraphs: [
        `minęło ${env.billingGraceDays} dni od końca okresu rozliczeniowego planu <strong>${esc(planName)}</strong> bez opłacenia faktury — konto firmy ${esc(companyName)} zostało zawieszone.`,
        'Aby odblokować dostęp, zaloguj się i opłać subskrypcję.',
      ],
      highlight: {
        text: 'Wystawione wcześniej legitymacje pozostają ważne dla absolwentów — zawieszenie blokuje tylko wystawianie nowych.',
      },
      cta: { label: 'Opłać i odblokuj konto', url: panel('/panel/firma/subskrypcja') },
    }),
  };
}

export function tplPaymentRecovered(planName: string): EmailContent {
  return {
    subject: 'Płatność zrealizowana — subskrypcja aktywna',
    html: baseEmail({
      title: 'Dziękujemy za płatność',
      greeting: 'Dzień dobry,',
      paragraphs: [
        `nowa metoda płatności została zapisana, a zaległa faktura za plan <strong>${esc(planName)}</strong> opłacona.`,
        'Subskrypcja jest ponownie w pełni aktywna.',
      ],
      cta: { label: 'Przejdź do panelu firmy', url: panel('/panel/firma') },
    }),
  };
}

export function tplTicketAnswered(ticketNumber: number, ticketSubject: string, isCompany: boolean): EmailContent {
  return {
    subject: `Odpowiedź na zgłoszenie #${ticketNumber}`,
    html: baseEmail({
      title: 'Nowa odpowiedź na zgłoszenie',
      greeting: 'Dzień dobry,',
      paragraphs: [
        `nasz zespół odpowiedział na zgłoszenie <strong>„${esc(ticketSubject)}”</strong> (nr ${ticketNumber}).`,
        'Zaloguj się do panelu i przejdź do zakładki Support, aby przeczytać odpowiedź.',
      ],
      cta: {
        label: 'Zobacz odpowiedź',
        url: panel(isCompany ? '/panel/firma/support' : '/panel/absolwent/powiadomienia'),
      },
    }),
  };
}

// ---------------------------------------------------------------------------
// SZABLONY — ABSOLWENCI
// ---------------------------------------------------------------------------

export function tplCredentialIssuedNew(
  holderName: string,
  typeName: string,
  companyName: string,
  email: string,
  temporaryPassword: string
): EmailContent {
  return {
    subject: `Otrzymałeś legitymację — ${typeName}`,
    html: baseEmail({
      title: 'Nowa legitymacja w Twoim portfelu',
      greeting: `Dzień dobry ${esc(holderName)},`,
      paragraphs: [
        `firma <strong>${esc(companyName)}</strong> wystawiła Ci cyfrową legitymację <strong>„${esc(typeName)}”</strong>.`,
        'Utworzyliśmy dla Ciebie konto w cyfrowym portfelu — zaloguj się poniższymi danymi, aby zobaczyć dokument, pobrać go lub pokazać kod QR do weryfikacji.',
      ],
      rows: [
        { label: 'Login', value: email },
        { label: 'Hasło tymczasowe', value: temporaryPassword },
      ],
      highlight: { text: 'Przy pierwszym logowaniu zmień hasło tymczasowe na własne w ustawieniach konta.', tone: 'warn' },
      cta: { label: 'Otwórz portfel legitymacji', url: panel('/logowanie') },
      afterCta: [
        'Twoja legitymacja jest dostępna także w aplikacji mobilnej mLegitymacja24 — zaloguj się tymi samymi danymi.',
      ],
    }),
  };
}

export function tplCredentialIssuedExisting(holderName: string, typeName: string, companyName: string): EmailContent {
  return {
    subject: `Nowa legitymacja w portfelu — ${typeName}`,
    html: baseEmail({
      title: 'Nowa legitymacja w Twoim portfelu',
      greeting: `Dzień dobry ${esc(holderName)},`,
      paragraphs: [
        `firma <strong>${esc(companyName)}</strong> wystawiła Ci cyfrową legitymację <strong>„${esc(typeName)}”</strong>.`,
        'Znajdziesz ją w swoim cyfrowym portfelu po zalogowaniu — możesz ją pobrać lub pokazać kod QR do weryfikacji.',
      ],
      cta: { label: 'Otwórz portfel legitymacji', url: panel('/logowanie') },
    }),
  };
}

// ---------------------------------------------------------------------------
// SZABLONY — ADMINISTRATOR PLATFORMY
// ---------------------------------------------------------------------------

export function tplAdminNewCompany(companyName: string, nip: string): EmailContent {
  return {
    subject: `Nowa firma czeka na weryfikację — ${companyName}`,
    html: baseEmail({
      title: 'Nowe zgłoszenie firmy',
      greeting: 'Dzień dobry,',
      paragraphs: ['nowa firma zarejestrowała się na platformie i oczekuje na weryfikację.'],
      rows: [
        { label: 'Firma', value: companyName },
        { label: 'NIP', value: nip },
      ],
      cta: { label: 'Zweryfikuj firmę', url: panel('/panel/super-admin') },
    }),
  };
}

export function tplAdminNewPayment(
  companyName: string,
  planName: string,
  amountCents: number,
  reference: string
): EmailContent {
  return {
    subject: `Nowa płatność przelewem oczekuje — ${companyName}`,
    html: baseEmail({
      title: 'Firma wybrała płatność przelewem',
      greeting: 'Dzień dobry,',
      paragraphs: ['firma wybrała subskrypcję z płatnością przelewem — wystaw fakturę proforma, a po wpłacie potwierdź ją w panelu.'],
      rows: [
        { label: 'Firma', value: companyName },
        { label: 'Plan', value: planName },
        { label: 'Kwota', value: pln(amountCents) },
        { label: 'Referencja', value: reference },
      ],
      cta: { label: 'Przejdź do płatności', url: panel('/panel/super-admin/platnosci') },
    }),
  };
}

export function tplCredentialExpiringHolder(
  holderName: string,
  typeName: string,
  companyName: string,
  expiryDate: Date
): EmailContent {
  return {
    subject: `Twoja legitymacja wkrótce wygaśnie — ${typeName}`,
    html: baseEmail({
      title: 'Legitymacja wkrótce straci ważność',
      greeting: `Dzień dobry ${esc(holderName)},`,
      paragraphs: [
        `Twoja legitymacja <strong>„${esc(typeName)}”</strong> wystawiona przez ${esc(companyName)} wygaśnie <strong>${esc(expiryDate.toLocaleDateString('pl-PL'))}</strong>.`,
        'Jeśli dokument ma być przedłużony, skontaktuj się z firmą, która go wydała — tylko wystawca może przedłużyć ważność legitymacji.',
      ],
      rows: [
        { label: 'Typ legitymacji', value: typeName },
        { label: 'Wystawca', value: companyName },
        { label: 'Ważna do', value: expiryDate.toLocaleDateString('pl-PL') },
      ],
      cta: { label: 'Otwórz portfel legitymacji', url: panel('/logowanie') },
    }),
  };
}

export function tplCredentialExpiringCompany(
  companyName: string,
  holderName: string,
  typeName: string,
  credentialNumber: string,
  expiryDate: Date
): EmailContent {
  return {
    subject: `Wygasająca legitymacja — ${holderName}`,
    html: baseEmail({
      title: 'Legitymacja absolwenta wkrótce wygaśnie',
      greeting: 'Dzień dobry,',
      paragraphs: [
        `za 30 dni wygaśnie legitymacja wystawiona przez ${esc(companyName)}. Absolwent również otrzymał przypomnienie.`,
        'Jeśli dokument ma pozostać ważny, przedłuż jego ważność w panelu przed datą końca.',
      ],
      rows: [
        { label: 'Absolwent', value: holderName },
        { label: 'Typ legitymacji', value: typeName },
        { label: 'Numer', value: credentialNumber },
        { label: 'Ważna do', value: expiryDate.toLocaleDateString('pl-PL') },
      ],
      cta: { label: 'Zarządzaj legitymacjami', url: panel('/panel/firma') },
    }),
  };
}

export function tplTicketCreated(ticketNumber: number, ticketSubject: string): EmailContent {
  return {
    subject: `Zgłoszenie #${ticketNumber} przyjęte`,
    html: baseEmail({
      title: 'Zgłoszenie zostało przyjęte',
      greeting: 'Dzień dobry,',
      paragraphs: [
        `potwierdzamy przyjęcie zgłoszenia <strong>„${esc(ticketSubject)}”</strong> (nr ${ticketNumber}).`,
        'Nasz zespół odpowie najszybciej, jak to możliwe — otrzymasz wiadomość e-mail, gdy tylko pojawi się odpowiedź.',
      ],
      rows: [
        { label: 'Numer zgłoszenia', value: `#${ticketNumber}` },
        { label: 'Temat', value: ticketSubject },
      ],
      cta: { label: 'Śledź zgłoszenie', url: panel('/panel/firma/support') },
    }),
  };
}

export function tplPasswordReset(name: string, resetUrl: string): EmailContent {
  return {
    subject: 'Resetowanie hasła — mLegitymacja24',
    html: baseEmail({
      title: 'Resetowanie hasła',
      greeting: `Dzień dobry ${esc(name)},`,
      paragraphs: [
        'otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta na platformie mLegitymacja24.',
        'Kliknij poniższy przycisk, aby ustawić nowe hasło. Link jest ważny przez 60 minut.',
      ],
      cta: { label: 'Ustaw nowe hasło', url: resetUrl },
      highlight: {
        text: 'Jeśli to nie Ty prosiłeś o reset hasła, zignoruj tę wiadomość — Twoje hasło pozostanie bez zmian.',
        tone: 'warn',
      },
    }),
  };
}

export function tplHolderWelcome(firstName: string): EmailContent {
  return {
    subject: 'Witaj w mLegitymacja24 — Twoje konto jest gotowe',
    html: baseEmail({
      title: 'Twoje konto zostało utworzone',
      greeting: `Dzień dobry ${esc(firstName)},`,
      paragraphs: [
        'utworzyłeś konto w cyfrowym portfelu mLegitymacja24.',
        'Gdy firma szkoleniowa wystawi Ci legitymację, pojawi się w Twoim portfelu automatycznie — poinformujemy Cię o tym osobną wiadomością.',
        'Zainstaluj aplikację mobilną mLegitymacja24 (linki poniżej) — dokumenty masz wtedy zawsze przy sobie, gotowe do pokazania kodem QR do weryfikacji.',
      ],
      cta: { label: 'Otwórz portfel legitymacji', url: panel('/logowanie') },
    }),
  };
}

export function tplStaffInvited(firstName: string, companyName: string, email: string): EmailContent {
  return {
    subject: `Zaproszenie do zespołu — ${companyName}`,
    html: baseEmail({
      title: 'Utworzono Ci konto w panelu firmy',
      greeting: `Dzień dobry ${esc(firstName)},`,
      paragraphs: [
        `administrator firmy <strong>${esc(companyName)}</strong> utworzył Ci konto pracownika na platformie mLegitymacja24.`,
        'Hasło do pierwszego logowania przekaże Ci bezpośrednio administrator Twojej firmy — z powodów bezpieczeństwa nie wysyłamy go w tej wiadomości.',
      ],
      rows: [{ label: 'Login', value: email }],
      cta: { label: 'Zaloguj się do panelu firmy', url: panel('/logowanie') },
      afterCta: [
        'Po pierwszym logowaniu zalecamy zmianę hasła oraz włączenie weryfikacji dwuetapowej w ustawieniach konta.',
      ],
    }),
  };
}

export function tplSubscriptionEnded(companyName: string, planName: string): EmailContent {
  return {
    subject: `Subskrypcja ${planName} zakończona`,
    html: baseEmail({
      title: 'Subskrypcja zakończona',
      greeting: 'Dzień dobry,',
      paragraphs: [
        `opłacony okres planu <strong>${esc(planName)}</strong> firmy ${esc(companyName)} dobiegł końca — subskrypcja została zakończona zgodnie z anulowaniem.`,
        'Dostęp do wystawiania legitymacji został wyłączony. Możesz wrócić w każdej chwili — wystarczy opłacić nowy plan.',
      ],
      highlight: {
        text: 'Wszystkie wystawione wcześniej legitymacje pozostają ważne dla absolwentów do ich daty wygaśnięcia.',
      },
      cta: { label: 'Wznów subskrypcję', url: panel('/panel/firma/subskrypcja') },
    }),
  };
}
