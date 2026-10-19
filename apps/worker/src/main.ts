/**
 * AICTE FlowGuard - Background Worker Engine
 * Processes Transactional Outbox Events, Deadlines, Reminders, Multi-Level Escalations, and Periodic Reconciliation
 */

import { PrismaClient } from '@prisma/client';
import { OutboxProcessor } from './outbox/outbox.processor';
import { DeadlineScheduler } from './deadline/deadline.scheduler';
import { ReconciliationService } from './reconciliation/reconciliation.service';

const prisma = new PrismaClient();
const processor = new OutboxProcessor(prisma);
const deadlineScheduler = new DeadlineScheduler(prisma);
const reconciliationService = new ReconciliationService(prisma);

async function startWorker() {
  console.log('====================================================');
  console.log('AICTE FlowGuard - Background Worker Engine Running');
  console.log('Outbox Processor: ACTIVE (3s interval)');
  console.log('Deadline & Escalation Engine: ACTIVE (10s interval)');
  console.log('Reconciliation Engine: ACTIVE (30s interval)');
  console.log('====================================================');

  // 1. Transactional Outbox Processor loop (Every 3 seconds)
  setInterval(async () => {
    try {
      await processor.processPendingEvents();
    } catch (err) {
      console.error('[Worker Error] Outbox polling failed:', err);
    }
  }, 3000);

  // 2. Deadline & Escalation loop (Every 10 seconds in dev/demo)
  setInterval(async () => {
    try {
      await deadlineScheduler.checkComplianceDeadlines();
    } catch (err) {
      console.error('[Worker Error] Deadline evaluation failed:', err);
    }
  }, 10000);

  // 3. Periodic Reconciliation Sweep (Every 30 seconds in dev/demo)
  setInterval(async () => {
    try {
      await reconciliationService.runReconciliationSweep();
    } catch (err) {
      console.error('[Worker Error] Reconciliation sweep failed:', err);
    }
  }, 30000);
}

startWorker().catch((err) => {
  console.error('[Worker Fatal Error]', err);
  process.exit(1);
});
