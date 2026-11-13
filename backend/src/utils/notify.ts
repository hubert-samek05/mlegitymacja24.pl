import { prisma } from '../config/prisma';
import { sendEmail } from './mailer';
import type { EmailContent } from './emailTemplates';

// Wysyła e-mail do wszystkich aktywnych administratorów danej firmy
export async function mailCompanyAdmins(companyId: string, tpl: EmailContent): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { companyId, role: 'COMPANY_ADMIN', isActive: true },
    select: { email: true },
  });
  const to = [...new Set(admins.map((a) => a.email))];
  if (to.length) await sendEmail(to, tpl.subject, tpl.html);
}

// Wysyła e-mail do wszystkich administratorów platformy
export async function mailSuperAdmins(tpl: EmailContent): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN', isActive: true },
    select: { email: true },
  });
  const to = [...new Set(admins.map((a) => a.email))];
  if (to.length) await sendEmail(to, tpl.subject, tpl.html);
}
