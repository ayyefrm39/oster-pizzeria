# Teknisk granskning och återställning

Utgångspunkt: återställningsgrenen vid `b990418`, inte `main`. Det befintliga kundgränssnittet och adminlayouterna har behållits. Källarkivet jämfördes för autentiseringskod, paketmanifest, inställningsvärden och tidigare Stripe-funktioner.

## Åtgärdade fynd

- ESLint saknade import av `globals`; skyddad route använde `useEffect` utan import.
- JavaScript-komponenterna hade ofullständig React `forwardRef`-typning och valfria props tolkades som obligatoriska. Cooldown-hookens returtyp var tvetydig. Lint och typkontroll passerade efter korrigeringarna i `8d79634`.
- Återfunnen frontend anropade Base44 för meny, inställningar, order, betalning och inloggning. Alla produktionsanrop går nu till `src/api/client.js` och den egna servern.
- Återfunnen webhook var ofullständig och backendens relativa Stripe-importer pekade på filer som inte fanns. Ny oberoende betalningskod ersätter dessa funktioner; originalen har bevarats.
- Checkout saknade formuläretiketter, beständig nyckel mot upprepade försök och verifierad serveroffert. Dessa är införda. Bilder kan nu laddas upp i admin. Footerknappar har informationsdialoger.
- Adminsidor och kassasidor delas i separata JavaScript-filer. Första huvudfilen har minskat från cirka 585 kB till cirka 342 kB före gzip i de uppmätta byggena. Det är en storleksmätning, inte ett prestandabetyg.

## Begränsningar i underlaget

Originalwebbplatsen `oster-pizza-go.base44.app` och `media.base44.com` gav CONNECT 403 i miljöns nätpolicy. En jämförelse av originalets skärmbilder har därför inte kunnat göras. Hero-bilden pekar fortfarande på den återfunna externa adressen och måste hämtas och lagras lokalt före fullständigt oberoende lansering. Ingen ny bild har hittats på eller presenterats som original.

Den fullständiga restaurangmenyn finns inte i de spårade återfunna filerna. De sex prisexemplen i direktivet har bevarats som ett tydligt märkt granskningsunderlag. Ingen av dessa poster har automatiskt blivit en aktiv produkt.

Återfunna MFA-/OAuth-/registreringssidor hör till plattformens tidigare autentisering. De är arkiverade i `legacy/src/`, inte routade eller inkluderade i bygget. Nu används en egen admininloggning och gästbeställningar.
