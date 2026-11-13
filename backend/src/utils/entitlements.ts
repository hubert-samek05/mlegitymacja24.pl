import { prisma } from '../config/prisma';
import { env } from '../config/env';

export const UNLIMITED = 999999;

export async function getEntitlement(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: { include: { plan: true } } },
  });
  const [credentials, users] = await Promise.all([
    prisma.credential.count({ where: { companyId } }),
    prisma.user.count({ where: { companyId, isActive: true, role: { in: ['COMPANY_ADMIN', 'COMPANY_STAFF'] } } }),
  ]);
  const sub = company?.subscription ?? null;
  const now = Date.now();
  const graceMs = env.billingGraceDays * 24 * 3600 * 1000;
  const periodEnd = sub?.currentPeriodEnd?.getTime() ?? null;
  let subActive = false;
  let inGrace = false;
  if (sub) {
    // TRIALING liczy się tylko, gdy okres próbny jest włączony w konfiguracji
    if (sub.status === 'ACTIVE' || (sub.status === 'TRIALING' && env.trialDays > 0)) {
      if (!periodEnd || periodEnd > now) subActive = true;
      // Przelew: po końcu okresu firma ma okres karencji na uregulowanie faktury
      else if (!sub.stripeSubscriptionId && now - periodEnd < graceMs) {
        subActive = true;
        inGrace = true;
      }
    } else if (sub.status === 'PAST_DUE' && sub.pastDueSince && now - sub.pastDueSince.getTime() < graceMs) {
      subActive = true;
      inGrace = true;
    }
  }
  return { company, sub, plan: sub?.plan ?? null, subActive, inGrace, credentials, users };
}

export async function assertActiveSubscription(companyId: string) {
  const e = await getEntitlement(companyId);
  if (!e.company || e.company.status !== 'ACTIVE') {
    throw new Error('Konto firmy nie jest jeszcze aktywne — poczekaj na weryfikację przez administratora platformy');
  }
  if (!e.subActive || !e.plan) {
    throw new Error('Brak aktywnej subskrypcji — wybierz lub odnów plan w zakładce Subskrypcja');
  }
  return e;
}

export async function assertCanIssue(companyId: string) {
  const e = await assertActiveSubscription(companyId);
  if (e.credentials >= e.plan!.maxCredentials) {
    throw new Error(`Osiągnięto limit legitymacji w planie ${e.plan!.name} (${e.plan!.maxCredentials}). Zmień plan na wyższy`);
  }
}

export async function assertCanAddStaff(companyId: string) {
  const e = await getEntitlement(companyId);
  if (!e.subActive || !e.plan) {
    throw new Error('Brak aktywnej subskrypcji — wybierz lub odnów plan w zakładce Subskrypcja');
  }
  if (e.users >= e.plan.maxStaffUsers) {
    throw new Error(`Osiągnięto limit kont zespołu w planie ${e.plan.name} (${e.plan.maxStaffUsers}). Zmień plan na wyższy`);
  }
}

export function addInterval(from: Date, interval: 'MONTHLY' | 'YEARLY'): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + (interval === 'YEARLY' ? 12 : 1));
  return d;
}
