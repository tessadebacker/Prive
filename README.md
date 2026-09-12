# Prive

## Tafels Kampioen 🏆

Een oefenapp voor de maaltafels, gemaakt voor een kind uit het tweede leerjaar.

De app past zich aan het niveau van het kind aan:
- Je oefent altijd op één actieve tafel tegelijk.
- De tafels worden aangeleerd in een didactisch opgebouwde volgorde: 1, 10, 5, 2, 4, 3, 6, 9, 7, 8. Zo start je met tafels die aansluiten bij wat een kind al kent (tellen in sprongen van 10, 5, 2), en bouwen moeilijkere tafels voort op tafels die al gekend zijn (bv. tafel van 4 = dubbele van tafel van 2, tafel van 9 = tafel van 10 min 1x, tafel van 7 = tafel van 5 + tafel van 2).
- **Voor elke nieuwe tafel krijgt het kind eerst een korte les**, vóór er getoetst wordt: wat vermenigvuldigen betekent (groepjes vormen), de tafel stap voor stap opbouwen, eventueel een handig verband met een tafel die het al kent, en tellen in sprongen met twee korte controlevragen. Pas daarna start de oefenmodus voor die tafel.
- Elk rekenfeit (bv. "6 × 7") moet 3 keer na elkaar goed beantwoord worden voor het als "gekend" telt.
- Zodra alle 10 feiten van een tafel gekend zijn, verschijnt er een felicitatie en gaat het kind meteen door naar de les van de volgende tafel.
- Al gekende tafels worden af en toe tussendoor herhaald, zodat kennis blijft hangen.
- Via het tafeloverzicht op het startscherm kan je ook een eerder geleerde tafel apart kiezen om te herhalen.
- Alle voortgang (sterren, welke tafel actief is, welke tafels al aangeleerd zijn, welke feiten al gekend zijn) wordt lokaal opgeslagen in de browser, dus die blijft bewaard tussen sessies op hetzelfde toestel.

### Gebruiken

Er is geen installatie of build-stap nodig, het is een gewone statische webpagina:

1. Open `index.html` rechtstreeks in een browser, of
2. start lokaal een simpele webserver in deze map, bv.:
   ```
   python3 -m http.server 8000
   ```
   en surf naar `http://localhost:8000`.

Werkt ook prima op een tablet of telefoon (bv. via "Toevoegen aan beginscherm" in de browser).
