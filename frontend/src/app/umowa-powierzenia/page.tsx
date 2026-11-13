import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { FadeIn } from "@/components/motion/FadeIn";

const sections = [
  {
    title: "§1. Strony i przedmiot umowy",
    body: [
      "Niniejsza umowa powierzenia przetwarzania danych osobowych (dalej: „Umowa Powierzenia”) zawarta jest pomiędzy:",
      "Administratorem — firmą szkoleniową korzystającą z platformy mLegitymacja24, której dane wskazano przy rejestracji konta firmowego,",
      "a Podmiotem przetwarzającym (Procesorem) — Akademią Rozwoju EduCraft z siedzibą w Krakowie, ul. Lipowa 3D, 30-702 Kraków, NIP: 5130303581, operatorem platformy mLegitymacja24.",
      "Umowa Powierzenia określa zasady przetwarzania przez Procesora danych osobowych powierzonych przez Administratora w związku z korzystaniem z Platformy, zgodnie z art. 28 rozporządzenia (UE) 2016/679 (RODO). Zostaje zawarta z mocą wsteczną z chwilą aktywacji konta firmowego i pozostaje w mocy przez czas trwania umowy o korzystanie z Platformy.",
    ],
  },
  {
    title: "§2. Zakres powierzenia",
    body: [
      "Przedmiot przetwarzania: dane osobowe absolwentów i innych osób, których dotyczą legitymacje wystawiane przez Administratora za pośrednictwem Platformy, a także — w zakresie wprowadzonym przez Administratora — dane jego pracowników korzystających z kont firmowych.",
      "Charakter i cel przetwarzania: przechowywanie, organizacja, prezentacja i udostępnianie danych w zakresie niezbędnym do wystawiania, zarządzania, prezentowania w portfelu absolwenta oraz publicznej weryfikacji legitymacji — zgodnie z funkcjonalnością Platformy.",
      "Kategorie osób, których dane dotyczą: absolwenci i kursanci Administratora, osoby występujące w treści dokumentów, użytkownicy kont firmowych Administratora.",
      "Kategorie danych osobowych: imię i nazwisko, data i miejsce urodzenia, adres e-mail, numer telefonu, fotografia, dane dotyczące wykonywanego zawodu lub ukończonych szkoleń, identyfikatory dokumentów oraz inne dane wprowadzone przez Administratora w polach dokumentów.",
      "Czas trwania przetwarzania: przez okres obowiązywania Umowy Powierzenia, a następnie zgodnie z §10.",
    ],
  },
  {
    title: "§3. Obowiązki Procesora",
    body: [
      "Procesor zobowiązuje się przetwarzać dane osobowe wyłącznie na udokumentowane polecenie Administratora, w tym w zakresie przekazywania danych do państwa trzeciego — chyba że obowiązek taki wynika z prawa Unii lub prawa państwa członkowskiego; w takim przypadku Procesor poinformuje Administratora przed przetworzeniem, o ile prawo nie zabrania takiej informacji. Korzystanie z funkcjonalności Platformy (w tym wystawianie, edycja, przedłużanie, unieważnianie i usuwanie legitymacji oraz udostępnianie danych absolwentom) stanowi udokumentowane polecenie Administratora.",
      "Procesor zapewnia, że osoby upoważnione do przetwarzania danych zobowiązały się do zachowania poufności lub podlegają odpowiedniemu ustawowemu obowiązkowi zachowania poufności.",
      "Procesor wdraża i utrzymuje odpowiednie środki techniczne i organizacyjne zapewniające stopień bezpieczeństwa odpowiadający ryzyku, zgodnie z art. 32 RODO, w szczególności: szyfrowanie transmisji, kontrolę i ograniczanie dostępu, haszowanie danych uwierzytelniających, dzienniki zdarzeń, kopie zapasowe oraz testowanie skuteczności środków.",
      "Procesor — uwzględniając charakter przetwarzania — pomaga Administratorowi wypełniać obowiązki odpowiadania na żądania osób, których dane dotyczą (rozdział III RODO), w szczególności udostępniając narzędzia do wyszukiwania, eksportu, sprostowania i usunięcia danych objętych powierzeniem.",
      "Procesor — uwzględniając charakter przetwarzania i dostępne informacje — pomaga Administratorowi wypełniać obowiązki w zakresie bezpieczeństwa przetwarzania (art. 32 RODO), zawiadomień o naruszeniach (art. 33–34 RODO), ocen skutków dla ochrony danych (art. 35 RODO) i konsultacji z organem nadzorczym (art. 36 RODO).",
    ],
  },
  {
    title: "§4. Naruszenia ochrony danych",
    body: [
      "Po stwierdzeniu naruszenia ochrony danych osobowych objętych powierzeniem Procesor niezwłocznie — nie później niż w ciągu 48 godzin — zawiadamia Administratora, przekazując znane mu informacje o charakterze naruszenia, możliwych kategoriach i liczbie osób oraz podjętych działaniach zaradczych.",
      "Ocena ryzyka naruszenia, decyzja o zawiadomieniu Prezesa UODO oraz powiadomienie osób, których dane dotyczą, należą wyłącznie do Administratora.",
    ],
  },
  {
    title: "§5. Podmioty podwykonawcze (dalsze procesory)",
    body: [
      "Administrator wyraża ogólną zgodę na korzystanie przez Procesora z podmiotów podwykonawczych niezbędnych do świadczenia usługi, w szczególności: dostawców hostingu i infrastruktury serwerowej, operatorów płatności (Stripe) i dostawców usług poczty elektronicznej (Resend).",
      "Procesor informuje Administratora o zamiarze zmiany podmiotów podwykonawczych z co najmniej 14-dniowym wyprzedzeniem; Administrator może w tym terminie zgłosić uzasadniony sprzeciw, którego skutkiem może być rozwiązanie Umowy Powierzenia.",
      "Procesor zawiera z podmiotami podwykonawczymi umowy nakładające obowiązki ochrony danych nie mniej rygorystyczne niż wynikające z niniejszej Umowy Powierzenia i ponosi wobec Administratora pełną odpowiedzialność za wykonanie przez nie ich obowiązków.",
    ],
  },
  {
    title: "§6. Przekazywanie danych poza EOG",
    body: [
      "Jeżeli podmiot podwykonawczy przetwarza dane poza Europejskim Obszarem Gospodarczym, przekazanie odbywa się na podstawie mechanizmu zgodnego z rozdziałem V RODO — w szczególności standardowych klauzul umownych przyjętych przez Komisję Europejską lub decyzji stwierdzającej odpowiedni stopień ochrony.",
    ],
  },
  {
    title: "§7. Obowiązki Administratora",
    body: [
      "Administrator oświadcza i zapewnia, że: posiada podstawę prawną przetwarzania powierzanych danych; wypełnił obowiązki informacyjne wobec osób, których dane dotyczą; wprowadzane dane są zgodne z prawdą i aktualne; zawartość wystawianych dokumentów jest zgodna z prawem.",
      "Administrator ponosi wyłączną odpowiedzialność za legalność powierzenia, w tym za przetwarzanie danych bez podstawy prawnej oraz za treść instrukcji składanych Procesorowi.",
      "Jeżeli polecenie Administratora naruszałoby przepisy RODO lub inne przepisy o ochronie danych, Procesor niezwłocznie informuje o tym Administratora.",
    ],
  },
  {
    title: "§8. Kontrole i audyty",
    body: [
      "Procesor udostępnia Administratorowi informacje niezbędne do wykazania wypełniania obowiązków z Umowy Powierzenia i umożliwia przeprowadzanie kontroli — w tym audytów — po uprzednim uzgodnieniu terminu i zakresu, nie częściej niż raz w roku kalendarzowym, na koszt Administratora.",
      "W miejsce audytu na miejscu Procesor może przedstawić aktualne raporty, certyfikaty lub inne dowody zgodności środków bezpieczeństwa, jeżeli wystarczająco wykazują wypełnianie obowiązków.",
    ],
  },
  {
    title: "§9. Odpowiedzialność",
    body: [
      "Procesor odpowiada wobec Administratora za szkodę spowodowaną przetwarzaniem wyłącznie w przypadku, gdy nie wypełnił obowiązków określonych w RODO nałożonych bezpośrednio na procesora albo działał poza zgodnymi z prawem poleceniami Administratora lub wbrew nim (art. 82 ust. 2 RODO).",
      "Procesor nie ponosi odpowiedzialności za decyzje Administratora dotyczące celów i sposobów przetwarzania, za treść powierzonych danych ani za ich legalność.",
      "Ograniczenia odpowiedzialności określone w Regulaminie Platformy stosują się odpowiednio do Umowy Powierzenia, bez uszczerbku dla przepisów bezwzględnie obowiązujących.",
    ],
  },
  {
    title: "§10. Zakończenie powierzenia",
    body: [
      "Po zakończeniu Umowy Powierzenia Procesor — według wyboru Administratora — usuwa powierzone dane osobowe wraz z istniejącymi kopiami albo zwraca je Administratorowi, chyba że prawo nakazuje ich dalsze przechowywanie.",
      "W razie braku wyboru w terminie 30 dni Procesor usuwa lub anonimizuje dane objęte powierzeniem, z zastrzeżeniem danych niezbędnych do wykazania prawidłowości wykonania umowy lub wymaganych przepisami prawa.",
    ],
  },
  {
    title: "§11. Postanowienia końcowe",
    body: [
      "Umowa Powierzenia podlega prawu polskiemu. W sprawach nieuregulowanych zastosowanie mają przepisy RODO oraz krajowe przepisy o ochronie danych osobowych.",
      "Umowa Powierzenia stanowi integralną część umowy o korzystanie z Platformy. W razie sprzeczności postanowień, w zakresie ochrony danych osobowych pierwszeństwo ma Umowa Powierzenia.",
    ],
  },
];

export default function UmowaPowierzeniaPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="Dokumenty prawne"
          title="Umowa powierzenia przetwarzania danych"
          description="Wzór umowy powierzenia danych osobowych (DPA) między firmą szkoleniową a mLegitymacja24 — art. 28 RODO."
          image="/images/heroes/hero-dokumenty.jpg"
          imageAlt="Segregatory z dokumentami na półce"
        />
        <section className="mx-auto max-w-3xl px-6 py-20">
          <FadeIn className="space-y-8">
            <div className="rounded-lg border border-ink/[0.08] bg-white p-8 shadow-card sm:p-10">
              <p className="leading-relaxed text-ink-soft">
                Niniejsza umowa reguluje powierzenie platformie mLegitymacja24
                przetwarzania danych osobowych zawartych w legitymacjach.
                Zawiera się ją automatycznie przy aktywacji konta firmowego —
                stanowi część umowy o korzystanie z Platformy i nie wymaga
                odrębnego podpisu.
              </p>

              <div className="mt-8 rounded-lg border border-brand-600/15 bg-brand-50 p-5">
                <p className="text-sm font-semibold text-ink">
                  Administrator i procesor
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Administratorem danych w legitymacjach jest firma szkoleniowa
                  (wystawca). Procesorem jest Akademia Rozwoju EduCraft, ul.
                  Lipowa 3D, 30-702 Kraków, NIP: 5130303581 — operator
                  mLegitymacja24.
                </p>
              </div>

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
