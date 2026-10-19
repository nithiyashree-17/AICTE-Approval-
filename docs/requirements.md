# AICTE FlowGuard — Product Requirements Document & Functional Specifications

**Document Control:**
- **Project:** AICTE FlowGuard — Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System
- **Problem Statement ID:** 26262
- **Document Role:** Teammate 1 (Product / APH Mapping)
- **Status:** Complete Baseline Specification
- **Primary Source:** AICTE Approval Process Handbook (APH) 2024–2027

---

## 1. Executive Summary & Problem Understanding

The statutory approval process of the All India Council for Technical Education (AICTE) governs thousands of technical institutions across India, encompassing diploma, undergraduate, and postgraduate institutions in Engineering, Technology, Management, Architecture, Pharmacy, and Applied Arts.

Present administrative operations encounter severe operational bottlenecks:
1. **Coordination Overhead:** Complex interactions between institutions, Regional Offices, Scrutiny Committees, Expert Visit Committees (EVC), Standing Hearing Committees (SHC), Standing Appellate Committees (SAC), and the Council.
2. **Procedural Delays & Missed Deadlines:** Manual tracking of deficiency notifications, institutional resubmissions, and committee reports frequently risks missing academic session calendar cutoffs.
3. **Compliance Slippage:** Document expirations (e.g., land leases, Fire NOCs, Building Safety Certificates, FDRs) go unnoticed post-approval until subsequent annual cycles.
4. **Lack of Auditable Provenance:** Difficulty verifying whether procedural steps strictly followed the governing Approval Process Handbook (APH) clauses versus informal administrative practice.

**AICTE FlowGuard** is a secure, configurable web platform and automated workflow engine that models official APH approval pathways, manages scrutiny and re-scrutiny cycles, coordinates EVC scheduling and reports, tracks institutional compliance and document validity, and automates multi-channel notifications and overdue escalations with strict human decision safeguards.

---

## 2. Project Scope & Boundaries

### 2.1 In-Scope for Prototype
- **Fictional Institution & Application Lifecycle:** Complete digital handling of applications across multiple categories:
  - New Technical Institution / Letter of Approval (LoA) (APH Chapter I).
  - Routine Extension of Approval (EoA) via Self-Disclosure (APH Chapter II).
  - Extension of Approval involving Substantive Changes (APH Chapter II, Table 2.3).
  - Deficiency, Re-scrutiny, and Standing Hearing Committee (SHC) compliance routing.
  - Standing Appellate Committee (SAC) appeal lifecycle adhering to Clause 2.24(a).
- **Multi-Role Scoped Access Control (10 Distinct Roles):** Full server-side RBAC and scope checks (institution, regional boundary, case assignment, committee roster).
- **Configurable Workflow Engine:** Finite state machine (FSM) enforcing stage prerequisites, permitted transitions, entry/exit criteria, and versioned rule references.
- **EVC Management System:** Conflict detection, committee assignment, inspection scheduling, and structured report capture.
- **Compliance & Document Validity Tracking:** Dynamic monitoring of expiring certificates (Land Lease, Fire NOC, Affiliation, NBA) with multi-offset early warning reminders and re-verification workflows.
- **Notification, Deadline & Escalation Pipeline:** Transactional outbox pattern coupled with Redis/BullMQ background workers delivering in-app alerts and templated emails with exponential backoff and reconciliation.
- **Role-Aware Dashboards & Analytics:** Pendency tracking, stage ageing buckets, SLA breach alerts, and EVC workloads.
- **Strict Human Decision Safeguards & Advisory AI:** Advisory-only document pre-check and case summaries; zero autonomous AI statutory approvals.

### 2.2 Out-of-Scope / Controlled Boundaries
- **No Direct Replacement of Official AICTE National Portals:** FlowGuard is built as a self-contained prototype; it does not connect to live production government servers without verified API credentials.
- **No Autonomous Statutory Decisions:** AICTE approval or rejection can never be triggered autonomously by software logic or AI models; every terminal decision requires an authenticated Competent Authority digital signature/speaking order.
- **Synthetic Data Exclusivity:** All institutional names, personal identifiers, land records, survey numbers, and credentials used in testing and demonstrations must be purely synthetic.

---

## 3. User Roles & Identity Architecture

FlowGuard enforces 10 discrete roles mapped directly from AICTE administrative regulations:

| Role Name | Scope & Authority | Primary Responsibilities |
| :--- | :--- | :--- |
| **Institution** | Scoped to own `institution_id` | Create/edit draft applications; upload statutory evidence; receive and respond to deficiency notices; upload renewed compliance documents; view permitted case timeline. |
| **Regional Officer (RO)** | Scoped to assigned `region_id` (e.g., Northern, Southern, Western) | Supervise regional pendency; assign Scrutiny Officers; oversee EVC scheduling; recommend cases to Bureau/Council; issue regional compliance notices. |
| **Bureau Officer (BO)** | Scoped to central bureau departments (Approval, Policy, Administration) | Central queue management; coordinate cross-regional policy compliance; review complex change cases; prepare dossiers for Executive Committee. |
| **Scrutiny Officer (SO)** | Scoped to explicitly assigned cases | Evaluate documentary evidence against APH checklists; record clause-wise observations; issue structured deficiency notices; perform re-scrutiny. |
| **EVC Coordinator** | Regional / Central queue scope | Maintain EVC inspection pool; schedule visit dates and modes (Physical/Hybrid); verify committee non-conflict; monitor report submission SLAs. |
| **EVC Member** | Scoped to assigned `evc_event_id` | Access assigned institution dossier; conduct on-site or virtual physical verification; upload geo-tagged photos, video links, and sign joint inspection reports. |
| **SAC/SHC Member** | Scoped to scheduled hearing rosters | Quasi-judicial committee member; review institutional oral and documentary submissions during hearings; record structured recommendations for Council. |
| **Competent Authority** | National executive jurisdiction (Executive Committee / Council / Member Secretary) | Authorize statutory Letter of Approval (LoA), Extension of Approval (EoA), or Speaking Orders of Rejection; final determinative decision-making. |
| **System Administrator** | Technical infrastructure scope | Manage users, role grants, region configurations, workflow definitions, deadline policies, and system queues. **Explicitly barred from making statutory case decisions.** |
| **Auditor** | Read-Only across all scopes | Inspect immutable audit logs, stage transition histories, document hashes, and compliance metrics. Zero write/update permissions. |

---

## 4. Detailed Functional Specifications

### 4.1 Application Ingestion & Lifecycle Management
- **FR-APP-001 (Draft Management):** The system shall allow Institution users to create, auto-save, and edit applications in `DRAFT` state across supported categories.
- **FR-APP-002 (Document Checklist Validation):** Prior to allowing submission, the system shall validate that all mandatory documents specified for the application category (per APH 2024–2027) are uploaded, virus-checked, and checksummed (SHA-256).
- **FR-APP-003 (Submission & Receipt Generation):** Upon formal submission, the system shall atomically:
  1. Generate a unique, human-readable Application Number (e.g., `AICTE-2026-LOA-00142`).
  2. Transition case state from `DRAFT` to `SUBMITTED`.
  3. Create an immutable PDF Submission Receipt containing timestamp, applicant ID, and document digest.
  4. Emit a `CaseSubmittedEvent` into the transactional outbox.

### 4.2 Scrutiny & Deficiency Workspace
- **FR-SCR-001 (Case Assignment):** Regional Officers shall assign `SUBMITTED` applications to authorized Scrutiny Officers within their jurisdiction.
- **FR-SCR-002 (Observation & Checklist Evaluation):** Scrutiny Officers shall evaluate applications using a digital checklist reflecting APH land, building, instructional, and financial norms, marking each item as *Compliant*, *Deficient*, or *Not Applicable*.
- **FR-SCR-003 (Deficiency Notice Generation):** If any mandatory item fails compliance, the Scrutiny Officer shall record an itemized deficiency notice specifying:
  - Exact APH clause violated.
  - Detailed factual deficiency description.
  - Required corrective evidence.
  - Remediation deadline (Default: 7 calendar days).
- **FR-SCR-004 (Deficiency State Transition):** Recording deficiencies atomically transitions the case to `DEFICIENCY_RESPONSE`, locks scrutiny editing, and dispatches urgent notifications to the Institution.
- **FR-SCR-005 (Institutional Resubmission & Versioning):** The Institution shall upload rectified documentation. The system shall preserve prior document versions, record version diffs, and transition the case to `RE_SCRUTINY`.
- **FR-SCR-006 (Re-Scrutiny Enforcement):** Scrutiny Officers shall review only the itemized deficient items during re-scrutiny. If non-compliance persists, the system shall block second deficiency notices and route the case directly to `HEARING_OR_COMMITTEE_REVIEW` (SHC).

### 4.3 Expert Visit Committee (EVC) Module
- **FR-EVC-001 (EVC Queue & Eligibility):** Cases requiring physical inspection (e.g., all LoA cases, change of site, unaccredited intake expansion) automatically enter the `EVC_PENDING` queue upon scrutiny clearance.
- **FR-EVC-002 (Committee Scheduling & Conflict Prevention):** EVC Coordinators shall create an `evc_event`, selecting inspection mode (Physical or Hybrid), inspection date, and assigning a 3-member committee from the vetted expert roster. The system shall block assignment of any expert affiliated with the institution or residing in the same municipal district.
- **FR-EVC-003 (Roster Notification & Acceptance):** Assigned EVC members receive encrypted briefing dossiers and must confirm their availability within 48 hours.
- **FR-EVC-004 (Inspection Evidence Capture):** EVC Members shall submit on-site verification evidence including geo-tagged, timestamped laboratory and infrastructure photographs, a secure link to the uncut video recording of the inspection, and quantitative equipment audits.
- **FR-EVC-005 (Report Submission & Anti-Auto-Close):** The inspection cannot be marked complete simply because the scheduled calendar date has elapsed. EVC completion requires explicit submission of the joint signed EVC Report (`evc_report`) by assigned members.

### 4.4 Standing Hearing Committee (SHC) & Appellate (SAC) Module
- **FR-SHC-001 (Hearing Docketing):** Applications with unresolved deficiencies after re-scrutiny or adverse EVC findings shall be scheduled for a formal Standing Hearing Committee session.
- **FR-SHC-002 (Quasi-Judicial Minutes):** SHC benches shall record hearing attendance, review institutional rejoinders, and record formal consensus recommendations to either recommend approval, uphold rejection, or order a Surprise EVC inspection.
- **FR-SAC-001 (Statutory 7-Day Appeal Intake):** When an adverse decision (Rejection) is uploaded to the portal, the system shall activate a strict **7-calendar-day appeal window** per APH Clause 2.24(a).
- **FR-SAC-002 (Statutory Appeal Enforcement):** The system shall calculate the deadline exactly as `uploaded_at + 7 days (23:59:59 UTC)`. If the institution submits an appeal memo within this window, the case transitions from `CLOSED` to `HEARING_OR_COMMITTEE_REVIEW` (SAC Appeal). If the window elapses, the appeal submission button is permanently disabled.
- **FR-SAC-003 (Appellate Decision Submission):** Standing Appellate Committee recommendations are compiled and submitted directly to the AICTE Council for final determinative order.

### 4.5 Statutory Decision Safeguards (Human Authority Only)
- **FR-DEC-001 (Decision Stage Exclusivity):** Only users authenticated with the `Competent Authority` role can execute terminal approval or rejection transitions at the `DECISION_PENDING` stage.
- **FR-DEC-002 (Automated Decision Prohibition):** Software algorithms, scheduled cron jobs, and AI agents are programmatically barred from executing statutory approval, refusal, or punitive sanctions.
- **FR-DEC-003 (Speaking Order Generation):** Every terminal decision must contain a signed justification, recorded in the audit log and published as a tamper-evident digital order.

### 4.6 Compliance & Document Validity Monitoring
- **FR-DOC-001 (Four-Dimensional Status Tracking):** Each compliance obligation shall maintain four independent status dimensions:
  1. `submission_status`: `NOT_SUBMITTED`, `SUBMITTED`, `RESUBMISSION_REQUIRED`.
  2. `verification_status`: `PENDING`, `VERIFIED`, `REJECTED`, `NEEDS_CORRECTION`.
  3. `validity_status`: `VALID`, `EXPIRING_SOON`, `EXPIRED`, `UNKNOWN`.
  4. `compliance_status`: `OPEN`, `SUBMITTED`, `UNDER_REVIEW`, `FULFILLED`, `OVERDUE`.
- **FR-DOC-002 (Document Expiry Engine):** The system shall register document types (e.g., Registered Land Lease Deed, Fire Safety NOC, Structural Stability Certificate, Affiliating University NOC, NBA Accreditation Certificate) with their valid-from and valid-to dates.
- **FR-DOC-003 (Multi-Tier Expiry Notifications):** BullMQ workers evaluate document validities daily and dispatch alerts at configured offsets: **T-180 days**, **T-90 days**, **T-30 days**, **T-7 days**, and **On Expiry Date**.
- **FR-DOC-004 (Renewal Submission & Verification Loop):** Uploading a renewed certificate preserves the historical expired document, creates a new document version record, and places the obligation into `UNDER_REVIEW` awaiting Scrutiny/Regional Officer re-verification. An obligation is marked `FULFILLED` only when verification succeeds.

### 4.7 Notification, Deadline & Escalation Engine
- **FR-NOT-001 (Transactional Outbox Pattern):** All workflow state changes, deficiency issuances, and deadline updates must insert an `outbox_events` record within the same PostgreSQL transaction as the state change.
- **FR-NOT-002 (Background Worker Processing):** Asynchronous BullMQ workers poll the outbox table, generate deduplication keys, schedule reminder triggers in Redis, and dispatch multi-channel notifications (In-App notifications and templated emails).
- **FR-NOT-003 (Pre-Delivery Eligibility Revalidation):** Before delivering any scheduled notification or escalation alert, the worker shall re-query the PostgreSQL database to verify that the task or obligation is still open. If the institution has resolved the deficiency or uploaded the renewal, the alert is cancelled.
- **FR-NOT-004 (Escalation Hierarchy):** Unresolved tasks trigger automated escalation:
  - **Level 1 Escalation (+2 days overdue):** Alert to Assigned Officer and Section Supervisor.
  - **Level 2 Escalation (+5 days overdue):** Alert to Regional Director and central Bureau Officer.
- **FR-NOT-005 (Reconciliation Worker):** A recurring cron job running every 60 minutes inspects the database for stuck outbox events, missed cron triggers, or unregistered deadlines to ensure 100% notification delivery reliability.

### 4.8 Auditing & Operational Dashboards
- **FR-AUD-001 (Immutable Audit Ledger):** Every authenticated action, stage transition, document upload, deficiency resolution, and role grant must be recorded in an append-only `audit_logs` table capturing `actor_user_id`, `client_ip`, `action_type`, `resource_id`, `before_state`, and `after_state`.
- **FR-DASH-001 (Role-Aware Metrics):** Dashboards shall display real-time database queries matching user role and scope:
  - *Institution:* Active applications, pending deficiencies, upcoming document expirations.
  - *Scrutiny Officer:* My assigned scrutiny queue, pending re-scrutinies, SLA ageing indicators.
  - *EVC Coordinator:* Unscheduled visits, overdue inspection reports, expert roster availability.
  - *Regional Officer:* Total regional pendency, stage ageing buckets (<7d, 7-14d, >14d), escalation alerts.
  - *Auditor:* Global activity log, drill-down case provenance, exception logs.

### 4.9 AI Features & Architectural Boundaries
- **FR-AI-001 (Document Pre-Check - Advisory):** An optional AI adapter parses uploaded PDF documents to extract candidate dates (lease expiry, execution date), issuing authority stamps, and survey numbers. Extracted values are presented as **draft suggestions** to human officers, requiring mandatory human confirmation.
- **FR-AI-002 (Case Brief Summarizer):** Provides officers with a concise, factual summary of case timeline, prior deficiencies, and committee findings compiled strictly from verified database records.
- **FR-AI-003 (Decision Firewall):** The system architecture shall enforce a strict software boundary preventing AI modules from accessing state transition or approval endpoints.

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Security & Access Control
- **NFR-SEC-001:** Server-side authentication and authorization must be evaluated on every API request. Zero trust on client-supplied role or scope headers.
- **NFR-SEC-002:** Scoped multi-tenancy: Institutions cannot access peer institution records; Regional Officers cannot access cases outside their designated geographical boundary.
- **NFR-SEC-003:** Document files stored in private S3/MinIO buckets; served exclusively via short-lived (maximum 15-minute validity), pre-signed authorization URLs.
- **NFR-SEC-004:** Passwords, API tokens, session secrets, and document binaries must never appear in application logs or audit metadata.

### 5.2 Reliability & Data Integrity
- **NFR-REL-001:** Relational integrity enforced through foreign keys, unique constraints, and ACID transactions in PostgreSQL.
- **NFR-REL-002:** Optimistic concurrency control (version counters) on application cases to prevent race conditions during concurrent officer evaluations.
- **NFR-REL-003:** Idempotent job processing in BullMQ to guarantee that network hiccups or process crashes never result in duplicate emails or duplicate escalation alerts.
- **NFR-REL-004:** All timestamps stored in UTC; localized timezone conversions (IST - UTC+05:30) applied explicitly at presentation and date-boundary calculation layers.

### 5.3 Performance & Usability
- **NFR-PERF-001:** Case detail page load and workflow transition API responses must complete within <500ms under standard operational load.
- **NFR-UI-001:** Clear textual status badges (never color-alone indicators) complying with accessibility (WCAG 2.1 AA) standards.
- **NFR-UI-002:** Every UI data table must support loading skeletons, empty states, error boundaries, search filtering, and pagination.
