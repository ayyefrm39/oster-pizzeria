ÖSTER PIZZERIA – VISUELL GRANSKNING

Öppna index.html i din webbläsare för samtliga 20 bilder. Galleriet fungerar utan internet. Klicka på bilderna för större vy. PNG-filerna är de riktiga skärmbilderna.

INTERAKTIVT I MOLNMILJÖN
Om Codex visar + → Desktop: öppna Desktop, starta Chrome och gå till http://127.0.0.1:4173. Den här adressen ligger i molndatorn och fungerar inte som publik länk på din egen dator. Appen är igång så länge miljön och serverprocessen är aktiva.

INTERAKTIVT PÅ EGEN DATOR
Kräver Git och Node.js 24 eller senare. Kör:
git clone --branch recovery/source-reconstruction https://github.com/ayyefrm39/oster-pizzeria.git
cd oster-pizzeria
npm ci
npm run build
node scripts/review-preview.js

Öppna sedan http://127.0.0.1:4173 i din egen webbläsare.

Testinloggning för /login:
admin@example.test
test-password-only-123

Detta konto är enbart för den lokala testversionen. Testdata ligger i minnet och återställs när processen startas om. Ingen produktionsdatabas eller Stripe används. Du kan lägga beställningar med betalning vid avhämtning, ändra priser och testa orderstatus. Alla visade produkter/beställningar är testdata, inte verifierad originalmeny.
