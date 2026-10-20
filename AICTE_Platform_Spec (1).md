# AICTE Approval Workflow & Compliance Monitoring Platform: Build Specification

> Instruction to the agent: This document is the single source of truth. The existing frontend, backend and database are already integrated but are wrong in the ways listed in Section 1. Do NOT rebuild from scratch. Audit what exists, then fix and extend it to match this spec. Keep the existing tech stack (Next.js 14 + NestJS + Prisma/PostgreSQL + BullMQ/Redis + MinIO, pnpm monorepo). Section 13 maps this spec onto that stack and takes priority wherever it is more specific.

---

## 1. What is wrong with the current build (fix these first)

| # | Problem | Required fix |
|---|---------|--------------|
| 1 | Dummy/hardcoded data in components (arrays, mock JSON, fake charts, fake counts) | Remove all of it. Every number, table row, chart and notification must come from an API call backed by the database. Empty database => empty states ("No applications pending"), never fake rows. |
| 2 | Different login screens/interfaces exist per role, but after login every user lands on the same page | Implement a role -> landing route map (Section 3). The login response returns the role; the frontend redirects by role; every route is guarded by role. |
| 3 | RBAC likely enforced only in the UI | Enforce RBAC on the backend for every endpoint, with data scoping (a Regional Officer only gets their own region's data even if they call the API directly). |
| 4 | Dashboards not tied to real workflow state | Dashboards are aggregate queries over the applications, stages, EVCs, undertakings and documents tables. |

**Seed data rule:** The only data allowed to be "fake" is created by a single backend seed command (`seed_demo`) that inserts demo users (one per role), demo institutions and demo applications at various stages and ages, flagged `is_demo = true`. The UI never contains data. Running the seed command once must make every dashboard show realistic content.

---

## 2. Roles

| Role code | Who they are | Scope of data |
|-----------|--------------|---------------|
| `INSTITUTION` | Technical institution (applicant) | Only its own institution(s) |
| `SCRUTINY_OFFICER` | Officer who does scrutiny / re-scrutiny of applications | Applications assigned to them, within their Region |
| `REGIONAL_OFFICER` | Regional Office head / officer | All applications, EVCs, undertakings and documents in their Region |
| `BUREAU_OFFICER` | Bureau officer (processing at head-office level) | All Regions, for the bureau's stages |
| `EVC_COORDINATOR` | Schedules Expert Visit Committees | EVCs for the Regions/bureau assigned |
| `EVC_MEMBER` | Expert on a visiting committee | Only EVCs they are assigned to |
| `COMMITTEE_MEMBER` | SAC / SHC member | Applications placed before their committee |
| `AUTHORITY` | Competent authority (final decisions, top-level monitoring) | National, read-heavy plus decision actions |
| `ADMIN` | System administrator | Configuration, users, masters. No approval decisions. |

A user has exactly one role and may have a `region_id` and/or `institution_id`.

---

## 3. Login and routing (the core RBAC fix)

**Flow**
1. One login page. User enters credentials (optionally pick a role tab for UX only; the server decides the real role).
2. Backend validates and returns the token plus `{ id, name, role, region_id, institution_id, permissions[] }`.
3. Frontend stores the user in auth state and redirects using this map:

| Role | Landing route | Layout |
|------|---------------|--------|
| INSTITUTION | `/institution/dashboard` | Institution layout |
| SCRUTINY_OFFICER | `/scrutiny/dashboard` | Officer layout |
| REGIONAL_OFFICER | `/regional/dashboard` | Officer layout |
| BUREAU_OFFICER | `/bureau/dashboard` | Officer layout |
| EVC_COORDINATOR | `/evc/dashboard` | Officer layout |
| EVC_MEMBER | `/evc-member/my-visits` | Minimal layout |
| COMMITTEE_MEMBER | `/committee/agenda` | Minimal layout |
| AUTHORITY | `/authority/overview` | Executive layout |
| ADMIN | `/admin/dashboard` | Admin layout |

4. **Route guard:** a `ProtectedRoute` wrapper takes `allowedRoles`. A wrong-role URL redirects to the user's own landing page (or shows 403). A user who is not logged in goes to `/login`.
5. **Menu is built from role config**, not hardcoded per page (one `navConfig[role]` object).
6. **Backend guard:** every endpoint declares allowed roles and applies a queryset/data filter by role and region/institution (see Section 9). Never trust the frontend.
7. If the user is already logged in and opens `/login`, redirect them to their landing route.

**Acceptance test:** log in with each of the 9 seeded users; each lands on a different page with a different menu and different data. Typing another role's URL gets blocked.

---

## 4. What each role sees and does

### 4.1 INSTITUTION
**Menu:** Dashboard, My Applications, Undertakings, Documents (Lease etc.), Notifications, Profile.

**Dashboard widgets**
- Application status cards: Draft, Submitted, In Scrutiny, Returned for Deficiency, In EVC, With Committee, Approved, Rejected (counts)
- Action required list: returned applications, upcoming EVC dates, undertakings due soon/overdue, documents expiring soon/expired
- Recent notifications

**Actions**
- Create and submit an application (select process type and fill the form; upload documents)
- Respond to returned applications (give clarification, upload corrected documents, resubmit)
- View stage-wise timeline of each application (read-only history)
- Upload compliance evidence for an undertaking before its due date
- Upload renewed lease/prescribed documents before expiry

**Cannot:** see other institutions, see internal officer observations marked internal, change application stage.

### 4.2 SCRUTINY_OFFICER
**Menu:** Dashboard, My Queue, Returned/Re-scrutiny, Completed, Notifications.

**Dashboard:** assigned count, due-soon/overdue count, average age of cases, my queue sorted by deadline.

**Actions**
- Open an application, review documents, add observations
- Mark scrutiny complete, which triggers automatic movement to the next stage (Section 5)
- Return/revert to the institution or a prior stage with a mandatory reason
- Generate an electronic case summary (system-drafted, officer edits and confirms)

**Cannot:** approve/reject (decisions are reserved), see other Regions.

### 4.3 REGIONAL_OFFICER
**Menu:** Regional Dashboard, Applications, Workload, EVC Status, Undertakings, Documents Validity, Escalations, Reports, Notifications.

**Dashboard (all scoped to their Region)**
- Stage-wise pendency (bar/funnel), ageing buckets (0-7, 8-15, 16-30, 30+ days)
- Workload per scrutiny officer
- Overdue and approaching-deadline lists
- EVCs due/overdue, undertakings overdue, documents expiring in 30/60/90 days
- Escalations received

**Actions**
- Assign/reassign applications to scrutiny officers
- Authorised return/revert with reason
- Acknowledge or act on escalations
- Export region reports

### 4.4 BUREAU_OFFICER
**Menu:** Bureau Dashboard, Applications (all regions), Stage Queues, Escalations, Reports.

**Dashboard:** same widgets as regional but across all Regions with a Region filter and comparison; bureau-stage queue.

**Actions:** process applications in bureau-level stages, return/revert with reason, move to the next stage where authorised.

### 4.5 EVC_COORDINATOR
**Menu:** EVC Queue, Schedule, Ongoing/Completed, Alerts, Reports.

**Dashboard:** applications waiting for EVC (auto-populated from workflow), new-institution EVCs highlighted with their prescribed timeline, scheduled vs overdue.

**Actions**
- Constitute an EVC (choose members, date, venue/mode)
- Reschedule with reason
- Record completion and attach the EVC report, which moves the application to the next stage
- See auto reminders and escalation status

### 4.6 EVC_MEMBER
**Menu:** My Visits, Submitted Reports.

**Actions:** view assigned visit details and the application summary, accept or record unavailability, upload the visit report and observations. **Cannot** see anything not assigned to them.

### 4.7 COMMITTEE_MEMBER (SAC / SHC)
**Menu:** Meeting Agenda, Case Review, Past Recommendations.

**Actions:** view the cases placed before their committee (case summary, scrutiny and EVC outcomes), record a recommendation with remarks. The recommendation is saved as a recommendation, not a final decision.

### 4.8 AUTHORITY
**Menu:** National Overview, All Applications, Pending Decisions, Region Performance, Compliance Overview, Escalations, Reports, Audit Trail.

**Dashboard:** national KPIs (total, pending, overdue, avg processing days), Region-wise performance ranking, EVC pendency, undertaking and document compliance rate, top bottlenecks.

**Actions:** take the final decision on cases reserved for the competent authority (approve / approve with time-bound undertaking / reject / return), always with remarks. Approving with undertaking creates the undertaking records automatically (Section 6.2).

### 4.9 ADMIN
**Menu:** Users and Roles, Regions, Institutions, Process Types and Stage Rules, Timelines (SLAs), Notification Templates, Escalation Matrix, Audit Logs, System Health.

**Actions:** create/disable users, assign roles and regions, configure rules and timelines (all configuration is data in the database, not code). **Cannot** perform approval decisions.

---

## 5. Workflow engine

### 5.1 Process types (configurable)
Each application has a `process_type` that defines an ordered list of stages:
- `ONLY_SCRUTINY` -> Scrutiny
- `SCRUTINY_EVC` -> Scrutiny -> EVC
- `EVC_SAC_SHC` -> EVC -> SAC/SHC
- `ONLY_EVC` -> EVC
- other combinations configurable by Admin from the APH

Stored as `process_types` and `process_type_stages (process_type_id, stage_code, sequence, sla_days, owner_role)`. Final decision by the Authority follows the last stage where required.

### 5.2 Application statuses
`DRAFT -> SUBMITTED -> IN_STAGE(<stage>) -> RETURNED -> ... -> DECISION_PENDING -> APPROVED | APPROVED_WITH_UNDERTAKING | REJECTED | CLOSED`

### 5.3 Transition rules
- A stage is completed by an authorised actor with required fields filled. On completion the engine automatically sets the next stage from `process_type_stages` and assigns the queue/owner role. No manual "forward" button for normal progression.
- Return/revert: allowed only for roles defined per stage; `reason` is mandatory; target is either the institution or a previous stage. The engine records it and restarts the SLA for the target stage.
- Every transition writes an audit row (Section 6.6).
- The engine is a single backend service (`WorkflowService.advance(application, actor, action, payload)`). Controllers never change stage directly.
- Human oversight: the system routes, reminds and summarises, but scrutiny verification, inspection findings and the final decision are always entered by a human of the competent role.

---

## 6. Modules

### 6.1 EVC scheduling
- When an application reaches a stage needing EVC (`SCRUTINY_EVC`, `EVC_SAC_SHC`, `ONLY_EVC`) after preliminary processing, it is automatically placed in the EVC queue.
- Each EVC has `due_by` (from SLA; tighter for new institutions), `scheduled_date`, members, status (`PENDING_SCHEDULE`, `SCHEDULED`, `COMPLETED`, `OVERDUE`, `RESCHEDULED`).
- Reminders: N days before `due_by`, on due date, then escalation to the designated authority if still unscheduled/incomplete.

### 6.2 Undertakings
- Created when a decision is "approve with undertaking". Each has `condition_text`, `due_date`, `status` (`OPEN`, `SUBMITTED`, `VERIFIED`, `REJECTED_EVIDENCE`, `OVERDUE`, `CLOSED`), and linked evidence files.
- Institution uploads evidence -> status `SUBMITTED` -> Regional Officer verifies or sends it back.
- Notifications to the institution before the due date; overdue triggers escalation.

### 6.3 Lease / document validity
- `institution_documents`: `doc_type`, `valid_from`, `valid_to`, `file`, `status` (`VALID`, `EXPIRING`, `EXPIRED`, `RENEWAL_SUBMITTED`, `VERIFIED`).
- Advance alerts at configurable thresholds (e.g. 90/60/30/7 days), overdue alert on expiry, escalation if no renewal.

### 6.3b Compliance submission tracking
Single view per institution showing every pending/submitted/verified item across undertakings and documents.

### 6.4 Notifications
- In-app notification centre (bell, unread count, mark read), plus email (and SMS hook if available).
- Templates and timings come from the database (Admin configurable). Types: pending application, approaching deadline, EVC due, compliance due, document expiry, escalation, returned application.

### 6.5 Escalation matrix
Table `escalation_rules (entity_type, trigger (days_overdue), escalate_to_role, level)`. A scheduled job evaluates items daily (or hourly), creates escalation records and notifications to the right role in the right Region. Escalation levels: 1 = concerned officer, 2 = Regional Officer, 3 = Bureau/Authority.

### 6.6 Audit trail
Append-only `audit_log (id, timestamp, actor_id, actor_role, entity_type, entity_id, action, from_state, to_state, remarks, ip)`. Written for application movement, observations, returns, alerts sent, submissions, verification, escalations, closures and logins. Visible per application (timeline) and globally to Authority/Admin. No update or delete endpoints.

### 6.7 Reports
Pendency, EVC status, undertaking compliance, document validity, overdue cases, Region-wise performance. Filters: Region, stage, date range, institution. Export to CSV/PDF. Scoped by role.

---

## 7. Database (core tables)

`users`, `roles` (or role column), `regions`, `institutions`, `applications` (id, institution_id, region_id, process_type_id, current_stage, status, submitted_at, stage_entered_at, assigned_to, is_demo), `application_stage_history`, `application_documents`, `observations` (with `is_internal`), `process_types`, `process_type_stages`, `sla_config`, `evc` , `evc_members`, `evc_reports`, `committee_cases`, `committee_recommendations`, `decisions`, `undertakings`, `undertaking_evidence`, `institution_documents`, `notifications`, `notification_templates`, `escalation_rules`, `escalations`, `audit_log`.

Add indexes on `(region_id, status)`, `(current_stage, stage_entered_at)`, due-date columns. Compute ageing from `stage_entered_at`; do not store counters.

---

## 8. Scheduled jobs (BullMQ repeatable jobs running in apps/worker)

| Job | Frequency | What it does |
|-----|-----------|--------------|
| `check_stage_sla` | hourly | Flags applications approaching/exceeding stage SLA, creates alerts and escalations |
| `check_evc_deadlines` | daily | EVC reminders and escalation |
| `check_undertaking_deadlines` | daily | Upcoming/overdue undertaking alerts and escalation |
| `check_document_expiry` | daily | Expiry alerts, marks `EXPIRING`/`EXPIRED`, escalation |
| `send_pending_notifications` | every few minutes | Delivers queued emails |

Each job is idempotent (does not re-send the same alert twice) and writes to the audit log.

---

## 9. API and security rules

- Auth: JWT in an httpOnly, Secure, SameSite cookie with a role claim; short expiry plus refresh (see Section 13).
- Every endpoint: `@roles_allowed([...])` plus a scoping filter:
  - INSTITUTION -> `institution_id = user.institution_id`
  - SCRUTINY_OFFICER -> `assigned_to = user` (and region)
  - REGIONAL_OFFICER -> `region_id = user.region_id`
  - EVC_MEMBER -> only EVCs where they are a member
  - COMMITTEE_MEMBER -> only cases on their committee agenda
  - BUREAU / EVC_COORDINATOR / AUTHORITY / ADMIN -> per their definitions above
- Key endpoints (REST, names indicative):
  - `POST /auth/login`, `GET /auth/me`
  - `GET /dashboard/summary` (returns role-appropriate aggregates; one endpoint, role-switched server side)
  - `GET/POST /applications`, `GET /applications/:id`, `POST /applications/:id/actions` (`complete_stage`, `return`, `resubmit`, `decide`)
  - `GET /applications/:id/timeline`
  - `GET/POST /evc`, `POST /evc/:id/schedule`, `POST /evc/:id/complete`
  - `GET /undertakings`, `POST /undertakings/:id/evidence`, `POST /undertakings/:id/verify`
  - `GET /documents`, `POST /documents/:id/renew`, `POST /documents/:id/verify`
  - `GET /notifications`, `POST /notifications/:id/read`
  - `GET /escalations`, `POST /escalations/:id/acknowledge`
  - `GET /reports/:type`
  - `GET/POST /admin/*` (ADMIN only)
- File storage: secure private storage; files served via authorised, expiring links; role-based access to documents.
- Confidential observations (`is_internal`) never returned to INSTITUTION.

---

## 10. Frontend rules

- Folder structure by role: `/pages/institution`, `/pages/scrutiny`, `/pages/regional`, etc., with shared components (DataTable, StatusBadge, Timeline, StatCard, DeadlineChip, FilterBar).
- Data fetching through a single API client with the token attached; handle 401 (logout) and 403 (blocked page).
- Loading, empty and error states on every page.
- No hardcoded arrays, no `faker` in production code. Charts receive data only from API responses.
- Colour-coded deadline chips: green = on time, amber = approaching, red = overdue.

---

## 11. Demo script / acceptance criteria

Seed users (one per role) and run this end-to-end demo with no code changes:

1. Institution submits a `SCRUTINY_EVC` application. It appears in the Scrutiny queue automatically.
2. Scrutiny Officer returns it with a reason. Institution sees it in "Action required", resubmits.
3. Scrutiny Officer completes scrutiny. The application auto-moves to the EVC queue and the EVC Coordinator sees it.
4. Coordinator schedules the EVC. EVC Member uploads the report. The application advances.
5. Authority approves with a time-bound undertaking. The undertaking appears for the Institution.
6. Time passes (use an admin "simulate date" or backdate seed rows): reminders fire, then escalations reach the Regional Officer, then the Authority.
7. Institution uploads evidence; Regional Officer verifies; the undertaking closes.
8. A lease document nears expiry: alerts fire, renewal uploaded and verified.
9. The Audit Trail shows every step above with actor, time and reason.

**Pass conditions**
- Each role lands on a different page with a different menu and different data.
- Direct URL/API access across roles or regions is blocked.
- Dashboards change when data changes; with an empty database they show empty states.
- Alerts and escalations fire at the configured times and never duplicate.
- The audit trail is complete and cannot be edited.

---

## 12. Suggested order of work for the agent

1. **Audit:** list every place with hardcoded/mock data and every route/redirect; report findings before changing code.
2. **Auth and RBAC:** role claim, landing map, route guards, backend permission and scoping layer.
3. **Schema:** align the database with Section 7 via migrations; write `seed_demo`.
4. **Workflow engine:** `WorkflowService`, process types, transitions, return/revert, audit log.
5. **Role dashboards:** replace every mock source with real aggregate endpoints, one role at a time.
6. **EVC, Undertakings, Documents** modules.
7. **Notifications, scheduler jobs, escalation matrix.**
8. **Reports and exports.**
9. **Run the demo script (Section 11) and fix gaps.**

After each step, summarise what changed and what was verified before moving on.

---

## 13. Stack mapping: AICTE FlowGuard (pnpm monorepo)

Stack: `apps/web` Next.js 14 App Router + TypeScript + Tailwind + Lucide + React Hook Form + Zod + Recharts; `apps/api` NestJS + Passport-JWT + cookie-parser + bcrypt + class-validator + Swagger; PostgreSQL 16 + Prisma; `apps/worker` BullMQ + Redis 7 + email adapter; MinIO/S3 storage.

### 13.1 Audit targets (likely root causes of the current bugs)
- **`DemoContext` in `apps/web`:** treat it as the prime suspect for dummy data and for every user landing on the same page. Find everything that reads from it. Either delete it, or restrict it to a dev-only "view as role" switch that is compiled out of production builds and never supplies data. All data must come from `apps/api`.
- Any hardcoded arrays, `const mock...`, static Recharts datasets, or `useState` initial data that looks like real records.
- The post-login code in `AuthContext` and the login page: look for a hardcoded `router.push('/dashboard')`.
- Any API controller that returns data without a role guard or scoping.

### 13.2 Shared types
Create `packages/shared` (pnpm workspace) holding the `Role` enum, landing-route map, permission constants and Zod schemas used by both `web` and `api`, so roles are defined in exactly one place.

### 13.3 Frontend (`apps/web`)
- Use App Router route groups, one per role, each with its own `layout.tsx` and navigation:
  `(institution)/institution/...`, `(scrutiny)/scrutiny/...`, `(regional)/regional/...`, `(bureau)/bureau/...`, `(evc)/evc/...`, `(evc-member)/evc-member/...`, `(committee)/committee/...`, `(authority)/authority/...`, `(admin)/admin/...`.
- `middleware.ts` runs on every request: no session cookie -> redirect to `/login`; the first path segment must match the role in the verified session, otherwise redirect to that role's landing route. `/login` for a logged-in user redirects to the landing route.
- Role-based redirect after login happens in one place (the login action), using the landing map from `packages/shared`, using the role returned by `POST /auth/login`, never a role selected in the UI.
- Pages are Server Components that fetch via the API with the cookie forwarded; interactive parts (filters, forms, charts) are Client Components. `AuthContext` is hydrated from `GET /auth/me` and only used for display (name, role, menu), never as the security boundary.
- Navigation items come from `navConfig[role]`. Charts (Recharts) take props from API data only.
- Forms: React Hook Form + Zod, reusing shared Zod schemas where the API accepts the same shape.
- Every page needs loading, empty and error states.

### 13.4 Backend (`apps/api`)
- Global `JwtAuthGuard` (JWT read from the httpOnly cookie via a custom Passport extractor), then a `RolesGuard` driven by a `@Roles(...)` decorator on every controller method. Default is deny: an endpoint without `@Roles` or an explicit `@Public()` must fail the build or tests.
- **Data scoping lives in a `ScopeService`** that turns `(user)` into a Prisma `where` fragment (region, institution, assigned user, EVC membership, committee agenda). Every list/detail query in services must apply it. Never filter in the controller or the frontend.
- A `WorkflowModule` with `WorkflowService.advance()` (Section 5) is the only code allowed to change application stage or status. A `$transaction` wraps the stage change, the history row and the audit row together.
- Modules: `auth`, `users`, `institutions`, `applications`, `workflow`, `evc`, `undertakings`, `documents`, `notifications`, `escalations`, `reports`, `audit`, `admin`, `storage`, `dashboard`.
- Cookies: `httpOnly`, `Secure` in production, `SameSite=Lax` or `Strict`; because auth is cookie-based, protect mutating requests against CSRF (SameSite plus a CSRF token or origin check). Configure CORS with explicit origin and credentials.
- Rate-limit `/auth/login`; bcrypt cost 12 stays.
- Swagger: document each endpoint with its allowed roles so `/api/docs` doubles as the RBAC reference.

### 13.5 Database (Prisma)
- Model the tables from Section 7 in `schema.prisma` with enums for `Role`, `ApplicationStatus`, `StageCode`, `EvcStatus`, `UndertakingStatus`, `DocumentStatus`.
- Add the indexes from Section 7 and an `isDemo` boolean on seeded rows.
- `audit_log` is append-only: revoke UPDATE/DELETE on it for the application DB user (raw SQL in a migration) or add a trigger that blocks them.
- Alert de-duplication: a unique constraint on `(entityType, entityId, alertType, thresholdKey)` in an `alert_dispatch` table, so jobs are idempotent.
- `prisma/seed.ts` is the only seeding mechanism (Section 1): 9 demo users with known passwords for the demo, regions, institutions, and applications spread across stages and ages (include some overdue, some expiring, some returned).

### 13.6 Worker (`apps/worker`)
- BullMQ repeatable jobs for the five jobs in Section 8; each job reads rules from `sla_config`, `escalation_rules` and `notification_templates`, writes notification and escalation rows, and enqueues email jobs.
- Retry with backoff on email delivery; failed jobs visible in a dead-letter list and in the Admin "System Health" page.
- Email adapter stays modular (console logger in dev, SMTP/Resend in production).
- Add an Admin-only "simulate date" or "run jobs now" action (disabled in production) so the escalation part of the demo script can be shown without waiting days.

### 13.7 Storage (MinIO/S3)
- Files are stored under `institutionId/applicationId/...` keys; the API issues short-lived presigned URLs only after the same scoping and role check as the record itself.
- EVC geo-tagged reports and undertaking evidence use the same flow; store file metadata (name, size, hash, uploader, timestamp) in Postgres and write an audit row for each upload and download.

### 13.8 Definition of done for the stack
- `pnpm -r build` and lint pass; no reference to `DemoContext` data remains in production code.
- An automated test per role: log in, assert the landing route, assert a forbidden route is blocked, assert an API list endpoint returns only scoped rows.
- Fresh clone -> `pnpm install` -> migrate -> seed -> start all three apps -> the Section 11 demo works without manual DB edits.
