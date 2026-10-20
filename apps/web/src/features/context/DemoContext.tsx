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
  const [applications, setApplications] = useState<Application[]>([]);
  const [complianceList, setComplianceList] = useState<ComplianceInstitution[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>(INITIAL_DOCUMENTS);

  // Derive currentUser strictly from /auth/me
  const currentUser: UserSession = {
    name: authUser?.fullName || 'Authenticated User',
    role: (authUser?.primaryRole || 'INSTITUTION') as any,
    designation: authUser?.designation || authUser?.primaryRole || 'Officer',
    department: authUser?.institutionName || (authUser?.assignedRegion ? `${authUser.assignedRegion} Region` : 'AICTE HQ'),
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  };

  // Live Backend / Database state
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);

  // Sync state directly from PostgreSQL via Backend API
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
        setApplications(liveApps || []);
      } catch (appErr) {
        console.warn('Could not fetch live applications from database:', appErr);
      }

      // 3. Fetch workflow stages from PostgreSQL (only after auth is ready)
      try {
        await api.workflow.getStages();
      } catch (stageErr) {
        console.warn('Could not fetch workflow stages from database:', stageErr);
      }

      // 4. Fetch compliance obligations from PostgreSQL
      try {
        const rawObligations = await api.compliance.getObligations();
        const mappedCompliance = mapObligationsToComplianceList(rawObligations);
        setComplianceList(mappedCompliance);
      } catch (compErr) {
        console.warn('Could not fetch compliance obligations from database:', compErr);
      }

      // 5. Fetch notifications from PostgreSQL
      try {
        const notifRes = await api.notifications.getAll();
        if (notifRes && notifRes.notifications) {
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
        if (auditRes && auditRes.logs) {
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
      console.warn('Backend sync failed:', err);
      setBackendConnected(false);
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  // Sync only after auth is ready and authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      syncWithBackend();
    }
  }, [authLoading, isAuthenticated, syncWithBackend]);

  const handleSetCurrentUser = (_user: UserSession) => {
    // Current user and role must come only from /auth/me
  };

  const refreshData = async () => {
    await syncWithBackend();
  };

  // Create real application in PostgreSQL
  const createApplication = async (input: CreateApplicationInput) => {
    try {
      const created = await api.applications.createDraft({
        type: input.type,
        academicYear: input.academicYear,
        assignedRegion: input.assignedRegion,
      });
      // Re-sync with PostgreSQL database
      await syncWithBackend();
      return created;
    } catch (err) {
      console.error('Failed to create application in database:', err);
      throw err;
    }
  };

  // Atomic workflow stage transition in PostgreSQL
  const transitionApplicationStage = async (id: string, targetStage: string, reason?: string) => {
    try {
      await api.applications.transition(id, {
        targetStage,
        reason: reason || `Stage transition to ${targetStage}`,
      });
    } catch (err) {
      console.error('API transition error:', err);
      throw err;
    } finally {
      // Refresh live state from PostgreSQL
      await syncWithBackend();
    }
  };

  // Transition application in PostgreSQL
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

  // Create real deficiency in PostgreSQL
  const addDeficiency = async (
    appId: string,
    observation: string,
    category: 'Infrastructure' | 'Faculty' | 'Curriculum' | 'Financial & Legal',
    actionRequired: string
  ) => {
    try {
      await api.scrutiny.createDeficiency(appId, {
        clauseReference: `Chapter I (${category})`,
        observation,
        requiredCorrection: actionRequired,
      });
    } catch (err) {
      console.warn('API deficiency creation error:', err);
    }

    // Refresh live state from PostgreSQL
    await syncWithBackend();
  };

  // Resolve deficiency in PostgreSQL
  const resolveDeficiency = async (appId: string, defId: string, notes: string) => {
    try {
      await api.scrutiny.resolveDeficiency(defId, 'RESOLVED');
    } catch (err) {
      console.warn('API resolve deficiency error:', err);
    }

    // Refresh live state from PostgreSQL
    await syncWithBackend();
  };

  // Schedule EVC inspection in PostgreSQL
  const scheduleEvc = async (appId: string, date: string, committee: string[]) => {
    try {
      await api.evc.schedule(appId, {
        mode: 'PHYSICAL',
        scheduledDate: new Date(date).toISOString(),
        locationOrLink: 'Campus Facilities Verification',
        memberUserIds: [],
      });
    } catch (err) {
      console.warn('API schedule EVC error:', err);
    }

    // Refresh live state from PostgreSQL
    await syncWithBackend();
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
