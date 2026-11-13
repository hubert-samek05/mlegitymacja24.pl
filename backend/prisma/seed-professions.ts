import { PrismaClient } from '@prisma/client';

// Zawody nieregulowane w Polsce - nie wymagają licencji, uprawnień państwowych
// ani wpisu do rejestru zawodowego. Świadectwo ukończenia kursu w tych
// zawodach ma pełną wartość dokumentacyjną i nie stwarza problemów prawnych.
// Wykluczone świadomie: zawody regulowane (instruktor nauki jazdy, elektryk
// z uprawnieniami SEP, diagnosta samochodowy, agent ubezpieczeniowy,
// pośrednik kredytowy, ochroniarz, detektyw, przewodnik miejski w miastach
// z uchwałami lokalnymi, doradca podatkowy, rzeczoznawca, fizjoterapeuta,
// psycholog, geodeta, kierownik budowy, operatorzy maszyn UDT itp.).

const prisma = new PrismaClient();

interface Profession {
  name: string;
  validity?: number; // domyślna ważność w miesiącach
}

const catalog: Record<string, Profession[]> = {
  'Sport i rekreacja': [
    { name: 'Trener personalny' },
    { name: 'Instruktor fitness' },
    { name: 'Instruktor jogi' },
    { name: 'Instruktor pilatesu' },
    { name: 'Instruktor crossfit' },
    { name: 'Instruktor zumba' },
    { name: 'Instruktor pole dance' },
    { name: 'Instruktor akrobatyki powietrznej' },
    { name: 'Instruktor nordic walking' },
    { name: 'Instruktor squasha' },
    { name: 'Instruktor tenisa' },
    { name: 'Instruktor golfa' },
    { name: 'Instruktor badmintona' },
    { name: 'Instruktor tenisa stołowego' },
    { name: 'Trener piłki nożnej' },
    { name: 'Trener koszykówki' },
    { name: 'Trener siatkówki' },
    { name: 'Trener piłki ręcznej' },
    { name: 'Trener pływania' },
    { name: 'Ratownik wodny' },
    { name: 'Instruktor karate' },
    { name: 'Instruktor judo' },
    { name: 'Instruktor taekwondo' },
    { name: 'Instruktor aikido' },
    { name: 'Instruktor krav maga' },
    { name: 'Instruktor brazylijskiego jiu-jitsu' },
    { name: 'Trener boksu' },
    { name: 'Instruktor kickboxingu' },
    { name: 'Instruktor tańca' },
    { name: 'Instruktor tańca towarzyskiego' },
    { name: 'Instruktor jazdy konnej' },
    { name: 'Instruktor ujeżdżenia' },
    { name: 'Instruktor narciarstwa' },
    { name: 'Instruktor snowboardu' },
    { name: 'Instruktor wspinaczki' },
    { name: 'Instruktor nurkowania' },
    { name: 'Instruktor żeglarstwa' },
    { name: 'Instruktor windsurfingu' },
    { name: 'Instruktor kitesurfingu' },
    { name: 'Instruktor kajakarstwa' },
    { name: 'Instruktor boulderingu' },
    { name: 'Instruktor parkouru' },
    { name: 'Instruktor strzelectwa sportowego' },
    { name: 'Instruktor samoobrony' },
    { name: 'Instruktor bushcraftu i survivalu' },
    { name: 'Animator sportowy' },
    { name: 'Trener przygotowania motorycznego' },
    { name: 'Masażysta sportowy' },
    { name: 'Trener biegania' },
  ],
  'Beauty i wellness': [
    { name: 'Kosmetolog' },
    { name: 'Stylista paznokci' },
    { name: 'Stylista rzęs' },
    { name: 'Stylista brwi' },
    { name: 'Makijażysta' },
    { name: 'Wizażysta' },
    { name: 'Charakteryzator' },
    { name: 'Linergistka (makijaż permanentny)' },
    { name: 'Barber' },
    { name: 'Fryzjer' },
    { name: 'Kolorysta' },
    { name: 'Tatuażysta' },
    { name: 'Piercer' },
    { name: 'Masażysta', validity: 36 },
    { name: 'Podolog' },
    { name: 'Trycholog' },
    { name: 'Aromaterapeuta' },
    { name: 'Stylista wizerunku' },
  ],
  'Gastronomia': [
    { name: 'Barista' },
    { name: 'Barman' },
    { name: 'Sommelier' },
    { name: 'Cukiernik', validity: 60 },
    { name: 'Piekarz', validity: 60 },
    { name: 'Kucharz', validity: 36 },
    { name: 'Kucharz sushi' },
    { name: 'Czekoladnik' },
    { name: 'Browarnik rzemieślniczy' },
    { name: 'Serowar' },
    { name: 'Winiarz' },
    { name: 'Kelner' },
    { name: 'Bar manager' },
  ],
  'IT i marketing': [
    { name: 'Specjalista SEO' },
    { name: 'Specjalista SEM (Google Ads)' },
    { name: 'Specjalista social media' },
    { name: 'Copywriter' },
    { name: 'Content manager' },
    { name: 'Grafik komputerowy' },
    { name: 'Projektant UI/UX' },
    { name: 'Projektant UX' },
    { name: 'Web designer' },
    { name: 'Programista front-end' },
    { name: 'Programista aplikacji mobilnych' },
    { name: 'Tester oprogramowania' },
    { name: 'Analityk danych' },
    { name: 'Specjalista e-commerce' },
    { name: 'Specjalista marketingu internetowego' },
    { name: 'Specjalista e-mail marketingu' },
    { name: 'Specjalista ds. reklamy online' },
    { name: 'Projektant 3D' },
    { name: 'Motion designer' },
    { name: 'Montażysta wideo' },
    { name: 'UX researcher' },
    { name: 'Scrum Master' },
    { name: 'Product Owner' },
    { name: 'Specjalista IT support' },
    { name: 'Specjalista ds. cyberbezpieczeństwa' },
    { name: 'Specjalista no-code/low-code' },
    { name: 'Specjalista ds. sztucznej inteligencji' },
  ],
  'Edukacja i rozwój osobisty': [
    { name: 'Trener biznesu' },
    { name: 'Coach' },
    { name: 'Mentor' },
    { name: 'Szkoleniowiec' },
    { name: 'Lektor języka angielskiego' },
    { name: 'Lektor języka hiszpańskiego' },
    { name: 'Lektor języka niemieckiego' },
    { name: 'Lektor języka francuskiego' },
    { name: 'Korepetytor' },
    { name: 'Terapeuta zajęciowy' },
    { name: 'Animator czasu wolnego' },
    { name: 'Tłumacz' },
    { name: 'Tłumacz języka migowego' },
    { name: 'Doradca zawodowy' },
    { name: 'Konsultant kariery' },
    { name: 'Specjalista pierwszej pomocy', validity: 24 },
    { name: 'Instruktor pierwszej pomocy', validity: 36 },
    { name: 'Instruktor BHP' },
    { name: 'Specjalista BHP' },
  ],
  'Biznes i usługi': [
    { name: 'Specjalista ds. sprzedaży' },
    { name: 'Specjalista ds. obsługi klienta' },
    { name: 'Account manager' },
    { name: 'Asystent zarządu' },
    { name: 'Asystent wirtualny (VA)' },
    { name: 'Rekruter' },
    { name: 'Specjalista ds. HR' },
    { name: 'Specjalista ds. kadr i płac' },
    { name: 'Specjalista ds. księgowości' },
    { name: 'Specjalista ds. windykacji' },
    { name: 'Mediator' },
    { name: 'Event manager' },
    { name: 'Wedding planner' },
    { name: 'Project manager' },
    { name: 'Agent nieruchomości' },
    { name: 'Zarządca najmu' },
    { name: 'Home stager' },
    { name: 'Specjalista ds. finansów osobistych' },
    { name: 'Specjalista ds. zamówień publicznych' },
    { name: 'Specjalista ds. RODO' },
    { name: 'Audytor wewnętrzny ISO 9001' },
    { name: 'Spedytor' },
    { name: 'Specjalista ds. logistyki' },
  ],
  'Rzemiosło i rękodzieło': [
    { name: 'Stolarz', validity: 60 },
    { name: 'Tapicer', validity: 60 },
    { name: 'Krawiec', validity: 60 },
    { name: 'Modystka' },
    { name: 'Szewc', validity: 60 },
    { name: 'Zegarmistrz' },
    { name: 'Jubiler' },
    { name: 'Złotnik', validity: 60 },
    { name: 'Kowal artystyczny' },
    { name: 'Ceramik' },
    { name: 'Garncarz' },
    { name: 'Rymarz' },
    { name: 'Pszczelarz' },
    { name: 'Florysta' },
    { name: 'Rękodzielnik (handmade)' },
    { name: 'Dekorator wnętrz' },
    { name: 'Projektant ogrodów' },
  ],
  'Budownictwo i wykończenia': [
    { name: 'Instalator sanitarny (hydraulik)', validity: 60 },
    { name: 'Malarz budowlany' },
    { name: 'Tynkarz' },
    { name: 'Glazurnik' },
    { name: 'Posadzkarz' },
    { name: 'Dekarz' },
    { name: 'Monter suchych zabudów' },
    { name: 'Monter stolarki budowlanej' },
    { name: 'Murarz', validity: 60 },
    { name: 'Cieśla', validity: 60 },
    { name: 'Majster budowlany' },
  ],
  'Motoryzacja': [
    { name: 'Mechanik samochodowy' },
    { name: 'Blacharz-lakiernik' },
    { name: 'Detalista (auto detailing)' },
    { name: 'Wulkanizator' },
    { name: 'Serwisant rowerów' },
    { name: 'Mechanik motocyklowy' },
  ],
  'Turystyka i eventy': [
    { name: 'Pilot wycieczek' },
    { name: 'Opiekun wycieczek (tour leader)' },
    { name: 'Animator hotelowy' },
    { name: 'Konferansjer' },
    { name: 'Animator imprez dziecięcych' },
  ],
  'Zwierzęta': [
    { name: 'Behawiorysta zwierząt' },
    { name: 'Trener psów' },
    { name: 'Groomer (fryzjer dla zwierząt)' },
    { name: 'Petsitter' },
    { name: 'Hodowca zwierząt' },
  ],
  'Dom i opieka': [
    { name: 'Niania' },
    { name: 'Opiekun osób starszych' },
    { name: 'Opiekunka domowa' },
    { name: 'Asystent osoby z niepełnosprawnością' },
    { name: 'Organizator przestrzeni (professional organizer)' },
  ],
  'Kultura i sztuka': [
    { name: 'Fotograf' },
    { name: 'Fotograf ślubny' },
    { name: 'Operator wideo' },
    { name: 'Filmowiec' },
    { name: 'Muzyk' },
    { name: 'Instruktor gry na gitarze' },
    { name: 'Instruktor gry na fortepianie' },
    { name: 'DJ' },
    { name: 'Ilustrator' },
    { name: 'Malarz' },
    { name: 'Rysownik' },
    { name: 'Projektant mody' },
    { name: 'Stylista mody' },
    { name: 'Iluzjonista' },
  ],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  let created = 0;
  let updated = 0;

  for (const [category, professions] of Object.entries(catalog)) {
    for (const { name, validity } of professions) {
      const slug = slugify(name);
      const result = await prisma.credentialType.upsert({
        where: { slug },
        update: { category, isActive: true },
        create: {
          name,
          slug,
          category,
          description: `Legitymacja zawodu: ${name}`,
          defaultValidityMonths: validity ?? 24,
        },
      });
      if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
      else updated++;
    }
  }

  // Instruktor nauki jazdy to zawód regulowany (wymaga licencji) - wyłączamy go z katalogu
  await prisma.credentialType.updateMany({
    where: { slug: 'instruktor-nauki-jazdy' },
    data: { isActive: false },
  });

  const total = await prisma.credentialType.count({ where: { isActive: true } });
  console.log(`Katalog zawodów: ${created} nowych, ${updated} zaktualizowanych. Aktywnych: ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
