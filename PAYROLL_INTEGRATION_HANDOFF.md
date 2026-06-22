# Aluverse — Payroll Integration Handoff

## 1. About the Project

**Aluverse** is a custom internal business management app for an Australian aluminum fabrication business. It's a Next.js + tRPC + Kysely + Drizzle + Postgres app. The owner is the only developer and uses it to manage:

- **Projects** (jobs for clients) with cost tracking (supplies, labor, misc), payments, margin/burn-rate analytics
- **Bank transactions** synced from Westpac (via Frollo) and reconciled into categories: budget, project, loan, tax, refund
- **Loans** (borrowed/lent)
- **Budget categories** (the app's equivalent of a Chart of Accounts)
- **Dashboard** with project margin, burn rate, allocation tracking, and other analytics

The owner has decided NOT to migrate to Xero because the project analytics in Aluverse are far more sophisticated than what Xero offers. But Aluverse currently has **no payroll**, and the owner now needs to pay employees legally.

## 2. The Task

Build an **Employment Hero (Payroll Classic, formerly KeyPay) integration** inside Aluverse so the owner can run payroll without ever opening Employment Hero's UI. The app should be a "headless" front-end to the payroll engine.

**Important:** We are NOT syncing/persisting payroll data to our DB right now. All reads and writes go directly through the Employment Hero Payroll Classic API, on demand. A syncing mechanism may come later.

## 3. Business & Legal Background (read this — the dev needs to understand it)

The owner has employees of two kinds:

- **Salaried employees** → paid monthly, fixed amount each month
- **Casuals** → paid weekly, hours vary, hourly rate has 25% loading on top of base

Legal obligations the integration must satisfy (Australian context):

### Pay Runs

A pay run is a manual process the owner triggers each pay cycle. It calculates gross pay, deducts PAYG tax, calculates super, and locks in the figures. **Pay runs DO NOT move money** — the owner still has to bank-transfer the net pay to employees themselves. The Payroll Classic API handles all the calculations.

There will be **two pay schedules**:

- **Monthly** for salaried employees (1 pay run per month)
- **Weekly** for casuals (4–5 pay runs per month)

For casuals, hours worked must be entered before calculating the pay run.

### PAYG (Pay-As-You-Go withholding tax)

Tax withheld from each employee's gross pay. Calculated by Employment Hero. Owner remits the total to the ATO **quarterly** via the ATO Business Portal — not via our app. The app just needs to show the current PAYG owed.

### Super (Superannuation Guarantee)

Currently **12%** on top of gross pay (was 11.5%, increased July 2026). Each employee may have a different super fund. Paid **quarterly** via a clearing house — the app doesn't need to handle the actual payment, just surface the amounts.

### STP (Single Touch Payroll)

Australian legal requirement: every finalized pay run must be reported to the ATO **in real time**. Employment Hero handles this automatically when a pay run is finalized. The app just needs to display the STP submission status (success/failed/pending) and surface errors.

### TFN (Tax File Number)

Legally protected under the Privacy Act. The app must **never** collect or store TFNs. Use Employment Hero's **self-service onboarding link** — generate a URL per new employee and the employee enters their own TFN directly into Employment Hero's certified system.

### EOFY Finalisation

Once a year, after the last pay run of the financial year, an EOFY finalisation must be lodged via the API. One endpoint call.

### Casual Conversion

After 12 months of regular work, casuals must be offered conversion to permanent. Track this in the app via employment start dates and surface a warning when approaching 12 months.

## 4. The Two Employment Hero APIs (don't confuse them)

|                   | Employment Hero API              | **Payroll Classic API (use this one)** |
| ----------------- | -------------------------------- | -------------------------------------- |
| Base URL          | `api.employmenthero.com/api/v1/` | `api.yourpayroll.com.au/api/v2/`       |
| Auth              | OAuth2 (15-min tokens)           | **HTTP Basic Auth with API key**       |
| Has Pay Runs      | No                               | Yes                                    |
| Has STP           | No                               | Yes                                    |
| Has Pay Schedules | No                               | Yes                                    |
| Subscription      | Platinum+                        | Included                               |

We use **Payroll Classic** exclusively. It is the rebranded KeyPay API. Documentation is at `https://api.keypay.com.au/australia/reference` and `https://api.yourpayroll.com.au` (the docs site sometimes blocks bots — open it in a real browser).

## 5. API Credentials

Already set in `.env`:

```
KEYPAY_API_KEY=<long base64-ish string>
KEYPAY_ORGANIZATION_ID=527461
```

(Note: env var prefix is `KEYPAY_` for historical reasons — it's the same Payroll Classic API.)

**Auth method:** HTTP Basic Auth. The API key is the username, password is empty:

```
Authorization: Basic base64(API_KEY + ":")
```

The business ID `527461` is the one used in URL paths like `/api/v2/business/527461/employee`.

**Rate limit:** ~5 requests per second per API key. Be gentle.

### Verified Endpoints (already tested)

- `GET /api/v2/business` → lists all accessible businesses
- `GET /api/v2/business/{id}` → business details
- `GET /api/v2/business/{id}/employee` → list employees

## 6. Codebase Conventions (read AGENTS.md too — these are non-negotiable)

The app is **Bun + Next.js (App Router) + tRPC + Kysely (runtime) + Drizzle (schema) + Postgres**.

### Feature Structure

Every feature lives at `features/<name>/` with this exact structure:

```
features/<name>/
├── api/<name>.router.ts           # tRPC router
├── components/                    # client-side React components
├── hooks/                         # client hooks (e.g. table column defs)
├── mutations/<action>.mutation.ts # server functions that write
├── queries/<action>.query.ts      # server functions that read
├── schemas/<name>.shared-schema.ts# Zod schemas
├── views/<name>-list-view.tsx     # page-level views
├── lib/                           # feature-specific server utilities
└── index.ts                       # barrel
```

Reference features to copy patterns from:

- **`features/projects/`** — clean CRUD example with router/queries/mutations/schemas
- **`features/financial-accounts/`** — has the bank-syncer, our reference for external API integration. Look at `lib/bank-syncer/bank-fetchers/westpac.fetcher.ts` to see how Frollo is wired up. **Mirror this pattern for the KeyPay client.**

### tRPC

- Routers registered in `trpc/routers/_app.ts`
- Use `permissionProcedure("payroll.read")` etc. for permission gating (you'll need to add `payroll.*` permissions to wherever permissions are defined — search for existing permission names like `loans.read` to find the file)
- Procedure types: `baseProcedure` (no auth), `protectedProcedure` (auth), `permissionProcedure(perm)` (RBAC)

### Conventions (from AGENTS.md)

- **Bun only:** `bun install`, `bun run <script>`, `bun add <package>`. Never npm/yarn.
- **Type inference, never duplication:** infer from `RouterOutputs` and Drizzle/Kysely schema; never redeclare types.
- **`type` not `interface`.**
- **No `any`**, ever.
- **Don't annotate function return types** — let TS infer.
- **No new files unless required.** Edit existing where possible.
- **Mappers** under `shared/mappers/<feature>/` as `*-full.mapper.ts` / `*-list.mapper.ts`
- **Expressions** (computed DB fields) under `shared/expressions/<feature>/` as `*.expression.ts`
- **Shared schemas** as `*.shared-schema.ts`. Pagination/filter base utilities live in `lib/shared-schemas.ts`.
- **Money is stored in cents** (integer). Schemas use `.transform(v => Math.round(v * 100))` at the API boundary.
- **Server utilities** in `lib/server-utils.ts`, **client utilities** in `lib/client-utils.ts`, **shared** in `lib/shared-utils.ts`.
- **Before completing any change**, run `bun run lint`, `bun run check`, `bun run build` and fix everything. These must all pass.
- Prefer `bun run lint` / `bun run check` after each step.

### What NOT to Do

- Don't introduce new architectural patterns.
- Don't add features beyond what's specified.
- Don't add error handling for impossible cases.
- Don't create helper abstractions for one-time use.
- Don't add backwards-compat shims; if something is unused, delete it.
- Don't add TFN fields anywhere in the app.

## 7. Implementation Plan

Build this in the order below. After each step, lint/typecheck/build must pass. Get the owner's review before moving to the next step.

### Step 1 — Payroll Classic API Client

Create `features/payroll/lib/keypay-client/`:

- `index.ts` — exports a `keypayClient` object/class with typed methods
- `types.ts` — TypeScript types for the API responses we use
- `request.ts` — internal `request()` helper that:
  - Reads `KEYPAY_API_KEY` and `KEYPAY_ORGANIZATION_ID` from `process.env`
  - Sets `Authorization: Basic base64(apiKey + ":")`
  - Sets `Content-Type: application/json`
  - Prefixes all paths with `https://api.yourpayroll.com.au/api/v2/business/{orgId}` (some endpoints, like the EOFY/STP roots, may not be business-scoped — handle both)
  - Throws on non-2xx with the response body included
  - Returns parsed JSON

Mirror the structure of `features/financial-accounts/lib/bank-syncer/bank-fetchers/westpac.fetcher.ts` (the Frollo integration). The owner approved that pattern.

Methods to expose initially (add more as later steps need them):

- `listEmployees()`
- `getEmployee(id)`
- `createEmployee(data)`
- `getOnboardingUrl(employeeId)`
- `listPaySchedules()`
- `listPayRuns(payScheduleId?)`
- `createPayRun(payScheduleId, periodEndingDate)`
- `getPayRun(payRunId)`
- `calculatePayRun(payRunId)`
- `finalizePayRun(payRunId)`
- `getStpStatus(payRunId)`
- `getYtdReport()`
- `getSuperContributions()`

API method bodies should be one-liners delegating to `request()` with the right path. **Don't over-engineer.**

**Test it** by writing a one-off script in `scripts/` that calls `listEmployees()` and prints the result. Delete the script when done (or leave it as a diagnostic — owner's choice).

### Step 2 — tRPC Router & Permissions

- Create `features/payroll/api/payroll.router.ts`
- Add procedures: `listEmployees`, `getEmployee`, `createEmployee`, `getOnboardingUrl`, `listPaySchedules`, `listPayRuns`, `createPayRun`, `calculatePayRun`, `finalizePayRun`, `getStpStatus`, `getYtdReport`, `getSuperContributions`
- All input validation via Zod schemas in `features/payroll/schemas/payroll.shared-schema.ts`
- Each procedure should be a thin wrapper: validate → call `keypayClient` → return
- Add `payroll.read`, `payroll.write` permissions to wherever existing permissions live (grep for `loans.read` to find it)
- Register the router in `trpc/routers/_app.ts` as `payroll: payrollRouter`

### Step 3 — Employees Page

- Create `features/payroll/views/payroll-employees-view.tsx`
- Create `features/payroll/components/payroll-employees-list.tsx` — data table using the existing table component (look at how `loans-list.tsx` does it)
- Create the page at `app/(dashboard)/payroll/employees/page.tsx`
- Add a nav link in the dashboard sidebar (search for where `loans` is added in nav)
- Columns: name, email, employment type (full-time / part-time / casual), start date, status
- Action: "Generate onboarding link" button → calls `getOnboardingUrl` → copies URL to clipboard. Owner sends this to the new hire. The new hire enters their own TFN/super choice/bank details directly into Employment Hero.
- Create employee form: minimal fields only (first name, last name, email, employment type, pay schedule, hourly rate or annual salary). **Never collect TFN.**

### Step 4 — Pay Schedules Setup (Read-only initially)

- Page: `app/(dashboard)/payroll/pay-schedules/page.tsx`
- View showing the configured pay schedules (Monthly for salaried, Weekly for casuals)
- This is read-only — schedules are created in Employment Hero's UI once at setup time, then never touched. The owner will configure them manually before using the app.

### Step 5 — Pay Runs Page

This is the core daily-use feature.

- Page: `app/(dashboard)/payroll/pay-runs/page.tsx`
- List all pay runs (filterable by pay schedule)
- Status column: draft / calculated / finalized
- Action buttons depending on status:
  - **Draft / Calculated:** "Calculate" button → calls `calculatePayRun`
  - **Calculated:** "Review" button → opens detail view showing per-employee breakdown
  - **Calculated:** "Finalize" button → calls `finalizePayRun` (with confirmation modal — this is irreversible and triggers STP submission)
- "New Pay Run" button → modal asking for pay schedule + period ending date → calls `createPayRun`
- For casual pay runs, the calculate step needs hours-per-employee input. Either:
  - **Option A (simple):** the owner enters hours in Employment Hero's UI before clicking Calculate
  - **Option B (better):** the app shows a form with each casual employee and an hours input, and the API call updates timesheet/earnings before calculating

Go with Option B, we don't want to leave the app.

### Step 6 — Pay Run Detail View

- Route: `app/(dashboard)/payroll/pay-runs/[id]/page.tsx`
- Shows: pay period, status, total gross, total PAYG, total net, total super
- Per-employee breakdown table: name, gross, PAYG, net, super
- If finalized: show STP status (with refresh button)
- If STP failed: show the error message from Employment Hero

### Step 7 — Payroll Dashboard Card

- Add a card to the existing dashboard at `features/dashboard/...` showing:
  - Total payroll YTD
  - Total PAYG owed (current quarter)
  - Total super owed (current quarter)
  - Last pay run date and STP status
- Pull data via `getYtdReport` and `getSuperContributions`

### Step 8 — EOFY Finalisation

- Add a single button somewhere in payroll settings: "Finalize EOFY for {financial year}"
- Calls the EOFY endpoint
- Confirmation modal — this is once-a-year and significant
- Show success/failure clearly

### Step 9 — Casual Conversion Warning

- On the employees list, highlight casuals approaching 12 months since start date
- Simple visual indicator + tooltip

## 8. What NOT to Build

- Any database table for payroll data (all data lives in Employment Hero)
- TFN collection or storage anywhere
- Tax calculation logic (Employment Hero does it)
- Super calculation logic (Employment Hero does it)
- STP XML generation (Employment Hero does it)
- Direct ATO communication (Employment Hero does it)
- Bank file generation for paying employees (use Employment Hero's built-in or do bank transfers manually)
- Payroll tax / state taxes (out of scope for now)
- Leave management UI (out of scope for now — leave is accrued automatically)
- Any sync-to-DB mechanism (explicitly out of scope, may be added later)

## 9. Testing the Integration

The owner does NOT have any employees set up yet — the Employment Hero account is fresh. To test:

1. Verify the API client works by listing employees (should return `[]` initially)
2. Create a test employee via the API → confirm it appears in Employment Hero's web UI
3. Set up pay schedules manually in Employment Hero web UI before testing pay runs
4. Test pay run creation and calculation with the test employee
5. **Do NOT finalize a real pay run during development** — finalisation triggers STP submission to the ATO and is irreversible
6. Use Employment Hero's sandbox/test mode if available, or create the test employee with `endDate` set so they don't accrue real obligations

## 10. Things to Watch Out For

- **Rate limit:** ~5 req/sec. If you ever loop through employees making per-employee API calls, throttle.
- **Money in cents:** the app stores cents as integers. Employment Hero's API returns money in dollars (decimals). Convert at the boundary in the keypay-client layer.
- **Dates:** Australian format. Employment Hero uses ISO 8601. App uses Date objects in Drizzle.
- **Time zones:** Australian. The app is single-tenant Australian-only.
- **Pagination:** Some Employment Hero list endpoints paginate. Check the response — if there's a `top`/`skip` query param pattern, implement it.
- **Idempotency:** `finalizePayRun` is irreversible. Always confirm with the user.
- **Errors:** Employment Hero returns RFC 9110 problem details. Surface the `title` and `detail` fields to users.

## 11. Reference Files in the Codebase

Read these before writing code — they'll teach you the patterns:

- `AGENTS.md` — non-negotiable conventions
- `db/schemas/projects.schema.ts` — how schemas look
- `features/loans/api/loans.router.ts` — typical router
- `features/loans/queries/list-loans.query.ts` — typical query
- `features/loans/mutations/create-loan.mutation.ts` — typical mutation
- `features/loans/schemas/loans.shared-schema.ts` — typical Zod schemas
- `features/loans/views/loans-list-view.tsx` — typical view + RBAC
- `features/loans/components/loans-list.tsx` — typical client component using tRPC
- `features/financial-accounts/lib/bank-syncer/bank-fetchers/westpac.fetcher.ts` — **the reference for external API integration**
- `trpc/init.ts` — procedure definitions and context
- `trpc/routers/_app.ts` — router registration
- `lib/shared-schemas.ts` — pagination/list base schemas
- `lib/constants.ts` — enums and constants

## 12. The Owner

The owner is the only stakeholder. They are a competent developer themselves but don't know accounting or payroll, so explain payroll concepts when they ask. They prefer:

- Concise answers
- Step-by-step delivery (don't dump everything at once — show one step, get review, then continue)
- Following existing patterns over inventing new ones
- No "improvements" or scope creep beyond what was asked

When unsure about a payroll concept, ask before guessing — payroll has legal consequences if done wrong.
