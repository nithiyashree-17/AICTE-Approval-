# AICTE FlowGuard — Workflow State Diagrams & Pathways

**Document Control:**
- **Project:** AICTE FlowGuard (Problem Statement ID: 26262)
- **Document Role:** Teammate 1 (Product / APH Mapping)
- **Status:** Baseline Approved
- **Primary Source:** AICTE Approval Process Handbook (APH) 2024–2027

---

## 1. Master Application State Machine

This master finite state machine (FSM) governs all application cases in the AICTE FlowGuard platform. Individual application templates activate specific subsets of these states and transitions.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Institution Creates Application
    DRAFT --> SUBMITTED : Form Validated & Fee Paid (Atomic Receipt Generated)
    
    SUBMITTED --> SCRUTINY : RO Assigns Case / Intake Cleared
    SUBMITTED --> DECISION_PENDING : Routine EoA Fast-Track (Self-Disclosure Cleared)

    state SCRUTINY {
        [*] --> DocumentEvaluation
        DocumentEvaluation --> Compliant : All APH Norms Met
        DocumentEvaluation --> DeficienciesFound : Missing / Non-Compliant Docs
    }

    SCRUTINY --> DEFICIENCY_RESPONSE : Scrutiny Officer Issues Deficiency Notice
    SCRUTINY --> EVC_PENDING : Scrutiny Cleared (Inspection Required)
    SCRUTINY --> DECISION_PENDING : Scrutiny Cleared (No EVC Required)

    DEFICIENCY_RESPONSE --> RE_SCRUTINY : Institution Resubmits Corrected Evidence
    DEFICIENCY_RESPONSE --> DECISION_PENDING : Remediation Deadline Elapsed (Auto-Forward Deficient)

    state RE_SCRUTINY {
        [*] --> ItemizedVerification
        ItemizedVerification --> Cleared : Deficiencies Resolved
        ItemizedVerification --> StillDeficient : Deficiencies Persist
    }

    RE_SCRUTINY --> EVC_PENDING : Re-Scrutiny Cleared (Inspection Required)
    RE_SCRUTINY --> HEARING_OR_COMMITTEE_REVIEW : Unresolved Deficiencies -> Scheduled for SHC

    state EVC_PENDING {
        [*] --> CommitteeNomination
        CommitteeNomination --> ConflictCheckPassed
    }

    EVC_PENDING --> EVC_SCHEDULED : EVC Coordinator Assigns 3 Experts & Date
    EVC_SCHEDULED --> EVC_REVIEW : Inspection Conducted (Report Uploaded by Committee)
    
    EVC_REVIEW --> DECISION_PENDING : EVC Report Favorable
    EVC_REVIEW --> HEARING_OR_COMMITTEE_REVIEW : EVC Reports Infrastructure Deficit -> SHC

    state HEARING_OR_COMMITTEE_REVIEW {
        [*] --> QuorumCheck
        QuorumCheck --> HearingConducted
        HearingConducted --> RecommendationDrafted
    }

    HEARING_OR_COMMITTEE_REVIEW --> EVC_PENDING : Committee Orders Surprise Physical Inspection
    HEARING_OR_COMMITTEE_REVIEW --> DECISION_PENDING : SHC/SAC Formal Recommendations Submitted

    state DECISION_PENDING {
        [*] --> CompetentAuthorityReview
        CompetentAuthorityReview --> FinalDetermination
    }

    DECISION_PENDING --> CLOSED_APPROVED : Letter of Approval (LoA) or EoA Issued
    DECISION_PENDING --> CLOSED_REJECTED : Speaking Order of Rejection Issued

    state CLOSED_REJECTED {
        [*] --> AppealTimerActivated
        AppealTimerActivated --> Statutory7DayWindow : Cl. 2.24(a)
    }

    CLOSED_REJECTED --> HEARING_OR_COMMITTEE_REVIEW : Institution Files SAC Appeal (Within 7 Calendar Days)
    CLOSED_APPROVED --> [*]
```

---

## 2. Template A: New Technical Institution / Letter of Approval (LoA)

Mapped directly from **APH Chapter I (Clauses 1.3 to 1.12)**. Requires mandatory documentary scrutiny, physical infrastructure verification via EVC, and final authorization by the Executive Committee / Competent Authority.

```mermaid
flowchart TD
    subgraph Institution["Institution Actor"]
        A1["Create Draft Application (Chap I)"] --> A2["Upload Land, Building, Finance Evidence"]
        A2 --> A3["Pay Processing Fee & Submit Application"]
    end

    subgraph Intake["Regional Office / Intake"]
        A3 --> B1["Automated Intake Check & Hash Generation"]
        B1 --> B2["Application Number Generated: DRAFT -> SUBMITTED"]
        B2 --> B3["RO Assigns Scrutiny Officer"]
    end

    subgraph Scrutiny["Scrutiny Stage"]
        B3 --> C1["Scrutiny Officer Evaluates Land, Plan & NOCs"]
        C1 --> C2{"Deficiencies Identified?"}
        C2 -- Yes --> C3["Issue Itemized Deficiency Notice: SUBMITTED -> DEFICIENCY_RESPONSE"]
        C2 -- No --> C4["Scrutiny Clearance: SCRUTINY -> EVC_PENDING"]
    end

    subgraph Remediation["Deficiency & Re-Scrutiny"]
        C3 --> D1["Institution Uploads Rectified Evidence (7-day SLA)"]
        D1 --> D2["Resubmission: DEFICIENCY_RESPONSE -> RE_SCRUTINY"]
        D2 --> D3["Scrutiny Officer Performs Targeted Re-Scrutiny"]
        D3 --> D4{"Deficiencies Resolved?"}
        D4 -- Yes --> C4
        D4 -- No --> D5["Case Referred to SHC: RE_SCRUTINY -> HEARING_OR_COMMITTEE_REVIEW"]
    end

    subgraph EVC["Expert Visit Committee (EVC)"]
        C4 --> E1["EVC Coordinator Schedules Date & Appoints 3 Experts"]
        E1 --> E2["State: EVC_PENDING -> EVC_SCHEDULED"]
        E2 --> E3["EVC Conducts On-Site Physical Inspection"]
        E3 --> E4["EVC Uploads Signed Report, Geotagged Photos & Video Link"]
        E4 --> E5["State: EVC_SCHEDULED -> EVC_REVIEW"]
        E5 --> E6{"EVC Recommends Approval?"}
        E6 -- Yes --> E7["Forward Dossier: EVC_REVIEW -> DECISION_PENDING"]
        E6 -- No --> D5
    end

    subgraph Decision["Competent Authority (Council / EC)"]
        E7 --> F1["Executive Committee Reviews Dossier"]
        D5 --> F2["SHC Conducts Hearing & Records Recommendation"]
        F2 --> F1
        F1 --> F3{"Final Statutory Determination"}
        F3 -- Approved --> F4["Issue Letter of Approval (LoA): DECISION_PENDING -> CLOSED_APPROVED"]
        F3 -- Rejected --> F5["Issue Speaking Order of Rejection: DECISION_PENDING -> CLOSED_REJECTED"]
    end
```

---

## 3. Template B: Routine Extension of Approval (EoA) via Self-Disclosure

Mapped from **APH Chapter II (Clauses 2.1 to 2.4 and Table 2.3)**. Applies to existing, accredited/compliant institutions with no structural, programmatic, or intake changes.

```mermaid
flowchart TD
    subgraph Institution["Institution Actor"]
        B_Inst1["Access Annual Portal"] --> B_Inst2["Complete Annual Self-Disclosure Form"]
        B_Inst2 --> B_Inst3["Affirm Faculty Cadre, Student Enrollment & Infrastructure"]
        B_Inst3 --> B_Inst4["Pay Processing Fee & Submit (DRAFT -> SUBMITTED)"]
    end

    subgraph Automation["System Verification Engine"]
        B_Inst4 --> B_Auto1["Query Regulatory Rules & Status"]
        B_Auto1 --> B_Auto2{"Automated Check Criteria:
        1. Valid NBA/NAAC Accreditation?
        2. Land Lease Remaining Term >= 1 Year?
        3. Zero Pending Compliance Sanctions?
        4. Zero Course/Intake Alterations?"}
        
        B_Auto2 -- All Criteria Passed --> B_Auto3["Automated Compliance Clearance Memo Generated"]
        B_Auto2 -- Any Flag / Failure --> B_Manual["Route to Manual Scrutiny (Template C)"]
    end

    subgraph Council["Competent Authority"]
        B_Auto3 --> B_Council1["State: SUBMITTED -> DECISION_PENDING"]
        B_Council1 --> B_Council2["Batch Review & Approval by Member Secretary"]
        B_Council2 --> B_Council3["State: DECISION_PENDING -> CLOSED_APPROVED"]
        B_Council3 --> B_Council4["Digital Watermarked EoA Certificate Issued & Published"]
    end
```

---

## 4. Template C: Extension of Approval with Substantive Changes

Mapped from **APH Chapter II (Clauses 2.5–2.14 and Table 2.3)**. Governs expansion of intake, addition of new programs/courses, change of site, or change of trust name.

```mermaid
flowchart TD
    subgraph AppType["Application Intake & Classification"]
        C_Start["Institution Selects Substantive Change Application"] --> C_Class{"Change Classification per Table 2.3"}
        C_Class -- "Increase Intake / New Course" --> C_ScrutinyReq["Mandatory Scrutiny Required"]
        C_Class -- "Change of Site / Location" --> C_BothReq["Mandatory Scrutiny + Mandatory EVC"]
        C_Class -- "Closure / Name Change" --> C_DocReq["Documentary Scrutiny Only"]
    end

    subgraph ScrutinyExec["Scrutiny Execution"]
        C_ScrutinyReq --> C_Assign["RO Assigns Scrutiny Officer"]
        C_BothReq --> C_Assign
        C_DocReq --> C_Assign
        C_Assign --> C_ScrutinyWork["Scrutiny Officer Audits Building Plan, Cadre Ratio, DPR"]
        C_ScrutinyWork --> C_ScrutinyOutcome{"Scrutiny Result"}
        C_ScrutinyOutcome -- Deficient --> C_DefNotice["Issue Deficiency Notice (7-Day Cure)"]
        C_DefNotice --> C_Resub["Institution Resubmits -> Re-Scrutiny"]
        C_Resub --> C_ScrutinyOutcome
        C_ScrutinyOutcome -- Compliant --> C_EVC_Check{"EVC Mandated by Table 2.3?"}
    end

    subgraph EVCSwitch["Inspection Routing"]
        C_EVC_Check -- Yes (Site Change / Massive Expansion) --> C_ToEVC["State: SCRUTINY -> EVC_PENDING"]
        C_ToEVC --> C_EVC_Exec["3-Member EVC Physical Site Audit"]
        C_EVC_Exec --> C_ToDecision["State: EVC_REVIEW -> DECISION_PENDING"]
        C_EVC_Check -- No (Norms verified on paper) --> C_ToDecision
    end

    subgraph Authority["Final Determination"]
        C_ToDecision --> C_Auth["Competent Authority Signs Speaking Order / Revised EoA"]
        C_Auth --> C_Final["State: DECISION_PENDING -> CLOSED_APPROVED"]
    end
```

---

## 5. Template D: Deficiency, Re-Scrutiny & Standing Hearing Committee (SHC)

Mapped from **APH Chapter II (Clauses 2.19 to 2.21)**. Governs the quasi-judicial hearing pathway when documentary deficiencies or physical EVC shortcomings cannot be resolved through administrative re-scrutiny.

```mermaid
flowchart TD
    subgraph Trigger["Deficiency Escalation Trigger"]
        D_Trig1["Re-Scrutiny Identifies Persistent Deficiencies"] --> D_Trig3["Regional Officer Refers Case to SHC"]
        D_Trig2["EVC Reports Critical Infrastructure Deficit"] --> D_Trig3
        D_Trig3 --> D_State1["State: ... -> HEARING_OR_COMMITTEE_REVIEW"]
    end

    subgraph Docketing["Hearing Docketing & Summoning"]
        D_State1 --> D_Doc1["Regional Officer Issues Formal Hearing Notice (5-Day Advance Notice)"]
        D_Doc1 --> D_Doc2["Notice Contains Itemized Statement of Discrepancies"]
        D_Doc2 --> D_Doc3["Institution Submits Written Rejoinder & Nominates Authorized Attendees"]
    end

    subgraph Hearing["Quasi-Judicial SHC Bench Proceedings"]
        D_Doc3 --> D_Bench1["Standing Hearing Committee Convenes (Retired Judge / Senior Academicians)"]
        D_Bench1 --> D_Bench2["Institutional Representatives Present Original Documents & Oral Arguments"]
        D_Bench2 --> D_Bench3["SHC Deliberates on Facts and APH Standards"]
        D_Bench3 --> D_BenchOutcome{"SHC Recommendation"}
        
        D_BenchOutcome -- "Facts Uncertain / Verification Needed" --> D_Surprise["Recommend Surprise Physical Inspection (EVC)"]
        D_Surprise --> D_SurpriseExec["State: HEARING_OR_COMMITTEE_REVIEW -> EVC_PENDING"]
        
        D_BenchOutcome -- "Compliance Established" --> D_RecApprove["Record Recommendation for Approval"]
        D_BenchOutcome -- "Deficiencies Confirmed" --> D_RecReject["Record Recommendation for Rejection / Penalty"]
    end

    subgraph Submission["Submission to Council"]
        D_RecApprove --> D_CouncilDossier["Compile Signed Minutes of Meeting & Dossier"]
        D_RecReject --> D_CouncilDossier
        D_CouncilDossier --> D_Decision["State: HEARING_OR_COMMITTEE_REVIEW -> DECISION_PENDING"]
        D_Decision --> D_FinalSign["Competent Authority Passes Statutory Speaking Order"]
    end
```

---

## 6. Template E: Standing Appellate Committee (SAC) & Council Appeal Pathway

Mapped strictly from **APH Chapter II, Clause 2.24(a), (b), and (c)**.

```mermaid
sequenceDiagram
    autonumber
    actor Inst as Institution
    participant Portal as AICTE FlowGuard Portal
    participant DB as PostgreSQL Database
    participant Worker as BullMQ Timer Worker
    actor SAC as Standing Appellate Committee (SAC)
    actor Council as Council / Member Secretary

    Note over Portal,Council: Initial Adverse Decision Uploaded
    Council->>Portal: Upload Adverse Decision (Speaking Order of Rejection)
    Portal->>DB: UPDATE applications SET state = 'CLOSED_REJECTED', uploaded_at = NOW()
    Portal->>Worker: Enqueue Appeal Window Job (Expires uploaded_at + 7 Calendar Days)
    Portal->>Inst: Dispatch Email & In-App Notice: 7-Day Appeal Window Activated

    alt Appeal Filed Within 7 Calendar Days (Cl. 2.24(a))
        Inst->>Portal: File Appeal Memo + Rebuttal Evidence + Appeal Fee
        Portal->>DB: Validate NOW() <= uploaded_at + 7 days (23:59:59 UTC)
        DB-->>Portal: Validation Passed (Timestamp in bounds)
        Portal->>DB: UPDATE applications SET state = 'HEARING_OR_COMMITTEE_REVIEW', sub_type = 'SAC_APPEAL'
        Portal->>Worker: Cancel Appeal Expiry Job
        Portal->>SAC: Case Docketed in SAC Appellate Queue
        
        Note over SAC,Inst: SAC Appellate Hearing
        SAC->>Inst: Issue Summons for Appellate Hearing
        Inst->>SAC: Present Oral Argument & Demonstrative Rebuttal
        SAC->>Portal: Record SAC Findings & Recommendation Report
        Portal->>DB: UPDATE applications SET state = 'DECISION_PENDING'
        
        Council->>Portal: Review SAC Findings at Council Meeting
        alt Council Grants Relief
            Council->>Portal: Issue Letter of Approval / EoA
            Portal->>DB: UPDATE applications SET state = 'CLOSED_APPROVED'
        else Council Rejection Sustained
            Council->>Portal: Issue Final Determinative Speaking Order
            Portal->>DB: UPDATE applications SET state = 'CLOSED_REJECTED', appeal_exhausted = true
        end
    else 7 Calendar Days Expire Without Appeal
        Worker->>DB: Appeal Window Expired (NOW() > uploaded_at + 7 days)
        DB-->>Portal: Lock Case Permanently
        Portal->>Inst: Notification: Statutory Administrative Appeal Barred by Limitation
    end
```

---

## 7. Document Validity & Lease Renewal Lifecycle

Governs ongoing institutional compliance, tracking long-term land leases, fire safety NOCs, structural certificates, and NBA accreditation validity.

```mermaid
stateDiagram-v2
    [*] --> VALID : Registered Document Approved During Scrutiny/EVC
    
    VALID --> EXPIRING_SOON : BullMQ Detects Expiry within Offset (T-180d, T-90d, T-30d, T-7d)
    
    state EXPIRING_SOON {
        [*] --> SendReminder180d
        SendReminder180d --> SendReminder90d
        SendReminder90d --> SendReminder30d
        SendReminder30d --> SendEscalation7d
    }

    EXPIRING_SOON --> EXPIRED : Document Expiration Date Reached (T-0)
    
    EXPIRING_SOON --> SUBMITTED : Institution Uploads Renewed Registered Document (Preserving Historical Version)
    EXPIRED --> SUBMITTED : Institution Uploads Renewed Document (Post-Expiry Compliance Cure)

    state SUBMITTED {
        [*] --> NewDocumentVersionStored
        NewDocumentVersionStored --> VerificationQueueAssigned
    }

    SUBMITTED --> UNDER_REVIEW : Scrutiny / Regional Officer Opens Renewal Dossier
    
    state UNDER_REVIEW {
        [*] --> InspectRegistrarStamps
        InspectRegistrarStamps --> ValidateRemainingTerm
    }

    UNDER_REVIEW --> VALID : Verification Approved (Obligation Marked FULFILLED)
    UNDER_REVIEW --> NEEDS_CORRECTION : Document Defective / Unregistered -> Deficiency Issued

    NEEDS_CORRECTION --> SUBMITTED : Institution Re-uploads Corrected Evidence
    NEEDS_CORRECTION --> OVERDUE : Cure SLA Missed -> Escalated to Regional Director
```

---

## 8. Outbox, BullMQ, Notification & Escalation Event Flow

Ensures zero message loss, atomic updates, idempotent execution, and automated escalation across system boundaries.

```mermaid
flowchart TD
    subgraph API["NestJS Application Transaction Boundary"]
        Req["User Request (e.g. Issue Deficiency / Transition State)"] --> Guard["Validate RBAC, Scope & Transition Guard"]
        Guard --> DB_Tx["PostgreSQL ACID Transaction
        1. UPDATE applications (new state)
        2. INSERT INTO application_stage_history
        3. INSERT INTO audit_logs
        4. INSERT INTO outbox_events"]
        DB_Tx --> Commit["Transaction Committed"]
    end

    subgraph OutboxWorker["BullMQ Outbox Poller Worker"]
        Commit -.-> Poll["Poll / Listen for Committed Outbox Events"]
        Poll --> LockEvent["Lock Outbox Record & Generate Deduplication Key"]
        LockEvent --> RouteJob{"Event Routing"}
        RouteJob -- State Change / Audit --> EmitWS["In-App Notification Dispatch"]
        RouteJob -- Deadline / Reminder --> EnqueueBull["Enqueue Delayed Job in Redis (e.g. T-3d, T-0, +2d Escalation)"]
    end

    subgraph ScheduledWorker["BullMQ Deadline & Escalation Worker"]
        EnqueueBull -.-> TriggerTime["Scheduled Time Reached (or Cron Reconciliation)"]
        TriggerTime --> RecheckDB{"Recheck DB State:
        Is task / obligation still open?
        Has deadline been amended?"}
        RecheckDB -- Resolved / Obsolete --> CancelAlert["Discard Job (Suppress Outdated Alert)"]
        RecheckDB -- Still Open --> CheckAge{"Task Age vs Deadline"}
        
        CheckAge -- "Before Due Date" --> SendReminder["Dispatch Reminder Notification (Institution & Officer)"]
        CheckAge -- "0 to 2 Days Overdue" --> SendOverdue["Mark Status = OVERDUE & Send Alert"]
        CheckAge -- "2 to 5 Days Overdue" --> EscalationL1["Dispatch Level 1 Escalation: Section Supervisor"]
        CheckAge -- "> 5 Days Overdue" --> EscalationL2["Dispatch Level 2 Escalation: Regional Director & Bureau Head"]
    end

    subgraph Delivery["Delivery Adapters"]
        SendReminder --> EmailAdapter["Email Provider Adapter (Resend / SMTP / Mock in Dev)"]
        SendOverdue --> EmailAdapter
        EscalationL1 --> EmailAdapter
        EscalationL2 --> EmailAdapter
        SendReminder --> InAppAdapter["In-App Alert DB Record (Real-time Webhook)"]
        SendOverdue --> InAppAdapter
        EscalationL1 --> InAppAdapter
        EscalationL2 --> InAppAdapter
    end
```
