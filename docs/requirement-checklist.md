# Requirement checklist

Status of every requirement in the assignment brief (`docs/assignment.pdf`),
checked against the actual implementation.

| Requirement | Status | Evidence |
| --- | --- | --- |
| **1. Opportunities list** | | |
| Table/clear layout of all opportunities | Complete | `src/components/opportunities/OpportunityTable.tsx` |
| Search by company name | Complete | `OpportunityFilters.tsx` (debounced) → `listOpportunities` `contains`/insensitive |
| Filter by stage | Complete | `OpportunityFilters.tsx` stage `<select>` |
| Sort by requested amount | Complete | `OpportunityTable.tsx` sortable column header |
| Sort by submission date | Complete | `OpportunityTable.tsx` sortable column header |
| Pagination | Complete | `src/components/ui/Pagination.tsx`, `PAGE_SIZE = 10` |
| Open an individual opportunity | Complete | row/card links to `/opportunities/[id]` |
| Search/filter/sort/page state in the URL | Complete | `src/lib/use-opportunity-list-query.ts` |
| Loading / empty / error states | Complete | `TableSkeleton`, `EmptyState`, `ErrorState` in `OpportunitiesListClient.tsx` |
| Filtering/sorting/pagination server-side, not full dataset in browser | Complete | `listOpportunities` builds a Prisma `where`/`orderBy`/`skip`/`take` query; the browser only ever receives one page |
| **2. Opportunity details** | | |
| Dynamic route, all fields shown | Complete | `src/app/(app)/opportunities/[id]/page.tsx` + `OpportunityDetailClient.tsx` |
| Edit, assign reviewer, change stage, comment actions | Complete | same file, role-gated sections |
| Not-found state | Complete | `src/app/(app)/opportunities/[id]/not-found.tsx`, triggered via `notFound()` when `getOpportunity` returns `NOT_FOUND` |
| **3. Create and edit forms** | | |
| Server-side validation | Complete | Zod schemas in `src/lib/validation/opportunity.ts`, enforced inside `createOpportunity`/`updateOpportunity` regardless of client input |
| Client-side feedback | Complete | `OpportunityForm.tsx` renders field errors returned from the server; native `required`/`min`/`maxLength` hints (form uses `noValidate` so the server is always the real gate, exercised by every submit) |
| Company name required, not whitespace-only | Complete | `companyName` schema: trim → `min(1)` |
| Amount > 0 | Complete | `requestedAmount` schema: `positive()` |
| Currency in USD/EUR/GBP | Complete | `currency` schema: `z.enum(Currency)` |
| Description required, ≤ 500 chars | Complete | `description` schema |
| Submission date valid | Complete | `submissionDate` schema: `z.coerce.date()` |
| Stage one of the supported values | Complete | stage is never free-form client input — see assumption below |
| Field-level validation messages | Complete | `Field.tsx` renders `fieldError(state, name)` next to each input |
| **4. Stage transitions** | | |
| Only `DRAFT→UNDER_REVIEW`, `UNDER_REVIEW→APPROVED`, `UNDER_REVIEW→REJECTED` allowed | Complete | `src/lib/stage-machine.ts`, enforced inside `changeOpportunityStage`'s transaction against the row's current stage |
| Server rejects all other transitions, even outside the UI | Complete | verified manually by replaying the raw multipart Server Action request with a tampered `stage=APPROVED` against a `DRAFT` record — server returned `CONFLICT` and the database was unchanged (see README → "Manual security testing") |
| Activity record on every stage change (prev, new, actor, timestamp) | Complete | `changeOpportunityStage` creates an `Activity` row with `type: STAGE_CHANGED` |
| Stage change + activity as one operation | Complete | both writes are inside the same `prisma.$transaction` |
| **5. Authentication and roles** | | |
| NextAuth Credentials provider | Complete | `src/auth.ts` |
| Users stored in Postgres via Prisma | Complete | `prisma/schema.prisma` `User` model |
| Passwords hashed with bcryptjs | Complete | `bcrypt.hash`/`bcrypt.compare` in `prisma/seed.ts` and `src/auth.ts` |
| `authorize()` loads user + verifies password itself | Complete | `src/auth.ts` |
| Seeded ADMIN/REVIEWER/VIEWER accounts | Complete | `prisma/seed.ts` (1 admin, 2 reviewers, 1 viewer) |
| Role permission table matched exactly | Complete | `src/lib/permissions.ts` mirrors the brief's table 1:1 |
| Role checks enforced server-side, not just hidden buttons | Complete | every action in `src/actions/*.ts` checks role before touching the database; verified by direct HTTP replay (see above) |
| Login page + sign-out | Complete | `src/app/login`, `src/actions/auth.ts` |
| Unauthenticated requests redirected to login | Complete | `src/proxy.ts` (Next 16's `middleware` → `proxy` rename) via `authConfig.callbacks.authorized` |
| User id + role in session | Complete | `src/auth.config.ts` `jwt`/`session` callbacks, typed via `src/types/next-auth.d.ts` |
| Secure/JWT session | Complete | `session: { strategy: "jwt" }` |
| Unauthenticated/forbidden result from protected actions | Complete | `unauthenticated()`/`forbidden()` in `src/lib/action-result.ts` |
| Seeded credentials documented | Complete | README → "Seeded accounts" |
| Direct role checks, no policy system | Complete | `src/lib/permissions.ts` is plain boolean functions |
| Acting user id/role never taken from form input | Complete | every action calls `getActingUser()` (reads the verified session) instead of reading an id/role from `input`/`formData` |
| Reviewer assignment verifies the target user has the `REVIEWER` role | Complete | `assignReviewer` transaction re-checks `reviewer.role === "REVIEWER"` |
| **6. Dashboard** | | |
| Total active opportunities | Complete | `getDashboardSummary` |
| Count per stage | Complete | `getDashboardSummary` (`groupBy` on `stage`) |
| Total requested amount by currency | Complete | `getDashboardSummary` (`groupBy` on `currency`, `_sum`) |
| Five most recently submitted | Complete | `orderBy: { submissionDate: "desc" }, take: 5` |
| Reviewer workload (active assigned count) | Complete | `groupBy` on `reviewerId` joined against all `REVIEWER` users |
| Computed from PostgreSQL | Complete | all via Prisma aggregate queries, no client-side computation |
| **7. Comments and activity history** | | |
| Admins/reviewers can comment | Complete | `canComment()` gate in `addComment` and in `CommentsSection.tsx` |
| Author + timestamp shown | Complete | `CommentsSection.tsx` |
| Empty comments rejected, 1000-char max | Complete | `addCommentSchema` |
| Activity timeline: creation, stage changes, reviewer changes, comments, archive/restore | Complete | `Activity` model + `ActivityTimeline.tsx` / `describeActivity()` |
| Activity is append-only, not editable | Complete | no update/delete action exists for `Activity` anywhere in the codebase |
| **8. Archive and restore** | | |
| Admin-only archive/restore | Complete | `canArchiveOrRestore()` |
| Excluded from default list/dashboard totals | Complete | `archived: "ACTIVE"` default filter; dashboard's `ACTIVE_FILTER` |
| Remains stored, accessible via explicit filter | Complete | `archived=ARCHIVED`/`ALL` filter option |
| Cannot be edited or change stage while archived | Complete | `CONFLICT` checks in `updateOpportunity`, `changeOpportunityStage`, `assignReviewer`, `addComment` |
| Enforced server-side | Complete | same `CONFLICT` checks, independent of UI |
| **9. Data fetching and mutations** | | |
| SWR for list/filters/pagination/dashboard/comments/activity | Complete | `useSWR` calls in `OpportunitiesListClient.tsx`, `DashboardClient.tsx`, `OpportunityDetailClient.tsx` |
| Server Actions as SWR fetchers | Complete | SWR fetcher functions call the exported Server Actions directly |
| Search/filter/sort/pagination validated before Prisma | Complete | `opportunityListQuerySchema.safeParse` inside `listOpportunities` |
| No direct Prisma access from client components | Complete | Prisma is only imported in `src/lib/prisma.ts` and files under `src/actions/` (all `"use server"`) |
| Server Actions for all mutations | Complete | create/edit, reviewer assignment, stage change, comment, archive/restore all live in `src/actions/*.ts` |
| Every action: auth check, role check, Zod validation, structured result | Complete | see `docs/server-actions.md` |
| SWR revalidated after mutation | Complete | `mutate()` calls in each detail-page mutation's `onSuccess`/`onChanged` handler |
| **10. Persistence** | | |
| Prisma schema | Complete | `prisma/schema.prisma` |
| Migration | Complete | `prisma/migrations/20260919040704_init` |
| Relations and constraints | Complete | FKs, `@@index`, `@unique` throughout the schema |
| Seed: ≥12 opportunities, every stage, all roles, multiple reviewers, comments, activity, archived records | Complete | `prisma/seed.ts` — 14 opportunities, all 4 stages, 2 archived, 2 reviewers, 6 comments |
| Local DB setup instructions | Complete | README → "Database setup" |
| No raw SQL for ordinary CRUD | Complete | every query goes through Prisma's query builder |
| **11. Server Action documentation** | Complete | `docs/server-actions.md` |
| **Technical expectations** | | |
| Secrets out of Git | Complete | `.env` is git-ignored; `.env.example` has placeholders only |
| `.env.example` | Complete | `.env.example` |
| Business rules separate from presentation | Complete | `src/actions/`, `src/lib/` vs. `src/components/`, `src/app/` |
| Auth/role/validation on trusted server boundaries | Complete | see section 5 |
| Avoid `any` | Complete | zero `any` in the codebase; the one loose-typed spot (`FormData` → typed input) is an isolated, commented `unknown` cast in `src/actions/opportunities.ts` |
| Handle expected failures, don't swallow them | Complete | structured `ActionResult` everywhere; unexpected errors are logged server-side and returned as a generic `UNKNOWN` message |
| Usable on desktop and small screens | Complete | table→card responsive strategy, verified at 375px width (see README → "Manual testing") |
| Semantic HTML, associated labels | Complete | every input uses `<label htmlFor>`; tables use `<th scope="col">` |
| Prevent accidental duplicate submissions | Complete | `useFormStatus`-driven `SubmitButton` disables itself while a Server Action is pending |
| Visible success/failure feedback | Complete | `src/components/ui/toast.tsx`, wired through `useActionFeedback` |
| Transactions for multi-write consistency | Complete | create, stage change, reviewer assignment, comment, archive, restore |
| **Optional enhancements** | Not attempted | Time was spent completing the core requirements thoroughly instead; see README → "What I'd improve" |
