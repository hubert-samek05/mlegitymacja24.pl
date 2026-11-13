// Seed pełnej listy zawodów nieregulowanych jako typy legitymacji.
// Uruchomienie: node scripts/seed-credential-types.js
// Idempotentne - pomija nazwy i slugi istniejące już w bazie.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NAMES = `
Administrator baz danych
Administrator nieruchomości
Administrator portali internetowych
Administrator stron internetowych
Administrator systemów komputerowych
Administrator sklepu internetowego
Agent nieruchomości
Agent reklamowy
Analityk biznesowy
Analityk danych
Analityk finansowy
Analityk internetowy
Animator czasu wolnego
Animator kultury
Animator rekreacji
Animator sportu
Animator turystyki
Architekt krajobrazu
Architekt wnętrz
Arteterapeuta
Artysta malarz
Artysta rzeźbiarz
Asystent biura
Asystent ds. marketingu
Asystent fotografa
Asystent produkcji filmowej
Asystent projektanta
Asystent zarządu
Audytor wewnętrzny
Autor tekstów reklamowych
Barista
Barman
Behawiorysta zwierząt
Behawiorysta psów
Behawiorysta kotów
Behawiorysta koni
Behawiorysta królików
Behawiorysta gryzoni
Behawiorysta ptaków
Behawiorysta zwierząt egzotycznych
Behawiorysta zwierząt hodowlanych
Bloger
Brand manager
Broker informacji
Copywriter
Coach
Content creator
Dekorator wnętrz
Dekorator imprez
Dekorator witryn sklepowych
Dietetyk zwierząt
Dietetyk psów
Dietetyk kotów
Dietetyk koni
Dietetyk zwierząt egzotycznych
Dietetyk zwierząt hodowlanych
Dietetyk drobiu
Dietetyk trzody chlewnej
Dietetyk bydła
Dietetyk królików
Dietetyk gryzoni
Dietetyk zwierząt domowych
Konsultant żywienia psów
Konsultant żywienia kotów
Konsultant żywienia koni
Specjalista ds. żywienia zwierząt
Specjalista ds. suplementacji zwierząt
Specjalista ds. żywienia BARF
Układacz diet BARF dla psów
Układacz diet BARF dla kotów
Doradca biznesowy
Doradca ds. kariery
Doradca ds. wizerunku
Doradca klienta
Doradca personalny
Doradca zawodowy
Doradca żywieniowy
Dropshipping manager
Dyspozytor
Dziennikarz internetowy
Edukator
Edukator przyrodniczy
Edukator kynologiczny
Edukator felinologiczny
Edukator dobrostanu zwierząt
Edukator zoologiczny
Event manager
Felinolog
Florysta
Fotograf
Fotoreporter
Freelancer
Front-end developer
Full-stack developer
Game developer
Grafik komputerowy
Grafik reklamowy
Groomer
Groomer psów
Groomer kotów
Groomer zwierząt egzotycznych
Groomer mobilny
Stylista psów
Stylista zwierząt
Fryzjer zwierząt
Handlowiec
Headhunter
Home organizer
Home stager
Hostessa
Hotelowy animator czasu wolnego
Influencer
Instruktor aerobiku
Instruktor akrobatyki
Instruktor akrobatyki sportowej
Instruktor aerial hoop
Instruktor aerial silks
Instruktor aqua aerobiku
Instruktor aqua fitness
Instruktor badmintona
Instruktor baletu
Instruktor baseballu
Instruktor boksu
Instruktor breakdance
Instruktor capoeiry
Instruktor cheerleadingu
Instruktor crossfitu
Instruktor curlingu
Instruktor cyclingu
Instruktor fitness
Instruktor fitness dla seniorów
Instruktor fitness dla kobiet w ciąży
Instruktor fitness dla dzieci
Instruktor fitness funkcjonalnego
Instruktor fitness grupowego
Instruktor fitness indywidualnego
Instruktor gimnastyki
Instruktor gimnastyki artystycznej
Instruktor gimnastyki korekcyjnej
Instruktor gimnastyki sportowej
Instruktor gimnastyki prozdrowotnej
Instruktor gimnastyki dla seniorów
Instruktor gimnastyki dla dzieci
Instruktor gimnastyki dla kobiet w ciąży
Instruktor golfa
Instruktor jazdy figurowej na lodzie
Instruktor jazdy konnej
Instruktor jazdy na rolkach
Instruktor jazdy na wrotkach
Instruktor jazdy na łyżwach
Instruktor jogi
Instruktor judo
Instruktor kajakarstwa
Instruktor karate
Instruktor kettlebell
Instruktor kickboxingu
Instruktor kolarstwa
Instruktor kulturystyki
Instruktor kung-fu
Instruktor łyżwiarstwa
Instruktor łyżwiarstwa szybkiego
Instruktor masażu relaksacyjnego
Instruktor medytacji
Instruktor nordic walking
Instruktor odnowy biologicznej
Instruktor piłki nożnej
Instruktor piłki ręcznej
Instruktor piłki siatkowej
Instruktor piłki koszykowej
Instruktor pilatesu
Instruktor pilates reformer
Instruktor pływania
Instruktor pływania niemowląt
Instruktor pływania synchronicznego
Instruktor pływania dla seniorów
Instruktor pływania dla dzieci
Instruktor pływania korekcyjnego
Instruktor pole dance
Instruktor podnoszenia ciężarów
Instruktor parkour
Instruktor rekreacji
Instruktor rekreacji i turystyki
Instruktor rekreacji ruchowej
Instruktor rekreacji ruchowej – aerobik
Instruktor rekreacji ruchowej – badminton
Instruktor rekreacji ruchowej – bieganie
Instruktor rekreacji ruchowej – fitness
Instruktor rekreacji ruchowej – gimnastyka
Instruktor rekreacji ruchowej – jazda konna
Instruktor rekreacji ruchowej – joga
Instruktor rekreacji ruchowej – kajakarstwo
Instruktor rekreacji ruchowej – kulturystyka
Instruktor rekreacji ruchowej – narciarstwo
Instruktor rekreacji ruchowej – nordic walking
Instruktor rekreacji ruchowej – pływanie
Instruktor rekreacji ruchowej – tenis
Instruktor rekreacji ruchowej – turystyka rowerowa
Instruktor rekreacji ruchowej – wspinaczka
Instruktor rekreacji ruchowej – żeglarstwo
Instruktor rekreacji ruchowej w wodzie
Instruktor rekreacji ruchowej na świeżym powietrzu
Instruktor ringo
Instruktor rolkarstwa
Instruktor rugby
Instruktor samoobrony
Instruktor skateboardingu
Instruktor snowboardu
Instruktor soft fitness
Instruktor spinningu
Instruktor sportów ekstremalnych
Instruktor sportów motorowych
Instruktor sportów siłowych
Instruktor squasha
Instruktor strzelectwa sportowego
Instruktor sztuk walki
Instruktor tańca
Instruktor tańca brzucha
Instruktor tańca towarzyskiego
Instruktor tańca nowoczesnego
Instruktor tańca współczesnego
Instruktor tenisa
Instruktor tenisa stołowego
Instruktor trekkingu
Instruktor trampolin
Instruktor treningu obwodowego
Instruktor treningu personalnego
Instruktor treningu funkcjonalnego
Instruktor treningu medycznego
Instruktor treningu motorycznego
Instruktor treningu siłowego
Instruktor treningu wytrzymałościowego
Instruktor turystyki rowerowej
Instruktor unihokeja
Instruktor wspinaczki sportowej
Instruktor wspinaczki skałkowej
Instruktor wushu
Instruktor zumby
Instruktor zumby gold
Instruktor aqua zumby
Instruktor żeglarstwa
Instruktor żeglarstwa rekreacyjnego
Instruktor sportu
Instruktor sportu osób niepełnosprawnych
Instruktor sportu osób starszych
Instruktor sportu dzieci i młodzieży
Instruktor sportów wodnych
Instruktor sportów zimowych
Instruktor sportów rakietowych
Instruktor sportów walki
Instruktor stretchingu
Instruktor mobility
Instruktor zdrowego kręgosłupa
Instruktor treningu dla seniorów
Instruktor treningu dla kobiet
Instruktor treningu dla dzieci
Instruktor treningu personalnego dla seniorów
Instruktor treningu personalnego dla kobiet
Instruktor treningu personalnego dla dzieci
Instruktor kalisteniki
Instruktor street workout
Instruktor TRX
Instruktor tabaty
Instruktor body pump
Instruktor body balance
Instruktor body combat
Instruktor step aerobiku
Instruktor barre
Instruktor body art
Instruktor animal flow
Instruktor treningu EMS
Instruktor treningu biegowego
Instruktor biegania długodystansowego
Instruktor biegania terenowego
Instruktor maratonu
Instruktor triathlonu
Instruktor duathlonu
Instruktor orientacji sportowej
Instruktor łucznictwa
Instruktor paintballu
Instruktor ASG
Instruktor wspinaczki lodowej
Instruktor narciarstwa biegowego
Instruktor narciarstwa zjazdowego
Instruktor skituringu
Instruktor snowboardingu
Instruktor surfingu
Instruktor windsurfingu
Instruktor kitesurfingu
Instruktor wakeboardingu
Instruktor nurkowania rekreacyjnego
Instruktor snorkelingu
Instruktor paddleboardingu
Instruktor SUP
Instruktor kajakarstwa górskiego
Instruktor raftingu
Instruktor wioślarstwa
Instruktor żeglarstwa lodowego
Instruktor hokeja
Instruktor hokeja na trawie
Instruktor hokeja na lodzie
Instruktor lacrosse
Instruktor futbolu amerykańskiego
Instruktor futbolu flagowego
Instruktor frisbee
Instruktor ultimate frisbee
Instruktor petanque
Instruktor bowlingu
Instruktor kręgli
Instruktor bilarda
Instruktor snookera
Instruktor padla
Instruktor pickleballa
Instruktor szachów
Instruktor brydża
Instruktor gier i zabaw ruchowych
Instruktor rekreacji plenerowej
Instruktor survivalu
Instruktor bushcraftu
Instruktor turystyki pieszej
Instruktor trekkingu górskiego
Instruktor turystyki aktywnej
Instruktor turystyki kwalifikowanej
Instruktor animacji sportowej
Instruktor aktywności ruchowej
Instruktor zdrowego stylu życia
Instruktor relaksacji
Instruktor oddechu
Instruktor technik relaksacyjnych
Instruktor ćwiczeń ogólnorozwojowych
Instruktor ćwiczeń rozciągających
Instruktor ćwiczeń wzmacniających
Instruktor szkolenia psów
Instruktor posłuszeństwa psów
Instruktor obedience
Instruktor agility
Instruktor nosework
Instruktor tropienia użytkowego
Instruktor rally-o
Instruktor dog dance
Instruktor frisbee z psem
Instruktor canicross
Instruktor dog trekking
Instruktor flyball
Instruktor dogoterapii
Instruktor woltyżerki
Instruktor jeździectwa rekreacyjnego
Instruktor pracy z końmi
Instruktor natural horsemanship
Instruktor komunikacji ze zwierzętami
Kaskader
Kierownik biura
Kierownik klubu fitness
Kierownik obiektu sportowego
Kierownik sprzedaży
Kynolog
Zoolog
Zootechnik
Zoopsycholog
Zoopsycholog psów
Zoopsycholog kotów
Zoopsycholog koni
Zoopsycholog zwierząt egzotycznych
Zoopsycholog zwierząt domowych
Konsultant biznesowy
Konsultant ds. marketingu
Konsultant ds. organizacji
Konsultant ds. reklamy
Konsultant ds. sprzedaży
Konsultant adopcyjny zwierząt
Koordynator adopcji zwierząt
Konsultant komunikacji człowiek–zwierzę
Konsultant ds. dobrostanu zwierząt
Konsultant ds. wyposażenia zwierząt
Konsultant pielęgnacji zwierząt
Konsultant pielęgnacji psów
Konsultant pielęgnacji kotów
Konsultant doboru ras psów
Konsultant doboru ras kotów
Konsultant ds. hodowli psów
Konsultant ds. hodowli kotów
Konsultant ds. akwarystyki
Konsultant ds. terrarystyki
Konsultant ds. akwariów morskich
Konsultant ds. akwariów słodkowodnych
Konsultant ds. wyposażenia stajni
Konsultant ds. przygotowania zwierząt do wystaw
Konsultant ds. żywienia BARF
Konsultant ds. suplementacji zwierząt
Konsultant ds. turystyki konnej
Konsultant ds. pielęgnacji kopyt
Konsultant gastronomiczny
Konsultant edukacyjny
Konsultant HR
Konsultant ds. e-commerce
Konsultant ds. jakości
Konsultant ds. ekologii
Konsultant ds. reputacji online
Konsultant ds. obsługi najmu
Konsultant ds. nieruchomości
Korepetytor
Korektor tekstów
Koordynator eventów
Koordynator projektów
Koordynator sportu
Koordynator zajęć rekreacyjnych
Kucharz
Lektor języka obcego
Logistyk
Magazynier
Makijażysta
Manager hotelu
Manager klubu sportowego
Manager klubu fitness
Manager restauracji
Manager salonu groomerskiego
Manager hotelu dla zwierząt
Manager hodowli zwierząt
Manager sklepu zoologicznego
Marketing manager
Masażysta relaksacyjny
Masażysta zwierząt
Masażysta psów
Masażysta koni
Masażysta kotów
Mentor
Merchandiser
Montażysta filmowy
Montażysta wideo
Muzyk
Negocjator handlowy
Niania
Opiekun zwierząt
Petsitter
Dogsitter
Catsitter
Opiekun psów
Opiekun kotów
Opiekun koni
Opiekun zwierząt egzotycznych
Opiekun zwierząt w hotelu dla zwierząt
Opiekun zwierząt w schronisku
Opiekun zwierząt w zoo
Opiekun zwierząt hodowlanych
Opiekun ptaków
Opiekun gadów
Opiekun płazów
Opiekun gryzoni
Opiekun królików
Opiekun akwariów
Opiekun szczeniąt
Opiekun kociąt
Opiekun zwierząt podczas podróży
Opiekun zwierząt podczas wystaw
Opiekun zwierząt egzotycznych podczas podróży
Opiekun zwierząt w gospodarstwie
Organizator imprez
Organizator imprez sportowych
Organizator konferencji
Organizator wydarzeń
Organizator wycieczek rekreacyjnych
Organizator obozów jeździeckich
Organizator zajęć kynologicznych
Organizator wystaw zwierząt
Organizator zawodów kynologicznych
Organizator zawodów jeździeckich
Organizator turystyki konnej
Organizator opieki nad zwierzętami
Operator kamery
Operator drona
Parkieciarz
Piekarz
Pisarz
Petsitter behawioralny
Płatny tester oprogramowania
Podcaster
Pozycjoner stron internetowych
Projektant graficzny
Projektant mody
Projektant ogrodów
Projektant stron internetowych
Projektant UX
Projektant UI
Projektant akwariów
Projektant terrariów
Projektant wybiegów dla zwierząt
Projektant wolier
Projektant akcesoriów dla zwierząt
Projektant zabawek dla zwierząt
Programista
Pracownik administracyjny
Pracownik biurowy
Pracownik call center
Pracownik obsługi klienta
Pracownik obsługi imprez
Pracownik obsługi obiektu sportowego
Pracownik promocji
Pracownik reklamy
Pracownik social media
Pracownik sprzedaży internetowej
Pracownik usług porządkowych
Pracownik fundacji prozwierzęcej
Producent filmowy
Producent muzyczny
Producent karmy dla zwierząt
Product manager
Project manager
Public relations specialist
Rekruter
Redaktor
Redaktor internetowy
Rękodzielnik
Rzeczoznawca w dziedzinie niewymagającej ustawowych uprawnień
Scenarzysta
Sekretarka
Specjalista ds. administracji
Specjalista ds. analizy danych
Specjalista ds. bezpieczeństwa informacji
Specjalista ds. e-commerce
Specjalista ds. employer brandingu
Specjalista ds. fotografii
Specjalista ds. HR
Specjalista ds. kadr i płac
Specjalista ds. komunikacji
Specjalista ds. logistyki
Specjalista ds. marketingu
Specjalista ds. obsługi klienta
Specjalista ds. organizacji imprez
Specjalista ds. promocji
Specjalista ds. reklamy
Specjalista ds. rekrutacji
Specjalista ds. rozwoju osobistego
Specjalista ds. sprzedaży
Specjalista ds. social media
Specjalista ds. szkoleń
Specjalista ds. turystyki aktywnej
Specjalista SEO
Specjalista SEM
Specjalista UX
Specjalista UI
Specjalista Google Ads
Specjalista Meta Ads
Specjalista ds. dobrostanu zwierząt
Specjalista ds. wzbogacania środowiska zwierząt
Specjalista ds. treningu zwierząt
Specjalista ds. socjalizacji szczeniąt
Specjalista ds. socjalizacji kociąt
Specjalista ds. rozrodu zwierząt
Specjalista ds. genetyki hodowlanej
Specjalista ds. kynologii
Specjalista ds. felinologii
Specjalista ds. pielęgnacji zwierząt
Specjalista ds. reprodukcji psów
Specjalista ds. reprodukcji kotów
Specjalista ds. hodowli zwierząt
Specjalista ds. hodowli psów
Specjalista ds. hodowli kotów
Specjalista ds. akwarystyki
Specjalista ds. terrarystyki
Specjalista ds. wyposażenia zwierząt
Specjalista ds. marketingu zoologicznego
Specjalista ds. treningu psów
Specjalista ds. treningu koni
Specjalista ds. pielęgnacji kopyt
Specjalista ds. reprodukcji zwierząt
Specjalista ds. rozwoju zwierząt
Spedytor
Sprzedawca
Sprzedawca produktów zoologicznych
Stylista
Stylista fryzur
Stylista paznokci
Stylista rzęs
Stylista brwi
Stylista personalny
Stylista sesji zdjęciowych
Szkoleniowiec
Tancerz
Technik dźwięku
Technolog karmy dla zwierząt
Telemarketer
Tester oprogramowania
Trener biznesu
Trener personalny
Trener rozwoju osobistego
Trener sprzedaży
Trener wystąpień publicznych
Trener kompetencji miękkich
Trener motywacyjny
Trener sportu
Trener przygotowania motorycznego
Trener fitness
Trener biegania
Trener kulturystyki
Trener personalny kobiet
Trener personalny seniorów
Trener personalny dzieci
Trener pływania
Trener jogi
Trener pilatesu
Trener siłowy
Trener funkcjonalny
Trener kalisteniki
Trener sportów walki
Trener lekkoatletyki
Trener gimnastyki
Trener kolarstwa
Trener tenisa
Trener badmintona
Trener piłki nożnej
Trener piłki ręcznej
Trener koszykówki
Trener siatkówki
Trener sportów wodnych
Trener sportów zimowych
Trener sportu osób niepełnosprawnych
Trener rekreacji ruchowej
Trener treningu obwodowego
Trener treningu wytrzymałościowego
Trener treningu interwałowego
Trener zdrowego stylu życia
Trener aktywności ruchowej
Trener psów
Trener kotów
Trener koni
Trener zwierząt egzotycznych
Trener psów asystujących
Trener koni rekreacyjnych
Trener koni sportowych
Trener zwierząt do filmów i reklam
Trener zwierząt do pokazów
Terapeuta zajęć z udziałem zwierząt
Animaloterapeuta
Felinoterapeuta
Dogoterapeuta
Hipoterapeuta
Alpakoterapeuta
Onoterapeuta
Terapeuta zajęć z udziałem koni
Tłumacz zwykły
Webmaster
Wedding planner
Wirtualna asystentka
Wizażysta
Wykładowca kursów komercyjnych
Wykonawca rękodzieła
YouTuber
Zarządca najmu
Zarządca nieruchomości
Zarządca obiektów sportowych
Zarządca obiektów rekreacyjnych
Zarządca sklepu internetowego
Akwarysta
Akwarysta morski
Akwarysta słodkowodny
Terrarysta
Hodowca psów
Hodowca kotów
Hodowca koni
Hodowca ptaków ozdobnych
Hodowca gadów
Hodowca królików
Hodowca gryzoni
Hodowca ryb akwariowych
Hodowca owadów
Hodowca alpak
Hodowca zwierząt egzotycznych
Handler psów wystawowych
Handler kotów wystawowych
Handler zwierząt hodowlanych
Fotograf zwierząt
Fotograf psów
Fotograf koni
Fotograf dzikiej przyrody
Etolog
Antrozoolog
Ekolog zwierząt
Przewodnik po zoo
Przewodnik przyrodniczy
Przewodnik turystyki konnej
Zawodnik sportowy
Audytor jakości
Analityk kosztów
Kontroler finansowy
Księgowy
Samodzielny księgowy
Asystent księgowości
Specjalista ds. fakturowania
Specjalista ds. płac
Specjalista ds. controllingu
Specjalista ds. windykacji
Specjalista ds. rozliczeń
Doradca finansowy w zakresie niewymagającym odrębnych uprawnień
Specjalista ds. budżetowania
Przedstawiciel handlowy
Key Account Manager
Sales Manager
Regionalny kierownik sprzedaży
Kupiec
Kasjer
Konsultant telefoniczny
Konsultant sprzedaży
Specjalista ds. zakupów
Specjalista ds. wynajmu mieszkań
Koordynator najmu
Specjalista ds. obsługi najmu
Zarządca najmu krótkoterminowego
Malarz pokojowy
Tapeciarz
Glazurnik
Płytkarz
Stolarz
Cieśla
Dekarz
Monter mebli
Monter podłóg
Monter drzwi i okien
Monter płyt gipsowo-kartonowych
Monter instalacji sanitarnych
Hydraulik
Tynkarz
Posadzkarz
Ogrodnik
Konserwator budynków
Fryzjer
Kosmetyczka
Kosmetolog
Manikiurzystka
Pedikiurzystka
Barber
Stylista ubioru
Instruktor wellness
Trener odnowy biologicznej
Dietetyk
Konsultant ds. żywienia
Instruktor komputerowy
Instruktor rozwoju osobistego
Autor materiałów edukacyjnych
Twórca kursów internetowych
Specjalista ds. newsletterów
Email marketing specialist
Affiliate marketing specialist
Marketplace specialist
Amazon account manager
Allegro specialist
Specjalista ds. generowania leadów
Specjalista CRO
Specjalista marketing automation
Twórca produktów cyfrowych
Sprzedawca kursów online
Community manager
Moderator internetowy
Data analyst
Data scientist
Specjalista Business Intelligence
AI specialist
Prompt engineer
Machine learning engineer
Specjalista cyberbezpieczeństwa
Administrator sieci komputerowych
Administrator systemów IT
IT support specialist
Helpdesk specialist
DevOps engineer
UX researcher
Web developer
Software developer
QA tester
Web designer
No-code developer
Twórca aplikacji mobilnych
Specjalista automatyzacji procesów
Specjalista ds. dokumentacji
Archiwista zakładowy
Office manager
Kierownik operacyjny
Menedżer operacyjny
Specjalista ds. organizacji pracy
Specjalista ds. reklamacji
Koordynator dostaw
Specjalista ds. łańcucha dostaw
Planista transportu
Kontroler stanów magazynowych
Specjalista ds. zaopatrzenia
Koordynator floty
Analityk logistyczny
Pomoc kuchenna
Kierownik gastronomii
Recepcjonista hotelowy
Housekeeping manager
Animator czasu wolnego w hotelu
Reżyser
Ilustrator
Projektant biżuterii
Jubiler artystyczny
Krawiec
Szwaczka
Artysta tatuażu
DJ
Wokalista
Aktor
Choreograf
Organizator przeprowadzek
Specjalista ds. porządkowania przestrzeni
Profesjonalny sprzątacz
Specjalista ds. usług porządkowych
Doradca wizerunkowy
Doradca ds. organizacji
Specjalista ds. ekologii w firmie
Mystery shopper
Doradca hodowlany
Konsultant branży zoologicznej
Manager obiektu rekreacyjnego
`;

// Reguły kategoryzacji - pierwsze dopasowanie wygrywa (kolejność ma znaczenie)
const RULES = [
  ['Zwierzęta', /zwierz|psów|psem|psami|kotów|kotami|kotem|kociąt|szczeniąt|koni\b|konnej|końmi|jeździec|woltyżer|horsemanship|kyno|felin|groomer|petsitter|dogsitter|catsitter|\bdog\b|\bdogs\b|handler|hodowc|akwar|terrar|zootech|zoopsych|etolog|antrozoolog|zoolog|behawioryst|agility|nosework|obedience|rally-o|canicross|flyball|tropien|kopyt|stajn|schronisk|barf|dobrostan|adopcj|drobiu|trzody|bydła|alpak|owadów|terapeuta z|karmy dla|płazów|gadów|ptaków|gryzoni|królików|prozwierzęcej|groomerskiego|po zoo|\bptak|\bptasi/i],
  ['Sport i rekreacja', /instruktor|trener|sport|rekreac|fitness|gimnastyk|jog[aię]|pilates|crossfit|bieg|maraton|triathlon|duathlon|nordic|kulturysty|lekkoatlet|kolarstw|pływan|aqua|zumb|taniec|tańca|aerobik|sztuk walki|boks|judo|karate|kickboxing|kung|wushu|samoobron|akrobatyk|aerial|parkour|wspinacz|nurko|snorkel|surf|kite|wake|paddl|\bsup\b|kajakarstw|rafting|wioślarstw|żeglarstw|narciar|snowboard|skitur|hokej|lacrosse|futbol|frisbee|petanque|bowling|kręgl|bilard|snooker|padl|pickleball|squash|tenis|badminton|golf|rugby|unihokej|ringo|baseball|curling|cyclingu|spinning|trampolin|kettlebell|kalistenik|street workout|trx|tabat|body (pump|balance|combat|art)|step aerobiku|barre|animal flow|\bems\b|mobility|stretching|survival|bushcraft|trekking|orientacji|łucznic|paintball|\basg\b|strzelectw|szachów|brydża|zabaw ruchowych|plenerow|wellness|odnowy biologicznej|kręgosłup|relaksacj|oddech|aktywności ruchowej|zawodnik sportowy|koordynator sportu|zajęć rekreacyjnych|rolkar|skateboard|kaskader/i],
  ['IT i marketing', /programist|developer|front-end|full-stack|\bweb ?(developer|designer)|webmaster|software|devops|\bqa\b|tester oprogramowania|no-code|aplikacji mobilnych|sieci komputerowych|systemów (komputerowych|it)|it support|helpdesk|data (analyst|scientist)|business intelligence|\bai |prompt|machine learning|cyberbezpieczeństw|automatyzacj\w* procesów|\bseo\b|\bsem\b|google ads|meta ads|pozycjoner|analityk (internetowy|danych)|administrator (baz danych|portali|stron internetowych|sklepu internetowego|systemów)|e-commerce|dropshipping|marketplace|amazon|allegro|\bcro\b|marketing automation|leadów|produktów cyfrowych|kursów online|community manager|moderator internetowy|bezpieczeństwa informacji|social media|newsletter|e-?mail marketing|affiliate|game/i],
  ['Beauty i wellness', /fryzjer(?! zwierząt)|barber|kosmet|makijaż|manikiur|pedikiur|wizaż|tatuaż|paznokci|rzęs|brwi|stylist\w* (fryzur|ubioru|personalny|sesji|wizerun)|masażysta(?! zwierz|psów|koni|kotów)|doradca wizerunk|ds\. wizerunku/i],
  ['Budownictwo i wykończenia', /malarz (pokojowy|budowlany)|tapeciarz|glazurnik|płytkarz|stolarz|cieśla|dekarz|monter|hydraulik|tynkarz|posadzkarz|parkieciarz|ogrodnik|konserwator budynków|instalacji sanitarnych|budowlan|murarz/i],
  ['Gastronomia', /barista|barman|kucharz|cukiernik|piekarz|sommelier|kuchenn|gastronom|restauracj|kelner|sushi|czekolad|browarnik|serowar|winiarz|bar manager/i],
  ['Turystyka i eventy', /event|hotel|hostessa|recepcjonist|housekeeping|animator|organizator (imprez|konferencji|wydarzeń|wycieczek|przeprowadzek|obozów|zawodów|wystaw|turystyki|opieki)|wedding|przewodnik|turystyk|koordynator eventów|pilot/i],
  ['Edukacja i rozwój osobisty', /korepetytor|lektor|wykładowc|edukator(?!.*(zwierz|kyno|felin|zoo))|tłumacz|szkoleniowiec|coach\b|mentor\b|kursów|materiałów edukacyjnych|kompetencji|wystąpień|motywacyjny|rozwój osobistego|rozwoju osobistego|kariery|doradca (zawodowy|personalny)|pierwszej pomocy|\bbhp\b|arteterapeuta|nauki jazdy|ds\. szkoleń/i],
  ['Kultura i sztuka', /fotograf|fotoreporter|film|montaż|grafik|projektant (graficzny|ux|ui|stron|mody|biżuterii|ogrodów|3d|internetowych)|copy|blog|content|podcast|youtuber|influencer|dziennikarz|redaktor|artysta|dekorator|floryst|muzyk|\bdj\b|wokalist|aktor|reżyser|choreograf|tancerz|ilustrator|pisarz|scenarzyst|korektor|operator (kamery|drona|wideo)|rękodziel|producent (filmowy|muzyczny)|technik dźwięku|malarz(?! budowlan|pokojow)|rysownik|ceramik|garncarz|jubiler|złotnik|kowal|modystk|iluzjonist|architekt|autor tekstów|kreatywn/i],
  ['Dom i opieka', /niania|opiekun(?! zwierz)|opiekunka|home (organizer|stager)|organizator przestrzeni|sprząt|porządk|porządkowania|usług porządkowych|asystent osoby|osób starszych|niepełnosprawn|domowa|domowym/i],
  ['Rzemiosło i rękodzieło', /krawiec|szwaczk|tapicer|jubiler|złotnik|kowal|ceramik|garncarz|rymarz|pszczelarz|szewc|zegarmistrz|rękodzieł|modystk/i],
];

function categorize(name) {
  for (const [cat, re] of RULES) {
    if (re.test(name)) return cat;
  }
  return 'Biznes i usługi';
}

const PL = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL[c])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

(async () => {
  const names = NAMES.split('\n').map((s) => s.trim()).filter(Boolean);
  const unique = [...new Map(names.map((n) => [n.toLowerCase(), n])).values()];

  const existing = await prisma.credentialType.findMany({ select: { name: true, slug: true } });
  const existingNames = new Set(existing.map((t) => t.name.toLowerCase()));
  const existingSlugs = new Set(existing.map((t) => t.slug));

  const toCreate = [];
  for (const name of unique) {
    if (existingNames.has(name.toLowerCase())) continue;
    let slug = slugify(name);
    let i = 2;
    while (existingSlugs.has(slug) || toCreate.some((t) => t.slug === slug)) slug = `${slugify(name)}-${i++}`;
    toCreate.push({ name, slug, category: categorize(name), defaultValidityMonths: 24, isActive: true });
  }

  if (toCreate.length) {
    await prisma.credentialType.createMany({ data: toCreate });
  }

  const stats = {};
  toCreate.forEach((t) => { stats[t.category] = (stats[t.category] || 0) + 1; });
  const total = await prisma.credentialType.count();
  console.log(`Na liście: ${unique.length} unikalnych nazw`);
  console.log(`Dodano nowych: ${toCreate.length}`);
  console.log('Per kategoria (nowe):', stats);
  console.log(`Łącznie typów w bazie: ${total}`);
  process.exit(0);
})();
