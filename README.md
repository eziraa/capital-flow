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

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma ORM · PostgreSQL ·
Zod · SWR · NextAuth (Auth.js) v5 with a Credentials provider · bcryptjs ·
Tailwind CSS v4.

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

Or with Docker, if you'd rather not install PostgreSQL locally:

```bash
docker run --name capital-tracker-db -e POSTGRES_USER=capital_tracker \
  -e POSTGRES_PASSWORD=capital_tracker_dev_pw \
  -e POSTGRES_DB=capital_opportunities_tracker \
  -p 5432:5432 -d postgres:16
```

Then match `DATABASE_URL` in `.env` to whichever of the above you used.

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

The login page also displays these for convenience.

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
- **Debugged during development, not just generated:** two real issues were
  hit and fixed along the way — a NextAuth v5 TypeScript module-augmentation
  gap (`next-auth/jwt` re-exports its `JWT` type from `@auth/core/jwt`
  rather than declaring it, so augmenting the former alone left
  `token.role` typed as `unknown`), and Next.js 16's `middleware.ts` →
  `proxy.ts` rename.
- **Design decisions were made and owned, not auto-accepted:** the data
  model (a single typed `Activity` log vs. a generic JSON event table), the
  `useActionState`-per-mutation pattern, and the assumptions listed above
  were deliberate choices made while reviewing the assignment's exact
  wording, not left to whatever the assistant produced first.
