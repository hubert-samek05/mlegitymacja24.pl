import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { FadeIn } from "@/components/motion/FadeIn";

const sections = [
  {
    title: "§1. Definicje",
    body: [
      "Platforma — serwis internetowy mLegitymacja24 dostępny pod adresem mlegitymacja24.pl wraz z aplikacją mobilną, umożliwiający wystawianie, przechowywanie i weryfikację cyfrowych legitymacji zawodowych.",
      "Usługodawca — Akademia Rozwoju EduCraft, ul. Lipowa 3D, 30-702 Kraków, NIP: 5130303581, podmiot prowadzący Platformę, kontakt: kontakt@mlegitymacja24.pl.",
      "Firma — podmiot gospodarczy (w szczególności firma szkoleniowa), który zawarł z Usługodawcą umowę o korzystanie z Platformy i wystawia Legitymacje swoim Absolwentom.",
      "Absolwent — osoba fizyczna, której Firma wystawiła Legitymację i która korzysta z cyfrowego portfela na Platformie.",
      "Legitymacja — cyfrowy dokument zawodowy wystawiony przez Firmę za pośrednictwem Platformy, opatrzony unikalnym identyfikatorem i kodem zabezpieczającym.",
      "Weryfikator — podmiot lub osoba, która potwierdza autentyczność Legitymacji za pomocą kodu QR, identyfikatora lub publicznej strony weryfikacyjnej.",
    ],
  },
  {
    title: "§2. Charakter Platformy i wystawianych dokumentów",
    body: [
      "mLegitymacja24 jest wyłącznie narzędziem informatycznym (systemem IT) umożliwiającym Firmom wystawianie własnych dokumentów zawodowych i branżowych. Usługodawca nie jest wystawcą, współwystawcą ani gwarantem treści jakiejkolwiek Legitymacji.",
      "Legitymacje wystawiane za pośrednictwem Platformy są dokumentami prywatnymi, wydawanymi przez Firmy na ich wyłączną odpowiedzialność. Nie stanowią dokumentów państwowych, legitymacji szkolnych, studenckich ani służbowych w rozumieniu odrębnych przepisów i nie zastępują licencji, uprawnień, świadectw ani kwalifikacji regulowanych przepisami prawa.",
      "Wystawianie Legitymacji na Platformie nie wymaga wpisu do Zintegrowanego Rejestru Kwalifikacji (ustawa z dnia 22 grudnia 2015 r. o Zintegrowanym Systemie Kwalifikacji). Oznaczenia „certyfikat kwalifikacji wolnorynkowej”, „certyfikat kwalifikacji sektorowej” oraz odwołania do poziomu Polskiej Ramy Kwalifikacji mogą być stosowane wyłącznie przez podmioty posiadające stosowne uprawnienia w rozumieniu tej ustawy. Firma odpowiada za zgodność nazw i oznaczeń używanych na Legitymacjach z prawem.",
    ],
  },
  {
    title: "§3. Rejestracja i weryfikacja Firmy",
    body: [
      "Korzystanie z Platformy przez Firmę wymaga rejestracji konta firmowego i pozytywnej weryfikacji przez Usługodawcę. Usługodawca może żądać dokumentów potwierdzających istnienie i działalność Firmy oraz odmówić aktywacji konta bez podania przyczyny.",
      "Firma zobowiązuje się podawać wyłącznie prawdziwe i aktualne dane oraz niezwłocznie je aktualizować. Podanie nieprawdziwych danych stanowi podstawę do odrzucenia zgłoszenia lub zawieszenia konta.",
      "Konto firmowe mogą obsługiwać wyznaczeni przez Firmę użytkownicy (administratorzy i pracownicy) w granicach nadanych im uprawnień. Firma odpowiada za działania osób posługujących się kontami powiązanymi z jej kontem oraz za poufność danych dostępowych.",
    ],
  },
  {
    title: "§4. Rola Usługodawcy — pośrednik techniczny",
    body: [
      "Usługodawca świadczy usługę pośrednictwa technicznego: udostępnia infrastrukturę do wystawiania, prezentowania i weryfikowania Legitymacji. Usługodawca nie weryfikuje merytorycznej treści Legitymacji, nie sprawdza tożsamości Absolwentów i nie potwierdza posiadanych przez nich kwalifikacji.",
      "Za wszystkie dane wprowadzane do Platformy — w szczególności dane osobowe Absolwentów, treść Legitymacji, zakres potwierdzanych uprawnień oraz zdjęcia — wyłączną odpowiedzialność ponosi Firma wprowadzająca te dane.",
      "W rozumieniu rozporządzenia (UE) 2016/679 (RODO) administratorem danych osobowych przetwarzanych w Legitymacjach jest Firma wystawiająca dokument. Usługodawca przetwarza te dane wyłącznie w charakterze podmiotu przetwarzającego (procesora), na udokumentowane polecenie Firmy, zgodnie z Polityką prywatności oraz zawartą umową powierzenia przetwarzania danych.",
    ],
  },
  {
    title: "§5. Subskrypcja i płatności",
    body: [
      "Korzystanie z Platformy przez Firmę odbywa się w modelu subskrypcyjnym, według planów i cen publikowanych w cenniku. Płatności kartą obsługuje operator Stripe; płatności przelewem realizowane są na podstawie faktury wystawianej przez Usługodawcę.",
      "Subskrypcja odnawia się automatycznie na kolejne okresy rozliczeniowe, chyba że Firma ją anuluje. Anulowanie subskrypcji zatrzymuje odnowienie — Firma zachowuje dostęp do końca opłaconego okresu. Opłacone okresy nie podlegają zwrotowi.",
      "W przypadku braku zapłaty za kolejny okres Firma zachowuje dostęp przez 7 dni karencji, po których konto zostaje zawieszone do czasu uregulowania płatności. Zawieszenie konta nie wpływa na ważność wcześniej wystawionych Legitymacji.",
      "Usługodawca może zmienić cennik z 30-dniowym wyprzedzeniem, z zastrzeżeniem że zmiana nie dotyczy rozpoczętych okresów rozliczeniowych.",
    ],
  },
  {
    title: "§6. Legitymacje — wystawianie, ważność, unieważnianie",
    body: [
      "Firma wystawia Legitymacje w granicach limitów wynikających z wykupionego planu. Każda Legitymacja otrzymuje unikalny identyfikator zabezpieczający oraz kod QR umożliwiający weryfikację.",
      "Ważność Legitymacji określa Firma — dokument może mieć termin ważności lub być wystawiony bezterminowo. Wygaszenie lub unieważnienie Legitymacji przez wystawcę powoduje, że przestaje ona przechodzić weryfikację jako ważna.",
      "Usługodawca może unieważnić lub zawiesić Legitymację lub konto Firmy w przypadku stwierdzenia naruszeń Regulaminu, w szczególności wystawiania dokumentów niezgodnych z prawdą, wprowadzających w błąd lub bezprawnych.",
    ],
  },
  {
    title: "§7. Weryfikacja Legitymacji",
    body: [
      "Platforma udostępnia publiczną funkcję weryfikacji Legitymacji na podstawie kodu QR, linku lub identyfikatora zabezpieczającego. W ramach weryfikacji wyświetlane są wyłącznie dane niezbędne do potwierdzenia autentyczności dokumentu (m.in. imię i nazwisko Absolwenta, typ Legitymacji, wystawca, status i termin ważności).",
      "Wynik weryfikacji odzwierciedla wyłącznie stan dokumentu zapisany w Platformie. Usługodawca nie odpowiada za decyzje podejmowane przez Weryfikatorów na podstawie Legitymacji ani za treść merytoryczną dokumentu, za którą odpowiada wyłącznie Firma-wystawca.",
    ],
  },
  {
    title: "§8. Portfel Absolwenta",
    body: [
      "Absolwent otrzymuje dostęp do cyfrowego portfela, w którym prezentowane są wystawione mu Legitymacje. Konto Absolwenta tworzone jest z inicjatywy Firmy wystawiającej dokument, na podstawie danych przez nią przekazanych.",
      "Absolwent zobowiązuje się do ochrony danych dostępowych i nieudostępniania konta osobom trzecim. Usunięcie lub zawieszenie Legitymacji przez wystawcę skutkuje jej zniknięciem lub oznaczeniem jako nieważnej w portfelu.",
    ],
  },
  {
    title: "§9. Zakazy",
    body: [
      "Zabronione jest w szczególności: wystawianie dokumentów zawierających nieprawdziwe dane lub wprowadzających w błąd co do tożsamości, kwalifikacji czy uprawnień; posługiwanie się oznaczeniami sugerującymi charakter państwowy lub regulowany dokument, jeśli dokument takiego charakteru nie posiada; przetwarzanie danych osobowych bez podstawy prawnej; próby naruszania bezpieczeństwa Platformy, kopiowania lub podrabiania mechanizmów zabezpieczających; oraz wykorzystywanie Platformy do celów sprzecznych z prawem.",
      "Naruszenie zakazów może skutkować natychmiastowym zawieszeniem lub rozwiązaniem umowy bez odszkodowania oraz zawiadomieniem właściwych organów.",
    ],
  },
  {
    title: "§10. Odpowiedzialność Usługodawcy",
    body: [
      "Usługodawca nie ponosi odpowiedzialności za: treść, prawdziwość i skutki prawne Legitymacji wystawionych przez Firmy; dane wprowadzone do Platformy przez Firmy lub Absolwentów; decyzje Weryfikatorów; działania lub zaniechania Firm wobec Absolwentów; szkody wynikłe z ujawnienia danych osobowych przez Firmę lub z przetwarzania ich bez podstawy prawnej przez administratora, którym jest Firma.",
      "Usługodawca dokłada należytej staranności, aby Platforma działała nieprzerwanie, jednak nie gwarantuje pełnej dostępności — dopuszczalne są przerwy techniczne, konserwacyjne oraz wynikłe z przyczyn niezależnych od Usługodawcy (siła wyższa, awarie operatorów, działania osób trzecich).",
      "W zakresie dozwolonym przez prawo łączna odpowiedzialność Usługodawcy wobec Firmy z tytułu korzystania z Platformy ograniczona jest do wartości opłat subskrypcyjnych uiszczonych przez Firmę za ostatnie 3 miesiące. Odpowiedzialność za szkody pośrednie, utracone korzyści i utratę danych wprowadzonych przez użytkowników jest wyłączona.",
      "Powyższe wyłączenia nie naruszają przepisów bezwzględnie obowiązujących ani nie ograniczają odpowiedzialności za szkodę wyrządzoną umyślnie.",
    ],
  },
  {
    title: "§11. Ochrona danych osobowych",
    body: [
      "Zasady przetwarzania danych osobowych, podział ról administratora i procesora oraz prawa osób, których dane dotyczą, opisuje Polityka prywatności stanowiąca integralną część Regulaminu.",
      "Zawarcie umowy o korzystanie z Platformy obejmuje powierzenie Usługodawcy przetwarzania danych osobowych Absolwentów w zakresie niezbędnym do świadczenia usługi (art. 28 RODO). Firma jako administrator odpowiada za istnienie podstawy prawnej przetwarzania danych Absolwentów, w tym za ich informowanie i — gdy jest wymagana — za uzyskanie zgody.",
    ],
  },
  {
    title: "§12. Własność intelektualna",
    body: [
      "Wszystkie prawa do Platformy, w tym do oprogramowania, interfejsu, znaków towarowych i materiałów, przysługują Usługodawcy lub jego licencjodawcom. Firma zachowuje prawa do własnych materiałów (w tym logo i treści), udzielając Usługodawcy licencji na ich wykorzystanie w zakresie niezbędnym do świadczenia usługi.",
    ],
  },
  {
    title: "§13. Rozwiązanie umowy",
    body: [
      "Firma może zakończyć korzystanie z Platformy w każdym czasie przez anulowanie subskrypcji — umowa wygasa z końcem opłaconego okresu. Usługodawca może rozwiązać umowę ze skutkiem natychmiastowym w razie istotnego naruszenia Regulaminu, a po upływie okresu subskrypcji — również bez podania przyczyny.",
      "Po zakończeniu umowy Usługodawca zachowuje dane Legitymacji przez okres wymagany przepisami lub niezbędny do utrzymania możliwości weryfikacji wystawionych dokumentów, po czym dane podlegają usunięciu lub anonimizacji na zasadach opisanych w Polityce prywatności.",
    ],
  },
  {
    title: "§14. Postanowienia końcowe",
    body: [
      "Regulamin dostępny jest nieodpłatnie na stronie Platformy. Usługodawca zastrzega możliwość jego zmiany z ważnych przyczyn (zmiana przepisów, funkcjonalności lub modelu usługi) z 14-dniowym wyprzedzeniem, o czym Firma zostanie poinformowana drogą elektroniczną. Dalsze korzystanie z Platformy po wejściu zmian w życie oznacza ich akceptację.",
      "W sprawach nieuregulowanych zastosowanie mają przepisy prawa polskiego, w szczególności ustawy o świadczeniu usług drogą elektroniczną oraz Kodeksu cywilnego. Spory rozstrzyga sąd właściwy dla siedziby Usługodawcy, z zastrzeżeniem przepisów o jurysdykcji konsumenckiej.",
      "Regulamin obowiązuje od dnia publikacji.",
    ],
  },
];

export default function RegulaminPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="Dokumenty prawne"
          title="Regulamin platformy"
          description="Zasady korzystania z platformy mLegitymacja24 przez firmy szkoleniowe i absolwentów."
          image="/images/heroes/hero-dokumenty.jpg"
          imageAlt="Segregatory z dokumentami na półce"
        />
        <section className="mx-auto max-w-3xl px-6 py-20">
          <FadeIn className="space-y-8">
            <div className="rounded-lg border border-ink/[0.08] bg-white p-8 shadow-card sm:p-10">
              <p className="leading-relaxed text-ink-soft">
                Niniejszy regulamin określa zasady świadczenia usług drogą
                elektroniczną przez platformę mLegitymacja24. Akceptacja
                regulaminu następuje przy rejestracji konta i jest warunkiem
                korzystania z Platformy.
              </p>

              <div className="mt-10 space-y-9">
                {sections.map((s) => (
                  <section key={s.title}>
                    <h2 className="font-display text-lg font-semibold text-ink">
                      {s.title}
                    </h2>
                    <div className="mt-3 space-y-3">
                      {s.body.map((p, i) => (
                        <p key={i} className="leading-relaxed text-ink-soft">
                          {p}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>
      </main>
      <Footer />
    </>
  );
}
