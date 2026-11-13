import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'absolwent.demo@mlegitymacja24.pl';
const DEMO_PASSWORD = 'Demo1234!';
const DEMO_COMPANY_NIP = '5250001000';

async function main() {
  // --- firma demo (ACTIVE, zweryfikowana) ---
  const company = await prisma.company.upsert({
    where: { nip: DEMO_COMPANY_NIP },
    update: {},
    create: {
      name: 'Akademia Rozwoju Zawodowego',
      nip: DEMO_COMPANY_NIP,
      regon: '380123456',
      address: 'ul. Szkoleniowa 12',
      city: 'Warszawa',
      postalCode: '00-841',
      contactEmail: 'kontakt@akademia-demo.pl',
      contactPhone: '+48 600 100 200',
      status: 'ACTIVE',
      verifiedAt: new Date(),
    },
  });
  console.log(`Firma demo: ${company.name} (${company.id})`);

  // --- użytkownik HOLDER + profil absolwenta ---
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, phone: '+48 601 234 567' },
    create: {
      email: DEMO_EMAIL,
      phone: '+48 601 234 567',
      passwordHash,
      role: 'HOLDER',
      firstName: 'Jan',
      lastName: 'Kowalski',
      emailVerifiedAt: new Date(),
    },
  });

  const holder = await prisma.holderProfile.upsert({
    where: { userId: user.id },
    update: { photoUrl: '/uploads/demo-photo.jpg' },
    create: {
      userId: user.id,
      photoUrl: '/uploads/demo-photo.jpg',
      dateOfBirth: new Date('1994-03-15'),
      city: 'Warszawa',
    },
  });
  console.log(`Konto absolwenta: ${user.email} (${user.id})`);

  // --- typy legitymacji (z głównego seeda) ---
  const typeSlugs = ['trener-personalny', 'instruktor-fitness', 'specjalista-pierwszej-pomocy'];
  const types = await prisma.credentialType.findMany({
    where: { slug: { in: typeSlugs } },
  });
  if (types.length === 0) {
    throw new Error('Brak typów legitymacji — uruchom najpierw główny seed (npm run seed)');
  }

  const now = new Date();
  const inMonths = (m: number) => new Date(now.getFullYear(), now.getMonth() + m, now.getDate());

  const credentials = [
    {
      credentialNumber: 'DEMO-2026-0001',
      slug: 'trener-personalny',
      status: 'ACTIVE' as const,
      issueDate: inMonths(-3),
      expiryDate: inMonths(21),
    },
    {
      credentialNumber: 'DEMO-2026-0002',
      slug: 'instruktor-fitness',
      status: 'ACTIVE' as const,
      issueDate: inMonths(-8),
      expiryDate: inMonths(16),
    },
    {
      credentialNumber: 'DEMO-2025-0003',
      slug: 'specjalista-pierwszej-pomocy',
      status: 'EXPIRED' as const,
      issueDate: inMonths(-30),
      expiryDate: inMonths(-6),
    },
  ];

  for (const c of credentials) {
    const type = types.find((t) => t.slug === c.slug);
    if (!type) continue;
    await prisma.credential.upsert({
      where: { credentialNumber: c.credentialNumber },
      update: { photoUrl: '/uploads/demo-photo.jpg' },
      create: {
        credentialNumber: c.credentialNumber,
        holderId: holder.id,
        companyId: company.id,
        credentialTypeId: type.id,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        status: c.status,
        photoUrl: '/uploads/demo-photo.jpg',
      },
    });
    console.log(`Legitymacja: ${c.credentialNumber} (${type.name}, ${c.status})`);
  }

  // --- logi weryfikacji demo ---
  const holderCreds = await prisma.credential.findMany({ where: { holderId: holder.id } });
  const existingLogs = await prisma.verificationLog.count({
    where: { credential: { holderId: holder.id } },
  });

  if (existingLogs === 0 && holderCreds.length > 0) {
    const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000);
    const logSeeds = [
      { cred: holderCreds[0], result: 'VALID' as const, at: hoursAgo(3), location: 'Warszawa' },
      { cred: holderCreds[0], result: 'VALID' as const, at: hoursAgo(27), location: 'Warszawa' },
      { cred: holderCreds[1] ?? holderCreds[0], result: 'VALID' as const, at: hoursAgo(52), location: 'Kraków' },
      { cred: holderCreds[0], result: 'VALID' as const, at: hoursAgo(98), location: 'Gdańsk' },
      { cred: holderCreds[2] ?? holderCreds[0], result: 'EXPIRED' as const, at: hoursAgo(140), location: 'Warszawa' },
      { cred: holderCreds[0], result: 'VALID' as const, at: hoursAgo(200), location: 'Poznań' },
    ];
    for (const l of logSeeds) {
      await prisma.verificationLog.create({
        data: {
          credentialId: l.cred.id,
          result: l.result,
          ipAddress: '83.24.10.55',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
          location: l.location,
          verifiedAt: l.at,
        },
      });
    }
    console.log(`Logi weryfikacji: ${logSeeds.length}`);
  }

  // --- powiadomienia demo ---
  const existingNotifs = await prisma.notification.count({ where: { userId: user.id } });
  if (existingNotifs === 0) {
    const daysAgo = (d: number) => new Date(Date.now() - d * 86400 * 1000);
    await prisma.notification.createMany({
      data: [
        {
          userId: user.id,
          channel: 'EMAIL',
          subject: 'Nowa legitymacja w portfelu',
          body: 'Akademia Rozwoju Zawodowego wystawiła Ci legitymację „Instruktor fitness”. Znajdziesz ją w zakładce Portfel.',
          status: 'PENDING',
          createdAt: daysAgo(0.2),
        },
        {
          userId: user.id,
          channel: 'EMAIL',
          subject: 'Legitymacja wygasła',
          body: 'Twoja legitymacja „Specjalista pierwszej pomocy” wygasła. Skontaktuj się z organizacją, aby ją odnowić.',
          status: 'PENDING',
          createdAt: daysAgo(2),
        },
        {
          userId: user.id,
          channel: 'EMAIL',
          subject: 'Witaj w mLegitymacja24',
          body: 'Twoje konto absolwenta jest aktywne. Wszystkie legitymacje znajdziesz w zakładce Portfel — zawsze pod ręką.',
          status: 'SENT',
          sentAt: daysAgo(8),
          createdAt: daysAgo(8),
        },
      ],
    });
    console.log('Powiadomienia: 3');
  }

  console.log('\n=== KONTO DEMO ===');
  console.log(`E-mail:  ${DEMO_EMAIL}`);
  console.log(`Hasło:   ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
