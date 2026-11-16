# Öster Pizzeria

Fristående React/Vite-applikation med Node.js 24, Express och SQLite. Arbetsgren: `recovery/source-reconstruction`. Ingen Base44-tjänst, SDK eller inloggning krävs av den körbara applikationen.

## Utveckling

```sh
npm ci
npm run server
# I en andra terminal:
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

API kör på 3001. Vite vidarebefordrar `/api` och `/uploads`. Standardursprung är `http://localhost:5173`; använd exakt samma värde i `APP_ORIGIN` om webbläsaren använder en annan adress. Kopiera `.env.example` till `.env` och fyll bara de värden du behöver. Inga riktiga nycklar ska läggas i Git.

SQLite-migreringarna körs automatiskt vid serverstart. `data/` är lokal, ignorerad och måste ligga på beständig disk i drift. En ny databas innehåller restaurangens återfunna standardinställningar, men beställningar är **pausade**, leverans är av och inga produkter eller administratörer uppfinns.

## Administration och meny

Skapa första administratören med `npm run admin:create` efter att `ADMIN_EMAIL` och ett unikt `ADMIN_PASSWORD` på minst 14 tecken har satts säkert i processmiljön. Kommandot skriver aldrig lösenord till loggen. Ta bort bootstrapvariablerna efteråt. Besök `/login`; registrering för allmänheten finns inte. Kunder beställer som gäster och följer order med en svårgissad länk.

Admin kan ändra produkter, priser, familjestorlek, tillval, bilder, kategorier, öppettider, leveranszoner, erbjudanden och orderstatus. Bilder avkodas, storleksbegränsas och sparas som WebP utan metadata. Rabattkoder och leveransavgifter kontrolleras på servern.

`docs/menu-review.json` innehåller enbart direktivets sex prisexempel, utan påhittade ingredienser eller bilder. Det är **inte hela menyn** och är markerat ogranskat/dolt. `npm run data:import -- docs/menu-review.json` validerar utan att importera. En komplett granskad export använder samma struktur, `reviewed: true`, stabila ID:n och importeras med `--apply`. Befintliga produkter/kategorier skrivs inte över. Öppna inte för beställningar innan riktiga menyuppgifter och villkor har granskats.

## Kontroller

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser
```

Webbläsartesterna kör den byggda appen och ett riktigt lokalt API med en separat databas i minnet. `TEST – pizza` och testinloggningen finns bara i testfixturer, inte i vanlig serverstart. Chromium finns på `/usr/bin/chromium` i molnmiljön. Annars: `npx playwright install chromium` och sätt `CHROMIUM_PATH` till den installerade binären (se CI). Kör inte två webbläsarsviter samtidigt på port 4173.

## Betalning och drift

Utan Stripe-konfiguration visas endast betalning vid hämtning/leverans. Servern accepterar endast `sk_test_`-nycklar. Verifierade webhooks, inte återkomstlänkar, bekräftar betalning. Verkliga testköp och handlarens Swish/Klarna-aktivering återstår. Se [driftguiden](DEPLOYMENT_GUIDE.md), [säkerhetskontrollen](SECURITY_CHECKLIST.md), [status](IMPLEMENTATION_STATUS.md) och [kostnadsbudgeten](COST_ESTIMATE.md).

Återfunnen plattformskod är bevarad i `base44/`, `legacy/` och originalarkiven som referens; den ingår inte i produktionsbygget. Ingen merge till `main`, livebetalning eller domänändring ingår i arbetet hittills.
