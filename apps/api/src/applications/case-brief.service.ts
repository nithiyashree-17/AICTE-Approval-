import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CaseBriefSummary {
  applicationId: string;
  applicationNumber: string;
  institutionName: string;
  aicteCode: string;
  academicYear: string;
  category: string;
  currentStage: string;
  daysInCurrentStage: number;
  nextRequiredAction: string;
  responsibleRole: string;
  deficiencySummary: {
    total: number;
    open: number;
    resolved: number;
    pendingCorrections: string[];
  };
  evcSummary: {
    status: string;
    scheduledDate: string | null;
    mode: string | null;
    reportSubmitted: boolean;
  };
  complianceSummary: {
    totalObligations: number;
    openObligations: number;
    overdueCount: number;
  };
  aphClauseReference: string;
  briefGeneratedAt: string;
}

@Injectable()
export class CaseBriefService {
  constructor(private prisma: PrismaService) {}

  async generateCaseBrief(applicationId: string): Promise<CaseBriefSummary> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        institution: true,
        deficiencies: true,
        evcEvents: {
          include: { reports: true },
          orderBy: { createdAt: 'desc' },
        },
        obligations: true,
        stageHistory: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    const lastStageEntry = application.stageHistory[0];
    const lastChangeTime = lastStageEntry ? new Date(lastStageEntry.timestamp).getTime() : new Date(application.createdAt).getTime();
    const daysInStage = Math.max(0, Math.floor((Date.now() - lastChangeTime) / (1000 * 60 * 60 * 24)));

    const openDeficiencies = application.deficiencies.filter((d) => d.status === 'RAISED');
    const resolvedDeficiencies = application.deficiencies.filter((d) => d.status === 'RESOLVED');

    const latestEvc = application.evcEvents[0];
    const overdueObligations = application.obligations.filter((o) => o.status === 'OVERDUE');
    const openObligations = application.obligations.filter((o) => ['OPEN', 'UNDER_REVIEW'].includes(o.status));

    // Next required action logic
    let nextRequiredAction = 'Under Review';
    let responsibleRole = 'SCRUTINY_OFFICER';

    switch (application.currentState) {
      case 'DRAFT':
        nextRequiredAction = 'Institution must complete mandatory fields and submit';
        responsibleRole = 'INSTITUTION';
        break;
      case 'SUBMITTED':
        nextRequiredAction = 'Intake verification and regional scrutiny assignment';
        responsibleRole = 'REGIONAL_OFFICER';
        break;
      case 'SCRUTINY':
        nextRequiredAction = 'Technical scrutiny of land, building, and NOC certificates';
        responsibleRole = 'SCRUTINY_OFFICER';
        break;
      case 'DEFICIENCY_RESPONSE':
        nextRequiredAction = 'Institution must upload deficiency rectifications';
        responsibleRole = 'INSTITUTION';
        break;
      case 'RE_SCRUTINY':
        nextRequiredAction = 'Review of resubmitted deficiency rectifications';
        responsibleRole = 'SCRUTINY_OFFICER';
        break;
      case 'EVC_PENDING':
        nextRequiredAction = 'EVC Coordinator must propose dates and assign committee';
        responsibleRole = 'EVC_COORDINATOR';
        break;
      case 'EVC_SCHEDULED':
        nextRequiredAction = 'Conduct physical/virtual inspection and submit report';
        responsibleRole = 'EVC_MEMBER';
        break;
      case 'EVC_REVIEW':
        nextRequiredAction = 'Review EVC inspection findings';
        responsibleRole = 'REGIONAL_OFFICER';
        break;
      case 'HEARING_OR_COMMITTEE_REVIEW':
        nextRequiredAction = 'Conduct SHC/SAC hearing and record recommendations';
        responsibleRole = 'SAC_SHC';
        break;
      case 'DECISION_PENDING':
        nextRequiredAction = 'Record formal statutory approval/rejection decision';
        responsibleRole = 'COMPETENT_AUTHORITY';
        break;
      case 'APPROVED':
        nextRequiredAction = 'Monitor post-approval compliance obligations & document validity';
        responsibleRole = 'REGIONAL_OFFICER';
        break;
      case 'REJECTED':
        nextRequiredAction = '7-Day SAC appeal window active under APH Clause 2.24(a)';
        responsibleRole = 'INSTITUTION';
        break;
    }

    return {
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      institutionName: application.institution.name,
      aicteCode: application.institution.aicteCode,
      academicYear: application.academicYear,
      category: application.type,
      currentStage: application.currentState,
      daysInCurrentStage: daysInStage,
      nextRequiredAction,
      responsibleRole,
      deficiencySummary: {
        total: application.deficiencies.length,
        open: openDeficiencies.length,
        resolved: resolvedDeficiencies.length,
        pendingCorrections: openDeficiencies.map((d) => d.requiredCorrection),
      },
      evcSummary: {
        status: latestEvc ? latestEvc.status : 'NOT_SCHEDULED',
        scheduledDate: latestEvc?.scheduledDate ? latestEvc.scheduledDate.toISOString() : null,
        mode: latestEvc ? latestEvc.mode : null,
        reportSubmitted: latestEvc ? latestEvc.reports.length > 0 : false,
      },
      complianceSummary: {
        totalObligations: application.obligations.length,
        openObligations: openObligations.length,
        overdueCount: overdueObligations.length,
      },
      aphClauseReference: 'Approval Process Handbook (APH) 2024–2027 Chapters I, II & Table 2.3',
      briefGeneratedAt: new Date().toISOString(),
    };
  }
}
