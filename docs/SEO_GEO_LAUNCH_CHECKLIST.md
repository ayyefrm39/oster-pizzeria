# SEO, lokal synlighet och AI-upptäckbarhet – lanseringskontroll

## Före publicering
- Bekräfta verksamhetens juridiska/visningsnamn, adress, telefon, öppettider, leveransområden, menypriser och allergeninformation med restaurangägaren. Inga påhittade omdömen eller öppettider.
- Bekräfta kanonisk produktionsdomän. Sätt canonical URL, og:url och korrekt og:image (egen licensierad bild).
- Server-rendera eller förgenerera indexerbart innehåll för startsida och meny, så sökmotorer och AI-botar kan läsa riktiga maträtter och priser utan JavaScript.
- Skapa sitemap.xml med endast publika kanoniska sidor och referera den från robots.txt efter domänbeslut.
- Behåll admin, kassa och orderlänkar utanför index; robots.txt är inte åtkomstskydd, använd autentisering och noindex för privata sidor.
- Validera schema.org Restaurant/LocalBusiness, PostalAddress, openingHoursSpecification och Menu/hasMenu först efter att information verifierats. Kontrollera mot synligt sidinnehåll.
- Kontrollera mobilprestanda, Core Web Vitals, tillgänglighet, brutna länkar, bildtexter, 404, HTTPS och redirect mellan www/utan www.
- Verifiera ägarskap och skicka sitemap i Google Search Console och Bing Webmaster Tools. Uppdatera Google Business Profile med konsekvent namn, adress, telefon, meny och webbplats.
- AI-synlighet: tydliga crawlbara svar på användarfrågor (meny, beställning, leverans, öppettider), konsekventa offentliga företagsuppgifter och relevanta omnämnanden. Ingen garanti för rekommendationer i ChatGPT eller andra AI-tjänster.

## Driftspärrar
- Öppna inte för riktiga ordrar innan fullständig granskad meny, leveransvillkor, kontaktuppgifter och fungerande ordernotiser är testade.
- Stripe live är inte aktiverat i befintlig implementation. Testa webhook, återbetalning, avbrutna köp och kvitto innan separat livegodkännande.
- Verifiera HTTPS, backup/restore, administratörsinloggning, orderflöde på mobil och desktop på offentlig staging före DNS-byte.

## Ändringar som återstår i kod
- Dynamiska canonical/OG-taggar och sitemap beroende på bekräftad domän.
- Crawlbar, förgenererad meny samt korrekt strukturerad menydata.
- Verifiering av produktionsprestanda och indexering.
