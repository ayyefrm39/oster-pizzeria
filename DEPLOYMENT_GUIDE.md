# Drift och staging

Ingen publik staging eller produktion har skapats. Ingen DNS, betalmetod i live-läge eller `main` har ändrats. Följande är den förberedda driftsvägen, inte ett påstående om genomförd lansering.

## Förutsättningar

En godkänd EU-server med Docker/Compose, beständig disk, SSH-nycklar, brandvägg och regelbundna säkerhetsuppdateringar. Exponera endast SSH för administratörer och HTTPS/HTTP för kunder; API-porten 3001 ska inte vara publik. Välj först en separat stagingdomän och rena testuppgifter. Betalnings- och personuppgiftsavtal måste hanteras av verksamheten.

1. Checka ut `recovery/source-reconstruction` vid den granskade committen. Kör CI-kontrollerna i README.
2. Skapa `.env` utifrån `.env.example`, sätt filrättighet 600. Fyll `APP_ORIGIN=https://<stagingnamn>`. Compose sätter databas och uppladdningar till `/app/data` på en beständig volym. Logga inte nycklar.
3. Kör `SITE_HOST=<stagingnamn> docker compose --env-file .env -f deploy/compose.yml up -d --build`. Detta ska först ske när en server/domän har godkänts. Caddy kan då utfärda HTTPS-certifikat. Ingen instruktion här är ett godkännande av produktions-DNS.
4. Skapa första administratören genom att tillfälligt tillföra `ADMIN_EMAIL` och ett unikt långt `ADMIN_PASSWORD` som säkra processvariabler till `npm run admin:create` i appcontainern. Lägg inte värden på en kommandorad som sparas i historiken. Ta bort bootstrapvariablerna efter lyckat resultat. Publik registrering finns inte.
5. Migreringar sker automatiskt. Importera en granskad komplett meny; uppladdade bilder hamnar på datavolymen. Kontrollera inställningar/zoner innan beställningar avpausas.
6. Verifiera `/api/health`, HTTPS, säker sessionscookie, inloggning/utloggning, mobil/dator, menyändringar, hämtning, leverans, orderstatus och återställning. Testsviten använder egna fixturer och ersätter inte denna stagingkontroll.

## Stripe i testläge

Servern läser `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` och `STRIPE_PAYMENT_METHODS`. Endast testnycklar accepteras. Ingen nyckel byggs in i frontend. `APP_ORIGIN` styr returadresser och CSRF-kontroll.

Konfigurera en Stripe-testwebhook till `https://<stagingnamn>/api/payments/webhook` för:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `refund.updated`
- `refund.failed`

Börja med `STRIPE_PAYMENT_METHODS=card`. Lägg till `swish` och/eller `klarna` först efter att företagets land, SEK, verksamhet och konto har godkänts och metoderna aktiverats i Stripe. Vissa metoder har särskilda belopps-/kundkrav; aktuell behörighet måste verifieras i kontot och mot [Stripe-dokumentationen](https://docs.stripe.com/payments/payment-methods/overview). Att strängen är tillåten i koden bevisar inte att handlaren är berättigad.

Genomför riktiga Stripe-testfall: lyckat kort, nekad betalning, avbruten Checkout, fördröjd bekräftelse, dubblerad webhook, återbetalning och omladdning av orderlänk. Den lokala sviten verifierar integrationskontrakt och Stripe SDK:s signaturkontroll, inte genomförda Stripe-transaktioner. Livestöd är avsiktligt spärrat tills separat godkännande och granskad kodändring.

## Backup, återställning och rollback

`npm run db:backup` använder SQLite:s backup-API för en konsistent kopia. `BACKUP_DIR` väljer katalog. Kör dagligen från appcontainern och överför både databaskopia och `data/uploads` till separat krypterad lagring. Begränsa åtkomst och bestäm retention med verksamheten. Backup på samma server skyddar inte vid serverförlust.

Återställningsövning:

1. Stoppa appen och säkerhetskopiera nuvarande datavolym. Behåll kopian för rollback.
2. Återställ databasen från en konsistent `.sqlite`-backup och bilder från samma backupperiod till en **ny** volym. Ta inte enbart huvudfilen från en aktiv WAL-databas.
3. Kontrollera `PRAGMA integrity_check`, migreringsversion, produkter, order och bilder i isolerad staging innan trafik släpps på. Starta med beställningar pausade.
4. Vid kodrollback: återgå till tidigare granskad image/commit. Migreringar körs automatiskt framåt; återgå aldrig med en gammal app mot en inkompatibel ny databas. Vid behov återställ matchande backup medan skrivningar är avstängda.

Databasöppning/återöppning och lokal backup har testats här; extern backup, faktisk serverförlust och offentlig HTTPS-staging är ännu inte verifierade.

## Övervakning och underhåll

Docker har hälsokontroll; kontrollera också appens hälsa från en extern övervakning. Larma på uteblivna backuper, fullt diskutrymme, återkommande 5xx och misslyckade Stripe-webhooks. Apploggar skriver feltyp/orderns interna ID, inte kundens adress, lösenord, betalnyckel eller ordertoken. Aktivera inte proxyloggning av orderlänkars querysträngar.

Behåll en instans; rate limiting och sessioner är anpassade till detta. Säkerhetsuppdatera Node/container/dependencies, granska `npm audit` och verifiera efter uppdateringar. VPS-upplägget kräver en namngiven driftansvarig.

## Ägarens enkla löpande ändringar

Priser, nya/dolda rätter, bilder, storlekar/tillval, kategorier, erbjudanden, öppettider, leveranszoner och kontaktuppgifter ändras i admin. Strukturella önskemål skickas som konkret beteende med skärmbild/exempel; utvecklaren gör en separat GitHub-ändring, kör tester och visar staging före godkänd publicering. Inga normala prisändringar ska kräva programmering.

## Särskilt för denna molnmiljö

Dockerbygget behövde sessionens CA monterad som en BuildKit-hemlighet i en tillfällig Dockerfile för `npm ci`. TLS- och paketintegritetskontroller behölls. CA-filen har inte lagts i repository eller imagelager. Vanlig hosting med normalt betrodda certifikat använder den incheckade Dockerfile oförändrad.

Nätåtkomst till originalreferens, bildvärdar och Stripe har sparats som föreslagna domäner i miljöutkastet, men ett sparat utkast ändrar inte aktuell nätpolicy. När det har tillämpats kan utvecklaren köra `NODE_USE_ENV_PROXY=1 node scripts/vendor-hero.js`, bygga om och jämföra originalbilden. Skriptet verifierar att originalreferensen fortfarande är den förväntade, avkodar bilden och sparar källadress och SHA-256-proveniens. Det har inte kunnat genomföras med nuvarande CONNECT 403-blockering.

De gamla kraven `VITE_BASE44_APP_ID` och `VITE_BASE44_APP_BASE_URL` från det första setup-utkastet är inaktuella och ska inte fyllas i. Ta bort dem i miljöinställningarna vid nästa granskning; den körbara appen läser dem inte.
