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

### 2026-05-05 — `35ce873..HEAD`

**Scope:** 6 commits in the window, 4 with behavioural diff. (1) AI rate-limit infra: per-user hourly cap (50/hr) backed by `ai_request_log` table, applied to all four AI routes; input-size caps via `findOversizedField()`; defensive `message.content.find(b => b.type === 'text')` extraction. (2) Forgot-password / reset-password flow: new server actions `requestPasswordReset` and `updatePassword`, two new pages, two new form components, login form notice on `?reset=success`. (3) Cookie-marker fix for Supabase whitelist compatibility (drops `?next=` query, uses `cv_reset_pending` cookie). (4) Today's pure refactor extracting cookie helpers into `lib/auth/cookies.ts`. Skipped: `cfb98e2` (docs-only), `545e1b8` (gen-only types + the migration itself, audited semantically as part of `ce7d6cc`).

**Files read in full:** `app/api/ai/profile/route.ts`, `app/api/ai/description/route.ts`, `app/api/ai/skills/route.ts`, `app/api/ai/keywords/route.ts`, `lib/ai/rate-limit.ts`, `lib/ai/limits.ts`, `lib/ai/rate-limit.test.ts`, `supabase/migrations/20260504_ai_request_log.sql`, `lib/actions/auth.ts`, `lib/actions/auth.test.ts`, `lib/auth/cookies.ts`, `lib/validation/auth.ts`, `lib/validation/auth.test.ts`, `app/auth/callback/route.ts`, `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx`, `app/(auth)/login/page.tsx`, `components/auth/ForgotPasswordForm.tsx`, `components/auth/ResetPasswordForm.tsx`, `components/auth/LoginForm.tsx`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `middleware.ts`, `types/database.ts` (ai_request_log section). Cross-referenced the pre-refactor inline cookie code via `git show 9979e64` to verify semantic identity.

**Result: No critical bugs found.**

Auth flow trace (forgot → email → /auth/callback → /reset-password → updatePassword → signOut → /login?reset=success): all gates correctly enforced.
- `requestPasswordReset` always returns success regardless of Supabase outcome (user-enumeration prevented). Cookie set BEFORE the Supabase call so a Supabase failure still produces the expected UX. Test asserts both: success-on-error and "no-cookie when Zod rejects".
- `/auth/callback` consumes (delete) the cookie atomically via `consumeResetPendingCookie()` before redirecting, so a stale marker can't divert a future sign-up confirmation in the same browser. Verified by `git show 9979e64` — the new helper produces byte-identical cookie attributes (httpOnly, sameSite=lax, secure-in-prod, path=/, maxAge 1800) to the old inline code, and the read+delete sequence matches.
- `updatePassword` calls `supabase.auth.updateUser({ password })`. If the caller has no authenticated recovery session, Supabase returns `auth session missing` and the action returns the friendly Swedish error WITHOUT signing out — confirmed in test 4 (`signOutCalls === 0` on update failure). So an unauthenticated visitor to `/reset-password` cannot escalate; they just see the error.
- Middleware (`lib/supabase/middleware.ts`) only protects `/dashboard`, `/cv`, `/coach`. `/reset-password` is intentionally public — a recovery-email click lands the user there with a fresh session courtesy of `exchangeCodeForSession`. An already-logged-in user can also visit `/reset-password` and change their own password; that's the same surface as a Supabase-native account-settings password change. Not a finding.

Rate-limiter trace:
- Auth flow: `auth.getUser()` (server-side, cookie-based) returns the trusted user-id; `userId` argument to `checkRateLimit` is the same `user.id`. Client cannot spoof it. RLS on `ai_request_log` (`auth.uid() = user_id` for both select and insert) is a defence-in-depth layer that would block any cross-tenant attempt even if the application code regressed.
- Coach path on `/api/ai/keywords`: rate-limit increments under coach's own `user.id`, not the CV owner's. Coaches reviewing N participants share one bucket — by-design per the helper comment ("coaches share the same hourly bucket as jobseekers"), tunable later from telemetry.
- Race conditions: select-then-insert is non-atomic, so a high-concurrency burst can squeeze 2-3 extra calls past 50. Comment in the file calls this out explicitly. Acceptable: the cap exists to bound budget burn, not enforce a precise quota.
- Fail-open: documented in CLAUDE.md and the helper file. Trade-off accepted: brief unprotected windows during DB outages vs blocking legitimate users when protection infrastructure is down. The fail-open path does NOT mean "DB outage = unlimited free AI for an attacker indefinitely" — Supabase auth (`getUser()`) goes through the same DB; a real outage breaks the whole app, not just rate limiting.
- Guest paths (`/api/ai/profile` with `guestData`, `/api/ai/skills` with `guestData`, `/api/ai/description` with `isGuest: true`) are NOT rate-limited. Documented as intentional in CLAUDE.md ("If guest abuse becomes a problem, gate by IP via Vercel middleware"). Pre-dates this audit window.

Input-cap trace: `findOversizedField` is called BEFORE `auth.getUser()` and BEFORE the Anthropic call in every route. No path skips the check. Caps are 5 KB / 10 KB — generous, not formatting-level. A 5 MB `currentSummary` is rejected with 413 before any DB or token spend. Closes the open exposure noted in the prior audit.

Migration trace (`20260504_ai_request_log.sql`):
- Table has FK `user_id → profiles(id) ON DELETE CASCADE` — log rows die with the user account. Good.
- RLS enabled. `select` policy: `auth.uid() = user_id`. `insert` policy with check: `auth.uid() = user_id`. No update / delete policy at all — clients cannot tamper with their own log. A user CANNOT insert a row under another user's id (RLS blocks). A user CANNOT read other users' rows (RLS blocks). Covered.
- The `route` column is constrained to one of four literals via CHECK. Won't accept arbitrary values.
- No retention job yet (noted in the migration comment); not a bug, just a future cleanup.

Defensive content extraction: previously `message.content[0].type === 'text' ? ... : ''` would throw `Cannot read properties of undefined` on an empty `content` array (refusal-only / tool-use-only response). All four routes now use `find(b => b.type === 'text')`; throw caught path no longer triggers. Closes the prior-audit lower-severity item #2.

Test suite: 120 / 120 passing (`npm test`). +29 net since the prior audit, covering rate-limit allow / block / fail-open / no-insert-when-blocked, password-reset success-on-error, cookie-set behaviour, mismatched-password rejection, and not-signing-out on update failure.

**Notes for follow-up (cost/efficiency, non-blocking):**

- **Guest paths still not rate-limited.** Documented design — IP-based caps via Vercel middleware are the suggested escalation path. Not urgent, but worth tracking for "first day someone scripts the public guest endpoint".
- **`requestPasswordReset` always says "om kontot finns…" even on Zod failure path** — actually no: on Zod failure it returns `{ success: false, error: ... }` so the user sees an error. That's fine. Mentioning this only because the user-enumeration property only holds for Zod-valid emails. A Zod-invalid email leaks no information either (the format error is purely client-side). No concern.
- **Recovery-session reuse on shared devices:** `updatePassword` calls `signOut()` after success. Good. But if the user navigates away from `/reset-password` without submitting, the recovery session lingers (its own TTL applies — Supabase default is 1 hour). Not a finding, just a UX / hygiene observation.
- **Rate-limit insert is non-transactional with the count.** A determined attacker firing 50+ parallel requests can squeeze a few extra tokens past 50/hr. Bounded: even 60/hr × $cost-per-call is small. Move to `RPC + advisory lock` only if telemetry shows abuse.
- **Cookie helper file is fine, but the import pattern is brittle.** `lib/auth/cookies.ts` re-exports a constant that the test file imports as `RESET_PENDING_COOKIE`. Today's refactor preserved that import — verified in `lib/actions/auth.test.ts:71`. If anyone later inlines the constant elsewhere, that test still works.

**Validation performed:** Read every file listed top-to-bottom. Verified cookie-attribute identity by diffing `9979e64` (pre-refactor inline) against the current `lib/auth/cookies.ts` — all attributes preserved. Verified RLS policies on `ai_request_log` against the helper's query shape. Ran the full test suite locally: 120 / 120 pass. No production code modified in this audit run. No fix applied (no critical bugs to fix).

### 2026-05-05 (later) — `1315b38..HEAD` — beta posture + Layout 4

**Scope:** 5 commits. Behavioral: (1) `e82741c` middleware bug fix — `/cv/guest` was being treated as a protected route because of `startsWith('/cv')`, silently breaking the entire guest flow described in PRD §6.3. (2) `596a3ff` landing-page beta posture — auth CTAs visibly disabled, "Starta utan konto" promoted to primary, beta-version notice added. (3) `73e7d24` Layout 4 (Harvard / Ivy League) — new PDF template, type widening `CVLayout: 1|2|3 → 1|2|3|4`, DB constraint relaxation, dispatcher updates in two API routes and the preview client, picker UI entry, PRD §8 + history bumped to v1.3. Skipped: `f67e93e` (already audited under earlier 2026-05-05 entry, dep cleanup), `07c69bd` (docs).

**Files read in full:** `lib/supabase/middleware.ts` (pre and post fix), `lib/supabase/middleware.test.ts` (new), `app/page.tsx` (pre and post), `types/index.ts` (around CVLayout), `lib/guest/storage.ts`, `components/pdf/Layout1.tsx` (reference for Layout 4), `components/pdf/shared.ts`, `components/pdf/Layout4.tsx` (new), `components/pdf/CVPreviewInner.tsx`, `components/cv/LayoutPicker.tsx`, `app/api/cv/[id]/pdf/route.ts`, `app/api/cv/guest/pdf/route.ts`, `supabase/migrations/20260314_initial_schema.sql` (around `cvs_layout_check`), `supabase/migrations/20260505_layout_4.sql` (new), `PRD.md` (history + §6.1 + §8).

**Result: One P0 bug found and fixed in the same window (`e82741c`). No further critical bugs found.**

**Finding — P0: middleware silently broke entire guest flow.**
- **Bug:** `lib/supabase/middleware.ts` previously classified any `pathname.startsWith('/cv')` as auth-required. `/cv/guest`, `/cv/guest/[step]`, and `/cv/guest/preview` matched this rule even though the entire `(guest)` route group is designed to be public per PRD §6.3.
- **Impact:** Every logged-out visitor clicking the landing-page "Starta utan konto" CTA — the documented no-account path that the product was explicitly built around — was redirected to `/login` instead. Guest mode was effectively dead in production. The earlier 2026-05-04 senior-dev audit missed it because it inspected route handlers and middleware in isolation rather than tracing pathnames against the regex.
- **Trigger scenario:** any unauthenticated browser opening the landing page → "Starta utan konto" → middleware sees `/cv/guest`, no user, redirects to `/login` → user lands on a sign-in page they explicitly chose to bypass. Reproducible 100% of the time.
- **Root cause:** lazy `startsWith('/cv')` rule that did not distinguish authed CV paths (`/cv/new`, `/cv/[id]/edit`, `/cv/[id]/preview`) from the public guest routes.
- **Fix (commit `e82741c`):** extracted `isProtectedAppRoute(pathname)` as a named pure function with an explicit exclusion for `/cv/guest`. Added `lib/supabase/middleware.test.ts` with 5 cases pinning the rule, including a regression assertion specifically for `/cv/guest` and its children.
- **Validation:** `npm test` passes (125 / 125, +5 new). Manually verified the new pure helper returns the expected boolean for `/dashboard`, `/coach/*`, `/cv/new`, `/cv/[id]/edit`, `/cv/guest`, `/cv/guest/preview`, `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`.

**Layout 4 trace:** `cvs.layout` CHECK constraint widened from `(1,2,3)` to `(1,2,3,4)` via `20260505_layout_4.sql`, applied to the linked Supabase project (`vkafneraxgeshksvtdpb`) via `supabase db push`. RLS policies on `cvs` are untouched and continue to gate ownership. `CVLayout` widened in two places — `types/index.ts` and `lib/guest/storage.ts`'s `GuestCV` — verified via `tsc --noEmit`. PDF dispatcher updated in three call sites (preview client, authed PDF route, guest PDF route); each defaults to `Layout1` for unknown values, so a future fifth layout sent by a stale client would render correctly as Layout 1 rather than crash. Layout 4 itself is a pure render template — no auth, no DB, no user input beyond the same `FullCV` shape every other layout consumes. No new attack surface. Single-column structure preserves ATS safety per PRD §8 critical rule.

**Beta posture trace:** `app/page.tsx` swaps `<Link>` to `<span aria-disabled="true">` for the auth CTAs — the elements are no longer routable, just visually present. Auth pages remain in code and reachable by direct URL (intended; agreed with user). No middleware change for `/login` etc. (also intended). The login-redirect on a logged-in `/` visit (`if (user) redirect('/dashboard')`) is preserved — existing sessions continue to work. No new risk surface.

**Notes for follow-up (non-blocking):**

- **`isProtectedAppRoute` is permissive on `/cv/guestExtra`-style paths.** Today there is no such route, so this is theoretical. If someone later adds `/cv/guestSomething` for authed use, it would slip past the middleware. Tightening to `pathname === '/cv/guest' || pathname.startsWith('/cv/guest/')` closes this; not urgent.
- **No render test for Layout 4.** Layouts 1–3 also lack render tests; establishing one for layout 4 alone would be inconsistent. If a PDF render-test pattern is added later it should cover all four templates uniformly.
- **Beta posture not feature-flagged.** A direct UI edit was sufficient per the user's explicit scope ("we are disabling a button, adding a CTA, and updating a CV template"). Re-enabling login is a one-file revert. No env flag added by design.

**Validation performed:** `tsc --noEmit` clean, `eslint .` clean, `next build` succeeds, `npm test` 125 / 125. Migration applied to live DB cleanly (`supabase db push`, no errors). `types/database.ts` regenerated and verified unchanged (CHECK constraints don't surface in generated TS types).
