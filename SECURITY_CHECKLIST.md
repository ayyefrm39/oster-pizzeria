# Säkerhet och integritet

## Implementerat och lokalt testat

- Serverkontrollerad adminbehörighet på alla katalogändringar, orderlistor, orderändringar, uppladdningar och återbetalningar. Gäster kan inte registrera administratörer.
- Scrypt-lösenord med individuellt slumpat salt (N=131072, r=8, p=1), 14 teckens minsta bootstraplösenord. HttpOnly/SameSite=Strict-session, Secure i produktion, åtta timmars löptid och serverbaserad utloggning.
- Skrivningar kräver matchande `Origin`. Webhook är undantagen från CSRF men kräver Stripe-signatur på oförändrade rådata. Sessions-, login-, API- och orderbegränsningar finns; rate limiting är lokal till en process.
- Zod-validering, parameteriserade SQL-frågor och interna tabellnamnslistor. Produkter, pris, kvantitet, storlek, tillval, öppettid, leveranszon och rabatt kontrolleras på servern. Belopp lagras i heltalsören.
- Unik ordernyckel och SQLite-transaktion mot dubbla försök. Hashad sessions- och ordertokenkontroll. Kundens status-API lämnar inte ut telefon/adress. Endast rätt ordertoken ger läsrättighet.
- Stripe-testnyckelspärr, signaturkontroll, belopp/valuta/orderkoppling, unika webhook-ID:n, idempotensnycklar vid session och återbetalning. Redirect kan aldrig markera betald. Kontantbetalning och onlinebetalning hålls isär.
- Rasterbilder kräver admin, max 5 MB, äkta avkodning med pixelgräns, storleksanpassning och omkodning till WebP utan EXIF. SVG/trasiga bilder avvisas. Slumpade filnamn och `nosniff`.
- Hemligheter/data/backup är Git-ignorerade. Felrespons visar inte stackar eller databasdetaljer. Auditlogg innehåller aktör, händelse, mål-ID och tid utan kundadress.
- Helmet-säkerhetshuvuden och CSP i produktionsservern. React renderar verksamhetstexter som text, inte HTML. Ingen reklamspårning är installerad.

## Återstår före lansering

- Verkliga Stripe-testtransaktioner, säker webhookadress och handlarens bekräftade stöd för kort/Swish/Klarna. Lokala betalningstester använder uttryckligen en gatewaydubbel.
- Publik HTTPS-staging med en riktig admin, Caddy, sessionsflaggor, övervakning, brandvägg och extern krypterad backup. Docker/Compose-filer är inte bevis för en driftsatt tjänst.
- Fullständig meny-, pris- och allergengranskning. Inget löfte om allergenfrihet utifrån ett ofullständigt källarkiv.
- Företagets juridiska namn, personuppgiftsansvarig, kontaktväg, rättslig grund, kundvillkor, personuppgiftsbiträdesavtal, gallringsregler och hantering av registerutdrag/radering behöver verksamhetens beslut. Footertexten är en starttext och ska granskas, inte presenteras som färdig juridisk rådgivning.
- Bestäm skillnaden mellan orderuppgifter som behövs för redovisning och kontakt/adress som kan gallras tidigare. Någon godtycklig automatisk radering har inte aktiverats.
- Orderlänken är en hemlig läslänk. Dela den inte offentligt. Kontrollera att proxy/övervakning inte sparar dess querysträng. Databasen innehåller personuppgifter och måste skyddas av disk-/backupkryptering och åtkomstregler.
- Uppladdningar, kunddata och backup får inte ligga på flyktig disk. Enskild server innebär ingen hög tillgänglighet eller automatisk katastroffailover.
- En oberoende produktionssäkerhetsgranskning och eventuellt MFA/VPN för admin rekommenderas innan full drift. Arkiverad Base44-MFA är inte en aktiv säkerhetsfunktion.

Ingen livebetalning, produktions-DNS, prenumeration eller merge till `main` har godkänts eller genomförts här.
