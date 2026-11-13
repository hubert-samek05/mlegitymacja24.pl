import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { recordAuditLog } from '../middleware/auditLog';
import { sendEmail } from '../utils/mailer';
import { tplTicketAnswered, tplTicketCreated } from '../utils/emailTemplates';

const router = Router();
router.use(authenticate, authorize('COMPANY_ADMIN', 'COMPANY_STAFF', 'SUPER_ADMIN'));

const CATEGORIES = ['TECHNICAL', 'BILLING', 'CREDENTIALS', 'ACCOUNT', 'OTHER'];

function scope(req: AuthRequest) {
  return req.user!.role === 'SUPER_ADMIN' ? {} : { companyId: req.user!.companyId! };
}

router.get(
  '/tickets',
  asyncHandler(async (req: AuthRequest, res) => {
    const status = typeof req.query.status === 'string' && ['OPEN', 'ANSWERED', 'CLOSED'].includes(req.query.status) ? (req.query.status as 'OPEN' | 'ANSWERED' | 'CLOSED') : undefined;
    const tickets = await prisma.supportTicket.findMany({
      where: { ...scope(req), ...(status ? { status } : {}) },
      include: {
        company: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    res.json(tickets);
  })
);

router.post(
  '/tickets',
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  [body('subject').trim().isLength({ min: 3, max: 200 }), body('message').trim().isLength({ min: 3, max: 5000 })],
  asyncHandler(async (req: AuthRequest, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Podaj temat (min. 3 znaki) i treść zgłoszenia' });
    const { subject, message } = req.body;
    const category = CATEGORIES.includes(req.body.category) ? req.body.category : 'OTHER';
    const ticket = await prisma.supportTicket.create({
      data: {
        companyId: req.user!.companyId!, createdById: req.user!.userId, subject: subject.trim(), category,
        messages: { create: { authorId: req.user!.userId, isStaff: false, body: message.trim() } },
      },
    });
    await recordAuditLog({ userId: req.user!.userId, companyId: req.user!.companyId, action: 'SUPPORT_TICKET_CREATED', entityType: 'SupportTicket', entityId: ticket.id });
    // E-mail z potwierdzeniem przyjęcia zgłoszenia
    const creator = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { email: true } });
    if (creator) {
      const tpl = tplTicketCreated(ticket.number, subject.trim());
      await sendEmail(creator.email, tpl.subject, tpl.html);
    }
    res.status(201).json(ticket);
  })
);

router.get(
  '/tickets/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, ...scope(req) },
      include: {
        company: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' }, include: { author: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!ticket) return res.status(404).json({ error: 'Nie znaleziono zgłoszenia' });
    res.json(ticket);
  })
);

router.post(
  '/tickets/:id/messages',
  [body('body').trim().isLength({ min: 1, max: 5000 })],
  asyncHandler(async (req: AuthRequest, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Wpisz treść wiadomości' });
    const ticket = await prisma.supportTicket.findFirst({ where: { id: req.params.id, ...scope(req) } });
    if (!ticket) return res.status(404).json({ error: 'Nie znaleziono zgłoszenia' });
    if (ticket.status === 'CLOSED') return res.status(400).json({ error: 'Zgłoszenie jest zamknięte — otwórz je ponownie, aby odpowiedzieć' });
    const isStaff = req.user!.role === 'SUPER_ADMIN';
    await prisma.supportMessage.create({ data: { ticketId: ticket.id, authorId: req.user!.userId, isStaff, body: req.body.body.trim() } });
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: isStaff ? 'ANSWERED' : 'OPEN' } });
    if (isStaff) {
      await prisma.notification.create({
        data: {
          userId: ticket.createdById, channel: 'EMAIL', subject: `Odpowiedź na zgłoszenie #${ticket.number}`,
          body: `Support odpowiedział na Twoje zgłoszenie „${ticket.subject}”. Zaloguj się do panelu firmy (zakładka Support), aby przeczytać odpowiedź.`,
        },
      });
      const author = await prisma.user.findUnique({ where: { id: ticket.createdById }, select: { email: true, companyId: true } });
      if (author) {
        const tpl = tplTicketAnswered(ticket.number, ticket.subject, Boolean(author.companyId));
        await sendEmail(author.email, tpl.subject, tpl.html);
      }
    }
    res.status(201).json({ ok: true });
  })
);

router.patch(
  '/tickets/:id/status',
  [body('status').isIn(['OPEN', 'CLOSED'])],
  asyncHandler(async (req: AuthRequest, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Nieprawidłowy status' });
    const ticket = await prisma.supportTicket.findFirst({ where: { id: req.params.id, ...scope(req) } });
    if (!ticket) return res.status(404).json({ error: 'Nie znaleziono zgłoszenia' });
    const updated = await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: req.body.status } });
    res.json(updated);
  })
);

export default router;
