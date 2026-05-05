# UI_COPY_v1.md — All UI-text för CV-fix

**Format för Cursor-Claude.** Detta dokument levererar färdig copy som ska in i appens komponenter — sektion för sektion. Inget om arkitektur, ingen ny logik. Bara strängar.

**Författare:** Lisa (Jobblink AB) i samarbete med Claude.
**Datum:** 2026-05-05.
**Mappar mot:** PRD.md §7 (CV-sektioner), CLAUDE.md (UI/UX Standards).

---

## 0. Allmänna principer som styr all copy

- **Vardagsspråk före CV-jargong.** CV-termer (profiltext, kompetenser, referenser) får finnas som primärrubrik (det är så användaren känner igen sektionen från andra appar), men **lägg en synlig vardagsspråk-underrubrik direkt under** så någon utan tidigare CV-erfarenhet förstår vad sektionen handlar om.
- **Felmeddelanden enligt CLAUDE.md-standard:** specifika, åtgärdsinriktade, på svenska.
  - ✗ "Ogiltig e-post"
  - ✓ "E-postadressen saknar @-tecken"
- **Validering ska informera, inte skämma ut.** Använd "Bra start..." eller "Tänk på att..." snarare än "Fel!".
- **Knapptexter är imperativ.** "Ladda ner", "Spara", "Lägg till" — inte "Tryck här för att ladda ner".

---

## 1. Steg 1 — Personuppgifter

**Komponent:** `components/cv-form/PersonalInfoStep.tsx` (eller motsvarande befintlig fil).

### 1.1 Huvudrubrik och underrubrik

**Befintlig huvudrubrik:** `Personuppgifter`

**Lägg till som synlig underrubrik (mindre, gråare):**
```
Vad rekryteraren behöver för att höra av sig till dig
```

### 1.2 Section-headers (befintliga ska behållas)
- `NAMN` → behåll
- `KONTAKTUPPGIFTER` → behåll
- `LÄNKAR (VALFRITT)` → behåll
- `ÖVRIGT` → behåll

### 1.3 Förbättrade hjälptexter under fält

**Yrkestitel/Rubrik (placeholder och hjälptext):**
- Placeholder: `t.ex. Undersköterska, Lagerarbetare, IT-tekniker`
- Hjälptext under fältet: `Den roll du söker eller har — den syns under ditt namn på CV:t.`

**Telefon — hjälptext:**
- `Med riktnummer, t.ex. 070-123 45 67`

**E-postadress — hjälptext:**
- `Använd en privat adress du har koll på — inte din nuvarande arbetsmejl.`

**Ort/Stad — hjälptext:**
- `Räcker med stad — du behöver inte skriva hela adressen.`

### 1.4 Validerings-meddelanden (förbättrade)

| Trigger | Meddelande |
|---|---|
| Förnamn tomt | `Skriv ditt förnamn — det är det första rekryteraren ser.` |
| Efternamn tomt | `Skriv ditt efternamn.` |
| Telefon tomt | `Telefon behövs så arbetsgivaren kan höra av sig.` |
| Telefon för kort | `Numret ser kort ut — kontrollera att det är komplett.` |
| E-post saknar @ | `E-postadressen saknar @-tecken.` |
| E-post saknar domän | `E-postadressen saknar domän (det som kommer efter @).` |
| URL ogiltig | `Länken ser inte rätt ut — kontrollera att den börjar med https://` |

---

## 2. Steg 2 — Profiltext

**Komponent:** `components/cv-form/ProfileTextStep.tsx` (eller motsvarande).

### 2.1 Huvudrubrik och underrubrik

**Befintlig huvudrubrik:** `Profiltext`

**Lägg till som synlig underrubrik:**
```
Skriv kort om dig själv — vem du är, vad du kan, vart du är på väg
```

### 2.2 Hjälptext över textarean (ersätter befintlig)

**Befintligt:** "Skriv 3–5 meningar om vem du är, vad du kan och vad du söker. Rekryterare läser detta först."

**Behåll** — den är bra. Om Lisa vill mjuka upp den, alternativ:
```
3–5 meningar räcker. Rekryteraren läser detta först — så låt det vara
det viktigaste om dig.
```

### 2.3 AI-knapp och relaterad text

**Befintlig knapp:** `Generera förslag` med tagg "Förslag på CV-tips · prompt under utveckling"

**Ändringar:**
- Tagg "prompt under utveckling" tas bort när AI_PROMPTS_v1.md är implementerad
- Knapptext behålls: `Generera förslag`
- Lägg till hjälptext under knappen (liten, gråare):
  ```
  AI:n använder det du redan fyllt i som underlag. Du kan ändra fritt efteråt.
  ```

### 2.4 Meddelande efter AI-generering

När texten är genererad och förfylld i textarean, visa ovanför textarean:
```
Ett utkast — använd det på ditt sätt. Ändra, lägg till, ta bort.
Det här är utgångspunkten, inte slutprodukten.
```

### 2.5 [TIPS]-meddelande från AI

När AI returnerar `[TIPS]`-svar, visa det utan `[TIPS]`-prefixet i ett mjukare sammanhang:
```
[ikon: glödlampa eller liknande] {meddelandetext från AI}
```

### 2.6 Validerings-meddelanden

Befintlig orange varning ("Din profiltext verkar inte beskriva din bakgrund...") ersätts med specifika regler. Visa **endast den första som triggar**:

| Trigger | Meddelande |
|---|---|
| Text < 20 ord | `Bra start. Sikta på minst 3 meningar — då hinner du säga vem du är, vad du kan, och vart du är på väg.` |
| Text > 200 ord | `Profiltexten är lite lång. Rekryteraren scannar den på några sekunder — sikta på 3–5 meningar.` |
| Innehåller "jag heter" eller "mitt namn är" | `Ditt namn står redan högst upp i CV:t — börja gärna direkt med din yrkesroll.` |
| Innehåller ≥ 2 klyschor utan verb i dåtid eller siffror i samma stycke | `Ord som "driven" och "lösningsorienterad" säger inte så mycket — de står i nästan alla CV:n. Visa det istället: vad har du gjort som bevisar det?` |
| Saknar verb i grundform/dåtid (i lista nedan) | `Texten beskriver vem du är, men säger lite om vad du gör. Lägg till en mening om något du faktiskt gjort — börja gärna med ett verb som "ledde", "byggde" eller "ansvarade för".` |

**Verb-lista för detektion (samma som i Lisas Handledarguide_CV_Parovning):**
```
ledde, ansvarade, koordinerade, hanterade, rekryterade, planerade, drev,
organiserade, byggde, skapade, implementerade, utvecklade, etablerade,
digitaliserade, lanserade, moderniserade, löste, förbättrade, minskade,
ökade, effektiviserade, identifierade, analyserade, säkerställde,
presenterade, förhandlade, kommunicerade, utbildade, samarbetade,
representerade, övertygade, stöttade
```

**Regel:** visa endast en åt gången. Om flera triggar — visa den högst i listan ovan.

---

## 3. Steg 3 — Arbetslivserfarenhet

**Komponent:** `components/cv-form/ExperienceStep.tsx` (eller motsvarande).

### 3.1 Huvudrubrik och underrubrik

**Befintlig huvudrubrik:** `Arbetslivserfarenhet`

**Lägg till som synlig underrubrik:**
```
Lägg till de jobb som är mest relevanta för det du söker — du behöver
inte ta med allt.
```

### 3.2 Hjälptext för Beskrivning-fältet (förbättrad)

**Befintlig placeholder:** "Beskriv dina arbetsuppgifter och resultat..."

**Ny version:**
```
Berätta vad du gjorde — och om möjligt vad det ledde till. Använd gärna
en punktlista. Börja varje punkt med ett verb i dåtid: "ledde", "byggde",
"hanterade".

Exempel:
• Hanterade 40+ kundsamtal per dag och eskalerade ärenden vid behov
• Ledde introduktionen av tre nya kollegor till rutinerna
```

(Visa exemplet som dimmad text i fältet, alternativt som expanderbar "Visa exempel"-länk under.)

### 3.3 AI-knapp "Förbättra"

**Befintlig knapp:** `Förbättra` med tagg "Förslag på CV-tips · under utveckling"

**Ändringar:**
- Tagg tas bort när AI_PROMPTS_v1.md är implementerad
- Knapptext: behåll `Förbättra` (alternativt `Få förslag på 3 punkter`)
- Hjälptext under knappen:
  ```
  AI:n omformulerar din text till 3 punkter med starka verb. Du behåller
  rätten att ändra eller behålla original.
  ```

### 3.4 Meddelande efter AI-generering

```
Tre punkter — använd dem som utgångspunkt. Du kan redigera, kombinera
eller hoppa över dem helt.
```

### 3.5 Validerings-meddelanden

| Trigger | Meddelande |
|---|---|
| Jobbtitel tomt | `Skriv en jobbtitel — det är så rekryteraren känner igen rollen.` |
| Arbetsgivare tomt | `Skriv arbetsgivarens namn.` |
| Startdatum tomt | `Vilken månad och år började du?` |
| Slutdatum före startdatum | `Slutdatum kan inte vara innan startdatum — kontrollera datumen.` |
| Inget slutdatum och inte "Jobbar här nu" | `Sätt ett slutdatum eller kryssa i "Jobbar här nu".` |
| Beskrivning tom | (mjuk varning) `Lägg gärna till några rader om vad du gjorde — det stärker rollen markant.` |
| Beskrivning saknar verb | (mjuk varning) `Beskrivningen säger lite om vad du faktiskt gjorde. Lägg till en mening som börjar med ett verb i dåtid.` |

### 3.6 Lägg till-knapp

**Befintlig:** `+ Lägg till erfarenhet`

**Behåll** — den är tydlig.

**Lägg till hjälptext för förstagångsanvändare** (visas bara när ingen erfarenhet finns ännu):
```
Inget jobb ännu? Börja med det senaste eller mest relevanta. Du kan lägga
till fler senare.
```

---

## 4. Steg 4 — Utbildning

**Komponent:** `components/cv-form/EducationStep.tsx` (eller motsvarande).

### 4.1 Huvudrubrik och underrubrik

**Befintlig huvudrubrik:** `Utbildning`

**Lägg till som synlig underrubrik:**
```
Skola, kurser, yrkesutbildningar — det som är relevant för det du söker.
```

### 4.2 Hjälptext för Kort beskrivning-fältet

**Befintlig placeholder:** "t.ex. inriktning, examensarbete..."

**Förbättrad version:**
```
t.ex. inriktning, examensarbete, kurser som matchar tjänsten du söker
```

### 4.3 Validerings-meddelanden

| Trigger | Meddelande |
|---|---|
| Skola/Organisation tomt | `Skriv namnet på skolan eller utbildningsanordnaren.` |
| Program/Utbildning tomt | `Skriv vad du läste — programnamn eller kurs.` |
| Startår tomt | `Vilket år började du?` |
| Slutår före startår | `Slutåret kan inte vara innan startåret — kontrollera årtalen.` |
| Inget slutår och inte "Studerar här nu" | `Sätt ett slutår eller kryssa i "Studerar här nu".` |

### 4.4 Lägg till-knapp och hjälptext

**Befintlig:** `+ Lägg till utbildning`

**Hjälptext för förstagångsanvändare** (när ingen utbildning finns ännu):
```
Ingen formell utbildning? Det är OK — kortare kurser, körkort eller
yrkescertifikat kan också räknas. Lägg till det som är relevant.
```

---

## 5. Steg 5 — Kunskaper & Färdigheter

**Komponent:** `components/cv-form/SkillsStep.tsx` (eller motsvarande).

### 5.1 Huvudrubrik och underrubrik

**Befintlig huvudrubrik:** `Kunskaper & Färdigheter`

**Lägg till som synlig underrubrik:**
```
Det du är bra på — verktyg, system, språk och allt däremellan.
```

### 5.2 Hjälptext över sektionen

```
Tänk på vad arbetsgivare i din bransch faktiskt letar efter. Konkreta
färdigheter ("Excel", "Truckkort B", "Pedagogisk handledning") slår
generella ord ("ansvarstagande", "lagspelare").
```

### 5.3 AI-knapp "Föreslå med AI"

**Befintlig knapp:** `Föreslå med AI` med tagg "Förslag på CV-tips · prompt under utveckling"

**Ändringar:**
- Tagg tas bort när AI_PROMPTS_v1.md är implementerad
- Knapptext: behåll `Föreslå med AI`
- Hjälptext under knappen:
  ```
  AI:n föreslår 6 kompetenser baserat på dina jobb och utbildningar.
  Välj de som faktiskt stämmer in på dig.
  ```

### 5.4 Meddelande efter AI-generering

```
Sex förslag baserat på din erfarenhet. Klicka för att lägga till det
som stämmer — och hoppa över det som inte gör det.
```

### 5.5 Validerings-meddelanden

| Trigger | Meddelande |
|---|---|
| Kompetens-namn tomt | `Skriv namnet på färdigheten.` |
| ≥ 3 generiska klyschor utan kontext (driven, lagspelare osv.) | `Flera av dina färdigheter är väldigt allmänna. Försök ersätta dem med konkreta kompetenser — t.ex. specifika verktyg, metoder eller system du jobbat med.` |

### 5.6 Sektion: Språk

**Befintlig rubrik:** `Språk valfritt`

**Lägg till hjälptext under rubriken:**
```
Inkludera de språk du faktiskt kan använda i jobbet. Var ärlig om nivån.
```

### 5.7 Sektion: Hobbies & Intressen

**Befintlig rubrik:** `Hobbies & Intressen valfritt`

**Lägg till hjälptext:**
```
Bara om det säger något relevant om dig — t.ex. förtroendeuppdrag eller
intressen som kopplar till jobbet du söker.
```

### 5.8 Sektion: Volontärarbete

**Befintlig rubrik:** `Volontärarbete valfritt`

**Lägg till hjälptext:**
```
Volontärarbete räknas som arbetslivserfarenhet — särskilt om du bytt bransch
eller har en lucka i CV:t.
```

---

## 6. NY sektion — Helhets-CV-feedback

**Ny komponent:** föreslagen filnamn `components/cv-form/CVFeedbackStep.tsx` eller integrerad i `Step6Polish.tsx`. Lisa beslutar slutlig placering.

### 6.1 Huvudrubrik och underrubrik

**Huvudrubrik:**
```
En sista koll innan du skickar
```

**Underrubrik:**
```
När du känner dig klar — be om en ärlig genomgång av hela ditt CV.
```

### 6.2 Beskrivande text under rubriken

```
Du får några konkreta saker att titta på. Inget mer, inget mindre.
Du är experten på dig själv och din bransch — använd punkterna som en
checklista, inte ett facit.
```

### 6.3 Knapptext

```
Få ärlig feedback på mitt CV
```

### 6.4 Hjälptext under knappen

```
Det är du som väljer vad som faktiskt ska stå i ditt CV — och det är
ditt ansvar att kontrollera att det stämmer.
```

### 6.5 Loading-state

```
Läser igenom ditt CV…
```

### 6.6 När feedbacken visas

**Rubrik över bulletpoints:**
```
Här är vad som är värt att titta på
```

**Pedagogisk inramning som alltid visas under bulletpoints:**
```
Du är experten på dig själv och din bransch. AI:n ser mönster och
formuleringar — den ser inte vem du är. Använd punkterna ovan som en
checklista, inte som ett facit. Det är du som sätter pricken över i:et.
```

**Knappar i botten:**
- Primär: `Kopiera feedbacken`
- Sekundär: `Stäng`

### 6.7 [TIPS]-svar

Visa AI:s `[TIPS]`-meddelande utan prefixet, i samma kort där feedback annars hade legat. Endast en `Stäng`-knapp.

### 6.8 Felmeddelande

Standard svensk text vid timeout/fel:
```
Jag hänger inte med just nu — försök igen om en stund.
```

---

## 7. Globala texter

### 7.1 Gästläges-banner (befintlig)

**Befintlig:** "Du använder gästläge — ditt CV sparas inte. Allt försvinner om du stänger webbläsaren. Skapa ett gratis konto för att spara ditt CV."

**Status:** Login är temporärt avstängd enligt PRD v1.3. När den är på igen — behåll texten. Under beta — överväg att ta bort "Skapa ett gratis konto"-länken eller dimma den.

### 7.2 AI-toggle (existerande komponent)

**Knapptext (när AI är AV):** `Slå på AI-hjälp`
**Knapptext (när AI är PÅ):** `Stäng av AI-hjälp`

**Hjälptext under toggle (visa endast första gången på en session):**
```
AI hjälper dig formulera profiltext, beskrivningar och kompetenser.
Du har alltid sista ordet — och AI är ett verktyg, inte en facit.
```

### 7.3 Disclaimer i footer (lägg till om inte redan finns)

```
AI-genererat innehåll är ett förslag — inte en garanti. Du ansvarar
själv för att kontrollera och välja vad som ska stå i ditt CV.
```

(Detta speglar Coachgruppens ansvarsfriskrivning men skrivet i din ton.)

---

## 8. Acceptanskriterier för UI-copy

- [ ] Alla 5 stegrubriker har en synlig vardagsspråk-underrubrik
- [ ] Alla validerings-meddelanden är specifika och åtgärdsinriktade (inte "Invalid input")
- [ ] Klyscha-validering på Steg 2 triggar inte vid kontextuella klyschor (verb eller siffra i samma stycke)
- [ ] AI-genererad copy har "ett utkast"-meddelande över textarean
- [ ] Helhets-feedback har den pedagogiska inramningen synlig under bulletpoints
- [ ] Felmeddelanden är på svenska och säger vad användaren ska göra
- [ ] Tonen genom hela appen är jordnära — inga utropstecken, inget marknadsföringsspråk

---

**Slut på copy-spec.** Kompletteras av: `AI_PROMPTS_v1.md`, `UX_PATTERNS_v1.md`, `PRD_v1.4_DELTA.md`.
