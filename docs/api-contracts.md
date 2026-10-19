# AICTE FlowGuard — REST API Contracts & Specifications

**Document Control:**
- **Project:** AICTE FlowGuard (Problem Statement ID: 26262)
- **Document Role:** Teammate B (Backend / Database)
- **Status:** Complete Baseline REST API Specifications
- **Standard:** OpenAPI 3.1 / NestJS Swagger Compatible
- **Source Basis:** Section 13 of AICTE FlowGuard Implementation Plan

---

## 1. Global API Standards & Conventions

1. **Base URL:** `/api/v1`
2. **Content-Type:** `application/json` (except multi-part pre-signed S3 direct uploads).
3. **Authentication:** Bearer JWT in `Authorization: Bearer <token>` header or `flowguard_session` HTTP-only cookie.
4. **Error Envelope Standard:**
   ```json
   {
     "statusCode": 403,
     "timestamp": "2026-10-19T22:45:00.000Z",
     "path": "/api/v1/applications/c7b2c001/transitions",
     "error": "Forbidden",
     "message": "Actor role ROLE_SCRUTINY_OFFICER cannot execute GRANT_APPROVAL",
     "correlationId": "req-98f24a1b"
   }
   ```
5. **Pagination Standard:**
   Query parameters: `?page=1&limit=20&sortBy=createdAt&sortOrder=desc`
   Response envelope:
   ```json
   {
     "data": [],
     "meta": { "total": 124, "page": 1, "limit": 20, "totalPages": 7 }
   }
   ```

---

## 2. API Endpoints by Module

### 2.1 Authentication Module (`/auth`)

#### `POST /auth/login`
- **Description:** Authenticates user credentials and returns JWT bearer token. In development, demo switcher bypasses password check for seeded demo personas.
- **Request Body:**
  ```json
  {
    "email": "regional.director@aicte.gov.in",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400,
    "user": {
      "id": "u-45218d6a-8d1e-4cb8-8f55-1b32d20e2941",
      "email": "regional.director@aicte.gov.in",
      "fullName": "Dr. Rajesh Sharma",
      "role": "ROLE_REGIONAL_OFFICER",
      "regionId": "reg-nw-001",
      "regionName": "North Western Region",
      "institutionId": null
    }
  }
  ```

#### `GET /auth/me`
- **Description:** Returns profile and active permissions for the currently authenticated user session.
- **Response (200 OK):** Current session user object with assigned permissions array.

---

### 2.2 Application Lifecycle Module (`/applications`)

#### `POST /applications`
- **Description:** Initiates a new application draft for the authenticated institution.
- **Authorized Role:** `ROLE_INSTITUTION`
- **Request Body:**
  ```json
  {
    "academicYear": "2026-2027",
    "category": "NEW_INSTITUTION_LOA",
    "workflowVersionId": "wf-v1-loa-uuid"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "app-819f01bc-401f-4b02-a1f9-81a17937104b",
    "applicationNumber": "AICTE-2026-LOA-00142",
    "currentStage": "DRAFT",
    "institutionId": "inst-678a-uuid",
    "version": 1,
    "createdAt": "2026-10-19T17:15:00.000Z"
  }
  ```

#### `PATCH /applications/:id/draft`
- **Description:** Auto-saves section data and institutional parameters while application is in `DRAFT` stage.
- **Authorized Role:** `ROLE_INSTITUTION` (Scoped to own `institution_id`)
- **Request Body:**
  ```json
  {
    "landDetails": {
      "surveyNumber": "Plot 42/B, Industrial Area",
      "landAreaAcres": 7.5,
      "leaseHoldYearsRemaining": 33
    },
    "programsProposed": [
      { "course": "Computer Science & Engineering", "intake": 120 },
      { "course": "Artificial Intelligence & Data Science", "intake": 60 }
    ]
  }
  ```
- **Response (200 OK):** Updated application object.

#### `POST /applications/:id/submit`
- **Description:** Validates mandatory document presence, generates cryptographic digest, and transitions case from `DRAFT` to `SUBMITTED`.
- **Authorized Role:** `ROLE_INSTITUTION`
- **Response (200 OK):**
  ```json
  {
    "id": "app-819f01bc-401f-4b02-a1f9-81a17937104b",
    "currentStage": "SUBMITTED",
    "submittedAt": "2026-10-19T17:20:00.000Z",
    "receiptUrl": "https://storage.aicte.gov.in/receipts/AICTE-2026-LOA-00142.pdf",
    "documentDigestSha256": "3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d"
  }
  ```

---

### 2.3 Workflow & Transition Engine (`/workflow` & `/applications/:id/transitions`)

#### `GET /applications/:id/available-actions`
- **Description:** Computes permitted workflow transitions and UI action buttons based on current state, user role, and scope.
- **Response (200 OK):**
  ```json
  {
    "applicationId": "app-819f01bc-401f-4b02-a1f9-81a17937104b",
    "currentStage": "SCRUTINY",
    "availableTransitions": [
      {
        "transitionName": "CLEAR_SCRUTINY",
        "targetStage": "EVC_PENDING",
        "buttonLabel": "Clear Scrutiny & Forward to EVC",
        "requiresEvidence": true
      },
      {
        "transitionName": "ISSUE_DEFICIENCIES",
        "targetStage": "DEFICIENCY_RESPONSE",
        "buttonLabel": "Raise Itemized Deficiencies",
        "requiresEvidence": true
      }
    ]
  }
  ```

#### `POST /applications/:id/transitions`
- **Description:** Atomic execution of state machine transition.
- **Request Body:**
  ```json
  {
    "targetStage": "DEFICIENCY_RESPONSE",
    "reason": "Missing Fire Safety Certificate and Land Registration Deed stamp unclear.",
    "evidencePayload": {
      "checklistId": "chk-scrutiny-loa-01"
    }
  }
  ```
- **Response (200 OK):** Updated application record with new `currentStage`.

---

### 2.4 Scrutiny & Deficiency Module (`/scrutiny` & `/deficiencies`)

#### `POST /applications/:id/deficiencies`
- **Description:** Scrutiny Officer creates itemized deficiencies for an application.
- **Authorized Role:** `ROLE_SCRUTINY_OFFICER`
- **Request Body:**
  ```json
  {
    "deficiencies": [
      {
        "aphClause": "Chapter I, Clause 1.10(b)",
        "description": "Lease deed submitted does not show registration with Sub-Registrar Office.",
        "requiredRemediation": "Upload clear color scan of Registered Lease Agreement with official seal.",
        "daysToRespond": 7
      }
    ]
  }
  ```
- **Response (201 Created):** Array of created deficiency records with generated due dates.

#### `POST /deficiencies/:id/respond`
- **Description:** Institution uploads rectified evidence addressing a specific deficiency.
- **Authorized Role:** `ROLE_INSTITUTION`
- **Request Body:**
  ```json
  {
    "institutionNotes": "Registered copy obtained from District Registrar office attached.",
    "rectifiedDocumentKey": "documents/inst-678a/registered-lease-rectified-v2.pdf"
  }
  ```
- **Response (200 OK):** Updated deficiency status (`RESUBMITTED`).

---

### 2.5 Expert Visit Committee (EVC) Module (`/evc`)

#### `GET /evc/queue`
- **Description:** Retrieves cases awaiting EVC scheduling within coordinator's regional scope.
- **Authorized Role:** `ROLE_EVC_COORDINATOR`, `ROLE_REGIONAL_OFFICER`

#### `POST /evc/events`
- **Description:** Creates an EVC visit record, assigns inspection date, mode, and 3-member roster.
- **Request Body:**
  ```json
  {
    "applicationId": "app-819f01bc-401f-4b02-a1f9-81a17937104b",
    "mode": "PHYSICAL",
    "scheduledDate": "2026-11-05",
    "assignments": [
      { "memberUserId": "u-exp-01", "role": "CHAIRMAN" },
      { "memberUserId": "u-exp-02", "role": "SUBJECT_EXPERT" },
      { "memberUserId": "u-exp-03", "role": "ARCHITECT_MEMBER" }
    ]
  }
  ```
- **Response (201 Created):** Created `evc_event` with assignment details.

#### `POST /evc/events/:id/reports`
- **Description:** Assigned committee member submits joint inspection report, geotagged photos, and video recording link.
- **Authorized Role:** `ROLE_EVC_MEMBER`
- **Request Body:**
  ```json
  {
    "isApproved": true,
    "observations": "Classrooms, labs, and library verified as per APH norms. CAD lab equipped with 60 high-performance workstations.",
    "videoRecordingUrl": "https://storage.aicte.gov.in/evc-recordings/AICTE-2026-LOA-00142-visit.mp4",
    "geotaggedPhotoKeys": [
      "evc/AICTE-2026-LOA-00142/lab-photo-geo.jpg",
      "evc/AICTE-2026-LOA-00142/library-photo-geo.jpg"
    ],
    "reportPdfKey": "evc/AICTE-2026-LOA-00142/signed-evc-report.pdf"
  }
  ```
- **Response (201 Created):** EVC report recorded.

---

### 2.6 Documents & S3 Storage Module (`/documents`)

#### `POST /documents/upload-intent`
- **Description:** Requests a secure, short-lived S3 pre-signed upload URL for direct client-to-storage upload.
- **Request Body:**
  ```json
  {
    "fileName": "fire-safety-noc-2026.pdf",
    "mimeType": "application/pdf",
    "fileSizeBytes": 4210540,
    "category": "FIRE_SAFETY_NOC",
    "applicationId": "app-819f01bc-401f-4b02-a1f9-81a17937104b"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "s3ObjectKey": "uploads/inst-678a/fire-safety-noc-2026-uuid.pdf",
    "presignedPutUrl": "https://minio.local:9000/aicte-documents/uploads/inst-678a/fire-safety-noc-2026-uuid.pdf?X-Amz-Signature=...",
    "expiresInSeconds": 900
  }
  ```

#### `POST /documents/:id/confirm`
- **Description:** Confirms successful upload to storage, records SHA-256 checksum, and creates new document version.
- **Request Body:**
  ```json
  {
    "s3ObjectKey": "uploads/inst-678a/fire-safety-noc-2026-uuid.pdf",
    "sha256Checksum": "7a35c24e819b...",
    "validFrom": "2026-01-01",
    "validTo": "2027-12-31"
  }
  ```
- **Response (200 OK):** Confirmed document version record.

---

### 2.7 Compliance & Document Validity Module (`/compliance`)

#### `GET /compliance/obligations`
- **Description:** Retrieves open or expiring compliance obligations filtered by institution and validity status.
- **Query Params:** `?institutionId=...&validityStatus=EXPIRING_SOON&complianceStatus=OPEN`
- **Response (200 OK):** List of obligations with due dates, offsets, and verification statuses.

#### `POST /compliance/submissions/:id/verify`
- **Description:** Authorized Regional/Bureau Officer verifies renewed certificate evidence.
- **Authorized Role:** `ROLE_REGIONAL_OFFICER`, `ROLE_BUREAU_OFFICER`
- **Request Body:**
  ```json
  {
    "verificationStatus": "VERIFIED",
    "reviewerNotes": "Renewed Fire NOC verified from State Fire Department portal."
  }
  ```
- **Response (200 OK):** Obligation updated to `complianceStatus = FULFILLED`.

---

### 2.8 Reports & KPI Module (`/reports`)

#### `GET /reports/pendency`
- **Description:** Returns aggregate pendency metrics across processing stages and regions.
- **Response (200 OK):**
  ```json
  {
    "totalApplications": 420,
    "byStage": {
      "SUBMITTED": 45,
      "SCRUTINY": 82,
      "DEFICIENCY_RESPONSE": 34,
      "RE_SCRUTINY": 19,
      "EVC_SCHEDULED": 28,
      "DECISION_PENDING": 52,
      "CLOSED_APPROVED": 140,
      "CLOSED_REJECTED": 20
    },
    "byAgeingBucket": {
      "under7Days": 180,
      "between7And14Days": 55,
      "over14DaysOverdue": 25
    }
  }
  ```
