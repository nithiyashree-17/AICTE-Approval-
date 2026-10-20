'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowRight,
  ExternalLink,
  X,
  Database,
} from 'lucide-react';
import { useDemo } from '@/features/context/DemoContext';
import { Application, ApplicationStatus } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PipelineStages } from '@/components/dashboard/PipelineStages';
import { ApplicationDetailsModal } from '@/components/workflow/ApplicationDetailsModal';

export default function ApplicationsPage() {
  const { applications, auditLogs, createApplication } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [newAppType, setNewAppType] = useState<'NEW_INSTITUTION_LOA' | 'ROUTINE_EOA' | 'EOA_SUBSTANTIVE_CHANGE'>('NEW_INSTITUTION_LOA');
  const [newAppYear, setNewAppYear] = useState('2026-27');
  const [newAppRegion, setNewAppRegion] = useState('NORTH');
  const [isCreatingApp, setIsCreatingApp] = useState(false);

  const handleCreateNewApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingApp(true);
    try {
      await createApplication({
        type: newAppType,
        academicYear: newAppYear,
        assignedRegion: newAppRegion,
      });
      setShowNewAppModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingApp(false);
    }
  };

  // Filter applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || app.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  // Compute live aggregates from database
  const totalAppsCount = applications.length;
  const pendingAppsCount = applications.filter(
    (a) => a.status === 'Submitted' || a.status === 'Under Review' || a.status === 'Committee'
  ).length;
  const approvedAppsCount = applications.filter((a) => a.status === 'Approved').length;
  const rejectedAppsCount = applications.filter((a) => a.status === 'Rejected').length;
  const decidedTotal = approvedAppsCount + rejectedAppsCount;
  const approvalRatePct = decidedTotal > 0 ? Math.round((approvedAppsCount / decidedTotal) * 100) : 100;

  const filterTabs = [
    'ALL',
    'SUBMITTED',
    'UNDER REVIEW',
    'COMMITTEE',
    'APPROVED',
    'REJECTED',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1816]">
            Approval Pipeline Tracker
          </h1>
          <p className="text-xs text-[#736B5E] mt-1">
            Every application across the four statutory stages, with audit trail and reviewer assignment in one view.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8274]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search application ID or institution"
              className="pl-8 pr-4 py-2 text-xs bg-white border border-[#EAE6DF] rounded-lg w-64 text-[#1A1816] placeholder-[#8C8274] focus:outline-none focus:border-[#8C653B]"
            />
          </div>

          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                ['ID,Institution,Type,Submitted,Status']
                  .concat(
                    applications.map(
                      (a) => `${a.id},"${a.institution}",${a.type},${a.submittedDate},${a.status}`
                    )
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', 'aicte_pipeline_tracker.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1A1816] bg-white border border-[#EAE6DF] rounded-lg hover:bg-[#FAF8F5] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#8C653B]" />
            EXPORT CSV
          </button>

          <button
            onClick={() => setShowNewAppModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1A1816] rounded-lg hover:bg-[#2e2a26] transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            NEW APPLICATION
          </button>
        </div>
      </div>

      {/* KPI Cards Grid matching Screenshot 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Applications Hero Card */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C8274]">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Total Applications
            </span>
            <Copy className="w-3.5 h-3.5 cursor-pointer hover:text-[#1A1816]" />
          </div>
          <div className="my-2">
            <span className="font-serif font-bold text-4xl text-[#1A1816]">
              {totalAppsCount}
            </span>
          </div>
          <div className="text-[11px] text-[#8C8274]">
            <span className="font-semibold text-[#8C653B]">
              {totalAppsCount > 0 ? `${totalAppsCount} active in current cycle` : 'No filings yet'}
            </span> &bull; Statutory 2026-27
          </div>
        </div>

        {/* Pending, Approved, Rejected */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C8274]">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Pending
            </span>
            <Clock className="w-4 h-4 text-[#8C8274]" />
          </div>
          <div className="my-2">
            <span className="font-serif font-bold text-3xl text-[#1A1816]">
              {pendingAppsCount}
            </span>
          </div>
          <div className="text-[11px] font-bold text-[#D97706]">
            {pendingAppsCount} in active review
          </div>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C8274]">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Approved
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="my-2">
            <span className="font-serif font-bold text-3xl text-[#1A1816]">
              {approvedAppsCount}
            </span>
          </div>
          <div className="text-[11px] font-medium text-[#059669]">
            {approvalRatePct}% approval rate
          </div>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C8274]">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Rejected
            </span>
            <XCircle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="my-2">
            <span className="font-serif font-bold text-3xl text-[#1A1816]">
              {rejectedAppsCount}
            </span>
          </div>
          <div className="text-[11px] text-[#8C8274]">
            {rejectedAppsCount} speaking orders issued
          </div>
        </div>
      </div>

      {/* Rolling 30 Days Rate Banner */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl px-6 py-3 card-shadow flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 mr-6">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#736B5E] shrink-0">
            Approval Rate &bull; Current Statutory Cycle
          </span>
          <div className="w-full bg-[#F2ECE2] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#8C653B] h-full rounded-full transition-all duration-500"
              style={{ width: `${approvalRatePct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs">
          <span className="text-[#8C8274]">statutory benchmark 85%</span>
          <span className="font-bold text-[#1A1816]">{approvalRatePct}%</span>
        </div>
      </div>

      {/* Pipeline Stages Component */}
      <PipelineStages applications={applications} />

      {/* Main Grid: Applications Table (Left) & Recent Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width): Applications Table */}
        <div className="lg:col-span-2 bg-white border border-[#EAE6DF] rounded-xl card-shadow overflow-hidden flex flex-col justify-between">
          <div>
            {/* Table Header & Filter Tabs */}
            <div className="p-5 border-b border-[#EAE6DF] space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1A1816]">
                    Applications
                  </h3>
                  <span className="text-xs text-[#8C8274]">
                    Showing {filteredApps.length} of {totalAppsCount} &bull; Real-time Database Records
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab as any)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      statusFilter === tab
                        ? 'bg-[#1A1816] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#736B5E] hover:bg-[#F2ECE2] hover:text-[#1A1816]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Rows */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#8C8274] uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Application ID</th>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {filteredApps.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-[#FAF8F5] transition-colors group cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-[#1A1816]">
                        {app.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#1A1816]">
                        {app.institution}
                      </td>
                      <td className="py-3.5 px-4 text-[#736B5E]">{app.type}</td>
                      <td className="py-3.5 px-4 text-[#8C8274] font-mono">
                        {app.submittedDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="text-[11px] font-semibold text-[#8C653B] hover:text-[#1A1816] transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredApps.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#8C8274]">
                        No applications matched your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-[#EAE6DF] bg-[#FAF8F5] flex items-center justify-between text-xs text-[#736B5E]">
            <span>Page 1 of 156 &bull; 8 per page</span>
            <div className="flex items-center gap-1">
              <button className="px-2.5 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5] disabled:opacity-50">
                Prev
              </button>
              <button className="px-2.5 py-1 rounded bg-[#1A1816] text-white font-bold">
                1
              </button>
              <button className="px-2.5 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
                2
              </button>
              <button className="px-2.5 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
                3
              </button>
              <button className="px-2.5 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width): Recent Activity */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF]">
              <h3 className="font-serif font-bold text-base text-[#1A1816]">
                Recent Activity
              </h3>
              <MoreHorizontal className="w-4 h-4 text-[#8C8274] cursor-pointer" />
            </div>

            <div className="py-3 space-y-4">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8C653B]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#1A1816] leading-tight font-medium">
                      {log.details}
                    </p>
                    <span className="text-[10px] text-[#8C8274] font-mono mt-1 block">
                      {log.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/reports"
            className="pt-3 border-t border-[#EAE6DF] text-xs font-bold uppercase tracking-wider text-[#8C653B] hover:text-[#1A1816] flex items-center justify-center gap-1.5 transition-colors"
          >
            VIEW FULL AUDIT LOG <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Interactive Application Scrutiny & Sign-Off Modal */}
      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}

      {/* New Application Draft Modal - Persists to PostgreSQL */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C653B]">
                  Statutory Submission Engine
                </span>
                <h2 className="text-xl font-serif font-bold text-[#1A1816]">
                  Draft New AICTE Application
                </h2>
              </div>
              <button
                onClick={() => setShowNewAppModal(false)}
                className="p-1 rounded-lg text-[#8C8274] hover:text-[#1A1816] hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewApp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1816] mb-1">
                  Statutory Application Category
                </label>
                <select
                  value={newAppType}
                  onChange={(e: any) => setNewAppType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#EAE6DF] bg-[#FAF8F5] text-[#1A1816] focus:outline-none focus:border-[#8C653B]"
                >
                  <option value="NEW_INSTITUTION_LOA">New Technical Institution (LoA Grant)</option>
                  <option value="ROUTINE_EOA">Extension of Approval (Routine Annual EoA)</option>
                  <option value="EOA_SUBSTANTIVE_CHANGE">EoA with Substantive Change (Intake / New Course)</option>
                </select>
                <span className="text-[10px] text-[#736B5E] mt-1 block">
                  Regulated under AICTE Approval Process Handbook (APH 2024-27).
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1816] mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={newAppYear}
                    onChange={(e) => setNewAppYear(e.target.value)}
                    required
                    placeholder="2026-27"
                    className="w-full text-xs p-2.5 rounded-lg border border-[#EAE6DF] bg-[#FAF8F5] text-[#1A1816] focus:outline-none focus:border-[#8C653B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1816] mb-1">
                    Regional Jurisdiction
                  </label>
                  <select
                    value={newAppRegion}
                    onChange={(e) => setNewAppRegion(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#EAE6DF] bg-[#FAF8F5] text-[#1A1816] focus:outline-none focus:border-[#8C653B]"
                  >
                    <option value="NORTH">Northern Region (Kanpur/Delhi)</option>
                    <option value="WEST">Western Region (Mumbai)</option>
                    <option value="SOUTH">Southern Region (Chennai)</option>
                    <option value="EAST">Eastern Region (Kolkata)</option>
                    <option value="CENTRAL">Central Region (Bhopal)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-start gap-2.5 text-xs text-[#5C5449]">
                <Database className="w-4 h-4 text-[#8C653B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-[#1A1816]">Direct Database Persistence:</span>
                  This will generate an official application number, set state to DRAFT, create initial stage audit history, and store in PostgreSQL.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewAppModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5C5449] hover:bg-[#FAF8F5] rounded-lg border border-[#EAE6DF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingApp}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1A1816] hover:bg-[#2e2a26] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isCreatingApp ? 'Saving to Database...' : 'Save Application Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
