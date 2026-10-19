-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('INSTITUTION', 'REGIONAL_OFFICER', 'BUREAU_OFFICER', 'SCRUTINY_OFFICER', 'EVC_COORDINATOR', 'EVC_MEMBER', 'SAC_SHC', 'COMPETENT_AUTHORITY', 'SYSTEM_ADMINISTRATOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('NEW_INSTITUTION_LOA', 'ROUTINE_EOA', 'EOA_SUBSTANTIVE_CHANGE', 'DEFICIENCY_HEARING_CASE', 'APPEAL_SAC');

-- CreateEnum
CREATE TYPE "WorkflowConfigStatus" AS ENUM ('DRAFT', 'REVIEWED', 'APPROVED', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeficiencyStatus" AS ENUM ('RAISED', 'RESPONSE_SUBMITTED', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvcStatus" AS ENUM ('PENDING_SCHEDULE', 'SCHEDULED', 'RESCHEDULED', 'VISIT_COMPLETED', 'REPORT_SUBMITTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EvcMode" AS ENUM ('PHYSICAL', 'VIRTUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('CHAIRMAN', 'CONVENER', 'MEMBER', 'SPECIALIST');

-- CreateEnum
CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_CORRECTION');

-- CreateEnum
CREATE TYPE "DocumentValidityStatus" AS ENUM ('VALID', 'EXPIRING_SOON', 'EXPIRED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('OPEN', 'SUBMITTED', 'UNDER_REVIEW', 'FULFILLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'BOUNCED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "institutionId" TEXT,
    "assignedRegion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" "RoleType" NOT NULL,
    "description" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "scopeType" TEXT,
    "scopeValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "aicteCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "academicYear" TEXT NOT NULL,
    "currentState" TEXT NOT NULL,
    "workflowDefinitionKey" TEXT NOT NULL,
    "workflowVersion" INTEGER NOT NULL,
    "assignedRegion" TEXT NOT NULL,
    "assignedOfficerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicationCategory" "ApplicationType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_versions" (
    "id" TEXT NOT NULL,
    "workflowDefinitionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "WorkflowConfigStatus" NOT NULL DEFAULT 'DRAFT',
    "definitionJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" TEXT NOT NULL,
    "workflowVersionId" TEXT NOT NULL,
    "stageKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "responsibleRole" "RoleType" NOT NULL,
    "allowedTransitions" JSONB NOT NULL,
    "entryConditions" JSONB,
    "exitConditions" JSONB,
    "deadlineHours" INTEGER,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_stage_history" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT,
    "workflowVersion" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deficiencies" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "clauseReference" TEXT,
    "observation" TEXT NOT NULL,
    "requiredCorrection" TEXT NOT NULL,
    "status" "DeficiencyStatus" NOT NULL DEFAULT 'RAISED',
    "createdById" TEXT NOT NULL,
    "institutionResponse" TEXT,
    "responseSubmittedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deficiencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evc_events" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "EvcStatus" NOT NULL DEFAULT 'PENDING_SCHEDULE',
    "mode" "EvcMode" NOT NULL DEFAULT 'PHYSICAL',
    "scheduledDate" TIMESTAMP(3),
    "locationOrLink" TEXT,
    "coordinatorId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evc_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_assignments" (
    "id" TEXT NOT NULL,
    "evcEventId" TEXT NOT NULL,
    "memberUserId" TEXT NOT NULL,
    "assignmentRole" "AssignmentRole" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evc_reports" (
    "id" TEXT NOT NULL,
    "evcEventId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "s3ObjectKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "reviewStatus" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "findings" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evc_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "applicationId" TEXT,
    "documentType" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "validityStatus" "DocumentValidityStatus" NOT NULL DEFAULT 'VALID',
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "s3ObjectKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sha256Checksum" TEXT NOT NULL,
    "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_obligations" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "applicationId" TEXT,
    "sourceRuleId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceRequired" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'OPEN',
    "reminderPolicyJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_submissions" (
    "id" TEXT NOT NULL,
    "complianceId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "s3ObjectKey" TEXT NOT NULL,
    "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerNotes" TEXT,
    "verifiedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "compliance_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_events" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "templateKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "deliveryStatus" "NotificationDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_events" (
    "id" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "escalationLevel" INTEGER NOT NULL DEFAULT 1,
    "recipientRole" "RoleType" NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'ACTIVE',
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escalation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "changesBefore" JSONB,
    "changesAfter" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_versions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "aphClause" TEXT NOT NULL,
    "aphPageReference" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "configurationStatus" "WorkflowConfigStatus" NOT NULL DEFAULT 'APPROVED',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "provenanceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_scopeType_scopeValue_key" ON "user_roles"("userId", "roleId", "scopeType", "scopeValue");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_aicteCode_key" ON "institutions"("aicteCode");

-- CreateIndex
CREATE UNIQUE INDEX "applications_applicationNumber_key" ON "applications"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_key_key" ON "workflow_definitions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_versions_workflowDefinitionId_versionNumber_key" ON "workflow_versions"("workflowDefinitionId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stages_workflowVersionId_stageKey_key" ON "workflow_stages"("workflowVersionId", "stageKey");

-- CreateIndex
CREATE UNIQUE INDEX "committee_assignments_evcEventId_memberUserId_key" ON "committee_assignments"("evcEventId", "memberUserId");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_documentId_versionNumber_key" ON "document_versions"("documentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_idempotencyKey_key" ON "outbox_events"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "rule_versions_ruleId_key" ON "rule_versions"("ruleId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_workflowDefinitionId_fkey" FOREIGN KEY ("workflowDefinitionId") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflowVersionId_fkey" FOREIGN KEY ("workflowVersionId") REFERENCES "workflow_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evc_events" ADD CONSTRAINT "evc_events_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evc_events" ADD CONSTRAINT "evc_events_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_assignments" ADD CONSTRAINT "committee_assignments_evcEventId_fkey" FOREIGN KEY ("evcEventId") REFERENCES "evc_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_assignments" ADD CONSTRAINT "committee_assignments_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evc_reports" ADD CONSTRAINT "evc_reports_evcEventId_fkey" FOREIGN KEY ("evcEventId") REFERENCES "evc_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evc_reports" ADD CONSTRAINT "evc_reports_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_obligations" ADD CONSTRAINT "compliance_obligations_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_obligations" ADD CONSTRAINT "compliance_obligations_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_submissions" ADD CONSTRAINT "compliance_submissions_complianceId_fkey" FOREIGN KEY ("complianceId") REFERENCES "compliance_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
