/**
 * AICTE FlowGuard - Web Client API Layer
 * Connects Frontend directly to NestJS Backend on http://localhost:4000/api/v1
 */

import {
  Application,
  ApplicationStatus,
  ApplicationType,
  DeficiencyItem,
  AuditRecord,
  AlertRecord,
  ComplianceInstitution,
} from './types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const TOKEN_KEY = 'flowguard_access_token';
const USER_KEY = 'flowguard_auth_user';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string, user?: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.message || JSON.stringify(errorJson);
    } catch {
      // ignore
    }
    throw new Error(`API Error [${response.status}]: ${errorDetail}`);
  }

  // If 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// -----------------------------------------------------------------------------
// Mapping Helpers (Backend Schema <-> Frontend Types)
// -----------------------------------------------------------------------------

export function mapBackendStageToStatus(currentState: string): {
  status: ApplicationStatus;
  currentStage: Application['currentStage'];
} {
  switch (currentState) {
    case 'DRAFT':
    case 'SUBMITTED':
      return { status: 'Submitted', currentStage: 'Intake' };
    case 'SCRUTINY':
    case 'DEFICIENCY_RESPONSE':
    case 'RE_SCRUTINY':
    case 'EVC_PENDING':
      return { status: 'Under Review', currentStage: 'Scrutiny' };
    case 'EVC_SCHEDULED':
    case 'EVC_REVIEW':
    case 'HEARING_OR_COMMITTEE_REVIEW':
      return { status: 'Committee', currentStage: 'Committee Hearing' };
    case 'DECISION_PENDING':
      return { status: 'Under Review', currentStage: 'Final Human Decision' };
    case 'APPROVED':
      return { status: 'Approved', currentStage: 'Final Human Decision' };
    case 'REJECTED':
      return { status: 'Rejected', currentStage: 'Final Human Decision' };
    default:
      return { status: 'Under Review', currentStage: 'Scrutiny' };
  }
}

export function mapBackendTypeToFrontend(type: string): ApplicationType {
  switch (type) {
    case 'NEW_INSTITUTION_LOA':
      return 'New Approval';
    case 'ROUTINE_EOA':
      return 'Renewal';
    case 'EOA_SUBSTANTIVE_CHANGE':
    case 'DEFICIENCY_HEARING_CASE':
    case 'APPEAL_SAC':
      return 'Extension';
    default:
      return 'New Approval';
  }
}

export function mapRegionLabel(region: string): string {
  switch (region?.toUpperCase()) {
    case 'NORTH':
      return 'Northern Region (Kanpur/Delhi)';
    case 'WEST':
      return 'Western Region (Mumbai)';
    case 'SOUTH':
      return 'Southern Region (Chennai)';
    case 'EAST':
      return 'Eastern Region (Kolkata)';
    case 'CENTRAL':
      return 'Central Region (Bhopal)';
    default:
      return region || 'Central Bureau';
  }
}

export function mapBackendDeficiency(raw: any): DeficiencyItem {
  let mappedStatus: 'Open' | 'Resubmitted' | 'Resolved' = 'Open';
  if (raw.status === 'RESPONSE_SUBMITTED') mappedStatus = 'Resubmitted';
  if (raw.status === 'RESOLVED') mappedStatus = 'Resolved';

  return {
    id: raw.id,
    category: (raw.category as any) || 'Faculty',
    observation: raw.observation,
    actionRequired: raw.requiredCorrection || raw.actionRequired || 'Rectify per AICTE norms',
    raisedBy: raw.createdBy?.fullName || 'Senior Scrutiny Officer',
    raisedAt: raw.createdAt ? raw.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    deadline: raw.responseSubmittedAt
      ? raw.responseSubmittedAt.slice(0, 10)
      : new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    status: mappedStatus,
    resolutionNotes: raw.institutionResponse || raw.rectificationNotes,
  };
}

export function mapBackendApplication(raw: any): Application {
  const { status, currentStage } = mapBackendStageToStatus(raw.currentState);

  const deficiencies: DeficiencyItem[] = Array.isArray(raw.deficiencies)
    ? raw.deficiencies.map(mapBackendDeficiency)
    : [];

  let evcScheduled: string | undefined = undefined;
  let evcCommittee: string[] | undefined = undefined;

  if (raw.evcEvents && raw.evcEvents.length > 0) {
    const latestEvc = raw.evcEvents[0];
    if (latestEvc.scheduledDate) {
      evcScheduled = latestEvc.scheduledDate.slice(0, 10);
    }
    if (latestEvc.assignments && latestEvc.assignments.length > 0) {
      evcCommittee = latestEvc.assignments.map(
        (a: any) => `${a.member?.fullName || 'Expert Member'} (${a.assignmentRole})`
      );
    }
  }

  return {
    id: raw.applicationNumber || raw.id,
    institution: raw.institution?.name || 'Accredited Technical Campus',
    type: mapBackendTypeToFrontend(raw.type),
    submittedDate: raw.createdAt ? raw.createdAt.slice(0, 10) : '2026-06-01',
    status,
    currentStage,
    reviewer: raw.assignedOfficer?.fullName || 'AICTE Regulatory Bureau',
    region: mapRegionLabel(raw.assignedRegion),
    academicYear: raw.academicYear || '2026-27',
    deficiencies,
    evcScheduled,
    evcCommittee,
    finalDecisionNotes:
      status === 'Approved'
        ? 'All AICTE APH Chapter II norms verified compliant with statutory approval granted.'
        : status === 'Rejected'
        ? 'Non-rectification of statutory norms within prescribed regulatory timeframe.'
        : undefined,
    decisionBy: status === 'Approved' || status === 'Rejected' ? 'Competent Statutory Authority' : undefined,
    decisionDate: raw.updatedAt ? raw.updatedAt.slice(0, 10) : undefined,
  };
}

export function mapObligationsToComplianceList(obligations: any[]): ComplianceInstitution[] {
  if (!Array.isArray(obligations) || obligations.length === 0) {
    return [];
  }

  const institutionMap = new Map<string, {
    id: string;
    name: string;
    total: number;
    fulfilled: number;
    lastAudit: string;
    hasOverdue: boolean;
    activeDeficiencies: number;
  }>();

  for (const ob of obligations) {
    const instName = ob.institution?.name || 'Technical Campus';
    const current = institutionMap.get(instName) || {
      id: ob.institution?.id || ob.id,
      name: instName,
      total: 0,
      fulfilled: 0,
      lastAudit: ob.dueDate ? ob.dueDate.slice(0, 10) : '2026-06-01',
      hasOverdue: false,
      activeDeficiencies: 0,
    };
    current.total += 1;
    if (ob.status === 'FULFILLED') {
      current.fulfilled += 1;
    }
    if (ob.status === 'OPEN' && new Date(ob.dueDate).getTime() < Date.now()) {
      current.hasOverdue = true;
      current.activeDeficiencies += 1;
    }
    institutionMap.set(instName, current);
  }

  return Array.from(institutionMap.values()).map((item, idx) => {
    const score = item.total > 0 ? Math.round((item.fulfilled / item.total) * 100) : 85;
    let status: 'Compliant' | 'Needs Improvement' | 'Non-Compliant' = 'Compliant';
    if (score < 75 || item.hasOverdue) status = 'Needs Improvement';
    if (score < 40) status = 'Non-Compliant';

    return {
      id: item.id || `inst-${idx + 1}`,
      name: item.name,
      complianceScore: score,
      lastAudit: item.lastAudit,
      status,
      categoryScores: {
        faculty: Math.min(100, Math.max(65, score + 5)),
        infrastructure: Math.max(50, score - 5),
        curriculum: score,
      },
      auditsOverdue: item.hasOverdue,
      activeDeficienciesCount: item.activeDeficiencies,
      assignedOfficer: 'Dr. A. K. Sharma (Senior Scrutiny Officer)',
    };
  });
}

// -----------------------------------------------------------------------------
// API Service Methods
// -----------------------------------------------------------------------------

export const api = {
  // 1. Health & Connection Check
  health: {
    async check(): Promise<{ online: boolean; message: string; latencyMs: number }> {
      const start = Date.now();
      try {
        let res = await fetch(`${API_BASE_URL.replace(/\/api\/v1$/, '')}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) {
          res = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            cache: 'no-store',
          });
        }
        const latencyMs = Date.now() - start;
        return {
          online: res.ok,
          message: res.ok ? 'Backend Connected' : `Status ${res.status}`,
          latencyMs,
        };
      } catch (err: any) {
        try {
          const res = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            cache: 'no-store',
          });
          const latencyMs = Date.now() - start;
          return {
            online: res.ok,
            message: res.ok ? 'Backend Connected' : `Status ${res.status}`,
            latencyMs,
          };
        } catch {
          return {
            online: false,
            message: err?.message || 'Connection Refused',
            latencyMs: Date.now() - start,
          };
        }
      }
    },
  },

  // 2. Authentication
  auth: {
    async registerInstitution(dto: any) {
      return request<{ success: boolean; message: string; email?: string; verificationUrl?: string }>(
        '/auth/register-institution',
        {
          method: 'POST',
          body: JSON.stringify(dto),
        }
      );
    },

    async login(dto: { email: string; password: string }) {
      const res = await request<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      return res;
    },

    async verifyEmail(dto: { token: string; email?: string }) {
      return request<{ success: boolean; message: string; status?: string }>(
        '/auth/verify-email',
        {
          method: 'POST',
          body: JSON.stringify(dto),
        }
      );
    },

    async forgotPassword(dto: { email: string }) {
      return request<{ success: boolean; message: string; resetUrl?: string }>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify(dto),
        }
      );
    },

    async resetPassword(dto: { token: string; newPassword: string; confirmPassword: string }) {
      return request<{ success: boolean; message: string }>(
        '/auth/reset-password',
        {
          method: 'POST',
          body: JSON.stringify(dto),
        }
      );
    },

    async getProfile() {
      return request<any>('/auth/me');
    },

    async logout() {
      try {
        await request<any>('/auth/logout', { method: 'POST' });
      } catch {
        // ignore
      }
    },
  },

  // 3. Applications
  applications: {
    async getAll(filters?: { status?: string; region?: string }): Promise<Application[]> {
      const query = new URLSearchParams();
      if (filters?.status) query.append('status', filters.status);
      if (filters?.region) query.append('region', filters.region);
      const queryString = query.toString() ? `?${query.toString()}` : '';
      const rawApps = await request<any[]>(`/applications${queryString}`);
      return rawApps.map(mapBackendApplication);
    },

    async getById(id: string): Promise<Application> {
      const raw = await request<any>(`/applications/${id}`);
      return mapBackendApplication(raw);
    },

    async createDraft(dto: {
      type: string;
      academicYear: string;
      assignedRegion: string;
    }) {
      return request<any>('/applications', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    async updateDraft(id: string, dto: any) {
      return request<any>(`/applications/${id}/draft`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },

    async transition(id: string, transitionData: {
      targetStage: string;
      reason?: string;
      comment?: string;
    } | {
      targetState: string;
      reason?: string;
      comment?: string;
    }) {
      const targetStage =
        'targetStage' in transitionData ? transitionData.targetStage : transitionData.targetState;

      return request<any>(`/applications/${id}/transitions`, {
        method: 'POST',
        body: JSON.stringify({
          targetStage,
          reason: transitionData.reason || transitionData.comment,
        }),
      });
    },

    async getAvailableActions(id: string) {
      return request<any[]>(`/applications/${id}/available-actions`);
    },

    async getTimeline(id: string) {
      return request<any[]>(`/applications/${id}/timeline`);
    },

    async getCaseBrief(id: string) {
      return request<any>(`/applications/${id}/brief`);
    },
  },

  // 4. Scrutiny & Deficiencies
  scrutiny: {
    async getDeficiencies(applicationId: string) {
      return request<any[]>(`/applications/${applicationId}/deficiencies`);
    },

    async createDeficiency(applicationId: string, dto: {
      clauseReference?: string;
      observation: string;
      requiredCorrection: string;
    }) {
      return request<any>(`/applications/${applicationId}/deficiencies`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    async respondDeficiency(deficiencyId: string, dto: {
      institutionResponse: string;
    }) {
      return request<any>(`/deficiencies/${deficiencyId}/respond`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    async resolveDeficiency(deficiencyId: string, resolution: 'RESOLVED' | 'REJECTED') {
      return request<any>(`/deficiencies/${deficiencyId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      });
    },
  },

  // 5. Expert Visit Committee (EVC)
  evc: {
    async getQueue() {
      return request<any[]>('/evc/queue');
    },

    async schedule(applicationId: string, dto: {
      mode: 'PHYSICAL' | 'VIRTUAL' | 'HYBRID';
      scheduledDate: string;
      locationOrLink: string;
      memberUserIds: string[];
    }) {
      return request<any>(`/evc/applications/${applicationId}/schedule`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    async submitReport(eventId: string, dto: {
      findings: any;
      s3ObjectKey: string;
    }) {
      return request<any>(`/evc/events/${eventId}/reports`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
  },

  // 6. Compliance Obligations
  compliance: {
    async getObligations() {
      return request<any[]>('/compliance/obligations');
    },

    async createObligation(institutionId: string, dto: {
      title: string;
      description: string;
      evidenceRequired: string;
      dueDate: string;
    }) {
      return request<any>(`/compliance/institutions/${institutionId}/obligations`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    async submitEvidence(obligationId: string, dto: {
      s3ObjectKey: string;
      versionNumber?: number;
    }) {
      return request<any>(`/compliance/obligations/${obligationId}/submissions`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    async verifySubmission(submissionId: string, dto: {
      status: 'VERIFIED' | 'REJECTED';
      reviewerNotes?: string;
    }) {
      return request<any>(`/compliance/submissions/${submissionId}/verify`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },
  },

  // 7. Notifications & Alerts
  notifications: {
    async getAll() {
      return request<{ notifications: any[]; unreadCount: number }>('/notifications');
    },

    async markAsRead(id: string) {
      return request<any>(`/notifications/${id}/read`, {
        method: 'POST',
      });
    },
  },

  // 8. Audit Trail
  audit: {
    async getLogs(filters?: {
      resourceType?: string;
      resourceId?: string;
      take?: number;
      skip?: number;
    }) {
      const query = new URLSearchParams();
      if (filters?.resourceType) query.append('resourceType', filters.resourceType);
      if (filters?.resourceId) query.append('resourceId', filters.resourceId);
      if (filters?.take) query.append('take', String(filters.take));
      if (filters?.skip) query.append('skip', String(filters.skip));
      const queryString = query.toString() ? `?${query.toString()}` : '';
      return request<{ logs: any[]; total: number }>(`/audit/events${queryString}`);
    },
  },

  // 9. Reports & Analytics
  reports: {
    async getPendency() {
      return request<any>('/reports/pendency');
    },

    async getCompliance() {
      return request<any>('/reports/compliance');
    },

    async getEvc() {
      return request<any>('/reports/evc');
    },
  },

  // 10. Regulatory Workflow & Rules
  workflow: {
    async getTemplates() {
      return request<any[]>('/workflow/templates');
    },

    async getStages() {
      return request<any[]>('/workflow/stages');
    },

    async getRules() {
      return request<any[]>('/workflow/rules');
    },
  },
};
