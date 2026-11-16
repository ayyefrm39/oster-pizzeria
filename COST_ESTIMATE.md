# Kostnadsbudget i SEK

Planeringsbudget, inte verifierade leverantörsofferter. Inga tjänster har köpts. Priser måste kontrolleras vid val av konto/region, liksom moms, växelkurs och kommersiella villkor. Budgeten räknar grovt med 12 SEK/EUR och 11 SEK/USD; det är antaganden, inte aktuella valutakurser.

| Alternativ | Fast budget/månad exkl. moms | Bedömning |
|---|---:|---|
| EU-VPS + SQLite + lokal bildlagring | 60–100 kr server | Rekommenderat vid liten trafik och en instans; kräver löpande serverunderhåll |
| Extern krypterad backup | 20–50 kr | Separat leverantör/lagringsplats; även bilder måste säkerhetskopieras |
| Domän | 13–25 kr | Årsavgift utslagen per månad, ägande och förnyelsepris ännu okända |
| Egen adminautentisering | 0 kr separat licens | Drift, patchning och ansvar ingår fortfarande |
| PostgreSQL/Supabase betald tjänst | cirka 300–450 kr plus frontend/domän | Mindre egen databasdrift men en stor del av en avgift på 500 kr; plan och backupvillkor måste verifieras |
| Hanterad fullstackhosting med beständig disk | cirka 150–350 kr plus extern backup/domän | Alternativ om serverdrift inte kan tas om hand; lagring får inte vara tillfällig |

Vald arkitekturs fasta budget: ungefär **95–175 kr/månad**, före eventuell betald övervakning och arbetstid. Med 500 kr i restaurangavgift återstår då ungefär 325–405 kr före moms/skatt, support, incidenter och utvecklarens arbetstid. En engångsavgift på 5 000 kr finansierar inte obegränsad framtida drift eller ändringar.

Betalningsavgifter är separata och transaktionsbaserade. Räkna på exempelvis 2 % + 2 kr per köp som ett **känslighetsexempel**, inte ett Stripe-prislöfte. För 100 beställningar à 200 kr blir det 600 kr i detta exempel. Dessa kostnader bör bäras av restaurangens handlarkonto, inte döljas i en fast utvecklaravgift. Swish/Klarna, utländska kort, valuta och återbetalningar kan ha andra villkor.

Kontrollera aktuella uppgifter hos [Stripe Sverige](https://stripe.com/se/pricing), [Hetzner Cloud](https://www.hetzner.com/cloud/), [Supabase](https://supabase.com/pricing) och vald domän-/backupleverantör. Ingen fri hobbyplan används som grund för kommersiell drift i denna budget.
