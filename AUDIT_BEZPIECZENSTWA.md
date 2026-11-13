# Audyt bezpieczeństwa — mLegitymacja24

Data: 2026-11-06
Zakres: backend (Express + Prisma), frontend (Next.js), konfiguracja nginx/TLS.

## Co jest zrobione dobrze

- **HTTPS**: certyfikat Let's Encrypt, TLS 1.2/1.3, nowoczesne ciphery (GCM/ChaCha20), przekierowanie HTTP → HTTPS.
- **Helmet** na API — podstawowe nagłówki bezpieczeństwa.
- **CORS** ograniczony do whitelisty domen (nie `*`).
- **Rate limiting** globalny na `/api` (200 req / 15 min / IP).
- **Hasła**: bcrypt, 12 rund — prawidłowo.
- **JWT**: krótki access token (15 min) + refresh token (30 dni) z możliwością unieważnienia w bazie.
- **Kody QR**: podpis HMAC-SHA256, TTL 45 s, porównanie `crypto.timingSafeEqual` — odporne na replay i podróbki.
- **Autoryzacja**: spójne ograniczanie zasobów do `companyId` / `holderId` na większości tras; ręczna weryfikacja firm przez SUPER_ADMIN.
- **Audit log**: rejestrowanie rejestracji, logowań, wystawień i unieważnień.
- **Verification log**: każda weryfikacja QR zapisywana z wynikiem.
- **Absolwent nie może edytować danych tożsamości** — świadoma, poprawna decyzja projektowa.
- **Silne sekrety** w `.env` (długie, losowe).
- Walidacja wejścia przez `express-validator` na kluczowych trasach.

## Znalezione problemy

### Wysokie

1. **IDOR — `GET /api/verify/history/:credentialId`** (`routes/verify.ts`)
   Endpoint wymaga tylko zalogowania — dowolny użytkownik może pobrać historię weryfikacji **dowolnej** legitymacji po jej ID (bez sprawdzenia właściciela/firmy). Należy dodać kontrolę: HOLDER → tylko swoje legitymacje, COMPANY_* → tylko legitymacje swojej firmy, SUPER_ADMIN → wszystkie.

2. **`errorHandler` zwraca `err.message` klientowi** (`middleware/errorHandler.ts`)
   Wewnętrzne komunikaty błędów (w tym błędy Prisma, mogące zawierać strukturę zapytań/danych) trafiają w odpowiedzi API. Należy zwracać generyczny komunikat, a szczegóły tylko logować.

3. **Tymczasowe hasło absolwenta w odpowiedzi API** (`routes/credentials.ts` POST `/`)
   `temporaryPassword` jest zwracane w JSON do firmy — hasło w plaintext przechodzi przez API i może zostać w przeglądarce/logach. Bezpieczniej: wysyłka mailem do absolwenta + wymuszona zmiana przy pierwszym logowaniu.

### Średnie

4. **Brak rotacji refresh tokenów** — `/api/auth/refresh` wydaje nowy access token, ale nie rotuje refresh tokena. Przy kradzieży atakujący ma dostęp do 30 dni. Zalecana rotacja + detekcja reuse.
5. **Refresh tokeny w bazie w postaci jawnej** — wyciek bazy = przejęcie wszystkich aktywnych sesji. Zalecane przechowywanie hashy (SHA-256) tokenów.
6. **Tokeny JWT w `localStorage`** (frontend `lib/api.ts`) — podatne na kradzież przy XSS. Rozważyć ciasteczka `httpOnly; Secure; SameSite=Strict` (wymaga dostosowania auth po obu stronach).
7. **Brak węższego rate limitu na `/api/auth/login` i `/api/auth/register`** — globalny limit 200/15 min wystarcza na credential stuffing z jednego IP; dodać np. 10–20 prób/15 min na endpoint + opcjonalna blokada konta.
8. **Enumeracja kont przez rejestrację** — `register-holder` i `companies/register` zwracają 409 „konto już istnieje". Ułatwia sprawdzanie, czy dany e-mail ma konto (login poprawnie zwraca komunikat generyczny).
9. **2FA zadeklarowane, ale niezaimplementowane** — schema ma `twoFactorSecret`, zależność `speakeasy` jest, lecz brak tras 2FA. Nie komunikować 2FA na stronie jako dostępnej funkcji.

### Niskie / porządkowe

10. **`/api/credential-types` publiczne** — ujawnia wszystkie typy legitymacji; prawdopodobnie zamierzone, ale do przemyślenia.
11. **`PATCH /api/credential-types/:id`** przyjmuje całe `req.body` (mass assignment) — tylko SUPER_ADMIN, niskie ryzyko.
12. **`/uploads` serwowane publicznie** — zdjęcia legitymacji dostępne po URL bez autoryzacji. Jeśli zdjęcia są prywatne, dodać kontrolę dostępu. `multer` jest w zależnościach, ale niewykorzystany — usunąć lub wdrożyć z walidacją typów plików.
13. **IP + User-Agent w `verificationLog`** — dane osobowe wg RODO; potrzebna polityka retencji i wpis w polityce prywatności.
14. **Logi błędów** — `console.error(err)` z pełnym stackiem; rozważyć sanitizację logów (bez danych osobowych/sekretów).

## Wprowadzone poprawki w tej sesji

- **Nagłówki bezpieczeństwa na frontendzie** (`next.config.mjs`): do tej pory helmet chronił tylko `/api`; strona główna nie miała żadnych nagłówków. Dodano: `Strict-Transport-Security` (HSTS 2 lata), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (kamera tylko dla własnej domeny — potrzebna do skanowania QR; mikrofon i geolokalizacja wyłączone).

## Rekomendowany porządek działań

1. Poprawić IDOR w `/api/verify/history/:credentialId` i generyczny `errorHandler` (kilka linii, duży zysk).
2. Usunąć `temporaryPassword` z odpowiedzi API (wysyłka mailem) — SMTP jest przygotowane w `.env`.
3. Węższy rate limit na auth + rotacja refresh tokenów z hashowaniem w bazie.
4. Decyzja ws. ciasteczek httpOnly vs localStorage.
5. Dokończenie 2FA albo usunięcie obietnicy z komunikacji.
