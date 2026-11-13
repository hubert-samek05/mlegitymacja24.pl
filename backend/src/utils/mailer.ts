import { env } from '../config/env';

// Wysyłka e-maili przez Resend (REST API — bez dodatkowych zależności).
// Bez ustawionego RESEND_API_KEY wysyłka jest pomijana (dev-safe), błędy są logowane, ale nie przerywają żądania.
export async function sendEmail(to: string | string[], subject: string, html: string): Promise<boolean> {
  if (!env.mail.resendApiKey) {
    console.log(`[mail] RESEND_API_KEY nieustawiony — pominięto wysyłkę: "${subject}" -> ${to}`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.mail.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.mail.from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(env.mail.replyTo ? { reply_to: env.mail.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[mail] Resend ${res.status}: ${body} (temat: "${subject}")`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[mail] Błąd wysyłki "${subject}":`, err);
    return false;
  }
}
