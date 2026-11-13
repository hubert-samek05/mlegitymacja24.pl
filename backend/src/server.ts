import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { env } from './config/env';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import companyRoutes from './routes/companies';
import credentialTypeRoutes from './routes/credentialTypes';
import credentialRoutes from './routes/credentials';
import verifyRoutes from './routes/verify';
import userRoutes from './routes/users';
import billingRoutes, { stripeWebhookHandler, runDunningCheck, cleanupStalePayments } from './routes/billing';
import { runCredentialReminderCheck } from './utils/expiryReminders';
import supportRoutes from './routes/support';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  })
);
app.post('/api/billing/stripe-webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use('/uploads', express.static(path.join(process.cwd(), env.uploadDir)));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mlegitymacja24-backend', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/credential-types', credentialTypeRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/support', supportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`mLegitymacja24 backend nasłuchuje na porcie ${env.port} (${env.nodeEnv})`);
});

// Dunning: raz dziennie ponawia nieudane płatności i degraduje plan po 7 dniach zaległości
// + przypomnienia o legitymacjach wygasających w ciągu 30 dni
const runBillingChecks = () =>
  Promise.all([runDunningCheck(), cleanupStalePayments(), runCredentialReminderCheck()]).catch((e) => console.error('Billing check error:', e));
setTimeout(runBillingChecks, 30_000);
setInterval(runBillingChecks, 24 * 3600 * 1000);
