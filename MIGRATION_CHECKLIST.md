# Migreringskontroll — Öster Pizzeria

Detta är en teknisk checklista, inte en färdig implementation. All kod ligger på återställningsgrenen och ska inte slås ihop med `main` före granskning.

## Kundflöde
- [ ] Startsida, bilder, animationer och responsivitet jämförda mot originalet
- [ ] Menykategorier, produkter, storlekar, tillval, allergener och priser importerade och verifierade
- [ ] Varukorg: antal, kommentarer, tillval, totalsumma, leveransavgift
- [ ] Öppettider, leveransområden och giltiga adresser
- [ ] Kassa: ordervalidering på **servern**; priser får inte accepteras från klienten
- [ ] Order-ID och orderstatus; säker token/behörighet för kundens statusvy
- [ ] Bekräftelser och återhämtning efter avbruten betalning

## Administration
- [ ] Säker admininloggning med serverkontrollerad roll
- [ ] Hantera kategorier, produkter, priser, bilder, tillgänglighet och erbjudanden
- [ ] Beställningslista, nya order i realtid eller via polling, statusuppdateringar
- [ ] Öppettider, leveranszoner, avgifter och inställningar
- [ ] Loggning av viktiga ändringar och säkerhetskopiering

## Betalningar
- [ ] Stripe testläge: skapa Checkout-session server-side med serverberäknat belopp
- [ ] Verifiera Stripe-webhook-signatur och idempotens; markera aldrig betald från enbart redirect
- [ ] Hantera misslyckad betalning, avbruten checkout och återbetalning
- [ ] Bekräfta faktisk Swish/Klarna-tillgänglighet hos vald leverantör och handelskontot innan löften
- [ ] Inga API-nycklar, webhook-hemligheter eller personuppgifter i GitHub eller frontend

## Drift och kostnad
- [ ] Välj billig men säker hosting, databas, fillagring och autentisering
- [ ] Dokumentera domän/DNS, miljövariabler, backups och återställning
- [ ] Testa på separat staging-adress med testbetalningar
- [ ] Godkännande av ägaren före livebetalningar, domänbyte eller publicering

## Exakta Base44-anrop som behöver ersättas
- `src/pages/Checkout.jsx`: `base44.functions.invoke('createOrder', payload)`
- `src/pages/OrderConfirmation.jsx`: `getOrderStatus`, `confirmStripePayment`, `createPaymentSession`
- `src/pages/admin/AdminDashboard.jsx`: `Order.subscribe`, `Order.update`, `refundOrder`
- `src/lib/settings.jsx`: `RestaurantSettings.list`
- Fler Base44-anrop finns i meny- och adminfiler och ska kartläggas innan SDK tas bort.

## Verifieringsstatus
- [x] GitHub Actions kan installera npm-beroenden
- [ ] GitHub Actions `npm run build` grön
- [ ] Körbar frontend granskad visuellt
- [ ] Fristående backend
- [ ] End-to-end-testad order och betalning
