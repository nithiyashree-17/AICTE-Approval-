import { PrismaClient } from '@prisma/client';

export class DeadlineScheduler {
  constructor(private prisma: any) {}

  /**
   * Evaluates open compliance obligations against configured reminder policies
   * Configurable offsets: 7 days before, 3 days before, on due date, and overdue escalations (Section 11)
   */
  async checkComplianceDeadlines(): Promise<number> {
    const now = new Date();

    const openObligations = await this.prisma.complianceObligation.findMany({
      where: {
        status: { in: ['OPEN', 'UNDER_REVIEW', 'OVERDUE'] },
      },
      include: {
        institution: {
          include: { users: true },
        },
      },
    });

    let processedCount = 0;

    for (const obligation of openObligations) {
      const dueDate = new Date(obligation.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Overdue Check (COM-02)
      if (diffMs < 0 && obligation.status !== 'OVERDUE') {
        await this.prisma.complianceObligation.update({
          where: { id: obligation.id },
          data: { status: 'OVERDUE' },
        });

        // Trigger Level 1 Overdue Escalation to Regional Officer
        await this.triggerEscalation({
          triggerType: 'DEADLINE_MISSED',
          escalationLevel: 1,
          recipientRole: 'REGIONAL_OFFICER',
          referenceType: 'COMPLIANCE',
          referenceId: obligation.id,
          region: obligation.institution.region,
          message: `URGENT: Compliance obligation '${obligation.title}' is overdue for ${obligation.institution.name}.`,
        });

        processedCount++;
      }

      // 7 Days Before Reminder (COM-01)
      if (diffDays <= 7 && diffDays > 3) {
        await this.sendUniqueReminder(
          obligation,
          'REMINDER_7_DAYS',
          `Upcoming Deadline: 7 days remaining for '${obligation.title}'`,
        );
      }

      // 3 Days Before Reminder
      if (diffDays <= 3 && diffDays > 0) {
        await this.sendUniqueReminder(
          obligation,
          'REMINDER_3_DAYS',
          `URGENT: 3 days remaining to fulfill compliance obligation '${obligation.title}'`,
        );
      }
    }

    return processedCount;
  }

  private async sendUniqueReminder(obligation: any, reminderKey: string, title: string) {
    for (const user of obligation.institution.users) {
      // Check idempotency so reminder is never delivered twice for the same window (JOB-02)
      const existing = await this.prisma.notificationEvent.findFirst({
        where: {
          recipientId: user.id,
          templateKey: reminderKey,
          payload: {
            path: ['obligationId'],
            equals: obligation.id,
          },
        },
      });

      if (!existing) {
        await this.prisma.notificationEvent.create({
          data: {
            recipientId: user.id,
            channel: 'IN_APP',
            templateKey: reminderKey,
            title,
            body: `Obligation '${obligation.title}' is due on ${new Date(obligation.dueDate).toLocaleDateString()}. Please upload verified evidence before the statutory cutoff.`,
            payload: { obligationId: obligation.id, reminderKey },
            deliveryStatus: 'SENT',
            sentAt: new Date(),
          },
        });
        console.log(`[DeadlineScheduler] Dispatched ${reminderKey} to ${user.email} for '${obligation.title}'`);
      }
    }
  }

  private async triggerEscalation(data: {
    triggerType: string;
    escalationLevel: number;
    recipientRole: string;
    referenceType: string;
    referenceId: string;
    region?: string;
    message: string;
  }) {
    // 1. Create Escalation Event record
    const escalation = await this.prisma.escalationEvent.create({
      data: {
        triggerType: data.triggerType,
        escalationLevel: data.escalationLevel,
        recipientRole: data.recipientRole as any,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        state: 'ACTIVE',
      },
    });

    // 2. Alert Regional Officer in that region
    const targetOfficers = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { name: data.recipientRole as any },
          },
        },
        ...(data.region ? { assignedRegion: data.region } : {}),
      },
    });

    for (const officer of targetOfficers) {
      await this.prisma.notificationEvent.create({
        data: {
          recipientId: officer.id,
          channel: 'IN_APP',
          templateKey: 'ESCALATION_ALERT',
          title: `ESCALATION (Level ${data.escalationLevel}): Overdue Obligation`,
          body: data.message,
          payload: { escalationId: escalation.id, referenceId: data.referenceId },
          deliveryStatus: 'SENT',
          sentAt: new Date(),
        },
      });
    }

    console.log(`[DeadlineScheduler] Triggered Level ${data.escalationLevel} Escalation for ${data.referenceType} ${data.referenceId}`);
  }
}
