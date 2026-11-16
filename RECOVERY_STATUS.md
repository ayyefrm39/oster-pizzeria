# Öster Pizzeria — återställningsstatus

## Verifierat i arbetsgrenen
- Originalkällan i `base44(1).txt` är bevarad på `main`.
- Samtliga 15 kund- och adminsidor har separerats till `src/pages/`.
- Stora delar av `src/components/` och `src/components/ui/` har återställts.
- Kärnfilerna `src/App.jsx`, `src/main.jsx`, `src/index.css`, `package.json`, `index.html`, `postcss.config.js`, `tailwind.config.js` och `vite.config.js` har återskapats.
- Separata filer för varukorg, språk, öppettider, autentisering och inställningar finns.
- Kända sammanfogningar från originaltexten har korrigerats för bland annat varukorg/format och vissa UI-komponenter.
- En GitHub Actions-workflow för `npm install` och `npm run build` har lagts till.

## Inte verifierat
- Inget lyckat komplett byggtest har bekräftats.
- Vissa filgränser och innehåll behöver fortsatt kodgranskning.
- Fullständig menydata och bilder saknas eventuellt från den manuella källexporten.
- Base44 SDK och Base44 Vite-plugin finns fortfarande kvar i originalkonfigurationen.
- Ingen oberoende databas, autentisering, Stripe-testbetalning eller produktionsdriftsättning har verifierats.

## Nästa arbetsordning
1. Granska komponenternas slut/början, särskilt vid sammanslagna rader.
2. Kontrollera att alla lokala importsökvägar pekar på existerande filer.
3. Kör och felsök CI-byggtestet; rapportera verkligt resultat.
4. Därefter ersätta Base44 backend och autentisering.
5. Testa kundflöde, admin, Stripe testläge och responsivitet.
6. Förbered driftsättning först efter tester och ägarens godkännande.

`main` och den publicerade Base44-sidan ska lämnas orörda tills migrationen är godkänd.
