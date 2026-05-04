# AUDIT.md — Critical Correctness Audit Protocol

> **Read this file in full before every audit run.** No skim reads.
> Also read every source file you audit in full — no excerpts, no spot reads.

---

## Goal

Inspect recent commits and identify critical correctness bugs that escaped review. Only surface issues that would cause:

- data loss or corruption
- crashes in critical paths
- security holes (auth bypass, permission escalation, secret leakage)
- significant user-facing breakage (the user can't complete a core flow)

This is **not** a code review for style, taste, or theoretical concerns. The bar is intentionally high: "could this hurt a real user, today?"

---

## Investigation strategy

- **Focus on behavioral changes with meaningful blast radius.** Skip pure docs, types-only commits, CSS, dependency bumps that don't change behavior.
- **Look for:**
  - data corruption
  - race conditions that lose writes
  - null dereferences in critical paths
  - auth / permission bypasses
  - infinite loops
  - resource leaks (memory, DB connections, API budget)
  - silent data truncation
- **Trace the full code path** — don't pattern-match on the diff. Understand the caller chain and downstream effects. Open the file the diff lives in. Read it from top to bottom. Then open every file it imports from that you don't already have memorised. Read those in full too.
- **Ignore:**
  - style issues
  - minor edge cases
  - theoretical concerns without a concrete trigger
  - low-severity issues that merely degrade UX
  - bugs that pre-date the audit window (those go in the regular punch list, not the audit log)

---

## Confidence bar

- You **must** be able to describe a concrete scenario that triggers the bug — who does what, in what order, with what data, on what device — that produces the bad outcome.
- If you cannot construct a plausible trigger scenario, **do not flag it**. Note it in the regular punch list if it's worth tracking, but do not add it to the audit log as a finding.
- "It's theoretically unsafe" is not a finding. "User A logged in, opens CV with cvId=X owned by user B, the route fetches and returns user B's data" is a finding.

---

## Cost & efficiency

- When fixing a bug with multiple correct options, pick the **cheapest correct one**. Cheapest = least new code, least new dependency, least runtime cost, least operational complexity.
- When reading the diff, **flag any cheaper-or-equivalent alternative** you spot. Examples:
  - JOIN instead of N+1 round-trips
  - one query with `.in()` instead of a loop
  - cached / memoised value instead of fresh fetch
  - server-side computation instead of client roundtrip (or vice versa, when payload size flips the equation)
  - smaller Anthropic model (Haiku vs Sonnet) for trivial classification prompts
  - native string ops instead of regex when the input shape is fixed
  - early return instead of nested conditional
- A flag isn't a bug. Bugs go in **Findings**. Cost/efficiency notes go in **Notes for follow-up** in the log entry.

---

## Fix strategy (if a bug is found)

- Implement a **minimal, high-confidence fix.** No drive-by refactors, no related cleanup.
- **Add or update tests** to lock in the fixed behaviour. The test must fail against the unfixed code and pass against the fix — verify both directions.
- Keep the fix scoped to one bug. One PR / one commit per finding.

---

## Safety rules

- **Do not push to `main` without explicit approval, even for a fix.** Fixes go on a feature branch (e.g. `audit/fix-2026-05-04-keyword-coach-check`). Open a PR if/when we move to PR-based flow; until then, present the diff and wait for the user's "go".
- **Do not open a PR** without an approved finding + fix. Reporting in chat is the default; PR comes after the user approves the fix.
- If no critical bug is found, the expected output is a short **"no critical bugs found"** entry in the log. **This is the expected outcome on most days.** Don't manufacture findings to look productive.

---

## Output format

Append a new section to **`## Log`** below. One section per audit run.

```markdown
### YYYY-MM-DD — <commit-range>

**Scope:** N commits, M files touched, summary of what shipped in the window.
**Result:** No critical bugs found. | One finding (P0/P1). | Two findings…

**Findings (if any):**
- **Bug:** what it is
- **Impact:** who is affected, how badly
- **Trigger scenario:** concrete steps
- **Root cause:** why
- **Fix:** what we did, on which branch
- **Validation:** tests added, test command, what was verified

**Notes for follow-up (cost/efficiency, non-blocking):**
- One-line items that aren't bugs but should reach the regular punch list.
```

---

## Pre-push enforcement

A pre-push git hook (`.githooks/pre-push`) refuses any push to `main` if today's date does not appear under `## Log`. This makes "ran the audit today" a hard precondition for shipping. The hook is installed automatically by `npm install` via the `postinstall` script.

If today's diff is doc-only or test-only and you've decided no audit is needed, add an explicit log entry like:

```markdown
### 2026-05-04 — docs-only

**Scope:** doc updates, no behavioural diff.
**Result:** No audit required.
```

That counts as today's entry and unblocks the push.

---

## Log

### 2026-05-04 — Sprint 0d setup (this commit)

**Scope:** This file and the pre-push hook were added. No behavioural diff in the application code.
**Result:** No audit required for the setup commit itself. First real audit follows immediately on `e0775c3..HEAD` (the AI burst window).

### 2026-05-04 — `e0775c3..HEAD` (AI burst, ~14 days)

**Scope:** 16 commits in the window. Behavioural surface: 4 new AI API routes (`profile`, `description`, `skills`, `keywords`), `AIToggle` component + `useAIMode` hook, `KeywordMatchPanel` component, AI integration into `ProfileTextForm`, `ExperienceForm`, `SkillsLanguagesForm`. The two most recent commits (`3de2725` docs, `39a039d` Sprint 0c tests) had no behavioural diff and were skipped.

**Files read in full:** `app/api/ai/profile/route.ts`, `app/api/ai/description/route.ts`, `app/api/ai/skills/route.ts`, `app/api/ai/keywords/route.ts`, `components/cv/AIToggle.tsx`, `components/cv/KeywordMatchPanel.tsx`, `components/cv/ProfileTextForm.tsx`, AI handlers in `ExperienceForm.tsx` and `SkillsLanguagesForm.tsx`, `lib/queries/cv.ts` (called by every AI route), `lib/guest/storage.ts`, RLS policies for `cvs` in `supabase/migrations/20260314_initial_schema.sql`.

**Result: No critical bugs found.** Auth paths are correctly gated (server-side `auth.getUser()` + ownership check by `user_id`), coach access on `/api/ai/keywords` enforces `coach_links` explicitly on top of RLS (defence in depth), Anthropic SDK key is server-side only, all API routes have try/catch returning generic Swedish messages without leaking DB/SDK error text. Form-side AI calls use `AbortController` with a 15s timeout and disable the trigger button while in flight.

**Lower-severity items (logged for visibility, not P0/P1):**

1. **Silent data truncation: guest skill suggestions ignore experiences and educations.** `components/cv/SkillsLanguagesForm.tsx:177` builds the AISkillsPayload guest branch with `experiences: []` and `educations: []` hard-coded, even though `loadGuestCV()` has the real arrays in localStorage. The form's parent (`GuestStepContent`) doesn't thread them in either. A guest who has filled in their CV gets generic skills (e.g. "kommunikation", "samarbete") instead of context-aware ones (e.g. "Truckkort B", "ADR-utbildning").
   - **Trigger scenario:** guest fills `job_title="Truckförare"`, `program="Yrkesgymnasium"`, goes to step 5, toggles AI on, clicks "Föreslå kompetenser" → request goes out with empty experience/education arrays → AI suggestions are generic.
   - **Why not P0/P1:** AI is opt-in (off by default), labelled "prompt under utveckling" in the UI, and the user can still complete and export their CV. No data loss, no auth issue, no crash. The user simply gets a worse AI experience than an authenticated user would for the same input. Fits the AUDIT.md focus list under "silent data truncation" but at low severity.
   - **Suggested fix (small, single PR):** thread `guestCV.experiences` and `guestCV.educations` from `GuestStepContent` into `SkillsLanguagesForm` as new optional props; use them when building the guest payload. ~5 lines. Skips a test for now — locking this in needs jsdom + RTL which Sprint 0c deliberately deferred. Covered by a manual test plan instead.

2. **`message.content[0].type` access in all four AI routes** assumes the content array is non-empty. If Anthropic ever returns a response with `content: []` (e.g. tool-use or refusal blocks only) the access throws. The throw is caught by the route's try/catch and the user sees `'AI-tjänsten svarade inte. Försök igen.'`. So: not a crash to the app, just a generic error to the user. Future-proof: replace `message.content[0].type === 'text' ? ... : ''` with `message.content.find(b => b.type === 'text')?.text ?? ''`. Cheaper than the current code in failure cases too.

3. **`KeywordMatchPanel` parses `JSON.parse(data.result)` and trusts it's a `AIKeywordSuggestion[]`**. If the model wraps the JSON in prose or returns an object instead of an array, the subsequent `.map` throws and the React error boundary catches it. Same severity profile as #2 — degraded UX, no critical breakage. Defensive parse + shape check would close this.

**Notes for follow-up (cost/efficiency, non-blocking):**

- **Prompt caching is not enabled.** All four routes pass system prompts of 300–500 tokens on every call without `cache_control: { type: 'ephemeral' }`. For Sonnet 4.6 the cache write is 25% surcharge and the read is 10% of full price; for users hitting the same prompt repeatedly within a session, this is a clean cost win. Worth pairing with the Sprint 1 rate-limiting work.
- **`/api/ai/skills` is a simple "given X, suggest 6 names" task.** Currently uses `claude-sonnet-4-6` like the others. `claude-haiku-4-5` would likely produce equal-quality output at roughly a quarter of the cost. Worth A/B-ing the prompts before changing.
- **No request-size cap on user-supplied AI inputs.** A misbehaving client could POST a 5 MB `currentSummary` and burn tokens up to whatever Anthropic's request-size limit is. Combined with the known no-rate-limit gap (Sprint 1 P0), this is exposure. Adding a `max length: 5000` cap server-side on `currentSummary`, `currentDescription`, `jobPosting` is one line per route.
- **`getFullCV` does 10 round-trips in parallel.** Fine for a single CV today; worth flagging if any future caller fans out across many CVs (e.g. coach dashboard rendering CV cards) — would need a JOIN-based query to avoid N×10.

**Validation performed:** Read every file listed above top-to-bottom (no excerpts). Cross-referenced auth flow against `lib/queries/cv.ts` and the `cvs` RLS policies. Did not modify production code in this run. No tests added (no fix applied).
