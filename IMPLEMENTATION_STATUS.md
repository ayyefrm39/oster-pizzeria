# Implementationsstatus

Arbetsgren: `recovery/source-reconstruction`. Ingen produktionslansering är genomförd. Detta är en fungerande lokal implementation med återstående externa verifieringar, inte en färdig leverans enligt hela direktivets Definition of Done.

## Implementerat

- Oberoende API, SQLite-migreringar, relationskopplingar för produkter/tillval/order/betalningar och beständig lagring.
- Egen admininloggning, serverbehörighet, sessionshantering och auditlogg.
- Katalog-, produkt-, kategori-, inställnings-, leveranszons- och erbjudandehantering i den befintliga adminlayouten.
- Bildbyte/uppladdning, familjepriser och visuella tillvalskontroller.
- Serverprissättning i ören, offert, pickup/delivery, rabattvillkor, deduplicering och skyddad orderstatus.
- Stripe Checkout-/webhook-/återbetalningskod i enbart testläge; lokala integrationskontrakt och SDK-signaturer testas.
- Routeladdning, tillgängliga formuläretiketter, felåterkoppling och fungerande footerinformation.
- Låst npm-installation, CI, Docker/Compose, säker backup och granskad menyimport.

## Verifiering

Se senaste körningsresultat i slutet av denna fil. Tester använder tydligt märkta testprodukter och en separat testdatabas. Inga fixturer importeras vid normal driftstart.

## Externa beroenden och ej verifierat

- Fullständig aktuell meny, ingredienser, bilder, allergener och affärsvillkor. Bara sex ofullständiga prisexempel finns som granskningsfil.
- Originalets visuella likhet: referens och bildvärd blockeras av nuvarande nätpolicy. Originalets återfunna hero-URL finns kvar tills asset kan hämtas lokalt; därför är fullständigt oberoende bildvisning **inte klar**.
- Verklig Stripe test-mode Checkout, misslyckat/avbrutet köp, återbetalning och faktiskt tillgänglig Swish/Klarna. Inga Stripe-nycklar är injicerade i miljön.
- Riktig adminbootstrap i verksamhetens framtida drift, offentlig HTTPS-staging, extern backup/katastrofåterställning och uppmätt produktionsprestanda.
- Ägarbeslut om hostingkostnad, integritet/retention och separat lanseringsgodkännande.

Nästa högsta prioritet efter lokala kontroller: få läsåtkomst till originalets meny/bilder och Stripe-testkonfiguration, sedan verifiera full staging utan att ändra livesidan.

## Senaste verifierade resultat (16 november 2026)

- `npm run lint`: passerade, inklusive server, skript och tester.
- `npm run typecheck`: passerade.
- `npm test`: **20 passerade**, 0 misslyckade, 0 hoppade över.
- `npm run build`: passerade.
- `npm run test:browser`: **12 passerade**, 0 misslyckade. Chromium, dator 1440×1000 och mobil 390×844, svensk lokal och Europe/Stockholm.
- `npm audit` och `npm audit --omit=dev`: **0 rapporterade sårbarheter** vid körningen. Detta är inte en garanti mot okända fel.
- Dockerimage byggd; container startad som UID 1000 med produktionsserver. `/api/health` och HTML gav 200, obehörig orderlista gav 401 och CSP-huvud fanns.
- Lokal SQLite-backup skapad och läst tillbaka med `integrity_check = ok`. Även databasåteröppning efter skrivning testas automatiskt.
- Menyimportens dry-run på sex ogranskade exempel passerade; import spärras utan granskning. Ingen riktig produktdata har aktiverats i den vanliga databasen.

Testbilder och testloggar är genererade lokala artefakter, inte originalreferens eller en publicerad staging. Extern Stripe, offentlig HTTPS, verklig meny och återställning i en ny molnuppgift är inte verifierade. Commits är lokala tills de uttryckligen pushas; ingen push eller merge har utförts i denna cykel.
