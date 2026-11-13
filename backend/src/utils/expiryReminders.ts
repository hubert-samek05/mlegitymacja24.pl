import { prisma } from '../config/prisma';
import { sendEmail } from './mailer';
import { mailCompanyAdmins } from './notify';
import { tplCredentialExpiringCompany, tplCredentialExpiringHolder } from './emailTemplates';

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
