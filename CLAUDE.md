# CLAUDE.md - Instructions for Claude in Cursor

Read this entire file before writing any code.
Then read AGENTS.md and WORKFLOW.md.
All three files must be in your active context on every task.

---

## What we are building

A CV builder for job seekers in Sweden's Rusta och Matcha employment program.
ATS-safe PDFs. Mobile-first. Coach mode for reviewing and editing participant CVs.

Full product specification: `PRD.md`
Working methodology: `WORKFLOW.md`
Role definitions: `AGENTS.md`

---

## Your operating mode

You simultaneously embody three roles: Product Owner, UX Specialist, Senior Developer.
Before any task, run the Three-Role Check defined in AGENTS.md.
Follow the Task Protocol defined in WORKFLOW.md exactly.

You are not a yes-man. Push back when something is wrong.
You do not assume. You ask.
You do not loop. After 3 failed attempts, you stop and report.

---

## GitHub Remote

```bash
# The project remote is:
git remote add origin https://github.com/L-Lisa/CV-fix.git

# Verify with:
git remote -v

# Push after every verified sub-task:
git push origin main
```

---

## Supabase CLI Setup

```bash
# Install
brew install supabase/tap/supabase

# Authenticate
supabase login

# Link to your project (replace with actual project ref from Supabase dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Verify
supabase status

# Create a migration
supabase migration new migration_name

# Push migrations to database
supabase db push

# Regenerate TypeScript types (run after every migration)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

Your Supabase project ref and project ID are found in:
Supabase dashboard -> Project Settings -> General -> Reference ID

---

## Environment Variables

The project is flat at the repo root (no `cv-builder/` subdirectory). Create `/Users/lisa/CV-fix/.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # production: https://your-domain
ANTHROPIC_API_KEY=your_anthropic_key         # used by /api/ai/* routes
```

Rules:
- `.env.local` is in `.gitignore` — never commit it.
- `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-side only. Never prefix with `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_SITE_URL` is used by the auth flow to build email-confirmation redirect URLs.

---

## Tech Stack (locked - do not deviate)

| Component   | Choice                                              |
|-------------|-----------------------------------------------------|
| Framework   | Next.js 14 App Router                               |
| Language    | TypeScript (strict mode)                            |
| Styling     | Tailwind CSS + shadcn/ui                            |
| Backend/DB  | Supabase (auth, RLS, PostgreSQL)                    |
| PDF export  | @react-pdf/renderer via API Route                   |
| Forms       | React Hook Form + Zod                               |
| AI          | @anthropic-ai/sdk, model `claude-sonnet-4-6`        |
| Deployment  | Vercel                                              |

**Forbidden:**
- `pages/` router - always use `app/` router
- `any` in TypeScript
- `html2canvas` for PDF - image-based PDF is not ATS-safe
- Inline styles - use Tailwind classes
- Unnecessary Client Components - Server Components are default

---

## Project Structure (current as of 2026-05-04)

```
/app
  /(auth)/login/page.tsx
  /(auth)/register/page.tsx
  /(app)/dashboard/page.tsx
  /(app)/cv/new/page.tsx
  /(app)/cv/[id]/edit/page.tsx
  /(app)/cv/[id]/edit/[step]/page.tsx
  /(app)/cv/[id]/preview/page.tsx
  /(app)/coach/dashboard/page.tsx
  /(app)/coach/cv/[id]/page.tsx
  /(app)/coach/participant/[userId]/page.tsx
  /(guest)/cv/guest/page.tsx
  /(guest)/cv/guest/[step]/page.tsx
  /(guest)/cv/guest/preview/page.tsx
  /auth/callback/route.ts                  -> email-confirmation handler
  /api/cv/[id]/pdf/route.ts                -> authed PDF export
  /api/cv/guest/pdf/route.ts               -> guest PDF export
  /api/ai/profile/route.ts                 -> AI: profile text (PRD §15.1)
  /api/ai/description/route.ts             -> AI: experience bullets
  /api/ai/skills/route.ts                  -> AI: skill suggestions
  /api/ai/keywords/route.ts                -> AI: job-posting matching
  page.tsx                                 -> landing page
  error.tsx, not-found.tsx                 -> error boundaries

/components
  /cv-form/          -> step components (one per CV section)
  /cv-preview/       -> on-screen CV preview (HTML, not PDF)
  /cv/               -> shared CV widgets, including AIToggle.tsx
  /coach/            -> coach-specific UI
  /pdf/              -> @react-pdf templates
  /guest/            -> guest-mode banner / wrappers
  /auth/             -> login/register form components
  /ui/               -> shadcn/ui primitives

/lib
  /supabase/client.ts          -> browser client
  /supabase/server.ts          -> server client
  /supabase/middleware.ts      -> session refresh
  /actions/                    -> Server Actions (auth, cv, coach, guest)
  /queries/                    -> read helpers (cv, coach)
  /pdf/                        -> PDF rendering helpers
  /ats/                        -> ATS validation logic
  /validation/                 -> Zod schemas
  /guest/                      -> localStorage helpers
  /utils/, utils.ts            -> small shared utilities

/supabase
  /migrations/       -> all SQL migration files (currently one: 20260314_initial_schema.sql)

/types/index.ts      -> ALL TypeScript types (incl. AI* types — PRD §15)
/types/database.ts   -> generated by Supabase CLI (do not edit manually)
```

Note: coach-participant linking is implemented as a **Server Action** in `lib/actions/coach.ts` — there is no `/api/coach/link` route. PRD § 6.2 describes the flow.

---

## Code Conventions

### TypeScript

```typescript
// OK: Explicit typing always
async function getCV(cvId: string): Promise<CV | null> { ... }

// OK: Import types from /types/index.ts
import type { CV, CVExperience } from '@/types'

// FORBIDDEN
const data: any = ... // never
```

### Supabase

```typescript
// OK: server client for server-side
import { createClient } from '@/lib/supabase/server'

// OK: handle errors explicitly
const { data, error } = await supabase.from('cvs').select('*')
if (error) throw new Error(`Failed to fetch CVs: ${error.message}`)

// WARNING: always handle the null case from .single()
const { data, error } = await supabase.from('cvs').select().eq('id', id).single()
if (error || !data) return null
```

### Forms

```typescript
// OK: React Hook Form + Zod from /lib/validation/
const schema = z.object({
  firstName: z.string().min(1, 'Förnamn krävs'),
  email: z.string().email('Ogiltig e-postadress'),
})

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
})
```

### Error Handling

```typescript
// OK: try/catch in all Server Actions and API routes
export async function updateCV(cvId: string, data: Partial<CV>) {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('cvs').update(data).eq('id', cvId)
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('updateCV failed:', err)
    return { success: false, error: 'Kunde inte spara ändringar' }
  }
}
```

Note: UI error messages shown to users must be in Swedish.
Code-level logs and thrown errors should be in English.

---

## AI Routes (PRD § 15)

AI endpoints live under `/app/api/ai/`. All four follow the same shape:

```typescript
// OK: server-only Anthropic client, never expose to client
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Parse + validate the typed payload (AIProfilePayload, etc.)
  // 2. Branch on auth vs guest:
  //    - cvId + !isGuest -> createClient() + auth.getUser() + ownership check via getFullCV()
  //    - guestData       -> use directly, no DB access
  // 3. Build user prompt from CV context (or guestData)
  // 4. Call client.messages.create({ model: 'claude-sonnet-4-6', system, messages })
  // 5. Return AIResult { result, systemPrompt?, userPrompt?, error? }
}
```

Rules:
- Model is locked to `claude-sonnet-4-6` across all four routes. Don't change it without updating PRD §15 and discussing with the user — this affects cost and output quality.
- `ANTHROPIC_API_KEY` is server-side only.
- Coach access to `/api/ai/keywords` requires a `coach_links` row matching `coach_id = current_user` and `user_id = CV owner`.
- All user-facing error messages are in Swedish (e.g. "Tjänsten är tillfälligt otillgänglig — försök igen om en stund.").
- In dev (`process.env.NODE_ENV !== 'production'`), include `systemPrompt` and `userPrompt` in the response so the UI's expandable dev panel can render them. Never include them in production.
- AI is opt-in via `AIToggle` (`components/cv/AIToggle.tsx`). State is per-session in localStorage. Default = off.

System prompts already encode strict rules (forbidden buzzwords, exact format, "never invent facts"). Don't loosen these without discussing with the user — they exist to keep ATS safety intact.

---

## ATS Safety (critical)

PDF must be text-based. Never image-based.

```typescript
// OK: React-PDF via API Route
import { renderToBuffer } from '@react-pdf/renderer'
import { CVDocument } from '@/lib/pdf/templates/CVDocument'

export async function POST(request: Request) {
  const cv = await request.json()
  const buffer = await renderToBuffer(<CVDocument cv={cv} />)
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cv.pdf"',
    },
  })
}

// FORBIDDEN: html2canvas -> jsPDF (produces image PDF, fails ATS)
```

PDF layout rules:
- Single column always - never two-column
- Standard fonts only: Helvetica or Times
- Section headings adapt to CV language (sv or en)

---

## Security

```typescript
// Always verify ownership before modifying data
const { data: { user } } = await supabase.auth.getUser()
if (!user) return new Response('Unauthorized', { status: 401 })

const { data: cv } = await supabase
  .from('cvs').select('user_id').eq('id', cvId).single()

if (cv?.user_id !== user.id) {
  return new Response('Forbidden', { status: 403 })
}

// Coach: verify coach_link exists before granting access
const { data: link } = await supabase
  .from('coach_links')
  .select('id')
  .eq('coach_id', user.id)
  .eq('user_id', targetUserId)
  .single()

if (!link) return new Response('Forbidden', { status: 403 })
```

---

## Database Rules

- RLS is ON for every table - write policies before inserting any data
- Migrations go in `/supabase/migrations/` with format: `20240314_descriptive_name.sql`
- Never modify an existing migration - always create a new one
- Regenerate types after every migration

---

## UI/UX Standards

- Mobile-first: build for 375px, scale up
- All form inputs have visible label elements
- Swedish validation messages in the UI
- Every list/section has an empty state with a call-to-action
- Use shadcn/ui Skeleton for loading states
- Guest user warning: prominent banner, not a tooltip

---

## Naming Conventions

| Type                | Convention         | Example                   |
|---------------------|--------------------|---------------------------|
| Files (components)  | PascalCase         | PersonalInfoStep.tsx      |
| Files (utilities)   | camelCase          | atsValidation.ts          |
| Variables/functions | camelCase          | getCVById()               |
| Types/Interfaces    | PascalCase         | CVExperience              |
| Database tables     | snake_case         | cv_experiences            |
| CSS classes         | Tailwind utilities | className="flex gap-4"    |

---

## Development Workflow

1. New feature -> Zod schema in `/lib/validation/` first
2. Then types in `/types/index.ts`
3. Then Server Action or API route
4. Then UI component

UI never drives data structure.

---

## Session Start Checklist

Run this at the start of every Cursor session:

```bash
pwd
git status
git log --oneline -5
supabase status
npx tsc --noEmit
```

Only start new work if git is clean and TypeScript compiles.

---

<!-- "First Task in a New Project" bootstrap section removed 2026-05-04: project is past Phase 1. See git history for the original setup. -->

## Recent Activity Pointer

The codebase is past MVP. Phases 1–7 (PRD §5 MVP) and Phase 8 (PRD §15 AI) are shipped. When picking up work after a break, run the **Pickup Checklist** in WORKFLOW.md before starting anything new.
