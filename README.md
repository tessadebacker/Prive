# Prive

## Tafels Kampioen 🏆

Een oefenapp voor de maaltafels, gemaakt voor een kind uit het tweede leerjaar.

De app past zich aan het niveau van het kind aan:
- Je oefent altijd op één actieve tafel tegelijk (start bij tafel van 1).
- Elk rekenfeit (bv. "6 × 7") moet 3 keer na elkaar goed beantwoord worden voor het als "gekend" telt.
- Zodra alle 10 feiten van een tafel gekend zijn, verschijnt er een felicitatie en schuift de app automatisch door naar de volgende tafel.
- Al gekende tafels worden af en toe tussendoor herhaald, zodat kennis blijft hangen.
- Via het tafeloverzicht op het startscherm kan je ook een eerder geleerde tafel apart kiezen om te herhalen.
- Alle voortgang (sterren, welke tafel actief is, welke feiten al gekend zijn) wordt lokaal opgeslagen in de browser, dus die blijft bewaard tussen sessies op hetzelfde toestel.

### Gebruiken

Er is geen installatie of build-stap nodig, het is een gewone statische webpagina:

1. Open `index.html` rechtstreeks in een browser, of
2. start lokaal een simpele webserver in deze map, bv.:
   ```
   python3 -m http.server 8000
   ```
   en surf naar `http://localhost:8000`.

Werkt ook prima op een tablet of telefoon (bv. via "Toevoegen aan beginscherm" in de browser).
