# mLegitymacja24 — aplikacja iOS

Natywna powłoka (Capacitor + WKWebView) — odpowiednik Android TWA.
Po starcie ładuje `https://mlegitymacja24.pl/logowanie`.

- Bundle ID: `pl.mlegitymacja24.app`
- Ikona: granatowo-czerwone „m" na białym tle (jak Android)
- Splash: biały z logo „m"
- Build: Codemagic (`codemagic.yaml` w głównym repo, workflow `ios-app-store`)
  — ten sam schemat co przy petvio-mobile

## Kroki (po Twojej stronie — jak przy petvio)

1. **App Store Connect** — utwórz aplikację (My Apps → „+"), wybierz/utwórz
   Bundle ID `pl.mlegitymacja24.app` (Identifiers w Apple Developer).

2. **Codemagic → Team settings → Integrations → App Store Connect** —
   dodaj integrację o nazwie **`mlegitymacja24`** (klucz API .p8, tak jak
   integracja `petvio`). Podpisywanie i profile ogarnie `xcode-project use-profiles`.

3. **Push repo** — workflow `ios-app-store` odpala się na push do `main`,
   numer builda = `$BUILD_NUMBER` z Codemagic. Artefakt: `ios-app/build/ios/ipa/*.ipa`.

4. **App Store Connect** — po buildzie wgraj IPA przez Transporter/altool
   (`submit_to_testflight: false` — jak przy petvio; możesz przestawić na `true`,
   wtedy Codemagic sam wrzuci do TestFlight), potem opis + screenshoty +
   polityka prywatności (https://mlegitymacja24.pl/polityka-prywatnosci) → recenzja.

## Uwagi do recenzji Apple

- Aplikacja-webview może być zakwestionowana pod kątem wytycznej 4.2
  („minimum functionality"). W opisie podkreśl: portfel legitymacji, szybka
  weryfikacja QR, dostęp do dokumentów offline.
- Jakby odrzucili jako „repackaged website" — dodajemy push przez
  `@capacitor/push-notifications` (masz to w petvio).

## Lokalny build (Mac)

```
cd ios-app
npm ci
npx cap sync ios
cd ios/App && pod install
open App.xcworkspace   # Xcode → Product → Archive
```
