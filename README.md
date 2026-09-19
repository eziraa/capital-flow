# Capital Opportunities Tracker

An internal tool for tracking funding opportunities submitted by companies —
built for the Nexudy junior full-stack take-home assignment
(`docs/assignment.pdf`).

## Overview

Admins create and edit opportunities, assign reviewers, and archive/restore
them. Admins and reviewers move opportunities through a fixed workflow
(`DRAFT → UNDER_REVIEW → APPROVED`/`REJECTED`) and leave internal comments.
Everyone with an account can view the dashboard and the opportunities list.
Every state change — creation, stage change, reviewer reassignment, comment,
archive/restore — is recorded in an append-only activity log.

Admins also manage the team itself from **Admin → Users**: creating
accounts, changing roles, resetting passwords, and enabling/disabling
access — with guards against locking the app out of admins or orphaning a
reviewer's active assignments (see "Key technical decisions" below). This
part was added after the initial build, at the user's request — the
original brief explicitly puts role management out of scope; see "Beyond
the original brief" in `docs/requirement-checklist.md`.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma ORM · PostgreSQL ·
Zod · SWR · NextAuth (Auth.js) v5 with a Credentials provider · bcryptjs ·
Tailwind CSS v4 · shadcn/ui (Radix primitives) for every UI component.

## Architecture

```
Browser
  └─ React (Client Components: filters, forms, detail-page panels)
       └─ SWR                                    (reads)
            └─ Server Action (exported "use server" function)
                 ├─ getActingUser()               — identity from the verified session, never from input
                 ├─ permissions.ts                — role check
                 ├─ Zod schema.safeParse()         — input validation
                 ├─ re-read current record state   — e.g. stage, archivedAt
                 ├─ stage-machine.ts               — business rule (stage transitions)
                 └─ Prisma ($transaction where >1 write) → PostgreSQL
       └─ <form action={serverAction}>            (mutations, via useActionState)
```

- **Trusted:** everything from `getActingUser()` down — the session, role
  checks, Zod schemas, the stage machine, and Prisma queries. This is where
  every actual security and correctness guarantee lives.
- **Untrusted:** everything in the browser, including the URL's query
  string, form field values, hidden inputs, and which buttons are visible.
  The UI hides actions a role can't perform for usability, but every action
  re-checks authentication, role, and record state on the server regardless
  of what the client sends. This was verified manually, not just asserted —
  see "Manual security testing" below.

Route structure: `src/app/(app)/` holds every authenticated page behind a
shared layout with the nav bar; `src/app/login/` is the only public route.
`src/actions/` holds all Server Actions (reads *and* writes); `src/lib/`
holds validation schemas, permission checks, the stage machine, DTO mappers,
and shared client hooks; `src/components/` holds presentation only — no
Prisma or session access.

## Setup

### Prerequisites

- Node.js 20+
- A PostgreSQL server (local install, or `docker run` — see below)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to your PostgreSQL connection string, and
`AUTH_SECRET` to a random value (`npx auth secret` generates one).

### 3. Database setup

Using a local PostgreSQL install:

```bash
createdb capital_opportunities_tracker
```

Or with Docker, if you'd rather not install PostgreSQL locally (mapped to
host port `5433` here so it doesn't collide with a Postgres you may already
have running on the default `5432`; use `5432:5432` instead if you're sure
nothing else is listening there):

```bash
docker run --name capital-tracker-db -e POSTGRES_USER=capital_tracker \
  -e POSTGRES_PASSWORD=capital_tracker_dev_pw \
  -e POSTGRES_DB=capital_opportunities_tracker \
  -p 5433:5432 -d postgres:16
```

Then set `DATABASE_URL` in `.env` to match whichever of the above you used,
e.g. for the Docker command as written:
`postgresql://capital_tracker:capital_tracker_dev_pw@localhost:5433/capital_opportunities_tracker?schema=public`.

### 4. Run migrations and seed data

```bash
npm run db:migrate   # applies prisma/migrations
npm run db:seed       # populates seed data (safe to re-run — it clears opportunity data first)
```

### 5. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`.

### Other scripts

```bash
npm run build       # production build
npm run start        # run a production build
npm run lint          # ESLint
npm run typecheck   # tsc --noEmit
npm run db:studio  # Prisma Studio, a GUI over the database
```

## Seeded accounts

All seeded users share the password **`password123`**.

| Role | Email |
| --- | --- |
| Admin | `admin@nexudy.test` |
| Reviewer | `reviewer1@nexudy.test` |
| Reviewer | `reviewer2@nexudy.test` |
| Viewer | `viewer@nexudy.test` |

The login page also displays these for convenience. The seed also creates a
**disabled** reviewer account (`former-reviewer@nexudy.test`) so the
disabled state — and the fact that it can't sign in — is visible without
having to disable someone yourself first.

## Manual testing performed

Beyond `npm run typecheck`, `npm run lint`, and `npm run build` all passing
clean, the running app was exercised end-to-end with a headless-browser
script (login as each of the three roles; search/filter/sort/paginate the
list; open a detail page; create, edit, change stage, assign a reviewer, add
a comment, archive, and restore; confirm role-restricted actions are absent
from the UI for reviewers/viewers; check a 375px mobile viewport) with zero
browser console errors.

**Server-side enforcement was verified, not just assumed.** Hiding a button
proves nothing about security, so the actual HTTP request behind the "Move
to Under review" button was captured (its exact multipart body and
`Next-Action` header), then replayed with `curl` against a `DRAFT`
opportunity with the `stage` field changed to `APPROVED` — an illegal direct
jump. Using a real, valid admin session cookie, the server still rejected
it:

```json
{"ok":false,"error":{"kind":"CONFLICT","message":"An opportunity in DRAFT cannot move to APPROVED."}}
```

and the database row was confirmed unchanged. This exercises exactly the
scenario the assignment calls out: "a request is made outside the user
interface."

## Key technical decisions

- **`getActingUser()` re-reads role and disabled status from PostgreSQL on
  every Server Action call, instead of trusting the session JWT.** Without
  this, an admin disabling a user or changing their role would have no
  effect on that user until their session expired and they logged back in
  — the exact "even outside the user interface" gap this app treats as a
  real boundary everywhere else. The cost is one extra indexed lookup per
  action, which is negligible at this scale and is the same trade every
  database-session-backed auth system makes implicitly.
- **Users are disabled, never hard-deleted.** A `disabledAt` timestamp
  (mirroring `Opportunity.archivedAt`) blocks sign-in and is treated as
  unauthenticated by every Server Action, while leaving their existing
  comments, activity entries, and created/reviewed opportunities intact —
  deleting the row would either cascade-orphan that history or require
  `onDelete: Restrict` blocking the delete anyway.
- **Two guards protect the app from locking itself out**, checked inside
  the same transaction as the write: `updateUser`/`disableUser` refuse to
  demote or disable the last remaining active admin, and `updateUser`
  refuses to move a reviewer off that role while they still hold active
  (non-archived) opportunity assignments — both verified manually, not just
  asserted (see `docs/requirement-checklist.md` → "Beyond the original
  brief").
- **Create and edit are modals (shadcn `Dialog`), not separate routes.**
  `OpportunityFormDialog` wraps the same `OpportunityForm` used either way;
  the caller decides what "success" means — the list page navigates to the
  new opportunity's detail page, while the detail page just revalidates its
  SWR data and closes, so an edit updates in place with no navigation at
  all. There's deliberately no `/opportunities/new` or `/opportunities/
  [id]/edit` route anymore — the modal is the only way in, so there's no
  second code path to keep in sync.
- **Every UI component is shadcn/ui**, not hand-rolled. Buttons, inputs,
  selects, the table, cards, badges, dialogs, the sidebar, and toasts
  (Sonner) all come from `src/components/ui/`, generated via the shadcn CLI
  and customized in place (e.g. `success`/`warning` badge variants added
  alongside shadcn's defaults, since stage badges need colors shadcn's base
  palette doesn't ship). Radix's `Select` renders a hidden native `<select>`
  when given a `name`, so it drops directly into the `<form action=
  {serverAction}>` + `FormData` pattern below without extra plumbing — the
  one exception is the reviewer-assignment "Unassigned" option, which uses a
  sentinel value since Radix disallows an empty-string item value.
- **NextAuth v5 (Auth.js) split into `auth.config.ts` + `auth.ts`.** The
  Credentials provider's `authorize()` needs Prisma and bcryptjs, which
  can't run on the Edge runtime. `proxy.ts` (Next 16's renamed
  `middleware.ts`) only needs to know whether a session cookie is valid, so
  it's built from `auth.config.ts` alone — keeping Prisma/bcryptjs out of
  the Edge bundle entirely.
- **`useActionState` + `<form action={...}>` for every mutation**, not
  ad-hoc `onClick` handlers. This gives duplicate-submission protection via
  `useFormStatus` for free (the submit button disables itself while
  pending), works with progressive enhancement, and keeps the "one Server
  Action per mutation" model the assignment asks for. Reads go through SWR
  instead, with the same Server Actions as fetchers.
- **A single append-only `Activity` model** with explicit typed columns
  (`previousStage`/`newStage`, `previousReviewerId`/`newReviewerId`,
  `commentId`) rather than a generic JSON blob. This keeps the timeline
  queryable and type-safe, at the cost of a few nullable columns that are
  only ever populated for their matching `type`.
- **`archivedAt: DateTime?` instead of `archived: Boolean`** on
  `Opportunity` — same behavior, but records *when* an opportunity was
  archived at no extra cost.
- **Structured `ActionResult<T>` return type** for every Server Action
  (`{ ok: true, data }` or `{ ok: false, error: { kind, message,
  fieldErrors? } }`) instead of throwing. This lets the UI distinguish
  validation errors (shown inline, per field) from authorization/business-
  rule errors (shown as a toast) without parsing error strings.
- **Edit vs. stage change vs. reviewer assignment are three separate
  actions**, not one big "update opportunity" endpoint — matching the role
  table exactly (an admin editing company details is a different
  permission, and a different kind of change, than a reviewer moving the
  stage).

## Assumptions

- **Create always starts at `DRAFT`.** The stage field isn't exposed on the
  create form — the brief lists stage validation as a rule for the form,
  but also defines a strict transition graph starting from `DRAFT`, and
  letting a form set an arbitrary starting stage would bypass that graph
  entirely. New opportunities are created in `DRAFT` and moved forward only
  through the governed stage-change action.
- **The edit form does not include stage or reviewer.** Those are already
  separate, explicitly-listed actions ("assign a reviewer," "change its
  stage") with their own rules and activity records; folding them into a
  generic edit would let a plain field edit silently skip the transition
  rules.
- **"Active," for archive and dashboard purposes, means "not archived,"
  regardless of stage.** An `APPROVED` or `REJECTED` opportunity still
  counts as active (and still counts toward reviewer workload) until an
  admin archives it.
- **Search is a simple case-insensitive substring match** on company name
  (`ILIKE '%term%'` via Prisma's `contains`/`insensitive`). A `btree` index
  exists on `companyName`, but a plain `%term%` pattern can't use it
  efficiently at a larger data volume — see "What I'd improve."
- **Archived opportunities also can't receive new comments.** The brief
  only lists "edited or moved to another stage" as blocked while archived,
  but leaving comments open on a record everything else treats as frozen
  seemed inconsistent, so `addComment` returns `CONFLICT` for archived
  opportunities too (existing comments remain visible).
- **The 12-opportunity seed minimum** was read as "at least 12, covering
  every stage/role/etc.," so the seed creates 14 to comfortably cover every
  combination (multiple reviewers, several comments, two archived records)
  rather than exactly 12.

## What I'd improve with more time

- Add a `pg_trgm` GIN index for company-name search instead of a plain
  `btree`, since `ILIKE '%term%'` can't use a b-tree efficiently once the
  table is large.
- Automated tests (unit tests for the stage machine and permission
  functions, integration tests for the Server Actions against a test
  database) — everything here was verified manually (see above) rather
  than with a test suite, which is the main gap I'd close first.
- Optimistic SWR updates for stage changes/comments instead of waiting for
  the round trip, with rollback on error.
- A small `pg_trgm`-backed "did you mean" or fuzzy search, and configurable
  page size.
- CSV export of the activity log (listed as an optional enhancement in the
  brief; not attempted in favor of hardening the core requirements).

## Requirements not completed

All required functionality is implemented — see
`docs/requirement-checklist.md` for a line-by-line audit against the
assignment. None of the optional enhancements (CSV export, dashboard chart,
optimistic UI, Docker Compose, hosted deployment) were attempted, per the
brief's own guidance to prioritize the core requirements first.

## AI usage

This project was built with Claude (Anthropic) as a pair-programming
assistant inside Claude Code, working from the assignment PDF end to end —
schema design, Server Actions, UI components, the seed script, and this
documentation were all AI-drafted and then reviewed. Concretely:

- **Reviewed and manually verified rather than trusted:** every
  authorization/business-rule path (role checks, the stage machine, archive
  restrictions) was checked by reading the code, then confirmed by actually
  running the app and, for the stage machine specifically, by capturing and
  replaying the real HTTP request with a tampered value (see "Manual
  security testing" above) rather than taking the code's correctness on
  faith.
- **Debugged during development, not just generated:** real issues were hit
  and fixed along the way — a NextAuth v5 TypeScript module-augmentation gap
  (`next-auth/jwt` re-exports its `JWT` type from `@auth/core/jwt` rather
  than declaring it, so augmenting the former alone left `token.role` typed
  as `unknown`); Next.js 16's `middleware.ts` → `proxy.ts` rename; a
  `Tooltip must be used within TooltipProvider` runtime error from the
  sidebar's collapsed-icon tooltips after migrating to shadcn/ui; a Radix
  bug where calling `event.preventDefault()` in a `DropdownMenuItem`'s
  `onSelect` (to let a Dialog open from a menu item) also blocks the menu's
  own default close behavior, leaving it stuck open and swallowing the next
  click — found because a browser-driven test kept timing out on an
  interaction that looked correct in the code; and a real pluralization bug
  in a guard's error message ("5 active opportunit**yies**") caught by
  reading the actual toast text in a screenshot rather than trusting a
  boolean assertion.
- **Design decisions were made and owned, not auto-accepted:** the data
  model (a single typed `Activity` log vs. a generic JSON event table), the
  `useActionState`-per-mutation pattern, and the assumptions listed above
  were deliberate choices made while reviewing the assignment's exact
  wording, not left to whatever the assistant produced first.
