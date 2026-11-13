import { Router } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { recordAuditLog } from '../middleware/auditLog';
import { addInterval, getEntitlement } from '../utils/entitlements';
import { requirePermission } from '../utils/permissions';
import { mailCompanyAdmins, mailSuperAdmins } from '../utils/notify';
import {
  tplAdminNewPayment,
  tplPastDue,
  tplPaymentFailed,
  tplPaymentRecovered,
  tplSubscriptionActivated,
  tplSubscriptionBlocked,
  tplSubscriptionEnded,
  tplSubscriptionRenewed,
  tplTransferInstructions,
} from '../utils/emailTemplates';

const router = Router();
type Interval = 'MONTHLY' | 'YEARLY';

async function stripeRequest<T = any>(method: 'GET' | 'POST' | 'DELETE', path: string, params?: Record<string, string>): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.stripe.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Błąd bramki płatności');
  return data as T;
}

async function activate(subscriptionId: string, planId: string, interval: Interval, periodEnd?: Date, extra: Record<string, unknown> = {}) {
  const now = new Date();
  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      planId,
      billingInterval: interval,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd ?? addInterval(now, interval),
      cancelAtPeriodEnd: false,
      pastDueSince: null,
      pendingPlanId: null,
      ...extra,
    },
  });
}

// Przegląd rozliczeń firmy: plany, subskrypcja, płatności, wykorzystanie, dostępne metody płatności
router.get(
  '/overview',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  requirePermission('billing.view'),
  asyncHandler(async (req: AuthRequest, res) => {
    const companyId = req.user!.companyId!;
    const [plans, e] = await Promise.all([
      prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { monthlyPriceCents: 'asc' } }),
      getEntitlement(companyId),
    ]);
    const payments = e.sub
      ? await prisma.payment.findMany({ where: { subscriptionId: e.sub.id }, orderBy: { createdAt: 'desc' }, take: 50 })
      : [];
    res.json({
      plans,
      subscription: e.sub,
      active: e.subActive,
      usage: { credentials: e.credentials, users: e.users },
      payments,
      methods: {
        stripe: !!env.stripe.secretKey && !!env.stripe.publishableKey,
        bankTransfer: env.bank.iban ? { recipient: env.bank.recipient, iban: env.bank.iban, bankName: env.bank.bankName } : null,
      },
    });
  })
);

// Lekki status subskrypcji dla blokady panelu (bez uprawnienia billing.view - widzą wszyscy z firmy)
router.get(
  '/status',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  asyncHandler(async (req: AuthRequest, res) => {
    const e = await getEntitlement(req.user!.companyId!);
    const pending = e.sub
      ? await prisma.payment.findFirst({
          where: { subscriptionId: e.sub.id, status: 'PENDING' },
          select: { id: true, method: true, amountCents: true, reference: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        })
      : null;
    res.json({
      blocked: !e.subActive,
      status: e.sub?.status ?? null,
      planName: e.plan?.name ?? null,
      role: req.user!.role,
      companyStatus: e.company?.status ?? null,
      verificationNote: e.company?.verificationNote ?? null,
      inGrace: e.inGrace,
      periodEnd: e.sub?.currentPeriodEnd ?? null,
      pendingPayment: pending,
    });
  })
);

// Rozpoczęcie płatności za plan (Stripe Checkout lub przelew tradycyjny) - Company Admin
router.post(
  '/checkout',
  authenticate,
  authorize('COMPANY_ADMIN'),
  [body('planId').notEmpty(), body('interval').isIn(['MONTHLY', 'YEARLY']), body('method').isIn(['STRIPE', 'BANK_TRANSFER'])],
  asyncHandler(async (req: AuthRequest, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Nieprawidłowe dane płatności' });
    const companyId = req.user!.companyId!;
    const { planId, interval, method } = req.body as { planId: string; interval: Interval; method: 'STRIPE' | 'BANK_TRANSFER' };

    const [plan, company] = await Promise.all([
      prisma.subscriptionPlan.findUnique({ where: { id: planId } }),
      prisma.company.findUnique({ where: { id: companyId }, include: { subscription: true } }),
    ]);
    if (!plan || !plan.isActive) return res.status(404).json({ error: 'Nieprawidłowy plan subskrypcji' });
    if (!company || company.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Płatności są dostępne po aktywacji konta firmy przez administratora platformy' });
    }
    if (method === 'STRIPE' && !(env.stripe.secretKey && env.stripe.publishableKey)) return res.status(400).json({ error: 'Płatności kartą nie są jeszcze skonfigurowane' });
    if (method === 'BANK_TRANSFER' && !env.bank.iban) return res.status(400).json({ error: 'Płatność przelewem nie jest jeszcze skonfigurowana' });

    const amountCents = interval === 'YEARLY' ? plan.yearlyPriceCents : plan.monthlyPriceCents;
    const sub =
      company.subscription ??
      (await prisma.subscription.create({
        data: { companyId, planId, status: 'INCOMPLETE', billingInterval: interval, currentPeriodEnd: null },
      }));

    await prisma.payment.updateMany({
      where: { subscriptionId: sub.id, status: 'PENDING' },
      data: { status: 'CANCELED' },
    });

    const reference = `ML24-${crypto.randomInt(100000, 999999)}`;
    const payment = await prisma.payment.create({
      data: { subscriptionId: sub.id, amountCents, status: 'PENDING', method, planId, interval, reference },
    });

    await recordAuditLog({
      userId: req.user!.userId, companyId, action: 'SUBSCRIPTION_CHECKOUT_STARTED',
      entityType: 'Payment', entityId: payment.id, metadata: { plan: plan.name, interval, method },
    });

    if (method === 'BANK_TRANSFER') {
      const transfer = { recipient: env.bank.recipient, iban: env.bank.iban, bankName: env.bank.bankName, title: `${reference} ${company.name}` };
      const mailTpl = tplTransferInstructions(company.name, plan.name, amountCents, transfer);
      await mailCompanyAdmins(companyId, mailTpl);
      await mailSuperAdmins(tplAdminNewPayment(company.name, plan.name, amountCents, reference));
      return res.status(201).json({ method, paymentId: payment.id, amountCents, transfer });
    }

    const stripePriceId = interval === 'YEARLY' ? plan.stripePriceYearlyId : plan.stripePriceMonthlyId;
    const admin = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    const session = await stripeRequest<{ id: string; client_secret: string }>('POST', '/checkout/sessions', {
      mode: 'subscription',
      'managed_payments[enabled]': 'false',
      'line_items[0][quantity]': '1',
      ...(stripePriceId
        ? { 'line_items[0][price]': stripePriceId }
        : {
            'line_items[0][price_data][currency]': 'pln',
            'line_items[0][price_data][unit_amount]': String(amountCents),
            'line_items[0][price_data][recurring][interval]': interval === 'YEARLY' ? 'year' : 'month',
            'line_items[0][price_data][product_data][name]': `mLegitymacja24 — plan ${plan.name} (${interval === 'YEARLY' ? 'roczny' : 'miesięczny'})`,
          }),
      ...(env.stripe.pmConfig ? { payment_method_configuration: env.stripe.pmConfig } : {}),
      ui_mode: 'elements',
      return_url: `${env.frontendUrl}/panel/firma/subskrypcja?platnosc=ok`,
      client_reference_id: companyId,
      customer_email: admin?.email ?? company.contactEmail,
      'metadata[paymentId]': payment.id,
      'subscription_data[metadata][companyId]': companyId,
    });
    await prisma.payment.update({ where: { id: payment.id }, data: { providerRef: session.id } });
    res.status(201).json({ method, paymentId: payment.id, clientSecret: session.client_secret, publishableKey: env.stripe.publishableKey });
  })
);

// Zmiana planu przy aktywnej subskrypcji: upgrade = doliczenie różnicy, downgrade = od kolejnego okresu
router.post(
  '/change-plan',
  authenticate,
  authorize('COMPANY_ADMIN'),
  [body('planId').notEmpty()],
  asyncHandler(async (req: AuthRequest, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Nieprawidłowe dane' });
    const companyId = req.user!.companyId!;
    const [sub, plan] = await Promise.all([
      prisma.subscription.findUnique({ where: { companyId }, include: { plan: true } }),
      prisma.subscriptionPlan.findUnique({ where: { id: req.body.planId } }),
    ]);
    if (!sub || sub.status !== 'ACTIVE') return res.status(400).json({ error: 'Zmiana planu jest dostępna tylko przy aktywnej subskrypcji — użyj formularza płatności' });
    if (!plan || !plan.isActive) return res.status(404).json({ error: 'Nieprawidłowy plan subskrypcji' });

    const interval = sub.billingInterval as Interval;
    const curPrice = interval === 'YEARLY' ? sub.plan.yearlyPriceCents : sub.plan.monthlyPriceCents;
    const newPrice = interval === 'YEARLY' ? plan.yearlyPriceCents : plan.monthlyPriceCents;
    const newPriceId = interval === 'YEARLY' ? plan.stripePriceYearlyId : plan.stripePriceMonthlyId;

    // Cofnięcie zaplanowanego downgrade'u
    if (plan.id === sub.planId && sub.pendingPlanId) {
      if (sub.stripeSubscriptionId && env.stripe.secretKey) {
        const curPriceId = interval === 'YEARLY' ? sub.plan.stripePriceYearlyId : sub.plan.stripePriceMonthlyId;
        const stripeSub = await stripeRequest<any>('GET', `/subscriptions/${sub.stripeSubscriptionId}`);
        const item = stripeSub.items?.data?.[0];
        if (item && curPriceId) {
          await stripeRequest('POST', `/subscriptions/${sub.stripeSubscriptionId}`, {
            'items[0][id]': item.id, 'items[0][price]': curPriceId, proration_behavior: 'none',
          });
        }
      }
      const updated = await prisma.subscription.update({ where: { id: sub.id }, data: { pendingPlanId: null } });
      return res.json({ kind: 'DOWNGRADE_CANCELED', subscription: updated });
    }
    if (plan.id === sub.planId) return res.status(400).json({ error: 'To już jest Twój plan' });

    if (newPrice > curPrice) {
      // UPGRADE — pobierz różnicę od razu
      if (sub.stripeSubscriptionId && newPriceId && env.stripe.secretKey) {
        const stripeSub = await stripeRequest<any>('GET', `/subscriptions/${sub.stripeSubscriptionId}`);
        const item = stripeSub.items?.data?.[0];
        if (!item) return res.status(400).json({ error: 'Nie można odczytać subskrypcji w Stripe' });
        const updated = await stripeRequest<any>('POST', `/subscriptions/${sub.stripeSubscriptionId}`, {
          'items[0][id]': item.id,
          'items[0][price]': newPriceId,
          proration_behavior: 'always_invoice',
        });
        const invoiceId = typeof updated.latest_invoice === 'string' ? updated.latest_invoice : updated.latest_invoice?.id;
        await prisma.payment.create({
          data: {
            subscriptionId: sub.id, amountCents: newPrice - curPrice, status: 'PENDING', method: 'STRIPE',
            providerRef: invoiceId ?? null, planId: plan.id, interval,
            reference: `ML24-${crypto.randomInt(100000, 999999)}`,
          },
        });
        await prisma.subscription.update({ where: { id: sub.id }, data: { planId: plan.id, pendingPlanId: null, pastDueSince: null } });
        await recordAuditLog({ userId: req.user!.userId, companyId, action: 'SUBSCRIPTION_UPGRADED', entityType: 'Subscription', entityId: sub.id, metadata: { plan: plan.name, interval } });
        return res.json({ kind: 'UPGRADE_CHARGED', planName: plan.name });
      }
      // Przelew: proporcjonalna różnica do końca okresu
      const start = sub.currentPeriodStart.getTime();
      const end = (sub.currentPeriodEnd ?? addInterval(sub.currentPeriodStart, interval)).getTime();
      const frac = Math.max(0, Math.min(1, (end - Date.now()) / Math.max(1, end - start)));
      const diff = Math.max(1, Math.round((newPrice - curPrice) * frac));
      const reference = `ML24-${crypto.randomInt(100000, 999999)}`;
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      const payment = await prisma.payment.create({
        data: { subscriptionId: sub.id, amountCents: diff, status: 'PENDING', method: 'BANK_TRANSFER', planId: plan.id, interval, reference },
      });
      await recordAuditLog({ userId: req.user!.userId, companyId, action: 'SUBSCRIPTION_UPGRADE_TRANSFER', entityType: 'Payment', entityId: payment.id, metadata: { plan: plan.name } });
      return res.json({
        kind: 'UPGRADE_TRANSFER', paymentId: payment.id, amountCents: diff,
        transfer: { recipient: env.bank.recipient, iban: env.bank.iban, bankName: env.bank.bankName, title: `${reference} ${company?.name ?? ''}` },
      });
    }

    // DOWNGRADE (lub taka sama cena) — od następnego okresu
    if (sub.stripeSubscriptionId && newPriceId && env.stripe.secretKey) {
      const stripeSub = await stripeRequest<any>('GET', `/subscriptions/${sub.stripeSubscriptionId}`);
      const item = stripeSub.items?.data?.[0];
      if (item) {
        await stripeRequest('POST', `/subscriptions/${sub.stripeSubscriptionId}`, {
          'items[0][id]': item.id, 'items[0][price]': newPriceId, proration_behavior: 'none',
        });
      }
    }
    const updated = await prisma.subscription.update({ where: { id: sub.id }, data: { pendingPlanId: plan.id } });
    await recordAuditLog({ userId: req.user!.userId, companyId, action: 'SUBSCRIPTION_DOWNGRADE_SCHEDULED', entityType: 'Subscription', entityId: sub.id, metadata: { plan: plan.name } });
    res.json({ kind: 'DOWNGRADE_SCHEDULED', planName: plan.name, effectiveAt: updated.currentPeriodEnd });
  })
);

// Anulowanie własnej oczekującej płatności - Company Admin
router.post(
  '/payments/:id/cancel',
  authenticate,
  authorize('COMPANY_ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const companyId = req.user!.companyId!;
    const sub = await prisma.subscription.findUnique({ where: { companyId } });
    const payment = sub ? await prisma.payment.findFirst({ where: { id: req.params.id, subscriptionId: sub.id } }) : null;
    if (!payment || payment.status !== 'PENDING') return res.status(404).json({ error: 'Nie znaleziono oczekującej płatności' });
    if (payment.method === 'STRIPE' && payment.providerRef?.startsWith('cs_') && env.stripe.secretKey) {
      await stripeRequest('POST', `/checkout/sessions/${payment.providerRef}/expire`).catch(() => undefined);
    }
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'CANCELED' } });
    await recordAuditLog({ userId: req.user!.userId, companyId, action: 'PAYMENT_CANCELED', entityType: 'Payment', entityId: payment.id });
    res.json({ ok: true });
  })
);

// Anulowanie odnawiania / wznowienie - Company Admin
router.post(
  '/cancel',
  authenticate,
  authorize('COMPANY_ADMIN'),
  [body('cancel').isBoolean()],
  asyncHandler(async (req: AuthRequest, res) => {
    const companyId = req.user!.companyId!;
    const cancel = req.body.cancel === true || req.body.cancel === 'true';
    const sub = await prisma.subscription.findUnique({ where: { companyId } });
    if (!sub) return res.status(404).json({ error: 'Brak subskrypcji' });
    if (sub.stripeSubscriptionId && env.stripe.secretKey) {
      await stripeRequest('POST', `/subscriptions/${sub.stripeSubscriptionId}`, { cancel_at_period_end: String(cancel) });
    }
    const updated = await prisma.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: cancel } });
    await recordAuditLog({
      userId: req.user!.userId, companyId, action: cancel ? 'SUBSCRIPTION_CANCEL_SCHEDULED' : 'SUBSCRIPTION_RESUMED',
      entityType: 'Subscription', entityId: sub.id,
    });
    res.json(updated);
  })
);

// Zmiana metody płatności: karta -> przelew (wyłącza auto-odnawianie) albo przelew -> karta (auto-odnawianie od końca okresu)
router.post(
  '/switch-method',
  authenticate,
  authorize('COMPANY_ADMIN'),
  [body('method').isIn(['STRIPE', 'BANK_TRANSFER'])],
  asyncHandler(async (req: AuthRequest, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Nieprawidłowe dane' });
    const companyId = req.user!.companyId!;
    const method = req.body.method as 'STRIPE' | 'BANK_TRANSFER';
    const sub = await prisma.subscription.findUnique({ where: { companyId }, include: { plan: true } });
    if (!sub) return res.status(404).json({ error: 'Brak subskrypcji' });

    if (method === 'BANK_TRANSFER') {
      if (!sub.stripeSubscriptionId) return res.json({ kind: 'ALREADY_TRANSFER' });
      if (!env.bank.iban) return res.status(400).json({ error: 'Płatność przelewem nie jest skonfigurowana' });
      if (env.stripe.secretKey) {
        await stripeRequest('POST', `/subscriptions/${sub.stripeSubscriptionId}`, { cancel_at_period_end: 'true' });
      }
      await prisma.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: true } });
      await recordAuditLog({
        userId: req.user!.userId, companyId, action: 'SUBSCRIPTION_METHOD_SWITCHED',
        entityType: 'Subscription', entityId: sub.id, metadata: { method: 'BANK_TRANSFER' },
      });
      return res.json({ kind: 'TRANSFER_SCHEDULED' });
    }

    // STRIPE: zapis karty + auto-odnawianie od końca bieżącego opłaconego okresu (trial_end — bez pobierania teraz)
    if (sub.stripeSubscriptionId) return res.json({ kind: 'ALREADY_STRIPE' });
    if (!(env.stripe.secretKey && env.stripe.publishableKey)) {
      return res.status(400).json({ error: 'Płatności kartą nie są skonfigurowane' });
    }
    if (!sub.currentPeriodEnd || sub.currentPeriodEnd <= new Date()) {
      return res.status(400).json({ error: 'Bieżący okres już się zakończył — opłać subskrypcję kartą wybierając plan' });
    }
    const interval = sub.billingInterval as Interval;
    const stripePriceId = interval === 'YEARLY' ? sub.plan.stripePriceYearlyId : sub.plan.stripePriceMonthlyId;
    const amountCents = interval === 'YEARLY' ? sub.plan.yearlyPriceCents : sub.plan.monthlyPriceCents;
    const admin = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    const session = await stripeRequest<{ client_secret: string }>('POST', '/checkout/sessions', {
      mode: 'subscription',
      ui_mode: 'elements',
      'managed_payments[enabled]': 'false',
      'line_items[0][quantity]': '1',
      ...(stripePriceId
        ? { 'line_items[0][price]': stripePriceId }
        : {
            'line_items[0][price_data][currency]': 'pln',
            'line_items[0][price_data][unit_amount]': String(amountCents),
            'line_items[0][price_data][recurring][interval]': interval === 'YEARLY' ? 'year' : 'month',
            'line_items[0][price_data][product_data][name]': `mLegitymacja24 — plan ${sub.plan.name}`,
          }),
      'subscription_data[metadata][companyId]': companyId,
      'subscription_data[trial_end]': String(Math.floor(sub.currentPeriodEnd.getTime() / 1000)),
      'metadata[kind]': 'method_switch',
      'metadata[subscriptionId]': sub.id,
      return_url: `${env.frontendUrl}/panel/firma/subskrypcja`,
      client_reference_id: companyId,
      customer_email: admin?.email ?? '',
    });
    await recordAuditLog({
      userId: req.user!.userId, companyId, action: 'SUBSCRIPTION_METHOD_SWITCH_STARTED',
      entityType: 'Subscription', entityId: sub.id, metadata: { method: 'STRIPE' },
    });
    res.status(201).json({ kind: 'STRIPE_SESSION', clientSecret: session.client_secret, publishableKey: env.stripe.publishableKey });
  })
);

// Aktualizacja karty płatniczej (tryb setup) — firma zmienia numer karty bez przerywania subskrypcji
router.post(
  '/update-payment-method',
  authenticate,
  authorize('COMPANY_ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const companyId = req.user!.companyId!;
    const sub = await prisma.subscription.findUnique({ where: { companyId } });
    if (!sub?.stripeSubscriptionId || !sub.stripeCustomerId || !env.stripe.secretKey) {
      return res.status(400).json({ error: 'Aktualizacja karty jest dostępna tylko dla subskrypcji opłacanych kartą — wybierz plan i metodę płatności' });
    }
    const session = await stripeRequest<{ client_secret: string }>('POST', '/checkout/sessions', {
      mode: 'setup',
      ui_mode: 'elements',
      'managed_payments[enabled]': 'false',
      customer: sub.stripeCustomerId,
      currency: 'pln',
      'payment_method_types[0]': 'card',
      'metadata[subscriptionId]': sub.id,
      'metadata[companyId]': companyId,
      return_url: `${env.frontendUrl}/panel/firma/subskrypcja`,
    });
    res.status(201).json({ clientSecret: session.client_secret, publishableKey: env.stripe.publishableKey });
  })
);

// ---- Super Admin: potwierdzanie przelewów ----

router.get(
  '/admin/payments',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const payments = await prisma.payment.findMany({
      where: { ...(status ? { status } : {}) },
      include: { subscription: { include: { company: { select: { id: true, name: true, nip: true } }, plan: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const plans = await prisma.subscriptionPlan.findMany();
    const names = Object.fromEntries(plans.map((p) => [p.id, p.name]));
    res.json(payments.map((p) => ({ ...p, targetPlanName: p.planId ? names[p.planId] : null })));
  })
);

router.post(
  '/admin/payments/:id/confirm',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { subscription: true } });
    if (!payment || payment.status !== 'PENDING') return res.status(404).json({ error: 'Nie znaleziono oczekującej płatności' });

    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID', paidAt: new Date() } });
    if (payment.method === 'STRIPE' && payment.providerRef?.startsWith('cs_') && env.stripe.secretKey) {
      await stripeRequest('POST', `/checkout/sessions/${payment.providerRef}/expire`).catch(() => undefined);
    }
    if (payment.subscription.status === 'ACTIVE' && payment.planId && payment.planId !== payment.subscription.planId) {
      await prisma.subscription.update({ where: { id: payment.subscriptionId }, data: { planId: payment.planId, pendingPlanId: null, pastDueSince: null } });
    } else {
      await activate(payment.subscriptionId, payment.planId ?? payment.subscription.planId, payment.interval ?? 'MONTHLY');
    }
    // E-mail z potwierdzeniem aktywacji subskrypcji
    {
      const refreshed = await prisma.subscription.findUnique({
        where: { id: payment.subscriptionId },
        include: { plan: true, company: true },
      });
      if (refreshed) {
        await mailCompanyAdmins(
          refreshed.companyId,
          tplSubscriptionActivated(refreshed.company.name, refreshed.plan.name, refreshed.billingInterval, refreshed.currentPeriodEnd ?? new Date(), payment.amountCents)
        );
      }
    }
    // Zmiana metody na przelew: po opłaceniu przelewem subskrypcja nie może dalej auto-odnawiać się w Stripe
    if (payment.method === 'BANK_TRANSFER' && payment.subscription.stripeSubscriptionId) {
      if (env.stripe.secretKey) {
        await stripeRequest('DELETE', `/subscriptions/${payment.subscription.stripeSubscriptionId}`).catch(() => undefined);
      }
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: { stripeSubscriptionId: null, cancelAtPeriodEnd: false },
      });
    }
    await recordAuditLog({
      userId: req.user!.userId, companyId: payment.subscription.companyId, action: 'PAYMENT_CONFIRMED',
      entityType: 'Payment', entityId: payment.id,
    });
    res.json({ ok: true });
  })
);

router.post(
  '/admin/payments/:id/reject',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment || payment.status !== 'PENDING') return res.status(404).json({ error: 'Nie znaleziono oczekującej płatności' });
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'CANCELED' } });
    res.json({ ok: true });
  })
);

// Oznaczenie, że admin wystawił fakturę proforma dla płatności (organizacja pracy admina)
router.patch(
  '/admin/payments/:id/proforma',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Nie znaleziono płatności' });
    const issued = req.body.issued !== false;
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { proformaIssuedAt: issued ? new Date() : null },
    });
    res.json({ ok: true, proformaIssuedAt: updated.proformaIssuedAt });
  })
);

// ---- Webhook Stripe (surowe body - montowany w server.ts przed express.json) ----

export async function stripeWebhookHandler(req: any, res: any) {
  const secret = env.stripe.webhookSecret;
  const raw: Buffer = req.body;
  const header = String(req.headers['stripe-signature'] ?? '');
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=') as [string, string]));
  if (!secret || !parts.t || !parts.v1) return res.status(400).send('bad signature');
  const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${raw.toString('utf8')}`).digest('hex');
  const ok = expected.length === parts.v1.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  if (!ok || Math.abs(Date.now() / 1000 - Number(parts.t)) > 600) return res.status(400).send('bad signature');

  try {
    const event = JSON.parse(raw.toString('utf8'));
    const obj = event.data.object;
    if (event.type === 'checkout.session.completed' && obj.mode === 'setup') {
      // Aktualizacja karty: podepnij nową metodę pod subskrypcję i ponów zaległe faktury
      const sub = obj.metadata?.subscriptionId
        ? await prisma.subscription.findUnique({ where: { id: obj.metadata.subscriptionId }, include: { plan: true } })
        : null;
      if (sub?.stripeSubscriptionId) {
        const si = obj.setup_intent
          ? await stripeRequest<any>('GET', `/setup_intents/${obj.setup_intent}`).catch(() => null)
          : null;
        const pm = si?.payment_method;
        if (pm) {
          await stripeRequest('POST', `/subscriptions/${sub.stripeSubscriptionId}`, { default_payment_method: pm }).catch(() => undefined);
          if (sub.stripeCustomerId) {
            await stripeRequest('POST', `/customers/${sub.stripeCustomerId}`, {
              'invoice_settings[default_payment_method]': pm,
            }).catch(() => undefined);
          }
        }
        const open = await stripeRequest<any>('GET', `/invoices?subscription=${sub.stripeSubscriptionId}&status=open&limit=10`).catch(() => null);
        for (const inv of open?.data ?? []) {
          await stripeRequest('POST', `/invoices/${inv.id}/pay`).catch(() => undefined);
        }
        const fresh = await stripeRequest<any>('GET', `/subscriptions/${sub.stripeSubscriptionId}`).catch(() => null);
        if (sub.status === 'PAST_DUE' && fresh && (fresh.status === 'active' || fresh.status === 'trialing')) {
          await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'ACTIVE', pastDueSince: null } });
          const admins = await prisma.user.findMany({ where: { companyId: sub.companyId, role: 'COMPANY_ADMIN', isActive: true }, select: { id: true } });
          for (const a of admins) {
            await prisma.notification.create({
              data: {
                userId: a.id, channel: 'EMAIL', subject: 'Płatność zrealizowana',
                body: 'Dziękujemy — nowa metoda płatności została zapisana, a zaległa faktura opłacona. Subskrypcja jest ponownie aktywna.',
              },
            });
          }
          await mailCompanyAdmins(sub.companyId, tplPaymentRecovered(sub.plan.name));
        }
      }
      return res.json({ received: true });
    }
    if (event.type === 'checkout.session.completed') {
      if (obj.metadata?.kind === 'method_switch' && obj.metadata?.subscriptionId) {
        // Przejście na kartę od końca okresu: podepnij subskrypcję Stripe, okres zostaje bez zmian
        await prisma.subscription.update({
          where: { id: obj.metadata.subscriptionId },
          data: { stripeCustomerId: obj.customer ?? null, stripeSubscriptionId: obj.subscription ?? null, cancelAtPeriodEnd: false },
        });
        await recordAuditLog({
          companyId: obj.metadata.companyId ?? null, action: 'SUBSCRIPTION_METHOD_SWITCHED',
          entityType: 'Subscription', entityId: obj.metadata.subscriptionId, metadata: { method: 'STRIPE' },
        });
        return res.json({ received: true });
      }
      const payment = await prisma.payment.findUnique({ where: { id: obj.metadata?.paymentId }, include: { subscription: true } });
      if (payment && payment.status === 'PENDING') {
        const oldStripeSub = payment.subscription.stripeSubscriptionId;
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID', paidAt: new Date() } });
        await activate(payment.subscriptionId, payment.planId ?? payment.subscription.planId, payment.interval ?? 'MONTHLY', undefined, {
          stripeCustomerId: obj.customer ?? null,
          stripeSubscriptionId: obj.subscription ?? null,
        });
        if (oldStripeSub && oldStripeSub !== obj.subscription) {
          await stripeRequest('DELETE', `/subscriptions/${oldStripeSub}`).catch(() => undefined);
        }
        const refreshed = await prisma.subscription.findUnique({
          where: { id: payment.subscriptionId },
          include: { plan: true, company: true },
        });
        if (refreshed) {
          await mailCompanyAdmins(
            refreshed.companyId,
            tplSubscriptionActivated(refreshed.company.name, refreshed.plan.name, refreshed.billingInterval, refreshed.currentPeriodEnd ?? new Date(), payment.amountCents)
          );
        }
      }
    } else if (event.type === 'invoice.paid') {
      const sub = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: obj.subscription }, include: { plan: true } });
      if (!sub) return res.json({ received: true });
      const existing = await prisma.payment.findFirst({ where: { providerRef: obj.id } });
      if (existing && existing.status === 'PENDING') {
        await prisma.payment.update({ where: { id: existing.id }, data: { status: 'PAID', paidAt: new Date(), invoiceUrl: obj.hosted_invoice_url ?? null } });
      } else if (!existing) {
        await prisma.payment.create({
          data: {
            subscriptionId: sub.id, amountCents: obj.amount_paid, currency: String(obj.currency).toUpperCase(),
            status: 'PAID', method: 'STRIPE', providerRef: obj.id, invoiceUrl: obj.hosted_invoice_url ?? null,
            planId: sub.pendingPlanId ?? sub.planId, interval: sub.billingInterval, paidAt: new Date(),
          },
        });
      }
      if (obj.billing_reason === 'subscription_cycle' || obj.billing_reason === 'subscription_create') {
        const end = obj.lines?.data?.[0]?.period?.end;
        const newEnd = end ? new Date(end * 1000) : addInterval(new Date(), sub.billingInterval);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'ACTIVE', pastDueSince: null,
            currentPeriodStart: new Date(), currentPeriodEnd: newEnd,
            ...(sub.pendingPlanId ? { planId: sub.pendingPlanId, pendingPlanId: null } : {}),
          },
        });
        await mailCompanyAdmins(sub.companyId, tplSubscriptionRenewed(sub.plan.name, newEnd, obj.amount_paid ?? 0));
      }
    } else if (event.type === 'invoice.payment_failed') {
      const sub = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: obj.subscription }, include: { company: true, plan: true } });
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'PAST_DUE', pastDueSince: sub.pastDueSince ?? new Date() },
        });
        if (!(await prisma.payment.findFirst({ where: { providerRef: obj.id } }))) {
          const reason = obj.last_finalization_error?.message || 'Płatność odrzucona przez bank';
          await prisma.payment.create({
            data: {
              subscriptionId: sub.id, amountCents: obj.amount_due ?? 0, currency: String(obj.currency).toUpperCase(),
              status: 'FAILED', method: 'STRIPE', providerRef: obj.id, failureReason: reason,
              planId: sub.planId, interval: sub.billingInterval,
            },
          });
        }
        const admins = await prisma.user.findMany({ where: { companyId: sub.companyId, role: 'COMPANY_ADMIN', isActive: true }, select: { id: true } });
        for (const a of admins) {
          await prisma.notification.create({
            data: {
              userId: a.id, channel: 'EMAIL', subject: 'Nieudana płatność za subskrypcję',
              body: 'Nie udało się pobrać płatności za odnowienie subskrypcji. Spróbujemy ponownie automatycznie raz dziennie. Jeśli przez 7 dni płatność nie dojdzie do skutku, konto firmy zostanie zawieszone do czasu opłacenia.',
            },
          });
        }
        await mailCompanyAdmins(sub.companyId, tplPaymentFailed(sub.company.name, sub.plan.name));
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const deleted = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: obj.id }, include: { plan: true, company: true } });
      await prisma.subscription.updateMany({ where: { stripeSubscriptionId: obj.id }, data: { status: 'CANCELED' } });
      // Mail „zakończona" tylko gdy subskrypcja była aktywna (anulowanie do końca okresu);
      // przy PAST_DUE poszło już powiadomienie o zawieszeniu z dunningu
      if (deleted && deleted.status === 'ACTIVE') {
        await mailCompanyAdmins(deleted.companyId, tplSubscriptionEnded(deleted.company.name, deleted.plan.name));
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Błąd webhooka Stripe:', err);
    res.status(500).send('error');
  }
}

// ---- Codzienne sprawdzenie rozliczeń: przelewy (karencja + blokada) i dunning Stripe ----

export async function runDunningCheck() {
  const graceMs = env.billingGraceDays * 24 * 3600 * 1000;

  // Subskrypcje opłacane przelewem: koniec okresu -> PAST_DUE (karencja), po karencji -> CANCELED
  const bankSubs = await prisma.subscription.findMany({
    where: {
      stripeSubscriptionId: null,
      OR: [
        { status: 'ACTIVE', currentPeriodEnd: { not: null, lt: new Date() } },
        { status: 'PAST_DUE' },
      ],
    },
    include: { plan: true, company: true },
  });
  for (const sub of bankSubs) {
    const admins = await prisma.user.findMany({
      where: { companyId: sub.companyId, role: 'COMPANY_ADMIN', isActive: true },
      select: { id: true },
    });
    if (sub.status === 'ACTIVE' && sub.cancelAtPeriodEnd) {
      // Anulowana wcześniej — koniec okresu kończy subskrypcję bez karencji
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'CANCELED', cancelAtPeriodEnd: false, pendingPlanId: null },
      });
      for (const a of admins) {
        await prisma.notification.create({
          data: {
            userId: a.id, channel: 'EMAIL', subject: 'Subskrypcja zakończona',
            body: `Opłacony okres planu ${sub.plan.name} dobiegł końca — subskrypcja została zakończona zgodnie z anulowaniem. Wystawione legitymacje pozostają ważne.`,
          },
        });
      }
      await mailCompanyAdmins(sub.companyId, tplSubscriptionEnded(sub.company.name, sub.plan.name));
      await recordAuditLog({ companyId: sub.companyId, action: 'SUBSCRIPTION_ENDED', entityType: 'Subscription', entityId: sub.id, metadata: { plan: sub.plan.name } });
    } else if (sub.status === 'ACTIVE') {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'PAST_DUE', pastDueSince: sub.currentPeriodEnd ?? new Date() },
      });
      for (const a of admins) {
        await prisma.notification.create({
          data: {
            userId: a.id, channel: 'EMAIL', subject: 'Subskrypcja wymaga odnowienia',
            body: `Minął okres rozliczeniowy planu ${sub.plan.name}. Masz ${env.billingGraceDays} dni na opłacenie nowej faktury — po tym czasie konto firmy zostanie zawieszone do momentu zapłaty.`,
          },
        });
      }
      await mailCompanyAdmins(sub.companyId, tplPastDue(sub.company.name, sub.plan.name));
      await recordAuditLog({ companyId: sub.companyId, action: 'SUBSCRIPTION_PAST_DUE_TRANSFER', entityType: 'Subscription', entityId: sub.id, metadata: { plan: sub.plan.name } });
    } else if (sub.status === 'PAST_DUE' && sub.pastDueSince && Date.now() - sub.pastDueSince.getTime() >= graceMs) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'CANCELED', pendingPlanId: null },
      });
      for (const a of admins) {
        await prisma.notification.create({
          data: {
            userId: a.id, channel: 'EMAIL', subject: 'Konto firmy zawieszone',
            body: `Minęło ${env.billingGraceDays} dni od końca okresu rozliczeniowego planu ${sub.plan.name} bez opłacenia faktury. Konto zostało zawieszone — opłać subskrypcję, aby odblokować dostęp.`,
          },
        });
      }
      await mailCompanyAdmins(sub.companyId, tplSubscriptionBlocked(sub.company.name, sub.plan.name));
      await recordAuditLog({ companyId: sub.companyId, action: 'SUBSCRIPTION_SUSPENDED_UNPAID', entityType: 'Subscription', entityId: sub.id, metadata: { plan: sub.plan.name } });
    }
  }

  if (!env.stripe.secretKey) return;
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const pastDue = await prisma.subscription.findMany({
    where: { status: 'PAST_DUE', stripeSubscriptionId: { not: null } },
    include: { plan: true, company: true },
  });
  for (const sub of pastDue) {
    if (sub.pastDueSince && sub.pastDueSince < weekAgo) {
      try {
        const open = await stripeRequest<any>('GET', `/invoices?subscription=${sub.stripeSubscriptionId}&status=open&limit=10`);
        for (const inv of open.data ?? []) {
          await stripeRequest('POST', `/invoices/${inv.id}/void`).catch(() => undefined);
        }
        await stripeRequest('DELETE', `/subscriptions/${sub.stripeSubscriptionId}`).catch(() => undefined);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'CANCELED', pastDueSince: null, pendingPlanId: null },
        });
        const admins = await prisma.user.findMany({ where: { companyId: sub.companyId, role: 'COMPANY_ADMIN', isActive: true }, select: { id: true } });
        for (const a of admins) {
          await prisma.notification.create({
            data: {
              userId: a.id, channel: 'EMAIL', subject: 'Konto firmy zawieszone',
              body: `Przez 7 dni nie udało się pobrać płatności za odnowienie planu ${sub.plan.name}. Konto zostało zawieszone — opłać subskrypcję, aby odblokować dostęp.`,
            },
          });
        }
        await mailCompanyAdmins(sub.companyId, tplSubscriptionBlocked(sub.company.name, sub.plan.name));
        await recordAuditLog({ companyId: sub.companyId, action: 'SUBSCRIPTION_SUSPENDED_DUNNING', entityType: 'Subscription', entityId: sub.id, metadata: { plan: sub.plan.name } });
      } catch (e) {
        console.error(`Dunning: nie udało się zawiesić subskrypcji ${sub.id}`, e);
      }
      continue;
    }
    try {
      const open = await stripeRequest<any>('GET', `/invoices?subscription=${sub.stripeSubscriptionId}&status=open&limit=5`);
      for (const inv of open.data ?? []) {
        await stripeRequest('POST', `/invoices/${inv.id}/pay`).catch(() => undefined);
      }
    } catch (e) {
      console.error(`Dunning: błąd ponawiania płatności dla ${sub.id}`, e);
    }
  }
}

// Porzucone sesje kartą (firma rozpoczęła, ale nie dokończyła) — czyszczenie po 24h.
// Oczekujących przelewów NIE anulujemy automatycznie — firma może zapłacić proformę po kilku dniach.
export async function cleanupStalePayments() {
  const stale = await prisma.payment.findMany({
    where: { status: 'PENDING', method: 'STRIPE', createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } },
  });
  for (const p of stale) {
    if (p.method === 'STRIPE' && p.providerRef?.startsWith('cs_') && env.stripe.secretKey) {
      await stripeRequest('POST', `/checkout/sessions/${p.providerRef}/expire`).catch(() => undefined);
    }
    await prisma.payment.update({ where: { id: p.id }, data: { status: 'CANCELED' } });
  }
  return stale.length;
}

export default router;
