import { PrismaClient } from '@prisma/client';

export class ReconciliationService {
  constructor(private prisma: any) {}

  /**
   * Periodic Database & Queue Reconciliation Sweeper (Section 11.1 & JOB-01)
   * Recovers stuck outbox events, finds missed deadlines, and surfaces unassigned queue bottlenecks.
   */
  async runReconciliationSweep(): Promise<{
    stuckOutboxRetried: number;
    overdueObligationsFlagged: number;
    unassignedApplicationsDetected: number;
  }> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // 1. Recover Stuck Outbox Events
    const stuckEvents = await this.prisma.outboxEvent.findMany({
      where: {
        processed: false,
        createdAt: { lt: fiveMinutesAgo },
        retryCount: { lt: 5 },
      },
      take: 20,
    });

    let stuckRetried = 0;
    for (const event of stuckEvents) {
      console.log(`[Reconciliation] Retrying stuck outbox event ${event.id} (aggregate: ${event.aggregateType}, retry #${event.retryCount + 1})`);
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: { retryCount: { increment: 1 } },
      });
      stuckRetried++;
    }

    // 2. Identify Overdue Compliance Obligations lacking escalation
    const now = new Date();
    const missedOverdue = await this.prisma.complianceObligation.findMany({
      where: {
        status: { in: ['OPEN', 'UNDER_REVIEW'] },
        dueDate: { lt: now },
      },
      include: { institution: true },
      take: 20,
    });

    let overdueFlagged = 0;
    for (const obligation of missedOverdue) {
      await this.prisma.complianceObligation.update({
        where: { id: obligation.id },
        data: { status: 'OVERDUE' },
      });

      // Ensure escalation event exists
      const existingEscalation = await this.prisma.escalationEvent.findFirst({
        where: {
          referenceId: obligation.id,
          referenceType: 'COMPLIANCE',
        },
      });

      if (!existingEscalation) {
        await this.prisma.escalationEvent.create({
          data: {
            triggerType: 'DEADLINE_MISSED_RECONCILED',
            escalationLevel: 1,
            recipientRole: 'REGIONAL_OFFICER',
            referenceType: 'COMPLIANCE',
            referenceId: obligation.id,
            state: 'ACTIVE',
            resolutionNote: 'Flagged by automated reconciliation engine',
          },
        });
        overdueFlagged++;
      }
    }

    // 3. Monitor Unassigned Intake Queue (Section 11 Table - Case assigned / Queue assignment event)
    const unassignedApps = await this.prisma.application.count({
      where: {
        currentState: 'SUBMITTED',
        assignedOfficerId: null,
      },
    });

    if (stuckRetried > 0 || overdueFlagged > 0) {
      console.log(
        `[Reconciliation Report] Swept database: ${stuckRetried} stuck events retried, ${overdueFlagged} overdue obligations flagged, ${unassignedApps} unassigned applications in queue.`,
      );
    }

    return {
      stuckOutboxRetried: stuckRetried,
      overdueObligationsFlagged: overdueFlagged,
      unassignedApplicationsDetected: unassignedApps,
    };
  }
}
