export type ApplicationStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Committee'
  | 'Approved'
  | 'Rejected';

export type ApplicationType = 'New Approval' | 'Renewal' | 'Extension';

export interface DeficiencyItem {
  id: string;
  category: 'Infrastructure' | 'Faculty' | 'Curriculum' | 'Financial & Legal';
  observation: string;
  actionRequired: string;
  raisedBy: string;
  raisedAt: string;
  deadline: string;
  status: 'Open' | 'Resubmitted' | 'Resolved';
  resolutionNotes?: string;
}

export interface Application {
  id: string;
  institution: string;
  type: ApplicationType;
  submittedDate: string;
  status: ApplicationStatus;
  currentStage: 'Intake' | 'Scrutiny' | 'Committee Hearing' | 'Final Human Decision';
  reviewer?: string;
  region: string;
  academicYear: string;
  deficiencies: DeficiencyItem[];
  evcScheduled?: string;
  evcCommittee?: string[];
  finalDecisionNotes?: string;
  decisionBy?: string;
  decisionDate?: string;
}

export interface ComplianceInstitution {
  id: string;
  name: string;
  complianceScore: number;
  lastAudit: string;
  status: 'Compliant' | 'Needs Improvement' | 'Non-Compliant';
  categoryScores: {
    faculty: number;
    infrastructure: number;
    curriculum: number;
  };
  auditsOverdue: boolean;
  activeDeficienciesCount: number;
  assignedOfficer: string;
}

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertStatus = 'Unread' | 'Read' | 'Resolved';

export interface AlertRecord {
  id: string;
  severity: AlertSeverity;
  alert: string;
  timestamp: string;
  status: AlertStatus;
  assignedTo?: string;
  entityId?: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  category: 'ALL' | 'CRITICAL' | 'APPROVALS' | 'SYSTEM';
}

export type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'zip';
export type DocumentCategory =
  | 'Application'
  | 'Compliance Report'
  | 'Audit Report'
  | 'Certificate';

export interface DocumentRecord {
  id: string;
  name: string;
  institution: string;
  category: DocumentCategory;
  format: DocumentFormat;
  size: string;
  date: string;
  downloadUrl?: string;
}

export interface UserSession {
  name: string;
  designation: string;
  role: 'OFFICER' | 'INSTITUTION' | 'COMMITTEE' | 'REGIONAL_ADMIN';
  avatar: string;
  department: string;
  institutionName?: string;
}
