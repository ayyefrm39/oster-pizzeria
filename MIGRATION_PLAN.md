# Genomförd migration och återstående steg

## Arkitektur

Befintlig React/Vite-frontend, ett API i Node.js 24/Express, SQLite med WAL och beständig lokal disk, rasterbilder på samma disk och Stripe Checkout i testläge. Caddy terminerar HTTPS i den förberedda Docker Compose-konfigurationen. En applikationsinstans används; SQLite-filen får inte delas mellan flera servrar via nätverksdisk.

Valet undviker separat databas- och autentiseringsabonnemang. Utlovad tillgänglighet kräver ändå driftövervakning och extern backup. Vid flera instanser, kraftig belastning eller krav på automatisk failover behöver databasen flyttas till PostgreSQL och sessioner/rate limiting samordnas. Detta är en dokumenterad begränsning, inte en implementerad klusterlösning.

## Ersatta plattformsgränser

| Tidigare anrop | Ny funktion |
|---|---|
| MenuCategory/MenuItem | Validerat katalog-API och admin-CRUD |
| RestaurantSettings/DeliveryZone | Beständiga inställningar och leveranszoner |
| Order.list/update/subscribe | Admin-API och polling |
| createOrder/getOrderStatus | Serverprissättning, transaktion och säker orderlänk |
| createPaymentSession | Stripe-session från databasens belopp |
| confirmStripePayment | Läsning av webhook-bekräftad status; redirect ändrar inget |
| refundOrder | Behörighetskontrollerad Stripe-återbetalning |
| Base44 auth | Scrypt-lösenord, HttpOnly-cookie och serverkontrollerad adminbehörighet |
| Plattformens bildlagring | Lokal validerad bildlagring för nya uppladdningar |

## Återstående ordning

1. Tillåt läsning av originalwebbplats/bilder, hämta originalassets och jämför skärmbilder på mobil/dator.
2. Importera och granska fullständig aktuell meny, ingredienser, allergener, leveransområden och kontaktuppgifter. Visa inga exempel som verifierad meny.
3. Ange Stripe-testnyckel och webhook-hemlighet säkert. Kör riktiga lyckade, misslyckade och avbrutna testköp samt återbetalning. Kontrollera Swish och Klarna i handlarens konto.
4. Välj och godkänn staginghosting, sätt riktiga adminuppgifter och testa HTTPS, återställning och extern backup där.
5. Granska integritetstext, lagringstid, personuppgiftsbiträden och köpvillkor med verksamheten.
6. Begär separat godkännande före livebetalningar, produktionsdomän eller merge till `main`.
