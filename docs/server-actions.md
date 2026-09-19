# Server Actions

All application data reads and mutations go through the Server Actions
listed below (`src/actions/*.ts`). NextAuth's own `/api/auth/[...nextauth]`
route handler is the one exception noted in the assignment and isn't
documented here.

Every action returns the same shape, defined in `src/lib/action-result.ts`:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { kind: "UNAUTHENTICATED" | "FORBIDDEN" | "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "UNKNOWN"; message: string; fieldErrors?: Record<string, string[]> } }
```

Every action, without exception, does the following before touching the
database:

1. Loads the acting user from the verified NextAuth session (`getActingUser()`) — never from client input. Returns `UNAUTHENTICATED` if there's no session.
2. Checks the required role for that operation (`src/lib/permissions.ts`). Returns `FORBIDDEN` if the role doesn't allow it.
3. Validates all input with a Zod schema (`src/lib/validation/*.ts`). Returns `VALIDATION` with per-field messages on failure.
4. Re-reads the relevant record(s) from PostgreSQL and checks their current state (stage, archive status) before writing.

Mutations that touch more than one row (an opportunity plus its activity
record, or a comment plus its activity record) run inside a single
`prisma.$transaction`, so a failure partway through rolls back everything.

Several actions also have a thin `*FormAction` adapter (e.g.
`createOpportunityFormAction`) with the signature React's `useActionState`
expects: `(prevState, formData) => Promise<ActionResult<T>>`. These just
parse `FormData` into the typed input and call the documented action below —
they carry no extra logic or authorization, so they aren't documented
separately.

---

## Opportunities (`src/actions/opportunities.ts`)

### `listOpportunities(query)`

- **Purpose:** Fetches a page of opportunities for the list view. Backs the SWR hook that powers search, stage filtering, the active/archived filter, sorting, and pagination.
- **Input:** `{ q, stage, archived, sort, dir, page }` — the parsed, defaulted `OpportunityListQuery` (see `src/lib/validation/opportunity-query.ts`). Values are validated with `.catch()` fallbacks so a malformed URL still renders a usable page instead of erroring.
- **Success:** `{ items, total, page, pageSize, pageCount }`.
- **Failures:** `UNAUTHENTICATED` if not signed in. No role restriction — every role can view the list.

### `getOpportunity(id)`

- **Purpose:** Fetches one opportunity's full detail (all stored fields, current reviewer, creator).
- **Input:** `id: string`.
- **Success:** `OpportunityDetail`.
- **Failures:** `UNAUTHENTICATED`; `NOT_FOUND` if no opportunity has that id.

### `createOpportunity(input)`

- **Purpose:** Creates a new opportunity in `DRAFT` and records a `CREATED` activity entry, in one transaction.
- **Input:** `{ companyName, requestedAmount, currency, description, submissionDate }`.
- **Success:** `{ id }` of the new opportunity.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless the caller is `ADMIN`; `VALIDATION` for a blank/whitespace-only company name, a non-positive amount, an unsupported currency, a missing/too-long description, or an invalid submission date.

### `updateOpportunity(input)`

- **Purpose:** Edits an opportunity's core fields (not its stage or reviewer — those are separate, governed actions).
- **Input:** `{ id, companyName, requestedAmount, currency, description, submissionDate }`.
- **Success:** `{ id }`.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN`; `NOT_FOUND`; `CONFLICT` if the opportunity is archived; `VALIDATION` (same rules as create).

---

## Reviewers (`src/actions/reviewers.ts`)

### `listReviewers()`

- **Purpose:** Lists users with the `REVIEWER` role, for the reviewer-assignment dropdown.
- **Input:** none.
- **Success:** `{ id, name, email }[]`.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN`.

### `assignReviewer(input)`

- **Purpose:** Assigns, reassigns, or unassigns an opportunity's reviewer, and records a `REVIEWER_ASSIGNED` activity entry with the previous and new reviewer, in one transaction.
- **Input:** `{ opportunityId, reviewerId: string | null }`.
- **Success:** `{ id }`.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN`; `NOT_FOUND`; `CONFLICT` if archived; `VALIDATION` if `reviewerId` refers to a user who doesn't have the `REVIEWER` role. Assigning the same reviewer that's already set is a no-op (no activity record is written).

---

## Stage transitions (`src/actions/stage.ts`)

### `changeOpportunityStage(input)`

- **Purpose:** Moves an opportunity to a new stage and records a `STAGE_CHANGED` activity entry (previous stage, new stage, actor, timestamp), in one transaction. The allowed transitions (`DRAFT → UNDER_REVIEW`, `UNDER_REVIEW → APPROVED`, `UNDER_REVIEW → REJECTED`) are enforced here against the record's *current* stage as read inside the transaction — never against a stage value supplied by the client.
- **Input:** `{ opportunityId, stage: "UNDER_REVIEW" | "APPROVED" | "REJECTED" }`.
- **Success:** `{ id, stage }`.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN` or `REVIEWER`; `NOT_FOUND`; `CONFLICT` if the opportunity is archived, or if the requested transition isn't legal from the current stage; `VALIDATION` for an unrecognized stage value.

---

## Comments and activity (`src/actions/comments.ts`)

### `listComments(opportunityId)`

- **Purpose:** Lists an opportunity's comments, oldest first.
- **Success:** `CommentDTO[]`. **Failures:** `UNAUTHENTICATED`.

### `listActivity(opportunityId)`

- **Purpose:** Lists an opportunity's full append-only activity history (creation, stage changes, reviewer changes, comments, archive/restore), oldest first.
- **Success:** `ActivityDTO[]`. **Failures:** `UNAUTHENTICATED`.

### `addComment(input)`

- **Purpose:** Adds an internal comment and records a matching `COMMENT_ADDED` activity entry, in one transaction.
- **Input:** `{ opportunityId, body }`.
- **Success:** the created `CommentDTO`.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN` or `REVIEWER`; `NOT_FOUND`; `CONFLICT` if archived; `VALIDATION` if the comment is empty/whitespace-only or exceeds 1000 characters.

---

## Archive / restore (`src/actions/archive.ts`)

### `archiveOpportunity(input)` / `restoreOpportunity(input)`

- **Purpose:** Archives or restores an opportunity and records an `ARCHIVED` / `RESTORED` activity entry, in one transaction. An archived opportunity is excluded from the default list and dashboard totals, cannot be edited, cannot change stage, and cannot receive new comments until restored — all enforced by the other actions' own `CONFLICT` checks, not by this action alone.
- **Input:** `{ opportunityId }`.
- **Success:** `{ id }`.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN`; `NOT_FOUND`; `CONFLICT` if already archived (for `archiveOpportunity`) or not archived (for `restoreOpportunity`).

---

## Dashboard (`src/actions/dashboard.ts`)

### `getDashboardSummary()`

- **Purpose:** Computes the dashboard's numbers directly from PostgreSQL: total active opportunities, counts per stage, requested-amount totals grouped by currency, the five most recently submitted active opportunities, and each reviewer's active workload. Archived opportunities are excluded from every total.
- **Input:** none.
- **Success:** `DashboardSummary`.
- **Failures:** `UNAUTHENTICATED`. No role restriction — every role can view the dashboard.

---

## User management (`src/actions/users.ts`) — admin only

Beyond the standard authentication/role checks, every write here loads the
target user inside its transaction and checks record state before writing —
the same pattern the opportunity actions use for archive/stage checks.

### `listUsers()`

- **Purpose:** Every user account, with each reviewer's current active-assignment count and each user's created-opportunity count, for the admin user table.
- **Success:** `UserListItem[]`. **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN`.

### `createUser(input)`

- **Purpose:** Creates a user account with a bcrypt-hashed password. The account can sign in immediately.
- **Input:** `{ name, email, password, role }`.
- **Success:** `{ id }`.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN`; `VALIDATION` for a missing name, invalid email, password under 8 characters, or invalid role; a duplicate email is also reported as a `VALIDATION` error on the `email` field rather than a raw database constraint error.

### `updateUser(input)`

- **Purpose:** Edits a user's name, email, and role, inside a transaction that re-checks two invariants against the row's *current* role before writing: it won't demote or disable the last remaining active admin (leaving the app with no admin), and it won't move a `REVIEWER` off that role while they still have active (non-archived) opportunity assignments — those must be reassigned first.
- **Input:** `{ id, name, email, role }`.
- **Success:** `{ id }`.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN`; `NOT_FOUND`; `VALIDATION` (same field rules as create, minus password); `CONFLICT` for a duplicate email, the last-admin guard, or the active-reviewer-assignment guard.

### `setUserPassword(input)`

- **Purpose:** Sets a new bcrypt-hashed password for a user (an admin-initiated reset — there's no self-service "forgot password" flow, matching the assignment's scope).
- **Input:** `{ id, password }`.
- **Success:** `{ id }`.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN`; `NOT_FOUND`; `VALIDATION` if the password is under 8 characters.

### `disableUser(input)` / `enableUser(input)`

- **Purpose:** Blocks or restores an account's ability to authenticate. A disabled account can't start a new session (checked in `authorize()`) and is treated as unauthenticated on every subsequent Server Action call for any session it already has (checked live in `getActingUser()`, not just at login) — so disabling takes effect immediately, not after that session expires.
- **Input:** `{ id }`.
- **Success:** `{ id }`.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN`; `NOT_FOUND`; `CONFLICT` if disabling yourself, or disabling the last remaining active admin.

---

## Audit log export (`src/actions/audit-log.ts`) — admin only

### `exportActivityCsv()`

- **Purpose:** Builds a CSV of the full, cross-opportunity activity log (timestamp, company, activity type, actor, and a human-readable description reused from the per-opportunity timeline), for download. This is the assignment's own listed "audit-log export in CSV format" optional enhancement.
- **Input:** none.
- **Success:** `{ csv, filename }` — the client turns this into a file download via a `Blob` and a temporary anchor element; no route handler or file storage involved.
- **Failures:** `UNAUTHENTICATED`; `FORBIDDEN` unless `ADMIN`.
