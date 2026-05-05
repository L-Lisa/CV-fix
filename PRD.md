# PRD – CV-byggare för jobbcoacher (Rusta och Matcha)
**Version:** 1.4
**Status:** Aktiv – beta-testperiod pågår. AI-assistans utökad med helhets-CV-feedback (avsnitt 15.5) och uppdaterade prompt-regler (avsnitt 15.2).
**Senast uppdaterad:** 2026-05-06

> **Historik**
> - v1.0 → v1.1 (2026-03-14): MVP-scope låst.
> - v1.1 → v1.2 (2026-05-04): MVP markerad som levererad. AI-assistans (avsnitt 15) dokumenterad som scope-utökning utöver original-MVP. Tech stack (avsnitt 4) uppdaterad med Anthropic SDK. Öppna frågor (avsnitt 14) ompröade.
> - v1.2 → v1.3 (2026-05-05): Layout 4 (Harvard / Ivy League) tillagd. Beta-testperiod inledd: inloggning och kontoregistrering tillfälligt avstängda i UI, koden ligger kvar bakom dimmade CTA:er. Guest-flödet ("Starta utan konto") är permanent förstaval — bug i middleware som omdirigerade `/cv/guest` till `/login` är åtgärdad.
> - v1.3 → v1.4 (2026-05-06): AI-prompts uppgraderade — utökad forbidden-lista, klyscha-regeln blev kontextuell (klyschor tillåts om bevis i samma mening), ny endpoint `/api/ai/cv-feedback` för helhets-CV-granskning. Öppen fråga i §14 om opt-in/opt-out för AI-toggle stängd: opt-in behålls som default. UI-copy uppdaterad med vardagsspråk-underrubriker per CV-steg och åtgärdsinriktade Zod-meddelanden.

---

## 1. Vision

Bygga ett enkelt, tryggt och professionellt CV-verktyg primärt för deltagare inom Rusta och Matcha-programmet – men tillgängligt för alla jobbsökare – som:

- Leder användaren steg för steg genom ett strukturerat formulär
- Genererar ATS-säkra CV:n på svenska eller engelska
- Ger coachen möjlighet att se, kommentera och redigera deltagarnas CV:n
- Fungerar för alla digitala mognadsnivåer, inklusive nyanlända och lågdigitala användare

---

## 2. Målgrupper

### 2.1 Primär – Jobbsökare / Deltagare
- Alla nivåer: ungdomar, nyanlända, yrkesarbetare, akademiker
- Varierande digital mognad – gränssnittet ska fungera för en smartphone-ovan användare
- Behov: snabbt, begripligt, mobilvänligt, ATS-säkert

### 2.2 Sekundär – Jobbcoach
- Arbetar inom Rusta och Matcha eller liknande program
- Vill granska, kommentera och föreslå ändringar i deltagarnas CV:n
- Kopplas till deltagare via e-postinbjudan

### 2.3 Indirekt – Rekryterare
- Ska omedelbart förstå CV:t, hitta nyckelinformation
- Inga ATS-problem: standardiserade rubriker, ren layout, textbaserad PDF

---

## 3. Affärsmodell

**MVP-hypotes:** Gratisverktyg för deltagare. Coachen administrerar via sin organisation.
**Status:** Öppen fråga — se §14 (särskilt relevant nu när AI-anrop kostar).

---

## 4. Tech Stack (låst)

| Komponent | Val | Motivering |
|-----------|-----|------------|
| Frontend | Next.js 14 (App Router) | Server Components, API Routes, optimal Supabase-integration |
| Språk | TypeScript (strict) | Typsäkerhet, bättre Cursor/Claude-kodhjälp |
| Styling | Tailwind CSS + shadcn/ui | Snabb UI-utveckling, tillgängliga komponenter |
| Backend/DB | Supabase | Auth, RLS, realtid, PostgreSQL |
| PDF-export | React-PDF (via Next.js API Route) | Äkta textbaserad PDF – ATS-säker |
| Formulär | React Hook Form + Zod | Validering, typsäkerhet, prestanda |
| AI | Anthropic SDK (`@anthropic-ai/sdk`), modell `claude-sonnet-4-6` | Profil-, beskrivnings-, kompetens- och nyckelordsförslag (avsnitt 15) |
| Deployment | Vercel | Optimal Next.js-host |

---

## 5. MVP-scope (levererad 2026-03-15)

### ✅ Ingår i MVP – levererad
- Registrering / inloggning (Supabase Auth – e-post + lösenord, med `/auth/callback`)
- Gästläge (data lever i klienten, varning om att inget sparas)
- CV-formulär med alla 9 sektioner (se avsnitt 7)
- Live preview desktop / preview-knapp på mobil
- ATS-validering (röda hårda fel + gula rekommendationer)
- PDF-export (React-PDF, textbaserad, ATS-säker)
- Coach-dashboard: se kopplade deltagares CV:n + ATS-stats per kort
- Coach: kommentera per sektion
- Coach: redigera deltagarens CV direkt (per-sektion inline-edit)
- "Ändrad av coach"-indikation på CV-preview
- Coach-länkning: deltagaren anger coachens e-post vid registrering
- Landningssida med hero + CTA
- Accent-färgväljare och språk-toggle på preview-sidan

### ➕ Tillägg utöver MVP – levererad 2026-03-15 → 2026-03-20
- AI-assistans i CV-formulär (se avsnitt 15) – opt-in via toggle

### ➕ Tillägg utöver MVP – levererad 2026-05-06 (v1.4)
- Helhets-CV-feedback (avsnitt 15.5) — `/api/ai/cv-feedback`, synlig på preview-sidorna
- Uppgraderade AI-prompts med kontextuell klyscha-regel (avsnitt 15.2)
- `HowDoesThisWork`-mönster för transparens vid AI-funktioner (UX_PATTERNS §3)
- UI-copy med vardagsspråk-underrubriker per CV-steg (UI_COPY §1–§5)

### ❌ Skjuts till V1.1
- DOCX-export
- Spelifiering (XP, badges, progressbar)
- Inspiration-flik med miniutmaningar
- Snabba vägen (30-minutersläge)
- Mejla CV-funktion
- Magic Link-inloggning
- Avancerad versionshistorik

---

## 6. Användarresor

### 6.1 Jobbsökare – Standardresa

```
1. Landningssida
   → CTA: "Skapa CV" / "Starta utan konto"

2. Välj CV-språk
   → Svenska | English

3. (Skjuts till V1.1) Välj yrkesinriktning (valfritt)
   → IT/Tech | Vård/Omsorg | Handel/Service | Transport/Logistik
     Kontor/Admin | Ledarskap | Student/Ungdom | Annat
   → Ej implementerad i MVP. Se §14.

4. Formulärflöde (steg med tydlig progress)
   → Steg 1: Personuppgifter
   → Steg 2: Profiltext (hisspitch)
   → Steg 3: Arbetslivserfarenhet
   → Steg 4: Utbildning
   → Steg 5: Kunskaper & Färdigheter
   → Steg 6: Finputsning & ATS-check

5. Finputsning
   → Välj layout (1–4)
   → Förhandsvisning
   → ATS-check panel

6. Export
   → Ladda ner PDF
   → (Röda fel = knappar inaktiva med tooltip)

7. Skapa konto (frivilligt efter export)
   → Befintligt CV kopplas till kontot
```

### 6.2 Coachresa

```
1. Coach registrerar sig med roll = coach

2. Deltagare registrerar sig och anger coachens e-post
   → Systemet skapar coach_link automatiskt

3. Coach-dashboard
   → Lista deltagare (namn, senaste uppdatering, röda fel?, exporterat?)

4. Coach öppnar deltagarens CV
   → Läge "Kommentera": lägger kommentarer per sektion
   → Läge "Redigera": ändrar fältvärden direkt

5. Deltagaren ser
   → Kommentarer markerade + "Ändrad av coach"-indikation vid fält
```

### 6.3 Gästanvändare

- Ingen auth – data lever i localStorage med tydlig, framträdande varning
- Varning visas: vid start, vid varje steg, och extra tydligt vid export
- Möjlighet att skapa konto och spara befintligt CV i efterhand

---

## 7. CV-sektioner

| # | Sektion | Obligatorisk | Rubrik (SV) |
|---|---------|-------------|-------------|
| 1 | Personuppgifter | ✅ | – (visas alltid överst) |
| 2 | Profiltext | ✅ | Profil |
| 3 | Arbetslivserfarenhet | Villkorlig* | Arbetslivserfarenhet |
| 4 | Utbildning | Villkorlig* | Utbildning |
| 5 | Kunskaper & Färdigheter | ❌ | Kunskaper |
| 6 | Språk | ❌ | Språk |
| 7 | Hobbies & Intressen | ❌ | Intressen |
| 8 | Volontärarbete | ❌ | Volontärarbete |
| 9 | Övrigt | ❌ | Övrigt |

*Minst ett av (3) eller (4) måste finnas. Undantag: användaren kryssar "Jag saknar arbetslivserfarenhet" → endast utbildning räcker.

### 7.1 Fältspecifikation per sektion

**Personuppgifter**
- Förnamn*, Efternamn*
- Yrkestitel/Rubrik
- Telefon*, E-post*
- Ort/Stad, Region
- LinkedIn-URL, GitHub-URL, Portfolio-URL, Annan URL
- Körkort (text eller dropdown)
- Foto (photo_url) – valfritt, designat för layout 2 och 3 (uppladdnings-UI implementeras i V1.1, se §14 "Fotouppladdning"). Databaskolumnen finns redan.

**Profiltext**
- Fritext, rekommenderat 3–5 meningar

**Arbetslivserfarenhet** (upprepningsbar)
- Jobbtitel*, Arbetsgivare*, Stad, Land
- Startmånad/år*, Slutmånad/år / "Pågående"*
- Beskrivning (textfält → punktlista i rendering)
- Typ: Jobb | Praktik | Sommarjobb | Volontär

**Utbildning** (upprepningsbar)
- Skola*, Program/Utbildning*
- Nivå: Gymnasium | YH | Högskola | Kurs | Annat
- Startår*, Slutår / "Pågående"*
- Kort beskrivning (valfritt)

**Kunskaper & Färdigheter** (upprepningsbar)
- Kategori: Tekniska | Språk | Övriga
- Namn*, Nivå (1–5 eller text)

**Språk** (upprepningsbar)
- Språk*, Nivå: Modersmål | Flytande | God | Grundläggande

**Hobbies & Intressen**
- Fritext eller taggar

**Volontärarbete** (upprepningsbar)
- Roll*, Organisation*
- Startår*, Slutår / "Pågående"*
- Beskrivning

**Övrigt**
- Fritext eller etikett + text

---

## 8. Layouter

| Layout | Beskrivning | ATS-säker | Foto |
|--------|-------------|-----------|------|
| 1 | Enkel svartvit, en kolumn | ✅ | ❌ |
| 2 | En kolumn med valbar accentfärg | ✅ | ✅ (valfritt) |
| 3 | Utökad med extra sektioner, en kolumn | ✅ | ✅ (valfritt) |
| 4 | Harvard / Ivy League — centrerad rubrik, Times-serif, svartvit | ✅ | ❌ |

**Kritisk regel:** Alla layouter renderas som en-kolumns-PDF. Visuell styling (färg, typografi) appliceras men strukturen förblir ATS-säker. Ingen tvåkolumns-layout i MVP.

---

## 9. ATS-validering

### 9.1 Hårda (röda) fel – BLOCKERAR export

| # | Regel |
|---|-------|
| 1 | Namn saknas (förnamn eller efternamn) |
| 2 | Ogiltig e-post (ingen @, saknad domän, whitespace) |
| 3 | Telefon tomt eller orimligt kort |
| 4 | Profiltext tom |
| 5 | Varken erfarenhet eller utbildning ifylld |
| 6 | Slutdatum före startdatum |
| 7 | Både start och slut tomma på en post |
| 8 | Angiven URL passerar inte URL-validering |

**Effekt:** Röda fel visas i ATS-panelen och vid respektive fält. Exportknappar inaktiva med tooltip som förklarar varför.

### 9.2 Mjuka (gula) rekommendationer – STOPPAR INTE export

- CV längre än 2 sidor
- Profil för kort (< 2 meningar) eller för lång (> 6 meningar)
- Erfarenhetsposter utan beskrivning
- Utbildning utan nivå eller slutår
- Oprofessionell e-postadress
- Långa luckor i kronologin (> 12 månader oförklarade)
- Mycket långa textblock utan punktlista

---

## 10. Coach-funktioner (MVP)

- Coach ser lista av deltagare kopplade via `coach_links`
- Dashboard visar: namn, senaste uppdatering, röda fel kvar, exporterat (ja/nej)
- I CV-vyn: växla mellan "Kommentera" och "Redigera"
- Kommentarer knyts till sektion eller specifik rad
- Deltagarens UI visar: kommentarer markerade, "Ändrad av coach"-indikation
- Säkerhet: coach har BARA åtkomst via `coach_links`-relation (Supabase RLS)

---

## 11. Datamodell (Supabase)

```sql
-- Användarprofiler
profiles (
  id uuid references auth.users primary key,
  role text check (role in ('user', 'coach', 'admin')) default 'user',
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

-- CV-dokument
cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null default 'Mitt CV',
  language text check (language in ('sv', 'en')) default 'sv',
  layout int check (layout in (1, 2, 3)) default 1,
  accent_color text default '#000000',
  status text check (status in ('draft', 'complete')) default 'draft',
  has_been_exported boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references profiles(id)
)

-- Personuppgifter
cv_personal_info (
  cv_id uuid references cvs(id) on delete cascade primary key,
  first_name text,
  last_name text,
  headline text,
  phone text,
  email text,
  city text,
  region text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  other_url text,
  driving_license text,
  photo_url text
)

-- Profiltext
cv_profile (
  cv_id uuid references cvs(id) on delete cascade primary key,
  summary text
)

-- Arbetslivserfarenhet
cv_experiences (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid references cvs(id) on delete cascade,
  job_title text,
  employer text,
  city text,
  country text,
  start_month int,
  start_year int,
  end_month int,
  end_year int,
  is_current boolean default false,
  description text,
  type text check (type in ('job', 'internship', 'summer', 'volunteer')),
  sort_order int default 0
)

-- Utbildning
cv_educations (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid references cvs(id) on delete cascade,
  institution text,
  program text,
  level text check (level in ('gymnasium', 'yh', 'hogskola', 'kurs', 'annat')),
  start_year int,
  end_year int,
  is_current boolean default false,
  description text,
  sort_order int default 0
)

-- Kunskaper
cv_skills (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid references cvs(id) on delete cascade,
  category text check (category in ('technical', 'language', 'other')),
  name text,
  level int check (level between 1 and 5),
  sort_order int default 0
)

-- Språk
cv_languages (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid references cvs(id) on delete cascade,
  language text,
  level text check (level in ('native', 'fluent', 'good', 'basic')),
  sort_order int default 0
)

-- Hobbies
cv_hobbies (
  cv_id uuid references cvs(id) on delete cascade primary key,
  text text
)

-- Volontärarbete
cv_volunteering (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid references cvs(id) on delete cascade,
  role text,
  organisation text,
  start_year int,
  end_year int,
  is_current boolean default false,
  description text,
  sort_order int default 0
)

-- Övrigt
cv_other (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid references cvs(id) on delete cascade,
  label text,
  text text,
  sort_order int default 0
)

-- Coach-deltagare-koppling
coach_links (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(coach_id, user_id)
)

-- Kommentarer från coach
cv_comments (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid references cvs(id) on delete cascade,
  coach_id uuid references profiles(id),
  section_type text not null,
  item_id uuid,
  comment text not null,
  is_resolved boolean default false,
  resolved_at timestamptz,
  created_at timestamptz default now()
)
```

---

## 12. Projektstruktur (Next.js 14)

Den auktoritativa, aktuella layouten finns i `CLAUDE.md` → "Project Structure". Sammanfattning:

```
/app
  /(auth)/login | /register                        → Supabase Auth
  /(app)/dashboard                                 → användarens CV-lista
  /(app)/cv/new                                    → CV-skapande
  /(app)/cv/[id]/edit + /[step]                    → formulärflöde
  /(app)/cv/[id]/preview                           → fullscreen preview
  /(app)/coach/dashboard                           → kopplade deltagare
  /(app)/coach/cv/[id]                             → kommentera / redigera
  /(app)/coach/participant/[userId]                → deltagaröversikt
  /(guest)/cv/guest + /[step] + /preview           → gästflöde (localStorage)
  /auth/callback                                   → email-bekräftelse
  /api/cv/[id]/pdf, /cv/guest/pdf                  → React-PDF export
  /api/ai/profile | /description | /skills | /keywords
                                                   → AI-assistans (§15)

/components/cv-form, /cv-preview, /cv, /coach, /pdf, /guest, /auth, /ui

/lib
  /supabase    → browser/server clients + middleware
  /actions     → Server Actions (auth, cv, coach, guest)
  /queries     → Server-side reads
  /ai          → rate-limit + input-cap helpers
  /pdf         → React-PDF templates
  /ats         → ATS-validering (§9)
  /validation  → Zod schemas
  /guest       → localStorage helpers

/supabase/migrations/    → en fil per ändring (YYYYMMDD_*.sql)
/types/index.ts          → ALLA app-typer
/types/database.ts       → genererad av Supabase CLI (rör inte manuellt)
```

**Notera:** Coach–deltagar-länkning är en Server Action (`lib/actions/coach.ts`), inte en API-route. Tidigare versioner av detta dokument visade ett `/api/coach/link/route.ts` som aldrig implementerats.

---

## 13. Icke-funktionella krav

- **Responsivt, mobil-först** – fungerar på smartphone med liten skärm
- **Tillgänglighet** – WCAG AA: labels, kontrast, tangentbordsnavigering
- **Prestanda** – formulärsteg laddas snabbt, ingen tung initial bundle
- **Säkerhet** – Supabase RLS på ALLA tabeller, coach har BARA åtkomst via coach_links
- **Språk** – svenska eller engelska

---

## 14. Öppna frågor (att besluta i V1.1)

- [ ] Affärsmodell och betalvägg (särskilt relevant nu när AI-anrop kostar)
- [ ] Yrkesinriktningsval i flödet (§6.1 steg 3) — pre-fill defaults baserat på vald bransch
- [ ] Rate limiting / kvot per användare för AI-endpoints (delvis löst 2026-05-04: 50/h via `lib/ai/rate-limit.ts`; återstår: telemetri och eventuell rollbaserad differentiering)
- [ ] Spelifiering (XP, badges) – design och implementation
- [ ] DOCX-export – bibliotek och format
- [ ] Fotouppladdning – lagring i Supabase Storage
- [ ] Fler layouter med tvåkolumns-design (kräver ATS-granskning)
- [ ] Personligt brev-funktion (som cv.se erbjuder)
- [ ] Spara senaste jobbannons + nyckelordsmatchning per CV (idag är funktionen stateless)
- [x] Ska AI-toggle vara opt-in eller opt-out som default?
- [ ] Helhets-CV-feedback för coach-vyn — ska coach kunna trigga AI-feedback på en deltagares CV inom ramen för `coach_links`-relation? Inte i v1.4 — utvärderas efter beta-data.

> **Stängd 2026-05-06:** Opt-in behålls som default för AI-toggle. Skäl: AI kostar pengar, AF varnar uttryckligen för rena AI-genererade CV-texter, pedagogiskt rätt — deltagaren ska aktivt välja AI som verktyg. Beslutet dokumenterat i §15.2.

---

## 15. AI-assistans (tillägg utöver MVP)

**Status:** Levererad 2026-03-15 → 2026-03-20.
**Modell:** `claude-sonnet-4-6` via `@anthropic-ai/sdk`.
**Aktivering:** Användaren slår på AI via en toggle i CV-formuläret. State sparas per session (localStorage), inte i databas. Default = av.
**Säkerhet:** Inloggade flöden verifierar ägarskap via `cvId` + `getFullCV()`. Coach får använda nyckelordsmatchning för CV:n hen är kopplad till via `coach_links`. Gästflöden skickar CV-data direkt i request-body (ingen auth).

### 15.1 AI-funktioner

| # | Funktion | Endpoint | Input | Output | Var i UI |
|---|----------|----------|-------|--------|----------|
| 1 | Profilförslag | `POST /api/ai/profile` | nuvarande summary + CV-kontext + språk | 3-meningars ATS-optimerad profiltext, eller `[TIPS]`-meddelande om input är nonsens | Steg 2 (profiltext) |
| 2 | Beskrivningsförslag | `POST /api/ai/description` | jobbtitel + arbetsgivare + nuvarande beskrivning + språk | 3 punkter med starka verb i preteritum/past tense | Steg 3 (arbetslivserfarenhet) |
| 3 | Kompetensförslag | `POST /api/ai/skills` | jobbtitlar + utbildning + befintliga kompetenser + språk | JSON-array med 6 specifika kompetenser (4 yrkesspecifika + 2 mjuka) | Steg 5 (kunskaper & färdigheter) |
| 4 | Nyckelordsmatchning | `POST /api/ai/keywords` | `cvId` + jobbannons (fritext) + språk | JSON-array (max 8) med saknade nyckelord + sektionsförslag | ATS-panel / preview |
| 5 | Helhets-CV-feedback | `POST /api/ai/cv-feedback` | `cvId` ELLER `guestData` + språk | JSON-array med 3–5 feedback-punkter, eller `[TIPS]`-meddelande om CV:t är för tunt | Steg 6 (preview-sidorna) |

Helhets-feedbacken läser hela CV:t och returnerar 3–5 specifika observationer + förslag. Den är pedagogiskt designad: bulletpoints följs alltid av en inramning som påminner deltagaren att "AI:n ser mönster och formuleringar — den ser inte vem du är". Inga "Ersätt automatiskt"-knappar — deltagaren tar feedbacken och redigerar själv.

### 15.2 Designprinciper

- **Opt-in:** AI är alltid avstängd som default. Användaren slår på den explicit. Detta beslut är **stängt** (se §14): tre skäl — AI kostar pengar, AF varnar uttryckligen för rena AI-genererade CV-texter, och pedagogiskt rätt — deltagaren ska aktivt välja AI som verktyg.
- **Klyscha-regel (kontextuell):** Vi har en utökad lista med fluffiga buzz-ord (driven, lösningsorienterad, lagspelare, flexibel, engagerad, passionerad, ansvarstagande, motiverad, självgående, social, strukturerad, noggrann, prestigelös, resultatinriktad, kommunikativ, innovativ, dynamisk, proaktiv, team player, self-starter — full lista finns i `docs/v1.4/AI_PROMPTS_v1.md` och i koden under `lib/ai/forbidden-buzzwords.ts`). Reglen är **kontextuell, inte absolut**: orden får användas om deltagaren själv har gett ett konkret bevis i samma mening. "Driven av att lösa kniviga kundärenden" är OK; "Driven" ensamt är inte. Pedagogiskt rättare än absolut blockering.
- **Nonsense-detektion:** Alla AI-endpoints returnerar ett `[TIPS]`-meddelande istället för att generera text om input är meningslös – inga fabricerade fakta.
- **Aldrig hitta på fakta:** Prompts instruerar modellen att bara använda data som faktiskt finns i CV:t.
- **AI-output är alltid ett utkast:** UI:t visar alltid ett "ett utkast — använd det på ditt sätt"-meddelande direkt vid AI-genererat innehåll. Ingen automatisk ersättning av deltagarens text utan deltagarens aktiva val.
- **Språkmedvetenhet:** Alla endpoints tar `language: 'sv' | 'en'` och svarar på rätt språk. System-prompterna är språk-specifika (`SYSTEM_PROMPT_SV` / `SYSTEM_PROMPT_EN`) — inte en bilingual prompt som modellen får tolka.
- **Felmeddelanden på svenska:** Vänliga, åtgärdsinriktade meddelanden. Kreditslut detekteras separat och berättar för användaren att tjänsten är tillfälligt otillgänglig.
- **Dev-läge:** I dev-miljö visas en expanderbar panel med `systemPrompt` + `userPrompt` så vi kan iterera på prompt engineering. **I produktion utelämnas dessa fält ur API-svaret** — gating på `NODE_ENV !== 'production'` (säkerhetsfix från 2026-05-05).

### 15.3 Säkerhetsmodell

- Inloggad jobbsökare: server hämtar CV via `getFullCV(cvId)` efter `auth.getUser()`-verifiering.
- Coach: tillåten att anropa `/api/ai/keywords` för CV:n där `coach_links` matchar coach + CV-ägare. Coach har INTE åtkomst till `/api/ai/cv-feedback` i v1.4 (utvärderas efter beta-data — se §14).
- Gäst: payload måste innehålla `isGuest: true` eller `guestData` – ingen `cvId`-lookup, ingen DB-access.
- API-nyckel (`ANTHROPIC_API_KEY`) är server-side only. Aldrig `NEXT_PUBLIC_*`.
- Helhets-CV-feedback följer samma säkerhetsmodell som övriga endpoints.

### 15.4 Datamodell-konsekvenser

Inga nya tabeller. AI är stateless: förslag visas i UI och användaren accepterar/avvisar manuellt. Eventuell historik (vad användaren accepterade) är en V1.1-fråga (se avsnitt 14).

`ai_request_log.route` CHECK-constraint utökades 2026-05-06 till att inkludera `'cv-feedback'` (migration `20260506_ai_request_log_cv_feedback.sql`) — inte en datamodelländring i strikt mening, bara en utvidgning av redan existerande tabells acceptansfält.

### 15.5 Helhets-CV-feedback (`/api/ai/cv-feedback`)

**Status:** Levererad 2026-05-06 i v1.4. **Modell:** Samma `claude-sonnet-4-6`. **Aktivering:** Synlig som knapp i Steg 6 (preview-sidorna), aktiv när AI-toggle är på och CV:t har minst grundläggande personuppgifter + en av profil/erfarenhet/utbildning ifylld.

**Funktion:** Deltagaren klickar "Få ärlig feedback på mitt CV". AI:n läser hela CV-data-objektet och returnerar 3–5 konkreta observationer i JSON-format. Varje observation har:

```typescript
{
  point: string  // "Konkret observation + förslag (max 2 meningar)"
  section?: 'profile' | 'experience' | 'education' | 'skills' | 'general'
}
```

**Pedagogisk inramning:** Under bulletpointsen visas alltid texten:

> *"Du är experten på dig själv och din bransch. AI:n ser mönster och formuleringar — den ser inte vem du är. Använd punkterna ovan som en checklista, inte som ett facit. Det är du som sätter pricken över i:et."*

**UI-knappar:** Endast `Kopiera feedbacken` och `Stäng`. INGEN "Ersätt automatiskt"-knapp — deltagaren ska aktivt redigera sitt CV själv baserat på feedbacken.

**`[TIPS]`-fall:** Returneras om CV:t är nästan helt tomt eller innehåller uppenbar nonsens. Standardmeddelande: *"Det här CV:t verkar inte komplett. Fyll i lite mer innehåll så hjälper jag gärna till med en granskning."*

**Säkerhet:** Ärver hela mönstret från övriga AI-endpoints. Ägarskap verifieras före anrop. Rate limit delas med övriga AI-routes (samma `AI_HOURLY_LIMIT = 50` per användare).

**Forbidden-lista:** Helhets-feedbacken får (och ska) flagga klyschor från forbidden-listan om de förekommer i CV:t utan kontextuellt bevis. Det är en av de viktigaste sakerna deltagaren får feedback på.

### 15.6 Detaljerad implementeringsreferens

Följande dokument utgör implementeringsspec för v1.4-uppgraderingen och ligger sparade under `docs/v1.4/`:

- `AI_PROMPTS_v1.md` — komplett prompt-text för alla 5 AI-endpoints, inklusive utökad forbidden-lista och kontextuell klyscha-regel
- `UI_COPY_v1.md` — all UI-copy per CV-steg, inklusive helhets-feedback
- `UX_PATTERNS_v1.md` — återanvändbara UX-mönster (en sak åt gången, vardagsspråk, "hur fungerar det här?", AI-utkast-meddelande)
- `PRD_v1.4_DELTA.md` — pasta-källa för denna PRD-bump

Dokumenten bygger på och respekterar befintlig PRD §15-arkitektur. De ändrar inga låsta beslut (modell, opt-in, säkerhetsmodell, rate limit).
