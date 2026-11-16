# Migreringskontroll — Öster Pizzeria

- [x] Bygg vidare på återställd frontend på `recovery/source-reconstruction`.
- [x] Lint- och typfel korrigerade; produktion bygger.
- [x] Fristående API/databas, migreringar och egen admininloggning.
- [x] Serverkontrollerade priser, storlekar/tillval, leveranszoner, rabatter och ordernycklar.
- [x] Produkt-/kategori-/inställnings-/orderadministration samt uppladdningar och erbjudanden.
- [x] Lokal orderbekräftelse och tokenbaserad status.
- [x] Stripe-testintegration, signaturkontroll, händelseidempotens och skyddade återbetalningar implementerade och kontrakttestade.
- [x] Mobil-/datorflöden testade i Chromium med isolerade testdata.
- [x] Backup/importverktyg, CI, Docker och driftdokumentation.
- [ ] Fullständig originalmeny/ingredienser/bilder och verksamhetsgranskade uppgifter.
- [ ] Originalets skärmbilder jämförda; hero-asset lagrat oberoende av Base44.
- [ ] Riktigt Stripe-testköp, nekad/avbruten betalning och återbetalning i handlarens testkonto.
- [ ] Swish/Klarna-berättigande och faktisk aktivering verifierade.
- [ ] Extern HTTPS-staging, extern backup och fullständig katastrofåterställning.
- [ ] Juridisk integritetstext, retention, köpvillkor och driftansvar godkända.
- [ ] Separat ägargodkännande för livebetalningar, domänändring och produktion.

Detaljer och körningsresultat: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). Kryss för lokala tester innebär inte produktion eller verifierad betalning hos Stripe.
