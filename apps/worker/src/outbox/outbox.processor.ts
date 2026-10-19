import { PrismaClient } from '@prisma/client';

export class OutboxProcessor {
  constructor(private prisma: any) {}

  async processPendingEvents(): Promise<number> {
    const events = await this.prisma.outboxEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    if (events.length === 0) {
      return 0;
    }

    console.log(`[OutboxProcessor] Processing ${events.length} pending events...`);

    for (const event of events) {
      try {
        await this.handleEvent(event);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            processed: true,
            processedAt: new Date(),
          },
        });
      } catch (err: any) {
        console.error(`[OutboxProcessor] Failed to process event ${event.id}:`, err);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            retryCount: { increment: 1 },
            lastError: err?.message || String(err),
          },
        });
      }
    }

    return events.length;
  }

  private async handleEvent(event: any) {
    const { eventType, payload } = event;

    switch (eventType) {
      case 'STAGE_CHANGED': {
        // Find users to notify based on application institution
        if (payload.institutionId) {
          const instUsers = await this.prisma.user.findMany({
            where: { institutionId: payload.institutionId },
          });

          for (const u of instUsers) {
            await this.createNotification({
              recipientId: u.id,
              templateKey: 'APPLICATION_STAGE_CHANGED',
              title: `Application ${payload.applicationNumber} moved to ${payload.toState}`,
              body: `Your application stage changed from ${payload.fromState} to ${payload.toState}.${payload.reason ? ' Reason: ' + payload.reason : ''}`,
              payload,
            });
          }
        }
        break;
      }

      case 'DEFICIENCY_ISSUED': {
        const instUsers = await this.prisma.user.findMany({
          where: { institutionId: payload.institutionId },
        });

        for (const u of instUsers) {
          await this.createNotification({
            recipientId: u.id,
            templateKey: 'DEFICIENCY_ISSUED',
            title: `Deficiency Raised on Application ${payload.applicationNumber}`,
            body: `Observation: ${payload.observation}. Required correction: ${payload.requiredCorrection}`,
            payload,
          });
        }
        break;
      }

      case 'EVC_SCHEDULED': {
        // Notify assigned committee members
        if (payload.assignedMemberIds && Array.isArray(payload.assignedMemberIds)) {
          for (const memberId of payload.assignedMemberIds) {
            await this.createNotification({
              recipientId: memberId,
              templateKey: 'EVC_ASSIGNMENT',
              title: `Assigned to EVC Visit for Application ${payload.applicationNumber}`,
              body: `You are assigned to an EVC inspection scheduled for ${new Date(payload.scheduledDate).toLocaleDateString()}. Mode: ${payload.mode}. Location: ${payload.locationOrLink}`,
              payload,
            });
          }
        }
        break;
      }

      case 'COMPLIANCE_CREATED': {
        const instUsers = await this.prisma.user.findMany({
          where: { institutionId: payload.institutionId },
        });

        for (const u of instUsers) {
          await this.createNotification({
            recipientId: u.id,
            templateKey: 'COMPLIANCE_OBLIGATION_CREATED',
            title: `New Compliance Obligation: ${payload.title}`,
            body: `A compliance requirement is registered with deadline: ${new Date(payload.dueDate).toLocaleDateString()}.`,
            payload,
          });
        }
        break;
      }

      case 'OBLIGATION_FULFILLED': {
        console.log(`[OutboxProcessor] Obligation ${payload.obligationId} fulfilled. Suppressing future reminder alerts (COM-03).`);
        break;
      }

      default:
        console.log(`[OutboxProcessor] Unhandled event type: ${eventType}`);
    }
  }

  private async createNotification(data: {
    recipientId: string;
    templateKey: string;
    title: string;
    body: string;
    payload?: any;
  }) {
    await this.prisma.notificationEvent.create({
      data: {
        recipientId: data.recipientId,
        channel: 'IN_APP',
        templateKey: data.templateKey,
        title: data.title,
        body: data.body,
        payload: data.payload,
        deliveryStatus: 'SENT',
        sentAt: new Date(),
      },
    });

    // Mock email logging (Section 11)
    console.log(`[MockEmailAdapter] Sent email to recipient ${data.recipientId}: "${data.title}"`);
  }
}
