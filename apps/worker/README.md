# Background Worker (`apps/worker`)

High-reliability background processing engine powered by **BullMQ** and **Redis**.

## Core Functions

1. **Transactional Outbox Processor**:
   - Polls/receives committed outbox events from PostgreSQL.
   - Enqueues jobs idempotently with deduplication keys.
2. **Deadline & Reminder Engine**:
   - Computes reminder triggers (e.g., 7 days before, 3 days before, on due date, 2/5 days overdue).
   - Re-checks case status right before dispatch (suppresses obsolete reminders if obligation/deficiency was already fulfilled).
3. **Escalation Engine**:
   - Escalates overdue scrutiny tasks, unassigned queues, or missed compliance obligations to supervisors/regional officers.
4. **Email Dispatcher**:
   - Renders notification templates and delivers messages via SMTP / Resend or local mock mode.
5. **Periodic Reconciliation Job**:
   - Sweeps for missed deadlines, stuck outbox items, or queue inconsistencies every 15 minutes.

## Structure

```
apps/worker/src/
├── deadline/        # Due date calculations, boundary handling (UTC & midnight)
├── reminders/       # Scheduled reminder job processors with suppression logic
├── escalations/     # Hierarchical escalation dispatchers
├── email/           # Email templates & delivery adapters (Mock, Resend, SMTP)
├── reconciliation/  # Database reconciliation sweep for missed events
└── main.ts          # Worker orchestrator entry point
```

## Running Locally

```bash
pnpm dev:worker
```
Requires Redis running on `localhost:6379`.
