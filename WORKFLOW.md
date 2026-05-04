# WORKFLOW.md - Development Protocol for Claude in Cursor

Read this before every task. Follow it without skipping steps.

---

## The Three Roles

Every significant decision in this project must pass through three lenses before proceeding.
You embody all three roles simultaneously. Before writing code, run the task through each role.

| Role | Codename | Primary concern |
|------|----------|-----------------|
| Product Owner | PO | Is this the right thing to build? Does it match PRD.md? |
| UX Specialist | UX | Will a real user understand this? Is it accessible and mobile-friendly? |
| Senior Developer | DEV | Is this the right way to build it? Is it secure, scalable, testable? |

---

## The Task Protocol

Every task follows this exact sequence. Do not skip steps.

### STEP 1 - INTAKE (before any code)

Before touching the keyboard, write a short internal brief:

```
TASK: [what was asked]
PO CHECK: Does this align with PRD.md? Which section? Any scope creep risk?
UX CHECK: Which user is affected? Any mobile/accessibility concern?
DEV CHECK: Which files will be touched? Any risk of breaking existing functionality?
RISKS: [list anything that could go wrong]
PLAN: [numbered list of sub-tasks]
```

If any role raises a concern, resolve it before proceeding. If you cannot resolve it, stop and ask the user.

### STEP 2 - BUILD (one sub-task at a time)

- Complete one sub-task from the plan
- Run a self-check after each sub-task (see below)
- Commit after each sub-task is verified

Do not batch multiple sub-tasks before committing.

### STEP 3 - SELF-CHECK (after every sub-task)

Run all three role checks:

```
DEV SELF-CHECK:
  [ ] TypeScript compiles without errors (npx tsc --noEmit)
  [ ] No 'any' types introduced
  [ ] RLS policy written if new table created
  [ ] Error handling in place for all async operations
  [ ] No hardcoded secrets or API keys

UX SELF-CHECK:
  [ ] Component works on 375px screen width
  [ ] All form inputs have labels
  [ ] Empty state defined
  [ ] Loading state defined
  [ ] Error state defined

PO SELF-CHECK:
  [ ] Feature matches PRD.md specification
  [ ] No unplanned scope added
  [ ] ATS safety not compromised (if PDF-related)
```

If any check fails, fix it before moving to the next sub-task.

### STEP 4 - COMMIT

Use Conventional Commits. The repo started with `[role]` prefixes during MVP (Phases 1–7) and switched mid-project; both are still valid in `git log`, but new commits use Conventional Commits going forward.

```bash
git add <specific files>     # avoid `git add -A` to prevent accidental secrets
git commit -m "type(scope): short description

- detail
- detail"

git push origin main
```

**Allowed types:** `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`.
**Common scopes:** `ai`, `ats`, `coach`, `pdf`, `auth`, `ux`, `dev`. Scope is optional.

Examples (from repo history):
- `feat(ai): keyword matching against job postings for jobseeker and coach`
- `fix(ai): allow coaches to use keyword matching for linked participants`
- `feat(ats): add two missing soft warnings from PRD`
- `refactor: code review fixes — shared types, utils, and consistent error handling`
- `docs: bump PRD to v1.2 with AI section`

### STEP 5 - TASK CLOSE

After all sub-tasks are done and pushed:

```
TASK COMPLETE SUMMARY:
Files changed: [list]
Tests passing: [yes/no - what was tested]
PRD alignment: [confirmed / deviation noted]
Next logical task: [suggest what comes next]
Open questions: [anything that needs user input]
```

---

## Anti-Loop Protocol

A loop is defined as: the same error or problem appearing 3 or more times.

When you detect a loop:

1. STOP immediately. Do not attempt another fix.
2. Write a loop report:

```
LOOP DETECTED
Problem: [exact description]
Attempts made: [list each attempt and why it failed]
Root cause hypothesis: [your best analysis]
Options:
  A) [approach] - pros/cons
  B) [approach] - pros/cons
  C) [approach] - pros/cons
Recommendation: [which option and why]
ACTION REQUIRED: User must choose before I continue.
```

3. Wait for user input. Do not proceed.

---

## Git Workflow

### Branch Strategy

**Default: work directly on `main`.** Solo project; the `pre-push` hook + AUDIT.md gate every push, so the review surface a feature branch would provide doesn't exist yet.

**Use a feature branch when:**
- An audit-discovered fix lands (per AUDIT.md, branch name `audit/fix-YYYY-MM-DD-<slug>`).
- A change is risky enough to want a sandbox (e.g. preview-bundle perf rewrite, schema migration with backfill, dependency major bump).
- A second reviewer joins the project — at which point we revisit the default.

### Remote

```bash
# Verify remote is set correctly
git remote -v
# Should show: origin https://github.com/L-Lisa/CV-fix.git

# If not set:
git remote add origin https://github.com/L-Lisa/CV-fix.git
```

### Push after every verified sub-task

Never accumulate multiple uncommitted changes. If something breaks, a clean commit history makes it easy to revert.

```bash
# Standard push
git push origin main

# If push is rejected (remote has changes you don't have)
git pull --rebase origin main
git push origin main
```

### If you need to revert

```bash
# See recent commits
git log --oneline -10

# Revert to a specific commit (safe - creates a new commit)
git revert HEAD

# Hard reset (destructive - only if user explicitly approves)
git reset --hard [commit-hash]
```

---

## Supabase CLI Workflow

### Setup (first time)

```bash
# Install Supabase CLI if not installed
brew install supabase/tap/supabase

# Login
supabase login

# Link to project (run once per project)
supabase link --project-ref YOUR_PROJECT_REF

# Verify connection
supabase status
```

### Migration Workflow

Every database change goes through a migration file. Never modify the database directly in Supabase dashboard during development.

```bash
# Create a new migration
supabase migration new descriptive_name_here
# Creates: /supabase/migrations/[timestamp]_descriptive_name_here.sql

# Write your SQL in that file, then push to database
supabase db push

# Regenerate TypeScript types after every migration
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts

# Commit the migration and updated types together
git add supabase/migrations/ types/database.ts
git commit -m "feat(db): add migration: descriptive_name_here"
git push origin main
```

### Never do this
- Never write raw SQL in Supabase dashboard and forget to create a migration file
- Never delete a migration file that has already been pushed to the database
- Never modify an existing migration file - create a new one instead

---

## Testing Protocol

### What to test after every feature

```bash
# TypeScript check (must pass before any commit)
npx tsc --noEmit

# Lint check
npx eslint . --ext .ts,.tsx

# Manual test checklist per feature:
# 1. Open on mobile viewport (375px in browser devtools)
# 2. Tab through all interactive elements (keyboard navigation)
# 3. Test the happy path (normal user flow)
# 4. Test at least one error case (empty required field, invalid input)
# 5. Check browser console for errors or warnings
```

### PDF-specific testing

After any change to PDF generation:

```bash
# Generate a test PDF and verify:
# 1. File opens without errors
# 2. Text is selectable (not an image)
# 3. Copy-paste from PDF works correctly
# 4. No layout overflow (text not cut off)
```

### Supabase RLS testing

After any RLS policy change:

```sql
-- Test as a regular user (not admin)
-- Verify user can only see their own data
-- Verify coach can only see linked participants
-- Verify no cross-user data leakage
```

---

## Role Escalation Guide

Use this when the three roles disagree:

| Conflict | Resolution |
|----------|-----------|
| PO vs DEV (build it vs build it right) | Default to DEV if it affects security or ATS safety. Default to PO if it is a scope question. |
| UX vs DEV (looks good vs works correctly) | Default to DEV. A broken feature with good UX is still broken. |
| UX vs PO (user wants X vs PRD says Y) | Flag to user. Do not resolve unilaterally. |
| Any role vs PRD.md | PRD.md wins unless user explicitly overrides. |

---

<!-- Session Start Checklist consolidated 2026-05-04 — see "Pickup Checklist" further down. One canonical list. -->



## Feature Development Order

Work in this sequence. Do not jump ahead.

### MVP (delivered 2026-03-15)

```
Phase 1 - Foundation
  [x] 1.1 Next.js project setup + dependencies
  [x] 1.2 Supabase client setup (client.ts, server.ts, middleware.ts)
  [x] 1.3 All SQL migrations + RLS policies (supabase/migrations/20260314_initial_schema.sql)
  [x] 1.4 TypeScript types generated from database

Phase 2 - Auth
  [x] 2.1 Register page (user + coach roles)
  [x] 2.2 Login page
  [x] 2.3 Auth middleware (protect app routes)
  [x] 2.4 Guest mode (localStorage warning)
  [x] 2.5 Auth callback route (/auth/callback) for email confirmation

Phase 3 - CV Form (core)
  [x] 3.1 CV creation flow + routing
  [x] 3.2 Step 1: Personal info form
  [x] 3.3 Step 2: Profile text form
  [x] 3.4 Step 3: Work experience form (repeatable)
  [x] 3.5 Step 4: Education form (repeatable)
  [x] 3.6 Step 5: Skills, Languages, Other (repeatable)
  [x] 3.7 Step navigation + progress indicator

Phase 4 - CV Preview + ATS
  [x] 4.1 CV preview component (React-PDF document)
  [x] 4.2 Layout 1 (simple, single column)
  [x] 4.3 Layout 2 (accent color)
  [x] 4.4 Layout 3 (extended sections)
  [x] 4.5 ATS validation logic (hard + soft rules)
  [x] 4.6 ATS check panel in UI

Phase 5 - Export
  [x] 5.1 PDF export API route (/api/cv/[id]/pdf, /api/cv/guest/pdf)
  [x] 5.2 Export UI (download button, blocked state on errors)

Phase 6 - Coach Mode
  [x] 6.1 Coach dashboard (participant list, ATS stats per card)
  [x] 6.2 Coach-participant linking via email (Server Action, not API route)
  [x] 6.3 Comment mode (add comments per section)
  [x] 6.4 Edit mode (per-section inline edit of participant CV)
  [x] 6.5 Participant view: "Ändrad av coach" indicator on preview

Phase 7 - Polish
  [x] 7.1 Mobile QA pass on all screens
  [x] 7.2 Accessibility audit (labels, contrast, keyboard nav)
  [x] 7.3 Empty states on all lists
  [x] 7.4 Loading states on all async operations
  [x] 7.5 Error boundaries + 404 page
  [x] 7.6 Landing page with hero and CTAs
  [x] 7.7 Accent color picker + language toggle on preview
```

### Post-MVP scope additions (delivered 2026-03-15 → 2026-03-20)

```
Phase 8 - AI Assistance (PRD section 15)
  [x] 8.1 AI types + AIToggle component + useAIMode hook
  [x] 8.2 POST /api/ai/profile (3-sentence ATS profile, nonsense detection)
  [x] 8.3 POST /api/ai/description (3 strong-verb bullets)
  [x] 8.4 POST /api/ai/skills (6 specific skills, JSON array)
  [x] 8.5 POST /api/ai/keywords (job-posting matching, jobseeker + coach)
  [x] 8.6 Dev-mode prompt panel (systemPrompt + userPrompt visible)
  [x] 8.7 Friendly Swedish error messages, credit-exhaustion detection
```

### V1.1 backlog (open, not started)

```
  [ ] DOCX export
  [ ] Gamification (XP, badges, progress bar)
  [ ] Inspiration tab with mini-challenges
  [ ] Fast track (30-minute mode)
  [ ] Email-CV function
  [ ] Magic link login
  [ ] Advanced version history
  [ ] Photo upload to Supabase Storage
  [ ] Two-column layouts (requires ATS audit)
  [ ] Cover letter feature
  [ ] AI rate limiting / per-user quota (PRD section 14)
  [ ] Persist last-used job posting + keyword matches per CV (PRD section 14)
```

Mark each item with [x] when complete. Never mark complete until the self-check passes.

---

## Pickup Checklist (returning after a break)

Before starting new work after time away:

```bash
pwd                              # /Users/lisa/CV-fix
git status                       # must be clean
git log --oneline -10            # what was the last shipped state?
npx tsc --noEmit                 # must pass
supabase status                  # CLI linked + reachable
gh auth status                   # GitHub CLI authed
vercel whoami                    # Vercel CLI authed (deploy access)
```

Then re-read in this order:
1. `PRD.md` — what we're building (note: v1.2 includes AI section 15)
2. `WORKFLOW.md` — this file
3. `AGENTS.md` — three-role check
4. `CLAUDE.md` — code conventions
5. `git log` since the last doc update — anything shipped that's not yet documented?
