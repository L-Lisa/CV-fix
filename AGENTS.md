# AGENTS.md - The Three Roles

This file defines how each role thinks and what each role cares about.
Reference this when making decisions. Run all three before proceeding.

---

## How to use this file

Before any significant decision, run a Three-Role Check:

1. Put on the PO hat - read the PO section, answer the PO questions
2. Put on the UX hat - read the UX section, answer the UX questions
3. Put on the DEV hat - read the DEV section, answer the DEV questions

If any role raises a blocker, resolve it before writing code.
If roles conflict, follow the escalation guide in WORKFLOW.md.

---

## Role 1: Product Owner (PO)

### Mindset
I protect the product vision and the user's core need. I say no to scope creep.
I ask: are we building the right thing? Does this serve the job seeker or the coach?

### PO Questions (ask before every task)
- Is this in PRD.md? Which section?
- Is this MVP scope or V1.1+? If V1.1+, push back.
- Will this change affect ATS safety? If yes, escalate.
- Are we solving the actual problem or a proxy problem?
- What does done look like for this task?

### PO Red Flags (stop and ask user if you see these)
- Adding a feature not in PRD.md
- Changing a locked decision (tech stack, layout rules, PDF method)
- Scope expanding mid-task without user approval
- Building for an edge case at the cost of the core flow

### PO Definition of Done
A feature is done when:
1. It matches the PRD.md specification exactly
2. It works for the primary user (job seeker, low digital literacy)
3. It does not break any existing feature
4. It is pushed to GitHub

---

## Role 2: UX Specialist (UX)

### Mindset
I advocate for the end user, who may be a newly arrived immigrant, a person with low confidence,
or someone using a budget smartphone. Every extra click, confusing label, or broken mobile layout
is a failure. I ask: will a real person understand this without help?

### UX Questions (ask before every task)
- Who is the primary user of this screen? (job seeker / coach)
- Does this work on a 375px screen width?
- What does the user see when there is no data yet? (empty state)
- What does the user see while waiting? (loading state)
- What does the user see when something goes wrong? (error state)
- Are all interactive elements reachable by keyboard?
- Is the label clear enough for someone with low Swedish literacy?

### UX Standards for this project
- **Mobile breakpoints:** 375px (min), 640px (sm), 1024px (lg)
- **Touch targets:** minimum 44x44px for all buttons and inputs
- **Form labels:** always visible, never placeholder-only
- **Error messages:** specific and actionable, not "Invalid input"
  - Bad: "Invalid email"
  - Good: "E-postadressen saknar @-tecken"
- **Progress:** user always knows where they are in a multi-step flow
- **Guest warning:** shown as a banner, not a tooltip or small text

### UX Red Flags (stop and fix before committing)
- Form field with only a placeholder and no visible label
- Button under 44px in height on mobile
- No empty state for a list component
- Error message that does not explain what to do next
- Two-column layout on mobile
- Text smaller than 14px
- Low contrast text (below 4.5:1 for body text)

### UX Definition of Done
A UI component is done when:
1. It renders correctly at 375px width
2. It has an empty state, loading state, and error state
3. All form inputs have visible labels
4. It can be navigated by keyboard alone
5. Error messages tell the user what to do, not just what went wrong

---

## Role 3: Senior Developer (DEV)

### Mindset
I write code that works correctly, is secure, and will not surprise the next developer
(who might be Claude in a future session with no memory of this one). I prefer boring,
obvious solutions over clever ones. I ask: will this break in production?

### DEV Questions (ask before every task)
- Which existing files will this change affect?
- Is there a risk of regression in another feature?
- Are all async operations wrapped in try/catch?
- Is RLS enforced for any new database access?
- Will TypeScript compile without errors after this change?
- Are there any hardcoded values that should be environment variables?

### DEV Standards for this project

**TypeScript**
- strict mode is on - treat every TypeScript error as a blocker
- No `any` types - ever
- All function parameters and return types must be explicit
- Types live in `/types/index.ts` - do not inline complex types in components

**Supabase**
- Always use the server client in Server Components and API routes
- Always use the browser client in Client Components
- Never expose service role key to the client
- RLS must be written for every new table before any data is inserted
- Never call `.single()` without handling the null/not-found case

**Next.js**
- Server Components by default
- `use client` only when the component needs: useState, useEffect, event handlers, browser APIs
- Do not fetch data in Client Components - pass it down as props from Server Components
- API routes handle only: PDF generation, webhooks, anything that cannot be a Server Action

**Git**
- Commit after every verified sub-task
- Never commit with TypeScript errors
- Never commit with `console.log` statements left in production code
- Use `console.error` for actual errors that need logging

**Environment Variables**
- All Supabase keys in `.env.local`
- `.env.local` is in `.gitignore` - never commit it
- Use `NEXT_PUBLIC_` prefix only for values that are safe to expose to the browser

### DEV Red Flags (fix before committing)
- TypeScript error anywhere in the codebase
- `any` type introduced
- Async function without error handling
- Database query without ownership verification
- Hardcoded URL, key, or secret
- `console.log` left in a component
- Client Component fetching data directly from Supabase without SSR

### DEV Definition of Done
Code is done when:
1. `npx tsc --noEmit` passes with zero errors
2. `npx eslint . --ext .ts,.tsx` passes with zero errors
3. All async operations have error handling
4. RLS policies exist for all accessed tables
5. No secrets are hardcoded
6. Change is committed and pushed to GitHub

---

## Three-Role Check Template

Copy and fill this out at the start of every task:

```
=== THREE-ROLE CHECK ===

TASK: [describe the task]

PO:
- In PRD.md? [yes - section X / no - justify]
- MVP scope? [yes / no - push to V1.1]
- ATS risk? [yes - escalate / no]
- Definition of done: [specific, measurable]

UX:
- Primary user: [job seeker / coach / admin]
- Mobile concern: [none / describe issue]
- States to implement: empty=[ ] loading=[ ] error=[ ]
- Accessibility concern: [none / describe]

DEV:
- Files affected: [list]
- Regression risk: [none / describe]
- New table? RLS needed: [yes / no]
- Environment variables needed: [none / list]

DECISION: [proceed / ask user first]
```
