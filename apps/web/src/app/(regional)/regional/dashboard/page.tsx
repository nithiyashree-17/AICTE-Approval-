'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Clock,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Filter,
  Search,
  UserCheck,
  ChevronRight,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/features/context/AuthContext';
import { useDemo } from '@/features/context/DemoContext';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function RegionalOfficerDashboard() {
  const { user } = useAuth();
  const { applications, alerts, isLiveLoading } = useDemo();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'ESCALATED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const assignedRegion = user?.assignedRegion || 'NORTH';

  // Regional Scoped Applications
  const regionalApps = useMemo(() => {
    return applications.filter((app) => {
      const matchRegion = !app.region || app.region.toUpperCase().includes(assignedRegion.toUpperCase());
      const matchSearch =
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.institution.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchSearch;
    });
  }, [applications, assignedRegion, searchQuery]);

  // KPIs
  const unassignedCount = regionalApps.filter((a) => !a.reviewer).length;
  const underReviewCount = regionalApps.filter((a) => a.status === 'Under Review' || a.status === 'Submitted').length;
  const approvedCount = regionalApps.filter((a) => a.status === 'Approved').length;
  const escalationAlerts = alerts.filter((a) => a.severity === 'Critical' || a.severity === 'High');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EAE6DF] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5EDE4] text-[#8C653B] mb-2 border border-[#EAE6DF]">
            <Building2 className="w-3.5 h-3.5" />
            <span>Regional Administrative Jurisdiction: {assignedRegion} Region</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1816]">
            Regional Officer Command Desk
          </h1>
          <p className="text-xs text-[#736B5E] mt-1 max-w-2xl">
            Monitor statutory pendency, review unassigned institutional applications, track SLA deadlines, and coordinate regional escalations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#1A1816] hover:bg-[#8C653B] transition-colors shadow-2xs"
          >
            <span>Full Regional Intake Queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Regional Queue */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736B5E]">Regional Queue</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#8C653B]">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1A1816]">
              {regionalApps.length}
            </span>
            <span className="text-[11px] text-[#8C8274]">Applications</span>
          </div>
          <div className="text-[11px] text-[#736B5E] pt-2 border-t border-[#EAE6DF]/70 flex items-center justify-between">
            <span>Stage: Intake to Decision</span>
            <Link href="/applications" className="text-[#8C653B] font-semibold hover:underline">
              View All &rarr;
            </Link>
          </div>
        </div>

        {/* KPI 2: Unassigned Applications */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736B5E]">Unassigned Work</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1A1816]">
              {unassignedCount}
            </span>
            <span className="text-[11px] text-amber-800 font-medium">Awaiting Desk Officer</span>
          </div>
          <div className="text-[11px] text-[#736B5E] pt-2 border-t border-[#EAE6DF]/70 flex items-center justify-between">
            <span>SLA: 48h Allocation Target</span>
            <Link href="/applications?filter=unassigned" className="text-[#8C653B] font-semibold hover:underline">
              Assign &rarr;
            </Link>
          </div>
        </div>

        {/* KPI 3: Under Active Scrutiny */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736B5E]">Active In-Progress</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1A1816]">
              {underReviewCount}
            </span>
            <span className="text-[11px] text-blue-800 font-medium">Under Review</span>
          </div>
          <div className="text-[11px] text-[#736B5E] pt-2 border-t border-[#EAE6DF]/70 flex items-center justify-between">
            <span>Scrutiny &amp; EVC Inspection</span>
            <Link href="/scrutiny" className="text-[#8C653B] font-semibold hover:underline">
              Desk &rarr;
            </Link>
          </div>
        </div>

        {/* KPI 4: Critical Escalations */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736B5E]">Deadlines &amp; Escalations</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-rose-700">
              {escalationAlerts.length}
            </span>
            <span className="text-[11px] text-rose-600 font-medium">Active Alerts</span>
          </div>
          <div className="text-[11px] text-[#736B5E] pt-2 border-t border-[#EAE6DF]/70 flex items-center justify-between">
            <span>SLA Approaching / Overdue</span>
            <Link href="/notifications" className="text-[#8C653B] font-semibold hover:underline">
              Review &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Regional Queue Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#EAE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#1A1816]">
              Regional Caseload Registry
            </h2>
            <p className="text-xs text-[#736B5E]">
              Jurisdiction: {assignedRegion} Region • Showing active institutional applications
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8274]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search institution..."
                className="pl-9 pr-3 py-1.5 rounded-lg border border-[#EAE6DF] text-xs bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8C653B]"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isLiveLoading ? (
          <div className="p-12 text-center text-xs text-[#736B5E]">
            Loading regional cases from PostgreSQL...
          </div>
        ) : regionalApps.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#8C653B] mx-auto" />
            <h3 className="text-sm font-bold text-[#1A1816]">No Cases in Regional Queue</h3>
            <p className="text-xs text-[#736B5E] max-w-sm mx-auto">
              All applications in the {assignedRegion} region have been processed or no pending cases exist.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#736B5E] font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Case ID</th>
                  <th className="px-5 py-3.5">Institution</th>
                  <th className="px-5 py-3.5">Approval Stream</th>
                  <th className="px-5 py-3.5">Stage</th>
                  <th className="px-5 py-3.5">Assigned Officer</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {regionalApps.map((app) => (
                  <tr key={app.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#1A1816]">
                      {app.id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#1A1816]">
                      {app.institution}
                    </td>
                    <td className="px-5 py-3.5 text-[#5C5449]">
                      {app.type}
                    </td>
                    <td className="px-5 py-3.5 text-[#5C5449]">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F5EDE4] text-[#8C653B]">
                        {app.currentStage}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#5C5449]">
                      {app.reviewer ? (
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{app.reviewer}</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/applications?id=${app.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C653B] hover:text-[#1A1816]"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
