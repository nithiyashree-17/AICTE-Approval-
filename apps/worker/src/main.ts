/**
 * AICTE FlowGuard - Background Worker Engine
 * Processes Transactional Outbox Events, Deadlines, and Reminders
 */

import { PrismaClient } from '@prisma/client';
import { OutboxProcessor } from './outbox/outbox.processor';

const prisma = new PrismaClient();
const processor = new OutboxProcessor(prisma);

async function startWorker() {
  console.log('====================================================');
  console.log('AICTE FlowGuard - Background Worker Process Started');
  console.log('Outbox Processor: ACTIVE (polling interval: 3s)');
  console.log('Reconciliation Engine: ACTIVE');
  console.log('====================================================');

  // Polling loop for transactional outbox
  setInterval(async () => {
    try {
      await processor.processPendingEvents();
    } catch (err) {
      console.error('[Worker Error] Polling failed:', err);
    }
  }, 3000);
}

startWorker().catch((err) => {
  console.error('[Worker Fatal Error]', err);
  process.exit(1);
});
