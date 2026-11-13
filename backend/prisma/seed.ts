import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@mlegitymacja24.pl';
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD || 'ZmieńTeHasło123!';

  const existingAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(superAdminPassword, 12);
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        firstName: 'Super',
        lastName: 'Admin',
      },
    });
    console.log(`Utworzono konto Super Admina: ${superAdminEmail}`);
  } else {
    console.log('Konto Super Admina już istnieje - pomijam');
  }

  const credentialTypes = [
    {
      name: 'Trener personalny',
      slug: 'trener-personalny',
      description: 'Legitymacja trenera personalnego',
      defaultValidityMonths: 24,
    },
    {
      name: 'Instruktor fitness',
      slug: 'instruktor-fitness',
      description: 'Legitymacja instruktora fitness',
      defaultValidityMonths: 24,
    },
    {
      name: 'Kosmetolog',
      slug: 'kosmetolog',
      description: 'Legitymacja kosmetologa',
      defaultValidityMonths: 36,
    },
    {
      name: 'Specjalista pierwszej pomocy',
      slug: 'specjalista-pierwszej-pomocy',
      description: 'Legitymacja specjalisty pierwszej pomocy',
      defaultValidityMonths: 24,
    },
    {
      name: 'Instruktor nauki jazdy',
      slug: 'instruktor-nauki-jazdy',
      description: 'Legitymacja instruktora nauki jazdy',
      defaultValidityMonths: 60,
    },
    {
      name: 'Terapeuta zajęciowy',
      slug: 'terapeuta-zajeciowy',
      description: 'Legitymacja terapeuty zajęciowego',
      defaultValidityMonths: 36,
    },
    {
      name: 'Specjalista SEO',
      slug: 'specjalista-seo',
      description: 'Legitymacja specjalisty SEO',
      defaultValidityMonths: 24,
    },
    {
      name: 'Barista certyfikowany',
      slug: 'barista-certyfikowany',
      description: 'Legitymacja baristy certyfikowanego',
      defaultValidityMonths: 24,
    },
    {
      name: 'Instruktor jogi',
      slug: 'instruktor-jogi',
      description: 'Legitymacja instruktora jogi',
      defaultValidityMonths: 36,
    },
    {
      name: 'Behawiorysta zwierząt',
      slug: 'behawiorysta-zwierzat',
      description: 'Legitymacja behawiorysty zwierząt',
      defaultValidityMonths: 24,
    },
  ];

  for (const type of credentialTypes) {
    await prisma.credentialType.upsert({
      where: { slug: type.slug },
      update: {},
      create: type,
    });
  }
  console.log(`Zainicjowano ${credentialTypes.length} typów legitymacji`);

  const plans = [
    {
      name: 'Starter',
      maxCredentials: 50,
      maxStaffUsers: 2,
      monthlyPriceCents: 9900,
      yearlyPriceCents: 99900,
    },
    {
      name: 'Professional',
      maxCredentials: 300,
      maxStaffUsers: 10,
      monthlyPriceCents: 29900,
      yearlyPriceCents: 299900,
    },
    {
      name: 'Enterprise',
      maxCredentials: 999999,
      maxStaffUsers: 999999,
      monthlyPriceCents: 79900,
      yearlyPriceCents: 799900,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }
  console.log(`Zainicjowano ${plans.length} plany subskrypcji`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
