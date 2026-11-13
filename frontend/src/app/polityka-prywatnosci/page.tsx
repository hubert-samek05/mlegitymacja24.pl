import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageHero } from "@/components/PageHero";
import { FadeIn } from "@/components/motion/FadeIn";

const sections = [
  {
    title: "1. Najważniejsze — kto jest administratorem Twoich danych",
    body: [
      "Platforma mLegitymacja24 pełni dwie różne role w zależności od rodzaju danych:",
      "Dane kont użytkowników (firma szkoleniowa, jej pracownicy oraz konta absolwentów — m.in. imię i nazwisko, adres e-mail, telefon, dane logowania, historia aktywności): administratorem jest operator platformy, Akademia Rozwoju EduCraft, ul. Lipowa 3D, 30-702 Kraków, NIP: 5130303581, kontakt: kontakt@mlegitymacja24.pl.",
      "Dane zawarte w legitymacjach (imię i nazwisko absolwenta, data i miejsce urodzenia, zdjęcie, zawód, dane dokumentu): administratorem jest firma szkoleniowa, która wystawiła legitymację. Operator platformy przetwarza te dane wyłącznie jako podmiot przetwarzający (procesor) na udokumentowane polecenie firmy szkoleniowej, zgodnie z art. 28 RODO.",
      "Oznacza to, że wszelkie pytania i żądania dotyczące danych umieszczonych na legitymacji (ich poprawienia, usunięcia, sprzeciwu wobec przetwarzania) należy kierować przede wszystkim do firmy szkoleniowej — wystawcy dokumentu. Operator platformy przekazuje takie żądania właściwemu administratorowi i udziela mu pomocy technicznej w ich realizacji.",
    ],
  },
  {
    title: "2. Administrator danych kont",
    body: [
      "Administratorem danych osobowych związanych z kontami na platformie jest Akademia Rozwoju EduCraft, operator serwisu mLegitymacja24 (mlegitymacja24.pl). Kontakt we wszystkich sprawach ochrony danych: kontakt@mlegitymacja24.pl.",
      "Administrator nie powołał inspektora ochrony danych — we wszystkich sprawach można kontaktować się bezpośrednio pod adresem e-mail wskazanym powyżej.",
    ],
  },
  {
    title: "3. Cele i podstawy prawne przetwarzania",
    body: [
      "Zawarcie i wykonanie umowy o korzystanie z platformy (art. 6 ust. 1 lit. b RODO): obsługa kont firmowych i absolwenckich, wystawianie i prezentowanie legitymacji, obsługa subskrypcji i płatności, powiadomienia systemowe.",
      "Prawnie uzasadniony interes administratora (art. 6 ust. 1 lit. f RODO): zapewnienie bezpieczeństwa serwisu, zapobieganie nadużyciom, dochodzenie i obrona roszczeń, statystyka i rozwój usługi, kontakt z użytkownikami.",
      "Obowiązki prawne (art. 6 ust. 1 lit. c RODO): wystawianie i przechowywanie dokumentów księgowych i podatkowych.",
      "Zgoda (art. 6 ust. 1 lit. a RODO): wyłącznie w zakresie, w którym użytkownik dobrowolnie jej udzielił (np. materiały marketingowe) — z możliwością cofnięcia w każdej chwili.",
      "Przetwarzanie danych w legitymacjach odbywa się przez operatora wyłącznie w charakterze procesora, na polecenie i pod odpowiedzialność firmy szkoleniowej, która jako administrator decyduje o celach i podstawach prawnych (najczęściej: wykonanie umowy szkoleniowej lub uzasadniony interes dokumentowania kwalifikacji).",
    ],
  },
  {
    title: "4. Kategorie przetwarzanych danych",
    body: [
      "Dane konta: imię i nazwisko, adres e-mail, numer telefonu, hasło (w postaci zaszyfrowanej), rola i uprawnienia w systemie.",
      "Dane firmy: nazwa, NIP, REGON, adres, strona www, logo, dane kontaktowe osób reprezentujących firmę.",
      "Dane w legitymacjach (przetwarzane w imieniu firmy szkoleniowej): imię i nazwisko absolwenta, data i miejsce urodzenia, fotografia, adres e-mail, telefon, typ legitymacji, daty wystawienia i ważności, identyfikatory dokumentu.",
      "Dane rozliczeniowe: historia płatności, metoda płatności, dane do faktury (dane karty płatniczej przetwarzane są wyłącznie przez operatora Stripe — platforma nie przechowuje numerów kart).",
      "Dane techniczne: adresy IP, logi zdarzeń, identyfikatory sesji, dane o weryfikacjach legitymacji (czas, wynik, dane techniczne weryfikującego).",
    ],
  },
  {
    title: "5. Publiczna weryfikacja legitymacji",
    body: [
      "Istotą usługi jest umożliwienie weryfikacji autentyczności legitymacji przez osoby trzecie (np. pracodawców). Weryfikacja za pomocą kodu QR, linku lub identyfikatora zabezpieczającego ujawnia weryfikatorowi ograniczony zestaw danych dokumentu: imię i nazwisko absolwenta, typ legitymacji, wystawcę, status i termin ważności oraz — jeśli zostało dołączone — zdjęcie.",
      "Dostęp do weryfikacji wymaga znajomości unikalnego identyfikatora dokumentu, który legitymacjodawca przekazuje wyłącznie osobom uprawnionym. Udostępnienie identyfikatora oznacza możliwość podejrzenia danych dokumentu — jest to działanie administratora (firmy szkoleniowej) i legitymacjodawcy, a nie operatora platformy.",
    ],
  },
  {
    title: "6. Odbiorcy danych",
    body: [
      "Dane mogą być przekazywane podmiotom wspierającym świadczenie usługi, wyłącznie w zakresie niezbędnym do ich zadania: Stripe (operator płatności kartą — może oznaczać transfer poza EOG na podstawie standardowych klauzul umownych), Resend (dostarczanie wiadomości e-mail), dostawca hostingu i infrastruktury serwerowej, podmioty księgowe i prawne wspierające operatora.",
      "Operator nie sprzedaje danych osobowych i nie przekazuje ich podmiotom trzecim do celów marketingowych.",
    ],
  },
  {
    title: "7. Okres przechowywania",
    body: [
      "Dane kont przechowujemy przez czas trwania umowy, a po jej zakończeniu — przez okres niezbędny do realizacji obowiązków prawnych (np. podatkowych), dochodzenia roszczeń i zachowania możliwości weryfikacji wystawionych dokumentów.",
      "Dane w legitymacjach przechowujemy na polecenie administratora (firmy szkoleniowej) przez okres ważności dokumentu i po jego upływie — do momentu usunięcia przez administratora lub wypowiedzenia umowy powierzenia. Po zakończeniu współpracy z firmą dane legitymacji są usuwane lub anonimizowane zgodnie z poleceniem administratora.",
      "Tokeny bezpieczeństwa (sesje, linki resetujące) wygasają automatycznie po upływie ich terminu ważności.",
    ],
  },
  {
    title: "8. Bezpieczeństwo danych",
    body: [
      "Stosujemy środki techniczne i organizacyjne adekwatne do ryzyka, w tym: szyfrowanie transmisji (TLS), haszowanie haseł, kontrolę dostępu opartą na rolach i uprawnieniach, ograniczony dostęp personelu do danych produkcyjnych, logi zdarzeń i monitoring, okresowe kopie zapasowe.",
      "Dane przetwarzane w charakterze procesora są izolowane logicznie dla każdego administratora (firmy szkoleniowej) i dostępne wyłącznie uprawnionym osobom i procesom.",
      "Żaden system nie gwarantuje absolutnego bezpieczeństwa — użytkownik powinien chronić swoje dane dostępowe i niezwłocznie zgłaszać podejrzenie ich przejęcia.",
    ],
  },
  {
    title: "9. Naruszenia ochrony danych",
    body: [
      "W przypadku stwierdzenia naruszenia ochrony danych osobowych przetwarzanych na polecenie administratora (firmy szkoleniowej) operator — jako procesor — niezwłocznie zawiadamia administratora, przekazując dostępne informacje niezbędne do oceny naruszenia (art. 33 ust. 2 RODO).",
      "To administrator (firma szkoleniowa) ocenia ryzyko naruszenia, decyduje o zawiadomieniu Prezesa Urzędu Ochrony Danych Osobowych oraz — jeżeli jest to wymagane — o powiadomieniu osób, których dane dotyczą.",
      "W zakresie danych, dla których operatorem-administratorem jest Akademia Rozwoju EduCraft, obowiązki związane z naruszeniem realizowane są zgodnie z art. 33 i 34 RODO bezpośrednio przez operatora platformy.",
    ],
  },
  {
    title: "10. Prawa osób, których dane dotyczą",
    body: [
      "Masz prawo do: dostępu do swoich danych i otrzymania ich kopii; sprostowania (poprawienia) danych; usunięcia danych („prawo do bycia zapomnianym”); ograniczenia przetwarzania; przenoszenia danych; sprzeciwu wobec przetwarzania w celach wynikających z prawnie uzasadnionego interesu; cofnięcia zgody w dowolnym momencie.",
      "W sprawie danych zawartych w legitymacji żądanie należy kierować do firmy szkoleniowej — administratora dokumentu (jej dane widnieją na legitymacji). Operator platformy nie ma prawa samodzielnie zmieniać ani usuwać danych objętych powierzeniem — wykonuje wyłącznie udokumentowane polecenia administratora.",
      "Masz prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl), jeżeli uznasz, że przetwarzanie narusza przepisy RODO.",
    ],
  },
  {
    title: "11. Pliki cookies i technologie lokalne",
    body: [
      "Platforma wykorzystuje wyłącznie techniczne mechanizmy niezbędne do działania usługi: sesję i uwierzytelnianie (tokeny przechowywane lokalnie w przeglądarce lub aplikacji), preferencje interfejsu. Nie stosujemy plików cookies do profilowania ani reklamy.",
      "Wyłączenie technicznych mechanizmów przechowywania może uniemożliwić zalogowanie i korzystanie z portfela legitymacji.",
    ],
  },
  {
    title: "12. Zmiany polityki",
    body: [
      "Niniejsza polityka może być aktualizowana wraz z rozwojem usługi lub zmianami przepisów. O istotnych zmianach poinformujemy zarejestrowanych użytkowników drogą elektroniczną. Aktualna wersja jest zawsze dostępna na stronie mlegitymacja24.pl/polityka-prywatnosci.",
    ],
  },
];

export default function PolitykaPrywatnosciPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="Dokumenty prawne"
          title="Polityka prywatności"
          description="Zasady przetwarzania danych osobowych na platformie mLegitymacja24 zgodnie z RODO."
          image="/images/heroes/hero-prywatnosc.jpg"
          imageAlt="Symbol ochrony danych osobowych"
        />
        <section className="mx-auto max-w-3xl px-6 py-20">
          <FadeIn className="space-y-8">
            <div className="rounded-lg border border-ink/[0.08] bg-white p-8 shadow-card sm:p-10">
              <p className="leading-relaxed text-ink-soft">
                Niniejsza polityka wyjaśnia, jakie dane osobowe są przetwarzane
                na platformie mLegitymacja24, przez kogo i w jakim celu —
                zgodnie z rozporządzeniem Parlamentu Europejskiego i Rady (UE)
                2016/679 (RODO).
              </p>

              <div className="mt-8 rounded-lg border border-brand-600/15 bg-brand-50 p-5">
                <p className="text-sm font-semibold text-ink">
                  Kluczowa zasada podziału ról
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Za dane zawarte na legitymacjach odpowiada firma szkoleniowa,
                  która je wystawiła — to ona jest administratorem tych danych.
                  mLegitymacja24 przetwarza je wyłącznie jako podmiot
                  przetwarzający (procesor), na polecenie wystawcy.
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
