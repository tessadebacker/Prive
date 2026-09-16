# Prive

## Tafels Kampioen 🏆

Een oefenapp voor de maaltafels, gemaakt voor een kind uit het tweede leerjaar.

De app past zich aan het niveau van het kind aan:
- Je oefent altijd op één actieve tafel tegelijk.
- De tafels worden aangeleerd in een didactisch opgebouwde volgorde: 1, 10, 5, 2, 4, 3, 6, 9, 7, 8. Zo start je met tafels die aansluiten bij wat een kind al kent (tellen in sprongen van 10, 5, 2), en bouwen moeilijkere tafels voort op tafels die al gekend zijn (bv. tafel van 4 = dubbele van tafel van 2, tafel van 9 = tafel van 10 min 1x, tafel van 7 = tafel van 5 + tafel van 2).
- **Voor elke nieuwe tafel krijgt het kind eerst een korte les**, vóór er getoetst wordt: wat vermenigvuldigen betekent (groepjes vormen), de tafel stap voor stap opbouwen, eventueel een handig verband met een tafel die het al kent, en tellen in sprongen met twee korte controlevragen. Pas daarna start de oefenmodus voor die tafel.
- Elk rekenfeit (bv. "6 × 7") moet 3 keer na elkaar goed beantwoord worden voor het als "gekend" telt.
- **Een oefensessie ("les") duurt maximaal 20 oefeningen**, zoals bij Duolingo. De voortgangsbalk bovenaan tijdens het oefenen toont hoe ver je in déze les staat (samen met de tekst "Oefening X/20"). Na 20 sommen krijgt het kind een overzichtje (score + aanmoediging) met de keuze om een nieuwe les te starten of terug naar het startscherm te gaan.
- **Bij een fout antwoord verschijnt telkens een korte theorie-herinnering** (het trucje of verband voor precies dat rekenfeit), zowel tijdens het gewoon oefenen als tijdens de toets.
- Al gekende tafels worden af en toe tussendoor herhaald, zodat kennis blijft hangen. Via het tafeloverzicht op het startscherm kan je ook zelf een eerder geleerde tafel kiezen om te herhalen.

### Toets vóór een nieuwe tafel

Een tafel is pas écht "gekend" na een gehaalde **toets** — dit gebeurt nooit zomaar automatisch:
- Zodra alle 10 feiten van een tafel 3x na elkaar goed beantwoord zijn, **of** een volledige les (20 oefeningen) foutloos én vlot (gemiddeld snel genoeg per vraag) afgewerkt is, komt de toets beschikbaar (zichtbaar op het startscherm als "📝 Doe de toets!").
- Was de les wel foutloos maar duurde ze opvallend lang, dan verschijnt dat aanbod bewust **niet** — dat wijst eerder op tellen/twijfelen dan op automatisering.
- De toets zelf: 10 vragen, exact 1 per factor (1 t.e.m. 10), zonder herhaling. **Alle 10 moeten juist zijn** om door te schuiven naar de volgende tafel.
- Toets niet gehaald? Dan moet er eerst weer een **volledige** oefenles (20 oefeningen) afgewerkt worden voor de toets opnieuw geprobeerd mag worden.

### Punten & rewards

- Elke afgewerkte oefenles levert een instelbaar aantal punten op ("Punten per afgewerkte les" bij Instellingen, standaard 10).
- Via de 🎁 Rewards-knop op het startscherm kan het kind gespaarde punten inwisselen voor een beloning (bv. "15 minuten extra schermtijd", "Kiest het toetje", ...).
- Bij Instellingen beheer je zelf de lijst van rewards: naam en puntenprijs toevoegen, aanpassen of verwijderen.

### Overzicht & synchronisatie

- **Bovenaan het startscherm staat een niveau-kaart**: welk niveau (1 t.e.m. 10) en welke tafel het kind nu aan het leren is, met een voortgangsbalk van hoeveel sommen van die tafel al gekend zijn, en of de toets klaarstaat.
- **Voortgang synct automatisch tussen toestellen** via een gratis Firebase Firestore-database: wat je zoon op zijn tablet oefent (inclusief punten en toets-status), zie je ook terug op je eigen telefoon of laptop, en omgekeerd. Er is geen account of login voor nodig — alle toestellen delen gewoon hetzelfde ene voortgangsdocument. Lokaal (in de browser) wordt alles ook nog steeds bewaard als directe/offline back-up: zonder internet werkt de app gewoon verder op basis van de laatste lokale stand, en zodra er weer verbinding is synct alles automatisch bij. Onderaan het instellingenscherm staat een statusregel die toont of de cloud-sync actief is (☁️) of niet (📴).

### Gebruiken

De app draait live via GitHub Pages op:

**https://tessadebacker.github.io/Prive/**

Dat is een vaste link die op elk toestel werkt (telefoon, tablet, computer) — gewoon openen in de browser.

**Als app installeren op een gsm** (geen App Store nodig): open de link in de browser, en kies:
- **iPhone (Safari)**: knop "Delen" (vierkantje met pijltje omhoog) → "Zet op beginscherm".
- **Android (Chrome)**: menu (⋮) → "App installeren" of "Toevoegen aan startscherm".

Er verschijnt dan een eigen 🏆-icoontje op het beginscherm dat de app in volledig scherm opent, zonder browserbalk — net als een "echte" geïnstalleerde app. Dit gebruikt technisch gezien een web-app-manifest (`manifest.json`), geen aparte App Store-publicatie.

Er is geen installatie of build-stap nodig om de code zelf te ontwikkelen, het is een gewone statische webpagina. Om lokaal te ontwikkelen/testen:

1. Open `index.html` rechtstreeks in een browser, of
2. start lokaal een simpele webserver in deze map, bv.:
   ```
   python3 -m http.server 8000
   ```
   en surf naar `http://localhost:8000`.

Werkt ook prima op een tablet of telefoon (bv. via "Toevoegen aan beginscherm" in de browser).
