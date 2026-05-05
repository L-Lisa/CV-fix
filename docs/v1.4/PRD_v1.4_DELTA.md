# PRD_v1.4_DELTA.md — Förslag på PRD-uppdatering

**Format:** Detta dokument innehåller exakt det som ska klistras in i PRD.md vid bumpen från v1.3 till v1.4. Lisa använder det som kopiera-och-anpassa-mall.

**Författare:** Lisa (Jobblink AB) i samarbete med Claude.
**Datum för förändring:** 2026-05-05.
**Mappar mot:** PRD.md v1.3 → v1.4.

---

## Versionshuvud — uppdatera så här

**Befintligt (v1.3):**
> **Version:** 1.3 **Status:** Aktiv – MVP shippad 2026-03-15. AI-assistans tillagd som scope-utökning 2026-03-15 → 2026-03-20. Beta-testperiod startar 2026-05-05 (inloggning tillfälligt avstängd i UI; "Starta utan konto" är primär ingång). **Senast uppdaterad:** 2026-05-05

**Nytt (v1.4):**
> **Version:** 1.4 **Status:** Aktiv – beta-testperiod pågår. AI-assistans utökad med helhets-CV-feedback (avsnitt 15.5) och uppdaterade prompt-regler (avsnitt 15.2). **Senast uppdaterad:** 2026-05-05

**Lägg till i Historik-blocket:**
```
- v1.3 → v1.4 (2026-05-05): AI-prompts uppgraderade — utökad forbidden-lista,
  klyscha-regeln blev kontextuell (klyschor tillåts om bevis i samma mening),
  ny endpoint /api/ai/cv-feedback för helhets-CV-granskning. Öppen fråga
  i §14 om opt-in/opt-out för AI-toggle stängd: opt-in behålls som default.
```

---

## Förändring 1 — §15.1 utökas med en femte AI-funktion

**Lägg till denna rad i tabellen i §15.1:**

| # | Funktion | Endpoint | Input | Output | Var i UI |
| --- | --- | --- | --- | --- | --- |
| 5 | Helhets-CV-feedback | `POST /api/ai/cv-feedback` | `cvId` ELLER `guestData` + språk | JSON-array med 3–5 feedback-punkter, eller `[TIPS]`-meddelande om CV:t är för tunt | Steg 6 (Finputsning & ATS-check) eller egen sektion efter Steg 5 |

**Notering att lägga till efter tabellen:**

> Helhets-feedbacken läser hela CV:t och returnerar 3–5 specifika observationer + förslag. Den är pedagogiskt designad: bulletpoints följs alltid av en inramning som påminner deltagaren att "AI:n ser mönster och formuleringar — den ser inte vem du är". Inga "Ersätt automatiskt"-knappar — deltagaren tar feedbacken och redigerar själv.

---

## Förändring 2 — §15.2 (Designprinciper) uppdateras

**Befintlig text om förbjudna ord:**

> **Förbjudna ord/fraser i prompts:** Vi blockerar fluffiga buzz-ord (driven, social, flexibel, passionerad, etc.) i profil-prompten för att undvika generisk text som rekryterare ratar.

**Ersätt med:**

> **Klyscha-regel (kontextuell):** Vi har en utökad lista med fluffiga buzz-ord (driven, lösningsorienterad, lagspelare, flexibel, engagerad, passionerad, ansvarstagande, motiverad, självgående, social, strukturerad, noggrann, prestigelös, resultatinriktad, kommunikativ, innovativ, dynamisk, proaktiv, team player, self-starter — full lista finns i `AI_PROMPTS_v1.md`).
>
> Reglen är **kontextuell, inte absolut**: orden får användas om deltagaren själv har gett ett konkret bevis i samma mening. "Driven av att lösa kniviga kundärenden" är OK. "Driven" ensamt är inte. Pedagogiskt rättare än absolut blockering — och tillåter goda formuleringar att passera utan att bygga generisk text.

**Lägg till två nya principer (efter "Felmeddelanden på svenska"):**

> - **AI-output är alltid ett utkast:** UI:t visar alltid ett "ett utkast — använd det på ditt sätt"-meddelande direkt vid AI-genererat innehåll. Ingen automatisk ersättning av deltagarens text utan deltagarens aktiva val.
> - **AI-toggle förblir opt-in (default = av):** Vi har övervägt opt-out i §14 och valt att **behålla opt-in**. Tre skäl: AI kostar pengar, AF varnar uttryckligen för rena AI-genererade CV-texter, och pedagogiskt rätt — deltagaren ska aktivt välja AI som verktyg, inte bli överrumplad.

---

## Förändring 3 — §15.3 (Säkerhetsmodell) utökas

**Lägg till efter befintliga punkter:**

> - Helhets-CV-feedback följer samma säkerhetsmodell som övriga endpoints: inloggad jobbsökare verifieras via `auth.getUser()` + ägarskap genom `getFullCV(cvId)`. Gäst-flödet skickar `guestData` direkt — ingen `cvId`-lookup, ingen DB-access. Coach har INTE åtkomst till helhets-feedback i v1 (kan utvärderas senare för coach-driven granskning).

---

## Förändring 4 — §15.4 (Datamodell-konsekvenser) uppdateras

**Befintlig text:**

> Inga. AI är stateless: ingen ny tabell, ingen kolumnändring. Förslag visas i UI och användaren accepterar/avvisar manuellt. Eventuell historik (vad användaren accepterade) är en V1.1-fråga (se avsnitt 14).

**Behåll oförändrad** — gäller även för helhets-feedback. Ingen ny tabell behövs.

---

## Förändring 5 — Ny §15.5 läggs till

**Lägg till som nytt underavsnitt:**

### 15.5 Helhets-CV-feedback (`/api/ai/cv-feedback`)

**Status:** Levererad i v1.4. **Modell:** Samma `claude-sonnet-4-6`. **Aktivering:** Synlig som knapp i Steg 6 (Finputsning), aktiv när CV:t har minst grundläggande personuppgifter + en av profil/erfarenhet/utbildning ifylld.

**Funktion:** Deltagaren klickar "Få ärlig feedback på mitt CV". AI:n läser hela CV-data-objektet och returnerar 3–5 konkreta observationer i JSON-format. Varje observation har:

```typescript
{
  point: string  // "Konkret observation + förslag (max 2 meningar)"
  section: 'profile' | 'experience' | 'education' | 'skills' | 'general'
}
```

**Pedagogisk inramning:** Under bulletpointsen visas alltid texten:

> *"Du är experten på dig själv och din bransch. AI:n ser mönster och formuleringar — den ser inte vem du är. Använd punkterna ovan som en checklista, inte som ett facit. Det är du som sätter pricken över i:et."*

**UI-knappar:** Endast `Kopiera feedbacken` och `Stäng`. INGEN "Ersätt automatiskt"-knapp — deltagaren ska aktivt redigera sitt CV själv baserat på feedbacken.

**`[TIPS]`-fall:** Returneras om CV:t är nästan helt tomt eller innehåller uppenbar nonsens. Standardmeddelande: *"Det här CV:t verkar inte komplett. Fyll i lite mer innehåll så hjälper jag gärna till med en granskning."*

**Säkerhet:** Ärver hela mönstret från övriga AI-endpoints. Ägarskap verifieras före anrop. Rate limit delas med övriga AI-routes (samma `AI_HOURLY_LIMIT = 50` per användare).

**Forbidden-lista:** Helhets-feedbacken får (och ska) flagga klyschor från forbidden-listan om de förekommer i CV:t utan kontextuellt bevis. Det är en av de viktigaste sakerna deltagaren får feedback på.

---

## Förändring 6 — §14 (Öppna frågor) uppdateras

**Markera följande punkt som stängd (lägg [x] istället för [ ]):**

> [x] Ska AI-toggle vara opt-in eller opt-out som default?

**Lägg till stängningsanteckning under listan:**

> **Stängd 2026-05-05:** Opt-in behålls som default. Skäl: AI kostar pengar, AF varnar uttryckligen för rena AI-genererade CV-texter, pedagogiskt rätt — deltagaren ska aktivt välja AI som verktyg. Beslutet dokumenterat i §15.2.

**Behåll övriga öppna frågor oförändrade.**

**Lägg till en ny öppen fråga (sist i listan):**

> [ ] Helhets-CV-feedback för coach-vyn — ska coach kunna trigga AI-feedback på en deltagares CV inom ramen för `coach_links`-relation? Inte i v1.4 — utvärderas efter beta-data.

---

## Förändring 7 — §5 (MVP-scope) uppdateras

**Under "➕ Tillägg utöver MVP – levererad", lägg till en ny rad:**

> - Helhets-CV-feedback (avsnitt 15.5) — levererad 2026-05-XX

(Datum fylls i när Cursor är klar med implementeringen och feature är pushad.)

---

## Förändring 8 — Detaljreferens till externa dokument

**Lägg till längst ner i §15 (efter §15.5):**

> ### 15.6 Detaljerad implementeringsreferens
>
> Följande dokument utgör implementeringsspec för v1.4-uppgraderingen:
>
> - `AI_PROMPTS_v1.md` — komplett prompt-text för alla 5 AI-endpoints, inklusive utökad forbidden-lista och kontextuell klyscha-regel
> - `UI_COPY_v1.md` — all UI-copy per CV-steg, inklusive helhets-feedback
> - `UX_PATTERNS_v1.md` — återanvändbara UX-mönster (en sak åt gången, vardagsspråk, "hur fungerar det här?", AI-utkast-meddelande)
>
> Dokumenten bygger på och respekterar befintlig PRD §15-arkitektur. De ändrar inga låsta beslut (modell, opt-in, säkerhetsmodell, rate limit).

---

## Acceptanskriterier för PRD-uppdatering

- [ ] Versionshuvud är bumpad till v1.4
- [ ] Historik-block har ny rad om v1.3 → v1.4
- [ ] §15.1-tabellen har en femte rad för helhets-CV-feedback
- [ ] §15.2 har den kontextuella klyscha-regeln + två nya principer
- [ ] §15.3 har säkerhetsnotering om cv-feedback
- [ ] §15.5 finns som nytt underavsnitt
- [ ] §14 har opt-in-frågan stängd och ny öppen fråga om coach-feedback
- [ ] §5 har en ny rad under "Tillägg utöver MVP"
- [ ] §15.6 refererar till de tre kompanjons-dokumenten

---

## Commit-format för PRD-uppdateringen

Enligt WORKFLOW.md använder repot Conventional Commits:

```
docs: bump PRD to v1.4 with cv-feedback endpoint and prompt upgrade

- Add /api/ai/cv-feedback to §15.1 table
- Make klyscha-rule contextual (allow with proof in same sentence)
- Expand forbidden-list (full list in AI_PROMPTS_v1.md)
- Close §14 question on opt-in vs opt-out (decision: keep opt-in)
- Add §15.5 with full cv-feedback spec
- Reference companion docs in new §15.6
```

---

**Slut på PRD-delta.** Kompletteras av: `AI_PROMPTS_v1.md`, `UI_COPY_v1.md`, `UX_PATTERNS_v1.md`.
