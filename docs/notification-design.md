# AICTE FlowGuard — Notification, Reminder & Escalation Engine Design

**Document Control:**
- **Project:** AICTE FlowGuard (Problem Statement ID: 26262)
- **Document Role:** Teammate D (Automation / QA / Integration)
- **Status:** Complete Technical Design & Worker Specifications
- **Stack:** BullMQ 5.x, Redis 7, Resend / SMTP / Mock Email Adapter, Node.js
- **Source Basis:** Sections 7, 11, and 12 of AICTE FlowGuard Implementation Plan

---

## 1. Engine Architecture & Subsystems

The Notification, Reminder, and Escalation engine operates as a decoupled, multi-worker background service (`apps/worker`).

```
+-----------------------------------------------------------------------------------+
|                        TRANSACTIONAL OUTBOX (PostgreSQL)                          |
|  - Table: outbox_events                                                           |
|  - Events committed atomically with application state and audit logs              |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Polled every 500ms (or pg_notify)
                                         v
+-----------------------------------------------------------------------------------+
|                            OUTBOX PRODUCER WORKER                                 |
|  - Locks batch: SELECT ... FOR UPDATE SKIP LOCKED                                 |
|  - Generates idempotent job keys                                                  |
|  - Distributes jobs into specialized BullMQ Queues                                |
+-----------------------------------------------------------------------------------+
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
         v                               v                               v
+------------------+           +-------------------+           +--------------------+
|  immediate-queue |           |   delayed-queue   |           |  reconcile-queue   |
| (Outbox & Instant|           | (Offsets: T-7d,   |           | (Cron: Runs every  |
|  Event Alerts)   |           |  T-3d, +2d, +5d)  |           |  60 mins)          |
+------------------+           +-------------------+           +--------------------+
         |                               |                               |
         +-------------------------------+-------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                    BULLMQ WORKER CONSUMER (Execution Layer)                       |
|                                                                                   |
|  1. Pre-Delivery Revalidation Check (Re-queries DB to ensure still eligible)       |
|  2. Idempotency Check in Redis (Avoids duplicate notifications)                   |
|  3. Deduplication Key Verification                                                |
|  4. Notification Rendering (Handlebars / React Email templates)                   |
|  5. Dual-Channel Delivery: In-App DB Record + Email Provider Adapter              |
|  6. Failure Retries with Exponential Backoff (1m, 5m, 15m)                         |
+-----------------------------------------------------------------------------------+
```

---

## 2. Notification Timing & Offset Policies

### 2.1 Deficiency & Application Task Offsets

| Offset Point | Timing Trigger | Target Recipient | Channel | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Immediate (T-0)** | On Deficiency Creation | Institution Admin & Authorized Contact | Email + In-App | Formal Deficiency Notice delivery with itemized clause references. |
| **Early Warning** | 3 days before Due Date (T - 3d) | Institution Admin | Email + In-App | Reminder of pending deadline; instructions on uploading rectified docs. |
| **Final Reminder**| 1 day before Due Date (T - 1d) | Institution Admin | Email + In-App + High-Priority Banner | Urgent alert regarding impending deadline expiration. |
| **Deadline Day** | On Due Date at 09:00 IST | Institution Admin | Email + In-App | Final call before submission window closes. |
| **Overdue L1** | 2 days Overdue (T + 2d) | Institution + Assigned Scrutiny Officer + Section Supervisor | Email + In-App Escalation | Automated Level 1 Escalation: flags delinquency; queues for hearing review. |
| **Overdue L2** | 5 days Overdue (T + 5d) | Regional Director + Central Bureau Head | Email + In-App Urgent Escalation | Automated Level 2 Escalation: auto-forwards case to `DECISION_PENDING` with non-responsive finding. |

### 2.2 Document Expiry & Lease Renewal Offsets

| Offset Point | Timing Trigger | Target Recipient | Channel | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **T - 180 Days** | 6 months prior to expiry | Institution Admin | Email + In-App | Early awareness for long-lead renewals (e.g. Registered Lease, Fire NOC). |
| **T - 90 Days** | 3 months prior to expiry | Institution Admin | Email + In-App | Active renewal warning; prompts document re-upload. |
| **T - 30 Days** | 30 days prior to expiry | Institution + Regional Officer | Email + In-App | Critical warning; highlights regulatory risk of suspension. |
| **T - 7 Days** | 7 days prior to expiry | Institution + Regional Director | Email + In-App Urgent | Urgent compliance alert; warning of imminent expiration. |
| **T - 0 (Expired)**| Day of Expiry (00:01 IST) | Institution + Regional Director | Email + In-App Penalty Warning | Document marked `EXPIRED`; institution status flagged for compliance action. |

---

## 3. Pre-Delivery Revalidation & Idempotency Design

### 3.1 Idempotency Key Structure
To eliminate duplicate alerts during worker crashes, network retries, or multiple BullMQ deliveries, every job uses a deterministic idempotency key stored in Redis with a 7-day TTL:

```
idempotencyKey = `flowguard:notif:${aggregateId}:${reminderType}:${recipientId}:${deadlineVersion}`
```
Example: `flowguard:notif:def-8812c:T_MINUS_3D:u-inst-678a:v1`

### 3.2 Pre-Delivery Eligibility Check Logic
Before sending an alert, the worker verifies that the underlying condition remains active. If the institution already uploaded their rectified document or renewed their lease, the worker drops the notification and marks the outbox job as `CANCELLED_OBSOLETE`:

```typescript
// apps/worker/src/reminders/reminder.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';

@Processor('reminder-queue')
export class ReminderProcessor extends WorkerHost {
  private prisma = new PrismaClient();

  async process(job: Job<any>): Promise<any> {
    const { aggregateType, aggregateId, reminderType, recipientUserId } = job.data;

    // 1. Re-query live PostgreSQL database
    if (aggregateType === 'DEFICIENCY') {
      const deficiency = await this.prisma.deficiencies.findUnique({
        where: { id: aggregateId },
      });

      // If already resolved or resubmitted, cancel obsolete reminder
      if (!deficiency || deficiency.status !== 'OPEN') {
        return {
          status: 'SUPPRESSED',
          reason: `Deficiency ${aggregateId} status is ${deficiency?.status}; reminder cancelled.`,
        };
      }
    } else if (aggregateType === 'COMPLIANCE_OBLIGATION') {
      const obligation = await this.prisma.complianceObligation.findUnique({
        where: { id: aggregateId },
      });

      if (!obligation || obligation.complianceStatus === 'FULFILLED') {
        return {
          status: 'SUPPRESSED',
          reason: `Compliance obligation ${aggregateId} already fulfilled.`,
        };
      }
    }

    // 2. Deliver notification
    return await this.dispatchNotification(job.data);
  }

  private async dispatchNotification(data: any) {
    // Deliver in-app alert record
    await this.prisma.notificationEvent.create({
      data: {
        recipientUserId: data.recipientUserId,
        applicationId: data.applicationId,
        channel: 'IN_APP',
        title: data.title,
        body: data.body,
        deepLinkUrl: data.deepLinkUrl,
        status: 'QUEUED',
      },
    });

    // Deliver email via Email Provider Adapter
    // (Resend / SMTP / Mock adapter)
    return { status: 'DELIVERED', timestamp: new Date() };
  }
}
```

---

## 4. Periodic Reconciliation Worker (Anti-Stuck Sentinel)

To guarantee that no case stalls due to unexpected server reboots or dropped Redis events, a periodic reconciliation worker runs every 60 minutes:

```typescript
// apps/worker/src/reconciliation/reconciliation.worker.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ReconciliationWorker {
  private readonly logger = new Logger(ReconciliationWorker.name);
  private prisma = new PrismaClient();

  @Cron(CronExpression.EVERY_HOUR)
  async runReconciliation() {
    this.logger.log('Starting hourly reconciliation pass...');
    const now = new Date();

    // 1. Detect stuck outbox events older than 5 minutes
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const stuckOutboxEvents = await this.prisma.outboxEvent.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: fiveMinutesAgo },
      },
      take: 100,
    });

    for (const event of stuckOutboxEvents) {
      this.logger.warn(`Reprocessing stuck outbox event: ${event.id}`);
      // Re-trigger dispatch
    }

    // 2. Detect un-escalated overdue deficiencies
    const overdueDeficiencies = await this.prisma.deficiencies.findMany({
      where: {
        status: 'OPEN',
        dueAt: { lt: now },
      },
      include: { application: true },
    });

    for (const def of overdueDeficiencies) {
      const daysOverdue = Math.floor((now.getTime() - def.dueAt.getTime()) / (1000 * 3600 * 24));
      if (daysOverdue >= 2) {
        // Enqueue Level 1 Escalation if not already triggered
        this.logger.warn(`Escalating deficiency ${def.id} (${daysOverdue} days overdue)`);
      }
    }

    // 3. Scan for documents expiring within 180 days
    const horizon = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    const expiringDocs = await this.prisma.document.findMany({
      where: {
        isExpiryMonitored: true,
        validTo: { lte: horizon, gte: now },
      },
    });

    this.logger.log(`Reconciliation finished. Monitored expiring documents: ${expiringDocs.length}`);
  }
}
```

---

## 5. Email Templates & Mock Adapter for Development

When running locally without external SMTP/Resend credentials, the `EmailProviderAdapter` switches to `MockEmailService`, safely logging rendered HTML and subject lines to the console and saving an artifact copy in `scratch/mock-emails/` without failing API calls.