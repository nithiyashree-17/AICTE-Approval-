import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getPendencyReport() {
    const stageCounts = await this.prisma.application.groupBy({
      by: ['currentState'],
      _count: { id: true },
    });

    const regionCounts = await this.prisma.application.groupBy({
      by: ['assignedRegion'],
      _count: { id: true },
    });

    const typeCounts = await this.prisma.application.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    return {
      byStage: stageCounts.map((s) => ({ stage: s.currentState, count: s._count.id })),
      byRegion: regionCounts.map((r) => ({ region: r.assignedRegion, count: r._count.id })),
      byType: typeCounts.map((t) => ({ type: t.type, count: t._count.id })),
    };
  }

  async getComplianceReport() {
    const obligationCounts = await this.prisma.complianceObligation.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const now = new Date();
    const upcomingThreshold = new Date();
    upcomingThreshold.setDate(now.getDate() + 7);

    const dueSoonCount = await this.prisma.complianceObligation.count({
      where: {
        status: 'OPEN',
        dueDate: {
          gte: now,
          lte: upcomingThreshold,
        },
      },
    });

    const overdueCount = await this.prisma.complianceObligation.count({
      where: {
        status: { in: ['OPEN', 'OVERDUE'] },
        dueDate: {
          lt: now,
        },
      },
    });

    return {
      byStatus: obligationCounts.map((o) => ({ status: o.status, count: o._count.id })),
      dueSoonIn7Days: dueSoonCount,
      overdue: overdueCount,
    };
  }

  async getEvcReport() {
    const statusCounts = await this.prisma.evcEvent.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const modeCounts = await this.prisma.evcEvent.groupBy({
      by: ['mode'],
      _count: { id: true },
    });

    return {
      byStatus: statusCounts.map((s) => ({ status: s.status, count: s._count.id })),
      byMode: modeCounts.map((m) => ({ mode: m.mode, count: m._count.id })),
    };
  }
}
