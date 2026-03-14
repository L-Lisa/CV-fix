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

Follow this commit format every time:

```bash
git add -A
git commit -m "[role] short description of what was done

- bullet point detail
- bullet point detail"

git push origin main
```

Role prefix must be one of: `[dev]`, `[ux]`, `[po]`, `[fix]`, `[test]`

Examples:
- `[dev] Add Supabase RLS policies for cv_experiences table`
- `[ux] Add empty state and loading skeleton to CV form step 3`
- `[fix] Resolve TypeScript error in PDF export route`

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

### Branch Strategy (MVP)

Work directly on `main` for MVP. No feature branches unless the user requests them.

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
git commit -m "[dev] Add migration: descriptive_name_here"
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

## Session Start Checklist

At the start of every new Cursor session, run:

```bash
# 1. Verify you are in the right directory
pwd

# 2. Check git status - should be clean
git status
git log --oneline -5

# 3. Verify Supabase connection
supabase status

# 4. TypeScript check on existing code
npx tsc --noEmit

# 5. Read PRD.md to reorient
cat PRD.md | head -80
```

Only start new work if git status is clean and TypeScript compiles.

---

## Feature Development Order (MVP)

Work in this sequence. Do not jump ahead.

```
Phase 1 - Foundation
  [ ] 1.1 Next.js project setup + dependencies
  [ ] 1.2 Supabase client setup (client.ts, server.ts, middleware.ts)
  [ ] 1.3 All SQL migrations + RLS policies
  [ ] 1.4 TypeScript types generated from database

Phase 2 - Auth
  [ ] 2.1 Register page (user + coach roles)
  [ ] 2.2 Login page
  [ ] 2.3 Auth middleware (protect app routes)
  [ ] 2.4 Guest mode (localStorage warning)

Phase 3 - CV Form (core)
  [ ] 3.1 CV creation flow + routing
  [ ] 3.2 Step 1: Personal info form
  [ ] 3.3 Step 2: Profile text form
  [ ] 3.4 Step 3: Work experience form (repeatable)
  [ ] 3.5 Step 4: Education form (repeatable)
  [ ] 3.6 Step 5: Skills, Languages, Other (repeatable)
  [ ] 3.7 Step navigation + progress indicator

Phase 4 - CV Preview + ATS
  [ ] 4.1 CV preview component (React-PDF document)
  [ ] 4.2 Layout 1 (simple, single column)
  [ ] 4.3 Layout 2 (accent color)
  [ ] 4.4 Layout 3 (extended sections)
  [ ] 4.5 ATS validation logic (hard + soft rules)
  [ ] 4.6 ATS check panel in UI

Phase 5 - Export
  [ ] 5.1 PDF export API route
  [ ] 5.2 Export UI (download button, blocked state on errors)

Phase 6 - Coach Mode
  [ ] 6.1 Coach dashboard (participant list)
  [ ] 6.2 Coach-participant linking via email
  [ ] 6.3 Comment mode (add comments per section)
  [ ] 6.4 Edit mode (edit participant CV fields)
  [ ] 6.5 Participant view of coach comments

Phase 7 - Polish
  [ ] 7.1 Mobile QA pass on all screens
  [ ] 7.2 Accessibility audit (labels, contrast, keyboard nav)
  [ ] 7.3 Empty states on all lists
  [ ] 7.4 Loading states on all async operations
  [ ] 7.5 Error boundaries
```

Mark each item with [x] when complete. Never mark complete until the self-check passes.
