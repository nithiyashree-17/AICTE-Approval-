'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Application } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useDemo } from '@/features/context/DemoContext';

interface ApplicationDetailsModalProps {
  application: Application | null;
  onClose: () => void;
}

export function ApplicationDetailsModal({
  application,
  onClose,
}: ApplicationDetailsModalProps) {
  const {
    updateApplicationStatus,
    transitionApplicationStage,
    addDeficiency,
    resolveDeficiency,
    scheduleEvc,
    currentUser,
  } = useDemo();

  const [activeTab, setActiveTab] = useState<'overview' | 'deficiencies' | 'evc' | 'timeline' | 'decision'>('overview');
  const [newDefCategory, setNewDefCategory] = useState<'Faculty' | 'Infrastructure' | 'Curriculum' | 'Financial & Legal'>('Faculty');
  const [newDefObs, setNewDefObs] = useState('');
  const [newDefAction, setNewDefAction] = useState('');
  const [evcDate, setEvcDate] = useState('2026-07-05');
  const [evcExperts, setEvcExperts] = useState('Prof. S. R. Raman (IIT Bombay), Dr. Meenakshi Sundaram (Anna Univ)');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Fetch chronological timeline on mount or tab change
  React.useEffect(() => {
    if (!application?.id) return;
    let isMounted = true;
    const fetchTimeline = async () => {
      setIsLoadingTimeline(true);
      try {
        const { api } = await import('@/lib/api');
        const history = await api.applications.getTimeline(application.id);
        if (isMounted && Array.isArray(history)) {
          setTimelineEvents(history);
        }
      } catch (err) {
        console.warn('Could not load application timeline:', err);
      } finally {
        if (isMounted) setIsLoadingTimeline(false);
      }
    };
    fetchTimeline();
    return () => {
      isMounted = false;
    };
  }, [application?.id, activeTab]);

  if (!application) return null;

  const handleRaiseDeficiency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDefObs || !newDefAction) return;
    addDeficiency(application.id, newDefObs, newDefCategory, newDefAction);
    setNewDefObs('');
    setNewDefAction('');
    setActiveTab('deficiencies');
  };

  const handleScheduleEvc = (e: React.FormEvent) => {
    e.preventDefault();
    const experts = evcExperts.split(',').map((s) => s.trim());
    scheduleEvc(application.id, evcDate, experts);
    setActiveTab('overview');
  };

  const handleAdvanceStage = async (targetStage: string, reason?: string) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await transitionApplicationStage(
        application.id,
        targetStage,
        reason || `Progressed to ${targetStage} via Workflow Manager`
      );
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to execute workflow transition';
      setActionError(msg.replace(/API Error \[\d+\]: /, ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHumanDecision = async (status: 'Approved' | 'Rejected') => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await updateApplicationStatus(
        application.id,
        status,
        decisionNotes || (status === 'Approved' ? 'Statutory criteria satisfied post scrutiny.' : 'Mandatory requirements unmet.'),
        currentUser.name
      );
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to execute workflow transition';
      setActionError(msg.replace(/API Error \[\d+\]: /, ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-dropdown overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#EAE6DF] bg-[#FAF8F5] flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase font-semibold text-[#8C653B] bg-[#F5EDE4] px-2.5 py-1 rounded">
                {application.id}
              </span>
              <StatusBadge status={application.status} size="md" />
              <span className="text-xs text-[#736B5E]">{application.type}</span>
            </div>
            <h2 className="font-serif font-bold text-2xl text-[#1A1816] mt-2">
              {application.institution}
            </h2>
            <p className="text-xs text-[#8C8274] mt-0.5">
              Region: {application.region} &bull; Academic Year: {application.academicYear} &bull; Submitted: {application.submittedDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8C8274] hover:text-[#1A1816] rounded-lg hover:bg-[#F2ECE2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-[#EAE6DF] px-6 bg-white gap-6 text-sm font-medium">
          {[
            { id: 'overview', label: 'Overview & Scrutiny' },
            {
              id: 'deficiencies',
              label: `Deficiencies (${application.deficiencies.length})`,
            },
            { id: 'evc', label: 'EVC Committee' },
            { id: 'timeline', label: 'Audit Timeline' },
            { id: 'decision', label: 'Statutory Final Decision' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 border-b-2 text-xs uppercase tracking-wider font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-[#1A1816] text-[#1A1816]'
                  : 'border-transparent text-[#8C8274] hover:text-[#1A1816]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#2D2821]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statutory Stage Stepper Card */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#8C8274]">
                    AICTE Statutory Workflow Progression
                  </span>
                  <span className="text-xs font-semibold text-[#8C653B]">
                    Current: {application.currentStage}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className={`p-2.5 rounded-lg border font-semibold ${
                    application.currentStage === 'Intake'
                      ? 'bg-[#8C653B] text-white border-[#8C653B]'
                      : 'bg-white text-[#1A1816] border-[#EAE6DF]'
                  }`}>
                    1. Intake &amp; Filing
                  </div>
                  <div className={`p-2.5 rounded-lg border font-semibold ${
                    application.currentStage === 'Scrutiny'
                      ? 'bg-[#8C653B] text-white border-[#8C653B]'
                      : 'bg-white text-[#1A1816] border-[#EAE6DF]'
                  }`}>
                    2. Technical Scrutiny
                  </div>
                  <div className={`p-2.5 rounded-lg border font-semibold ${
                    application.currentStage === 'Committee Hearing'
                      ? 'bg-[#8C653B] text-white border-[#8C653B]'
                      : 'bg-white text-[#1A1816] border-[#EAE6DF]'
                  }`}>
                    3. EVC / Committee
                  </div>
                  <div className={`p-2.5 rounded-lg border font-semibold ${
                    application.currentStage === 'Final Human Decision' || application.status === 'Approved' || application.status === 'Rejected'
                      ? 'bg-[#8C653B] text-white border-[#8C653B]'
                      : 'bg-white text-[#1A1816] border-[#EAE6DF]'
                  }`}>
                    4. Final Decision
                  </div>
                </div>

                {/* Direct Stage Advance Actions */}
                <div className="mt-4 pt-3 border-t border-[#EAE6DF] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#1A1816] block">
                      Next Regulatory Action:
                    </span>
                    <span className="text-[11px] text-[#736B5E]">
                      {application.currentStage === 'Intake' && 'Application in intake. Ready for technical review or formal submission.'}
                      {application.currentStage === 'Scrutiny' && 'Verify infrastructure and faculty norms. Raise deficiency or advance.'}
                      {application.currentStage === 'Committee Hearing' && 'Review inspection report and formulate SAC/SHC recommendation.'}
                      {application.currentStage === 'Final Human Decision' && 'Competent authority order pending.'}
                      {(application.status === 'Approved' || application.status === 'Rejected') && 'Statutory cycle concluded for this application.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {application.currentStage === 'Intake' && (
                      <>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleAdvanceStage('SUBMITTED', 'Formal application submitted to AICTE Regional Bureau')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#8C653B] hover:bg-[#73522E] text-white transition-colors disabled:opacity-50"
                        >
                          Submit to AICTE
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleAdvanceStage('SCRUTINY', 'Application accepted for technical scrutiny')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1A1816] hover:bg-[#333] text-white transition-colors disabled:opacity-50"
                        >
                          Begin Scrutiny
                        </button>
                      </>
                    )}

                    {application.currentStage === 'Scrutiny' && (
                      <>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleAdvanceStage('EVC_PENDING', 'Scrutiny satisfactory; EVC physical inspection mandated')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#8C653B] hover:bg-[#73522E] text-white transition-colors disabled:opacity-50"
                        >
                          Order EVC Visit
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleAdvanceStage('DECISION_PENDING', 'Routine Extension of Approval - Recommended without EVC')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1A1816] hover:bg-[#333] text-white transition-colors disabled:opacity-50"
                        >
                          Fast-Track Decision
                        </button>
                      </>
                    )}

                    {application.currentStage === 'Committee Hearing' && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleAdvanceStage('DECISION_PENDING', 'Committee review complete; formal recommendation forwarded')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1A1816] hover:bg-[#333] text-white transition-colors disabled:opacity-50"
                      >
                        Submit Recommendation
                      </button>
                    )}

                    {application.currentStage === 'Final Human Decision' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('decision')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#065F46] hover:bg-[#044e39] text-white transition-colors"
                      >
                        Execute Final Order
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
                  <span className="text-[11px] uppercase font-semibold text-[#8C8274] tracking-wider">
                    Current Stage
                  </span>
                  <p className="text-base font-serif font-bold text-[#1A1816] mt-1">
                    {application.currentStage}
                  </p>
                  <p className="text-xs text-[#736B5E] mt-1">
                    Reviewer: {application.reviewer || 'Not assigned'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
                  <span className="text-[11px] uppercase font-semibold text-[#8C8274] tracking-wider">
                    Deficiencies Outstanding
                  </span>
                  <p className="text-base font-serif font-bold text-[#1A1816] mt-1">
                    {application.deficiencies.filter((d) => d.status !== 'Resolved').length} Open Issues
                  </p>
                  <p className="text-xs text-[#736B5E] mt-1">
                    Resolution timeline: 14 business days from notice
                  </p>
                </div>
              </div>

              {application.finalDecisionNotes && (
                <div className="p-4 rounded-xl bg-[#F5EDE4] border border-[#DFD8CC]">
                  <h4 className="font-serif font-bold text-sm text-[#73522E]">
                    Recorded Decision by {application.decisionBy} ({application.decisionDate})
                  </h4>
                  <p className="text-xs text-[#5C5449] mt-1">
                    {application.finalDecisionNotes}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('deficiencies')}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF] hover:bg-[#F2ECE2] text-xs font-semibold text-[#1A1816] transition-colors"
                >
                  Manage Deficiencies
                </button>
                <button
                  onClick={() => setActiveTab('evc')}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF] hover:bg-[#F2ECE2] text-xs font-semibold text-[#1A1816] transition-colors"
                >
                  Schedule EVC Inspection
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF] hover:bg-[#F2ECE2] text-xs font-semibold text-[#1A1816] transition-colors"
                >
                  Audit Timeline
                </button>
                <button
                  onClick={() => setActiveTab('decision')}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#1A1816] text-white hover:bg-[#333] text-xs font-semibold transition-colors"
                >
                  Statutory Sign-Off
                </button>
              </div>
            </div>
          )}

          {activeTab === 'deficiencies' && (
            <div className="space-y-6">
              {/* Existing Deficiencies */}
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-base text-[#1A1816]">
                  Active Deficiencies & Observations
                </h3>
                {application.deficiencies.length === 0 ? (
                  <p className="text-xs text-[#8C8274] italic p-4 bg-[#FAF8F5] rounded-lg">
                    No deficiencies recorded. Application satisfies standard scrutiny criteria.
                  </p>
                ) : (
                  application.deficiencies.map((def) => (
                    <div
                      key={def.id}
                      className="p-4 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#8C653B]">
                          {def.id} &bull; {def.category}
                        </span>
                        <StatusBadge status={def.status} />
                      </div>
                      <p className="text-xs text-[#1A1816] font-medium">
                        {def.observation}
                      </p>
                      <p className="text-xs text-[#736B5E]">
                        <strong>Action Required:</strong> {def.actionRequired}
                      </p>
                      {def.resolutionNotes && (
                        <p className="text-xs text-[#065F46] bg-[#ECFDF5] p-2 rounded">
                          <strong>Resolution:</strong> {def.resolutionNotes}
                        </p>
                      )}
                      {def.status !== 'Resolved' && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() =>
                              resolveDeficiency(
                                application.id,
                                def.id,
                                'Rectification documents verified compliant with APH guidelines.'
                              )
                            }
                            className="px-3 py-1 bg-[#065F46] text-white rounded text-xs font-semibold hover:bg-[#044e39] transition-colors"
                          >
                            Mark as Rectified & Resolved
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Form to raise new deficiency */}
              <form
                onSubmit={handleRaiseDeficiency}
                className="p-4 rounded-xl border border-[#DFD8CC] bg-white space-y-3"
              >
                <h4 className="font-serif font-bold text-sm text-[#1A1816]">
                  Issue New Scrutiny Deficiency Notice
                </h4>
                <div>
                  <label className="text-[11px] uppercase font-bold text-[#8C8274]">
                    Deficiency Category
                  </label>
                  <select
                    value={newDefCategory}
                    onChange={(e) => setNewDefCategory(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs border border-[#EAE6DF] rounded-lg bg-[#FAF8F5]"
                  >
                    <option value="Faculty">Faculty Cadre & Ratio Norms</option>
                    <option value="Infrastructure">Infrastructure & Land Title</option>
                    <option value="Curriculum">Curriculum & Laboratories</option>
                    <option value="Financial & Legal">Financial Lien, FDR & Legal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-[#8C8274]">
                    Observation
                  </label>
                  <textarea
                    rows={2}
                    value={newDefObs}
                    onChange={(e) => setNewDefObs(e.target.value)}
                    placeholder="Specific clause shortfall per AICTE APH..."
                    className="w-full mt-1 p-2 text-xs border border-[#EAE6DF] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-[#8C8274]">
                    Action Required by Institution
                  </label>
                  <input
                    type="text"
                    value={newDefAction}
                    onChange={(e) => setNewDefAction(e.target.value)}
                    placeholder="Documents or affidavits required..."
                    className="w-full mt-1 p-2 text-xs border border-[#EAE6DF] rounded-lg"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8C653B] text-white text-xs font-bold rounded-lg hover:bg-[#73522E] transition-colors"
                >
                  Raise Deficiency & Dispatch Notice
                </button>
              </form>
            </div>
          )}

          {activeTab === 'evc' && (
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-base text-[#1A1816]">
                Expert Visit Committee (EVC) Physical Verification
              </h3>
              <p className="text-xs text-[#736B5E]">
                EVC panels are appointed under statutory AICTE rules to perform on-site infrastructure and academic audits.
              </p>

              {application.evcScheduled ? (
                <div className="p-4 rounded-xl bg-[#F5EDE4] border border-[#DFD8CC] space-y-2">
                  <span className="text-xs font-bold text-[#73522E]">
                    EVC Inspection Scheduled for {application.evcScheduled}
                  </span>
                  <p className="text-xs text-[#5C5449]">
                    Panel: {application.evcCommittee?.join(', ')}
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleScheduleEvc}
                  className="p-4 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] space-y-3"
                >
                  <div>
                    <label className="text-[11px] uppercase font-bold text-[#8C8274]">
                      Inspection Target Date
                    </label>
                    <input
                      type="date"
                      value={evcDate}
                      onChange={(e) => setEvcDate(e.target.value)}
                      className="w-full mt-1 p-2 text-xs border border-[#EAE6DF] rounded-lg bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-bold text-[#8C8274]">
                      EVC Expert Committee Members
                    </label>
                    <input
                      type="text"
                      value={evcExperts}
                      onChange={(e) => setEvcExperts(e.target.value)}
                      className="w-full mt-1 p-2 text-xs border border-[#EAE6DF] rounded-lg bg-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1A1816] text-white text-xs font-bold rounded-lg hover:bg-[#333] transition-colors"
                  >
                    Confirm EVC Assignment
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1A1816]">
                  Chronological Regulatory Audit History
                </h3>
                <p className="text-xs text-[#736B5E] mt-0.5">
                  Immutable PostgreSQL-backed audit trail recording all stage entries, reasons, and statutory actors.
                </p>
              </div>

              {isLoadingTimeline ? (
                <div className="p-8 text-center text-xs text-[#8C8274]">
                  Loading statutory audit trail...
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8C8274] bg-[#FAF8F5] rounded-xl border border-[#EAE6DF]">
                  No stage transitions recorded yet. Advance the stage from the Overview tab to initiate entries.
                </div>
              ) : (
                <div className="relative border-l-2 border-[#EAE6DF] ml-4 pl-4 space-y-4 py-2">
                  {timelineEvents.map((event, idx) => (
                    <div key={event.id || idx} className="relative">
                      <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#8C653B] border-2 border-white shadow-2xs" />
                      <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE6DF] space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#1A1816]">
                            {event.fromState} &rarr; {event.toState}
                          </span>
                          <span className="text-[#8C8274]">
                            {event.timestamp ? event.timestamp.replace('T', ' ').slice(0, 16) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-[#5C5449]">
                          {event.reason || 'Stage progression confirmed'}
                        </p>
                        {event.actor?.fullName && (
                          <p className="text-[11px] text-[#8C653B] font-semibold">
                            By: {event.actor.fullName} ({event.actor.email})
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'decision' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                  Statutory Rule: Human Decision Authority Mandatory
                </div>
                <p>
                  AI algorithms, rule engines, and automated scrutiny tools assist in pendency tracking and deficiency highlighting. Under AICTE statutory governance, the final decision to Approve or Reject rests solely with authorised human officials.
                </p>
              </div>

              {application.currentStage !== 'Final Human Decision' && application.status !== 'Approved' && application.status !== 'Rejected' && (
                <div className="p-4 rounded-xl bg-[#F5EDE4] border border-[#DFD8CC] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#73522E]">
                    <Clock className="w-4 h-4 text-[#8C653B]" />
                    <span>Application is currently in stage: {application.currentStage}</span>
                  </div>
                  <p className="text-xs text-[#5C5449]">
                    Under AICTE statutory workflow rules, the final approval order is signed once the application reaches the final decision docket. You can progress the application stage-by-stage on the Overview tab or advance it directly to the Decision Docket below:
                  </p>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAdvanceStage('DECISION_PENDING', 'Administrative advance to final decision docket')}
                    className="mt-1 px-3.5 py-2 text-xs font-bold bg-[#1A1816] hover:bg-[#333] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Advance to Final Decision Docket
                  </button>
                </div>
              )}

              {actionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-900">Regulatory State Transition Blocked</p>
                    <p className="mt-0.5">{actionError}</p>
                  </div>
                </div>
              )}

              {application.status === 'Approved' || application.status === 'Rejected' ? (
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#1A1816]">
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    <span>Statutory Order Formally Recorded</span>
                  </div>
                  <p className="text-xs text-[#5C5449]">
                    Decision: <strong>{application.status}</strong> &bull; Date: {application.decisionDate || 'Current Cycle'}
                  </p>
                  {application.finalDecisionNotes && (
                    <p className="text-xs text-[#736B5E] italic">
                      "{application.finalDecisionNotes}"
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] uppercase font-bold text-[#8C8274]">
                      Official Decision Memo / Order Rationale
                    </label>
                    <textarea
                      rows={3}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Record formal statutory findings, committee reference, or approval order terms..."
                      className="w-full mt-1 p-3 text-xs border border-[#EAE6DF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8C653B]"
                    />
                  </div>

                  <div className="pt-2 flex gap-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleHumanDecision('Approved')}
                      className="flex-1 py-3 px-4 bg-[#065F46] hover:bg-[#044e39] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Grant Statutory Approval
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleHumanDecision('Rejected')}
                      className="flex-1 py-3 px-4 bg-[#991B1B] hover:bg-[#7f1d1d] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Issue Statutory Rejection
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
