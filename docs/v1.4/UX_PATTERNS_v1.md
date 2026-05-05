# UX_PATTERNS_v1.md — Återanvändbara UX-mönster för CV-fix

**Format för Cursor-Claude.** Detta dokument är ett **tillägg till AGENTS.md** (UX Specialist-rollen) — inte en ersättning. Det specificerar UX-mönster vi vill se konsekvent över hela appen, baserat på vad vi lärt av Coachgruppens AI-app och vad vår målgrupp behöver.

**Författare:** Lisa (Jobblink AB) i samarbete med Claude.
**Datum:** 2026-05-05.
**Mappar mot:** AGENTS.md (UX Specialist-sektionen), CLAUDE.md (UI/UX Standards).

**Status:** Rekommendation, inte hård kravlista. Lisa väljer hur snabbt mönstren rullas ut. Vid konflikt med befintlig PRD §13 vinner PRD.

---

## 0. Hur detta dokument används

När Cursor-Claude bygger eller uppdaterar UI-komponenter:

1. Kör Three-Role Check enligt AGENTS.md som vanligt.
2. När UX-rollen aktiveras — läs detta dokument utöver AGENTS.md UX-sektionen.
3. Om ett mönster här konflikter med PRD.md eller CLAUDE.md → PRD/CLAUDE vinner.
4. Om ett mönster här *kompletterar* befintlig standard utan att kollidera → applicera.

---

## 1. Princip: En sak åt gången

**Vad:** På varje skärm finns *en* huvudåtgärd. Alla andra knappar är sekundära (gråare, mindre, eller dolda i menyer).

**Varför:** Stressade deltagare på en telefon klarar inte parallella val. En huvudknapp kommer alltid att vinna kampen om uppmärksamheten — välj vilken det ska vara, istället för att låta UI:t bestämma åt dig.

**Hur det syns i koden:**

```tsx
// ✓ OK — en primär knapp, en sekundär
<Button variant="default">Spara och fortsätt</Button>
<Button variant="outline">Tillbaka</Button>

// ✗ Undvik — två likvärdiga primärknappar konkurrerar
<Button variant="default">Spara och fortsätt</Button>
<Button variant="default">Förbättra med AI</Button>
```

**Edge case som finns i appen idag:** På Steg 2 (Profiltext) konkurrerar "Generera förslag"-knappen visuellt med "Spara och fortsätt". Lösning: gör "Generera förslag" till en sekundär stil (outline eller ghost) eftersom den är ett *hjälpmedel*, inte en huvudåtgärd. Huvudåtgärden är att spara och gå vidare.

**Tillämpningsregel:** När du lägger till en ny knapp på en sida — fråga: "Är detta vad användaren ska göra härnäst?" Om ja → primär. Om det är ett valfritt hjälpmedel → sekundär.

---

## 2. Princip: Vardagsspråk före CV-jargong

**Vad:** Rubriker och knappar är skrivna så att någon utan tidigare CV-erfarenhet förstår dem. CV-termer (profiltext, kompetenser, referenser) får finnas som primärrubrik, men **lägg en synlig vardagsspråk-underrubrik direkt under**.

**Varför:** En undersköterska eller en lagerarbetare som aldrig skrivit CV på svenska behöver inte lära sig CV-vokabulär för att kunna använda appen. Vardagsspråket sänker tröskeln utan att ta bort de termer som blir relevanta senare i karriären.

**Hur det syns i koden:**

```tsx
// ✓ OK
<div>
  <h2 className="text-2xl font-bold">Profiltext</h2>
  <p className="text-sm text-muted-foreground">
    Skriv kort om dig själv — vem du är, vad du kan, vart du är på väg
  </p>
</div>

// ✗ Undvik — bara CV-jargong
<h2>Profiltext</h2>
```

**Tillämpningsregel:** Varje sektionsrubrik som använder en CV-term ska ha en max 1-meningars vardagsspråk-underrubrik. Konkret copy finns i `UI_COPY_v1.md`.

---

## 3. Princip: "Hur fungerar det här?"-mönstret

**Vad:** Vid varje AI-driven funktion finns en liten utvikbar "Hur fungerar det här?"-länk (med "i"-ikon eller liknande). När deltagaren klickar visas en kort förklaring (3–5 meningar) av vad funktionen faktiskt gör.

**Varför:** Det är *inte* samma sak som tips eller coaching. Det är funktionsförklaring för den som undrar "vad händer om jag trycker på den knappen". Bygger förtroende utan att tjata. Detta mönster är inspirerat av Coachgruppens app (där det fungerar bra) men anpassat till vår ton.

**När det ska finnas:**

- Vid AI-knappar (`Generera förslag`, `Förbättra`, `Föreslå med AI`, `Få ärlig feedback på mitt CV`)
- Vid validerings-meddelanden som kan kännas otydliga
- Vid ATS-panelen (om inte redan finns)

**Hur det implementeras (förslag på återanvändbar komponent):**

```tsx
// components/shared/HowDoesThisWork.tsx
interface HowDoesThisWorkProps {
  text: string  // 3–5 meningar
}

export function HowDoesThisWork({ text }: HowDoesThisWorkProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="text-sm">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <InfoIcon className="size-4" />
        Hur fungerar det här?
      </button>
      {open && (
        <p className="mt-2 text-muted-foreground bg-muted p-3 rounded-md">
          {text}
        </p>
      )}
    </div>
  )
}
```

**Tillämpningsregel:** Använd inte mönstret överallt — bara där deltagaren rimligen kan undra "vad gör den här knappen". Exempel: "Spara och fortsätt" behöver ingen förklaring. "Förbättra med AI" behöver det.

**Konkret copy för varje förekomst** finns i `UI_COPY_v1.md` per komponent.

---

## 4. Princip: Validering ska informera, inte skämma ut

**Vad:** Validerings-meddelanden ska vara specifika och åtgärdsinriktade — i ton som en kollega som ger ärlig feedback, inte en lärare som rättar.

**Varför:** Detta är redan AGENTS.md UX-standard. Vi bygger på det med konkret implementations-vägledning för CV-fix-specifika valideringar.

**Mönster:**

| Använd | Undvik |
|---|---|
| `Bra start. Sikta på minst 3 meningar...` | `Profiltext för kort` |
| `E-postadressen saknar @-tecken` | `Ogiltig e-post` |
| `Ord som "driven" säger inte så mycket — visa det istället: vad har du gjort som bevisar det?` | `Klyschig text, omformulera` |
| `Slutdatum kan inte vara innan startdatum` | `Datumfel` |

**Tillämpningsregel:** Visa **endast en valideringsmeddelande åt gången** per fält/sektion — annars överväldigar vi deltagaren. Om flera regler triggar — välj den högst i prioritets-listan (definierad i `UI_COPY_v1.md`).

**Visuell behandling:** Mjuka varningar (gul/orange) — texten kan sparas ändå. Hårda fel (röd) — blockerar export enligt PRD §9.1.

---

## 5. Princip: AI-output är alltid ett utkast

**Vad:** All AI-genererad copy presenteras som *ett utkast*, aldrig som ett färdigt resultat. Texten "Ett utkast — använd det på ditt sätt" eller motsvarande ska visas direkt vid varje AI-resultat.

**Varför:** AF varnar uttryckligen för rena AI-genererade CV-texter (se PRD §15.1 och `AI_PROMPTS_v1.md`). Vi måste kommunicera till deltagaren att hen *äger* texten, inte AI:n. Det skyddar både deltagaren juridiskt och pedagogiskt — och bygger förståelse för att AI är ett verktyg.

**Mönster:**

```tsx
// ✓ OK — utkast-status är synlig
<div className="border-l-4 border-primary pl-3 py-2 text-sm text-muted-foreground">
  Ett utkast — använd det på ditt sätt. Ändra, lägg till, ta bort.
</div>
<Textarea defaultValue={aiGenerated} />

// ✗ Undvik — AI-output presenteras som klar text
<Textarea defaultValue={aiGenerated} />
```

**Tillämpningsregel:** Mönstret gäller för alla AI-routes:
- `/api/ai/profile` → meddelandet visas över profiltext-textarean efter generering
- `/api/ai/description` → meddelandet visas över bullets-fältet efter generering
- `/api/ai/skills` → "Sex förslag — välj de som faktiskt stämmer in på dig"
- `/api/ai/keywords` → "Saknade nyckelord — väg in dem där det är naturligt"
- `/api/ai/cv-feedback` → den separata pedagogiska inramningen i `UI_COPY_v1.md` §6.6

---

## 6. Princip: Mobil först, alltid

**Vad:** Detta är redan PRD §13 och CLAUDE.md UI/UX-standard. Vi förtydligar tillämpning för nya komponenter:

- Bygg först för 375px-bredd, scala upp
- Touch targets minst 44×44px (även "Ta bort"-knappar i listor — se README-punktlista #5)
- Inga sidopaneler eller hovers — använd accordion, dialog eller separata vyer
- Ingen horisontell scroll — om text inte ryms, bryt rad eller korta texten

**Tillägg:** För nya komponenter där text är dynamisk (t.ex. AI-svar) — testa rendering vid både korta och långa svar på 375px.

**Tillämpningsregel:** Innan du commitar en ny UI-komponent — öppna devtools, sätt viewport till 375×667 (iPhone SE), tab-navigera genom hela komponenten. Om något bryter — fixa innan commit.

---

## 7. Princip: Empty, loading, error — tre tillstånd alltid

**Vad:** Detta är redan AGENTS.md UX Definition of Done. Vi förtydligar för AI-funktioner:

| Tillstånd | För AI-knappar |
|---|---|
| **Empty** | Knappen visas men ingen feedback ännu — texten under förklarar vad som händer vid klick |
| **Loading** | "Genererar förslag…" / "Tänker över din text…" / "Läser igenom ditt CV…" — texterna i `UI_COPY_v1.md` |
| **Error** | Standard svensk text: `Jag hänger inte med just nu — försök igen om en stund.` + retry-knapp |
| **`[TIPS]`-svar** (specifikt för AI) | Visa AI:s `[TIPS]`-meddelande utan prefixet, i mjukare visuell behandling — inte som ett fel |

**Tillämpningsregel:** Loading-state ska synas inom 200ms av användarens klick. Annars känns appen hängd.

---

## 8. Princip: Visuell hierarki för CV-stegen

**Vad:** Den befintliga design-grammatiken i appen (lila ram runt aktiv sektion, tydlig progress-bar, "checkmark"-stegnavigation) fungerar. Behåll den. Men:

- Den lila ramen runt aktiv sektion är pedagogiskt bra — bevara den vid alla nya komponenter
- Progress-bar uppdateras vid varje "Spara och fortsätt"
- "Tillbaka"-knappen behåller sin sekundära styling — den är alltid sekundär

**Tillämpningsregel:** Vid nya AI-funktioner som lägger till sektioner inom ett steg (t.ex. tipspanel, feedback) — håll dig inom den lila ramen istället för att skapa egna kort utanför. Det bevarar den visuella enheten.

---

## 9. Princip: AI är opt-in (och vi mjukar inte upp det)

**Vad:** PRD §15.2 säger att AI är opt-in via toggle, default = av. **Detta är ett medvetet beslut som inte ska ändras.**

**Varför vi inte gör det opt-out (eftersom det är en öppen fråga i PRD §14):**

- AI kostar pengar — opt-in skyddar plånboken
- AF varnar uttryckligen för AI-genererat innehåll — opt-in tvingar deltagaren att aktivt välja
- Pedagogiskt rätt — bygger förståelse för att AI är ett verktyg, inte automation
- Deltagare med låg digital mognad ska inte överrumlas av AI-funktioner

**Tillämpningsregel:** När AI-toggle är AV, ska AI-knappar vara *dolda* eller *dimmade med en "Slå på AI-hjälp"-prompt*. Inte synliga och klickbara med felmeddelande.

---

## 10. Mappning mot AGENTS.md UX Standards

För Cursor-Claude som kör Three-Role Check — här är hur våra mönster mappar mot befintlig UX-checklist:

| AGENTS.md UX-standard | Vårt mönster som kompletterar |
|---|---|
| "Touch targets: minimum 44x44px" | §6 — gäller även Ta bort-knappar (README punkt 5) |
| "Form labels: always visible" | §2 — vardagsspråk-underrubrik som tydliggörande |
| "Error messages: specific and actionable" | §4 — konkreta exempel per CV-sektion |
| "Progress: user always knows where they are" | §8 — bevara befintlig progress-bar |
| "Guest warning: shown as a banner" | (oförändrat — finns redan) |
| (ny) | §1 — En sak åt gången |
| (ny) | §3 — Hur fungerar det här?-mönstret |
| (ny) | §5 — AI-output är alltid ett utkast |
| (ny) | §7 — Empty/loading/error för AI-funktioner |
| (ny) | §9 — AI opt-in är låst |

---

## 11. Acceptanskriterier för UX-mönster

- [ ] Princip 1 (En sak åt gången) tillämpas på Steg 2 — "Generera förslag"-knappen är sekundär stylad
- [ ] Princip 2 (Vardagsspråk) tillämpas på alla 5 stegrubriker enligt `UI_COPY_v1.md`
- [ ] Princip 3 (Hur fungerar det här?) finns på minst tre platser: profil-AI, description-AI, helhets-feedback
- [ ] Princip 4 (Validering) — validerings-meddelanden enligt `UI_COPY_v1.md` är implementerade
- [ ] Princip 5 (AI-utkast) — alla 5 AI-routes har "ett utkast"-meddelande efter generering
- [ ] Princip 6 (Mobil) — alla nya komponenter testas på 375×667
- [ ] Princip 7 (3 tillstånd) — alla AI-funktioner har loading + error states
- [ ] Princip 8 (Visuell hierarki) — nya komponenter ligger inom den lila ramen där relevant
- [ ] Princip 9 (AI opt-in) — AI-knappar är dimmade när toggle är AV

---

**Slut på UX-mönster.** Kompletteras av: `AI_PROMPTS_v1.md`, `UI_COPY_v1.md`, `PRD_v1.4_DELTA.md`.
