'use client';

import React, { createContext, useContext, useState } from 'react';
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

interface DemoContextType {
  currentUser: UserSession;
  setCurrentUser: (user: UserSession) => void;
  applications: Application[];
  complianceList: ComplianceInstitution[];
  alerts: AlertRecord[];
  auditLogs: AuditRecord[];
  documents: DocumentRecord[];
  
  // Application Actions
  updateApplicationStatus: (
    id: string,
    status: Application['status'],
    notes?: string,
    decisionBy?: string
  ) => void;
  addDeficiency: (
    appId: string,
    observation: string,
    category: 'Infrastructure' | 'Faculty' | 'Curriculum' | 'Financial & Legal',
    actionRequired: string
  ) => void;
  resolveDeficiency: (appId: string, defId: string, notes: string) => void;
  scheduleEvc: (appId: string, date: string, committee: string[]) => void;
  
  // Compliance Actions
  initiateComplianceCheck: (institutionName: string, scope: string) => void;
  
  // Alert Actions
  markAlertStatus: (alertId: string, status: AlertRecord['status']) => void;
  escalateAlert: (alertId: string) => void;
  
  // Document Actions
  addDocument: (doc: Omit<DocumentRecord, 'id' | 'date'>) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserSession>(CURRENT_USER);
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [complianceList, setComplianceList] = useState<ComplianceInstitution[]>(INITIAL_COMPLIANCE);
  const [alerts, setAlerts] = useState<AlertRecord[]>(INITIAL_ALERTS);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);
  const [documents, setDocuments] = useState<DocumentRecord[]>(INITIAL_DOCUMENTS);

  const addAuditEntry = (action: string, details: string, category: AuditRecord['category'] = 'APPROVALS') => {
    const newLog: AuditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' IST',
      user: currentUser.name,
      role: currentUser.designation,
      action,
      details,
      category,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const updateApplicationStatus = (
    id: string,
    status: Application['status'],
    notes?: string,
    decisionBy?: string
  ) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          return {
            ...app,
            status,
            finalDecisionNotes: notes || app.finalDecisionNotes,
            decisionBy: decisionBy || currentUser.name,
            decisionDate: new Date().toISOString().slice(0, 10),
            currentStage:
              status === 'Approved' || status === 'Rejected'
                ? 'Final Human Decision'
                : status === 'Committee'
                ? 'Committee Hearing'
                : 'Scrutiny',
          };
        }
        return app;
      })
    );
    addAuditEntry(
      `Application Status -> ${status}`,
      `Application ${id} transitioned to ${status} by ${currentUser.name}.${notes ? ` Notes: ${notes}` : ''}`,
      status === 'Rejected' ? 'CRITICAL' : 'APPROVALS'
    );
  };

  const addDeficiency = (
    appId: string,
    observation: string,
    category: 'Infrastructure' | 'Faculty' | 'Curriculum' | 'Financial & Legal',
    actionRequired: string
  ) => {
    const defId = `DEF-${appId.slice(-4)}-0${Math.floor(Math.random() * 90 + 10)}`;
    const newDef = {
      id: defId,
      category,
      observation,
      actionRequired,
      raisedBy: currentUser.name,
      raisedAt: new Date().toISOString().slice(0, 10),
      deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'Open' as const,
    };

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            deficiencies: [...app.deficiencies, newDef],
          };
        }
        return app;
      })
    );

    addAuditEntry(
      'Deficiency Raised',
      `Deficiency ${defId} (${category}) raised on ${appId}: "${observation}"`,
      'CRITICAL'
    );

    // Create an alert
    const newAlert: AlertRecord = {
      id: `alert-${Date.now().toString().slice(-3)}`,
      severity: 'High',
      alert: `Deficiency raised for ${appId} in ${category}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Unread',
      entityId: appId,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const resolveDeficiency = (appId: string, defId: string, notes: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            deficiencies: app.deficiencies.map((d) =>
              d.id === defId
                ? { ...d, status: 'Resolved' as const, resolutionNotes: notes }
                : d
            ),
          };
        }
        return app;
      })
    );
    addAuditEntry(
      'Deficiency Resolved',
      `Deficiency ${defId} on ${appId} marked as Resolved. Evidentiary notes: ${notes}`,
      'APPROVALS'
    );
  };

  const scheduleEvc = (appId: string, date: string, committee: string[]) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            status: 'Committee',
            currentStage: 'Committee Hearing',
            evcScheduled: date,
            evcCommittee: committee,
          };
        }
        return app;
      })
    );
    addAuditEntry(
      'EVC Inspection Scheduled',
      `Expert Visit Committee inspection for ${appId} scheduled on ${date}. Assigned panel: ${committee.join(', ')}`,
      'APPROVALS'
    );
  };

  const initiateComplianceCheck = (institutionName: string, scope: string) => {
    addAuditEntry(
      'Compliance Audit Initiated',
      `New statutory audit initiated for "${institutionName}". Scope: ${scope}. Notification dispatched to institutional registrar.`,
      'APPROVALS'
    );

    const newAlert: AlertRecord = {
      id: `alert-${Date.now().toString().slice(-3)}`,
      severity: 'Medium',
      alert: `New audit check scheduled for ${institutionName}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Unread',
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const markAlertStatus = (alertId: string, status: AlertRecord['status']) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status } : a))
    );
    addAuditEntry(
      `Alert Status -> ${status}`,
      `Alert ${alertId} updated to ${status} by ${currentUser.name}`,
      'SYSTEM'
    );
  };

  const escalateAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, severity: 'Critical' } : a))
    );
    addAuditEntry(
      'Alert Escalated',
      `Alert ${alertId} escalated to Regional Officer tier by ${currentUser.name}`,
      'CRITICAL'
    );
  };

  const addDocument = (doc: Omit<DocumentRecord, 'id' | 'date'>) => {
    const newDoc: DocumentRecord = {
      ...doc,
      id: `DOC-${Date.now().toString().slice(-3)}`,
      date: new Date().toISOString().slice(0, 10),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    addAuditEntry(
      'Document Uploaded',
      `New statutory filing ${newDoc.name} (${newDoc.category}) stored by ${currentUser.name}`,
      'SYSTEM'
    );
  };

  return (
    <DemoContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        applications,
        complianceList,
        alerts,
        auditLogs,
        documents,
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
