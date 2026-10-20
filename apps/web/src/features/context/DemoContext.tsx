'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Application,
  ComplianceInstitution,
  AlertRecord,
  AuditRecord,
  DocumentRecord,
  UserSession,
} from '@/lib/types';
import {
  CURRENT_USER,
  INITIAL_APPLICATIONS,
  INITIAL_COMPLIANCE,
  INITIAL_ALERTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_DOCUMENTS,
} from '@/lib/mock-data';
import { api, API_BASE_URL, mapObligationsToComplianceList } from '@/lib/api';
import { useAuth } from '@/features/context/AuthContext';

interface CreateApplicationInput {
  type: 'NEW_INSTITUTION_LOA' | 'ROUTINE_EOA' | 'EOA_SUBSTANTIVE_CHANGE';
  academicYear: string;
  assignedRegion: string;
  institutionId?: string;
}

interface DemoContextType {
  currentUser: UserSession;
  setCurrentUser: (user: UserSession) => void;
  applications: Application[];
  complianceList: ComplianceInstitution[];
  alerts: AlertRecord[];
  auditLogs: AuditRecord[];
  documents: DocumentRecord[];

  // Backend Integration State
  backendConnected: boolean;
  apiUrl: string;
  isLiveLoading: boolean;
  refreshData: () => Promise<void>;

  // Database-backed Actions
  createApplication: (input: CreateApplicationInput) => Promise<any>;
  transitionApplicationStage: (id: string, targetStage: string, reason?: string) => Promise<void>;
  updateApplicationStatus: (
    id: string,
    status: Application['status'],
    notes?: string,
    decisionBy?: string
  ) => Promise<void>;
  addDeficiency: (
    appId: string,
    observation: string,
    category: 'Infrastructure' | 'Faculty' | 'Curriculum' | 'Financial & Legal',
    actionRequired: string
  ) => Promise<void>;
  resolveDeficiency: (appId: string, defId: string, notes: string) => Promise<void>;
  scheduleEvc: (appId: string, date: string, committee: string[]) => Promise<void>;

  // Compliance Actions
  initiateComplianceCheck: (institutionName: string, scope: string) => Promise<void>;

  // Alert Actions
  markAlertStatus: (alertId: string, status: AlertRecord['status']) => Promise<void>;
  escalateAlert: (alertId: string) => void;

  // Document Actions
  addDocument: (doc: Omit<DocumentRecord, 'id' | 'date'>) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [complianceList, setComplianceList] = useState<ComplianceInstitution[]>(INITIAL_COMPLIANCE);
  const [alerts, setAlerts] = useState<AlertRecord[]>(INITIAL_ALERTS);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);
  const [documents, setDocuments] = useState<DocumentRecord[]>(INITIAL_DOCUMENTS);

  // Derive currentUser
  const currentUser: UserSession = {
    name: authUser?.fullName || 'Dr. Ananya Sharma',
    role: (authUser?.primaryRole || 'INSTITUTION') as any,
    designation: authUser?.designation || authUser?.primaryRole || 'Senior Officer',
    department: authUser?.institutionName || (authUser?.assignedRegion ? `${authUser.assignedRegion} Region` : 'AICTE Headquarters'),
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160',
  };

  // Live Backend / Database state
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);

  // Sync state directly from PostgreSQL if Backend API is running
  const syncWithBackend = useCallback(async () => {
    setIsLiveLoading(true);
    try {
      // 1. Health check
      const health = await api.health.check();
      if (!health.online) {
        setBackendConnected(false);
        setIsLiveLoading(false);
        return;
      }
      setBackendConnected(true);

      // 2. Fetch applications from PostgreSQL
      try {
        const liveApps = await api.applications.getAll();
        if (Array.isArray(liveApps) && liveApps.length > 0) {
          setApplications(liveApps);
        }
      } catch (appErr) {
        console.warn('Could not fetch live applications from database:', appErr);
      }

      // 3. Fetch workflow stages from PostgreSQL
      try {
        await api.workflow.getStages();
      } catch (stageErr) {
        console.warn('Could not fetch workflow stages from database:', stageErr);
      }

      // 4. Fetch compliance obligations from PostgreSQL
      try {
        const rawObligations = await api.compliance.getObligations();
        if (Array.isArray(rawObligations) && rawObligations.length > 0) {
          const mappedCompliance = mapObligationsToComplianceList(rawObligations);
          setComplianceList(mappedCompliance);
        }
      } catch (compErr) {
        console.warn('Could not fetch compliance obligations from database:', compErr);
      }

      // 5. Fetch notifications from PostgreSQL
      try {
        const notifRes = await api.notifications.getAll();
        if (notifRes && notifRes.notifications && notifRes.notifications.length > 0) {
          const mappedAlerts: AlertRecord[] = notifRes.notifications.map((n) => ({
            id: n.id,
            severity: n.templateKey?.includes('WARNING') ? 'High' : 'Medium',
            alert: n.title ? `${n.title}: ${n.body}` : n.body,
            timestamp: n.createdAt ? n.createdAt.replace('T', ' ').slice(0, 16) : new Date().toISOString().slice(0, 16),
            status: n.readAt ? 'Read' : 'Unread',
          }));
          setAlerts(mappedAlerts);
        }
      } catch (notifErr) {
        console.warn('Could not fetch notifications from database:', notifErr);
      }

      // 6. Fetch audit logs from PostgreSQL
      try {
        const auditRes = await api.audit.getLogs({ take: 50 });
        if (auditRes && auditRes.logs && auditRes.logs.length > 0) {
          const mappedLogs: AuditRecord[] = auditRes.logs.map((l) => ({
            id: l.id.slice(0, 8),
            timestamp: l.createdAt ? l.createdAt.replace('T', ' ').slice(0, 19) + ' UTC' : new Date().toISOString(),
            user: l.actor?.fullName || 'System Automated Process',
            role: l.actor?.email ? 'AICTE Officer' : 'SYSTEM',
            action: l.action,
            details: `Resource: ${l.resourceType} (${l.resourceId})`,
            category: l.action.includes('DEFICIENCY') ? 'CRITICAL' : 'APPROVALS',
          }));
          setAuditLogs(mappedLogs);
        }
      } catch (auditErr) {
        console.warn('Could not fetch audit logs from database:', auditErr);
      }
    } catch (err) {
      setBackendConnected(false);
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  // Sync only after auth is ready
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      syncWithBackend();
    }
  }, [authLoading, isAuthenticated, syncWithBackend]);

  const handleSetCurrentUser = (_user: UserSession) => {};

  const refreshData = async () => {
    await syncWithBackend();
  };

  // Create application (Instant in demo mode + optional PostgreSQL sync)
  const createApplication = async (input: CreateApplicationInput) => {
    const formattedType =
      input.type === 'NEW_INSTITUTION_LOA'
        ? 'New Approval'
        : input.type === 'ROUTINE_EOA'
        ? 'Renewal'
        : 'Extension';

    const newApp: Application = {
      id: `AICTE/2026/APP-${1050 + applications.length}`,
      institution:
        currentUser.name && currentUser.name !== 'Authenticated User'
          ? currentUser.department || currentUser.name
          : 'Delhi Institute of Engineering & Technology',
      type: formattedType,
      submittedDate: new Date().toISOString().slice(0, 10),
      status: 'Submitted',
      currentStage: 'Intake',
      reviewer: 'Intake Scrutiny Desk',
      region: input.assignedRegion === 'NORTH' ? 'Northern Region (Kanpur)' : input.assignedRegion === 'WEST' ? 'Western Region (Mumbai)' : 'Southern Region (Chennai)',
      academicYear: input.academicYear || '2026-27',
      deficiencies: [],
    };

    // Immediate optimistic update
    setApplications((prev) => [newApp, ...prev]);

    // Append to audit logs
    const newAuditLog: AuditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' IST',
      user: currentUser.name || 'Authorised User',
      role: currentUser.role || 'INSTITUTION',
      action: 'Application Draft Initiated',
      details: `New application created: ${newApp.id} for ${newApp.institution}`,
      category: 'APPROVALS',
    };
    setAuditLogs((prev) => [newAuditLog, ...prev]);

    // Try backend persistence in background if online
    try {
      await api.applications.createDraft({
        type: input.type,
        academicYear: input.academicYear,
        assignedRegion: input.assignedRegion,
      });
      syncWithBackend();
    } catch (err) {
      // Standalone demo mode continues gracefully
    }

    return newApp;
  };

  // Atomic workflow stage transition (Instant in demo mode + optional PostgreSQL sync)
  const transitionApplicationStage = async (id: string, targetStage: string, reason?: string) => {
    // Immediate state transformation
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== id) return app;

        let nextStatus: Application['status'] = app.status;
        let nextStage: Application['currentStage'] = app.currentStage;

        if (targetStage === 'SUBMITTED') {
          nextStatus = 'Submitted';
          nextStage = 'Intake';
        } else if (
          targetStage === 'SCRUTINY' ||
          targetStage === 'DEFICIENCY_RESPONSE' ||
          targetStage === 'RE_SCRUTINY'
        ) {
          nextStatus = 'Under Review';
          nextStage = 'Scrutiny';
        } else if (targetStage === 'EVC_PENDING') {
          nextStatus = 'Under Review';
          nextStage = 'Scrutiny';
        } else if (targetStage === 'EVC_SCHEDULED' || targetStage === 'EVC_REVIEW') {
          nextStatus = 'Committee';
          nextStage = 'Committee Hearing';
        } else if (targetStage === 'HEARING_OR_COMMITTEE_REVIEW') {
          nextStatus = 'Committee';
          nextStage = 'Committee Hearing';
        } else if (targetStage === 'DECISION_PENDING') {
          nextStatus = 'Under Review';
          nextStage = 'Final Human Decision';
        } else if (targetStage === 'APPROVED') {
          nextStatus = 'Approved';
          nextStage = 'Final Human Decision';
        } else if (targetStage === 'REJECTED') {
          nextStatus = 'Rejected';
          nextStage = 'Final Human Decision';
        }

        return {
          ...app,
          status: nextStatus,
          currentStage: nextStage,
          finalDecisionNotes:
            targetStage === 'APPROVED' || targetStage === 'REJECTED'
              ? reason || `Formal order issued: ${targetStage}`
              : app.finalDecisionNotes,
          decisionBy:
            targetStage === 'APPROVED' || targetStage === 'REJECTED'
              ? currentUser.name
              : app.decisionBy,
          decisionDate:
            targetStage === 'APPROVED' || targetStage === 'REJECTED'
              ? new Date().toISOString().slice(0, 10)
              : app.decisionDate,
        };
      })
    );

    // Append to audit trail
    const auditEntry: AuditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' IST',
      user: currentUser.name || 'Statutory Official',
      role: currentUser.role || 'AICTE Officer',
      action: `Stage Transition -> ${targetStage}`,
      details: reason || `Application ${id} moved to ${targetStage}`,
      category: 'APPROVALS',
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    // Try backend transition in background if online
    try {
      await api.applications.transition(id, {
        targetStage,
        reason: reason || `Stage transition to ${targetStage}`,
      });
      syncWithBackend();
    } catch (err) {
      // Standalone demo mode continues smoothly
    }
  };

  // Transition application
  const updateApplicationStatus = async (
    id: string,
    status: Application['status'],
    notes?: string,
    _decisionBy?: string
  ) => {
    let targetStage = 'SCRUTINY';
    if (status === 'Approved') targetStage = 'APPROVED';
    else if (status === 'Rejected') targetStage = 'REJECTED';
    else if (status === 'Committee') targetStage = 'HEARING_OR_COMMITTEE_REVIEW';
    else if (status === 'Submitted') targetStage = 'SUBMITTED';

    return transitionApplicationStage(id, targetStage, notes || `State transition to ${status}`);
  };

  // Create deficiency (Optimistic local + background API)
  const addDeficiency = async (
    appId: string,
    observation: string,
    category: 'Infrastructure' | 'Faculty' | 'Curriculum' | 'Financial & Legal',
    actionRequired: string
  ) => {
    const newDef = {
      id: `DEF-${Date.now().toString().slice(-4)}`,
      category,
      observation,
      actionRequired,
      raisedBy: currentUser.name || 'Senior Scrutiny Officer',
      raisedAt: new Date().toISOString().slice(0, 10),
      deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'Open' as const,
    };

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        return {
          ...app,
          deficiencies: [newDef, ...app.deficiencies],
        };
      })
    );

    try {
      await api.scrutiny.createDeficiency(appId, {
        clauseReference: `Chapter I (${category})`,
        observation,
        requiredCorrection: actionRequired,
      });
      syncWithBackend();
    } catch {
      // Standalone demo mode continues
    }
  };

  // Resolve deficiency
  const resolveDeficiency = async (appId: string, defId: string, notes: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        return {
          ...app,
          deficiencies: app.deficiencies.map((d) =>
            d.id === defId ? { ...d, status: 'Resolved' as const, resolutionNotes: notes } : d
          ),
        };
      })
    );

    try {
      await api.scrutiny.resolveDeficiency(defId, 'RESOLVED');
      syncWithBackend();
    } catch {
      // Standalone demo mode continues
    }
  };

  // Schedule EVC inspection
  const scheduleEvc = async (appId: string, date: string, committee: string[]) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        return {
          ...app,
          evcScheduled: date,
          evcCommittee: committee,
          currentStage: 'Committee Hearing',
          status: 'Committee',
        };
      })
    );

    try {
      await api.evc.schedule(appId, {
        mode: 'PHYSICAL',
        scheduledDate: new Date(date).toISOString(),
        locationOrLink: 'Campus Facilities Verification',
        memberUserIds: [],
      });
      syncWithBackend();
    } catch (err) {
      // Standalone demo mode continues
    }
  };

  // Initiate statutory compliance check
  const initiateComplianceCheck = async (institutionName: string, scope: string) => {
    try {
      // Find matching institution id
      const match = complianceList.find((c) => c.name === institutionName);
      if (match?.id) {
        await api.compliance.createObligation(match.id, {
          title: `Statutory Compliance Review: ${scope}`,
          description: `Mandatory review initiated for ${institutionName}`,
          evidenceRequired: 'Audit report & compliance certificates',
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        });
      }
    } catch (err) {
      console.warn('API compliance obligation creation error:', err);
    }

    await syncWithBackend();
  };

  const markAlertStatus = async (alertId: string, status: AlertRecord['status']) => {
    try {
      if (status === 'Read') {
        await api.notifications.markAsRead(alertId);
      }
    } catch (err) {
      console.warn('API notification mark read error:', err);
    }

    await syncWithBackend();
  };

  const escalateAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, severity: 'Critical' } : a))
    );
  };

  const addDocument = (doc: Omit<DocumentRecord, 'id' | 'date'>) => {
    const newDoc: DocumentRecord = {
      ...doc,
      id: `DOC-${Date.now().toString().slice(-3)}`,
      date: new Date().toISOString().slice(0, 10),
    };
    setDocuments((prev) => [newDoc, ...prev]);
  };

  return (
    <DemoContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        applications,
        complianceList,
        alerts,
        auditLogs,
        documents,
        backendConnected,
        apiUrl: API_BASE_URL,
        isLiveLoading,
        refreshData,
        createApplication,
        transitionApplicationStage,
        updateApplicationStatus,
        addDeficiency,
        resolveDeficiency,
        scheduleEvc,
        initiateComplianceCheck,
        markAlertStatus,
        escalateAlert,
        addDocument,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
