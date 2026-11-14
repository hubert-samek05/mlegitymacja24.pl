import { prisma } from '../config/prisma';
import { sendEmail } from './mailer';
import { mailCompanyAdmins } from './notify';
import {
  tplAppInstallReminder,
  tplCredentialExpiringCompany,
  tplCredentialExpiringHolder,
} from './emailTemplates';

// Codzienne przypomnienie o legitymacjach wygasających w ciągu 30 dni — do absolwenta i firmy
export async function runCredentialReminderCheck() {
  const in30d = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const credentials = await prisma.credential.findMany({
    where: {
      status: 'ACTIVE',
      expiryReminderSentAt: null,
      expiryDate: { not: null, gt: new Date(), lte: in30d },
    },
    include: {
      holder: { include: { user: { select: { email: true, firstName: true, lastName: true } } } },
      company: { select: { name: true } },
      credentialType: { select: { name: true } },
    },
    take: 500,
  });

  for (const c of credentials) {
    const holderName = `${c.holder.user.firstName} ${c.holder.user.lastName}`;
    const t1 = tplCredentialExpiringHolder(holderName, c.credentialType.name, c.company.name, c.expiryDate!);
    await sendEmail(c.holder.user.email, t1.subject, t1.html);
    const t2 = tplCredentialExpiringCompany(c.company.name, holderName, c.credentialType.name, c.credentialNumber, c.expiryDate!);
    await mailCompanyAdmins(c.companyId, t2);
    await prisma.credential.update({ where: { id: c.id }, data: { expiryReminderSentAt: new Date() } });
  }
  if (credentials.length) console.log(`[reminders] Wysłano przypomnienia o wygaśnięciu dla ${credentials.length} legitymacji`);
}

// Jednorazowy e-mail onboardingowy z zachętą do instalacji aplikacji.
// Wysyłany ~20h po utworzeniu profilu absolwenta (pierwsza legitymacja) —
// marker w tabeli notifications zapobiega duplikatom, retry po nieudanej wysyłce.
const APP_ONBOARDING_MARKER = 'APP_INSTALL_REMINDER';

export async function runAppOnboardingCheck() {
  const cutoff = new Date(Date.now() - 20 * 3600 * 1000);
  const profiles = await prisma.holderProfile.findMany({
    where: {
      createdAt: { lte: cutoff },
      credentials: { some: {} },
      user: { isActive: true },
    },
    include: { user: { select: { id: true, email: true, firstName: true } } },
    take: 500,
  });

  let sent = 0;
  for (const p of profiles) {
    const marker = await prisma.notification.findFirst({
      where: { userId: p.userId, subject: APP_ONBOARDING_MARKER },
    });
    if (marker?.status === 'SENT') continue;

    const tpl = tplAppInstallReminder(p.user.firstName);
    const ok = await sendEmail(p.user.email, tpl.subject, tpl.html);
    const data = {
      userId: p.userId,
      channel: 'EMAIL' as const,
      subject: APP_ONBOARDING_MARKER,
      body: 'Jednorazowa zachęta do instalacji aplikacji mobilnej',
      status: (ok ? 'SENT' : 'PENDING') as 'SENT' | 'PENDING',
      sentAt: ok ? new Date() : null,
    };
    if (marker) {
      await prisma.notification.update({ where: { id: marker.id }, data });
    } else {
      await prisma.notification.create({ data });
    }
    if (ok) sent += 1;
  }
  if (sent) console.log(`[onboarding] Wysłano ${sent} e-maili z zachętą do instalacji aplikacji`);
}
