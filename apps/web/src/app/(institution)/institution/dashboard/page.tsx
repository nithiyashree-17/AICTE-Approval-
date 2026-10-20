'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileCheck2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FolderClosed,
  Plus,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/features/context/AuthContext';
import { useDemo } from '@/features/context/DemoContext';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const { applications, complianceList, alerts, isLiveLoading } = useDemo();

  const institutionName = user?.institutionName || user?.fullName || 'Registered Institution';

  // My Applications
  const myApplications = useMemo(() => {
    return applications.filter((app) => {
      if (!user?.institutionId && !user?.institutionName) return true;
      return (
        app.institution.toLowerCase().includes((user.institutionName || '').toLowerCase()) ||
        app.institution.toLowerCase().includes((user.fullName || '').toLowerCase())
      );
    });
  }, [applications, user]);

  // Active Deficiencies across my applications
  const activeDeficiencies = useMemo(() => {
    return myApplications.flatMap((app) =>
      app.deficiencies.map((d) => ({
        ...d,
        appId: app.id,
        appName: app.type,
      }))
    );
  }, [myApplications]);

  const openDeficiencies = activeDeficiencies.filter((d) => d.status === 'Open');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EAE6DF] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5EDE4] text-[#8C653B] mb-2 border border-[#EAE6DF]">
            <Building2 className="w-3.5 h-3.5" />
            <span>Institution Portal: {institutionName}</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1816]">
            Institutional Approval &amp; Compliance Hub
          </h1>
          <p className="text-xs text-[#736B5E] mt-1 max-w-2xl">
            Track real-time statutory review progress, respond to technical desk deficiencies, upload compliance evidence, and monitor regulatory deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#8C653B] hover:bg-[#735330] transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Approval Application</span>
          </Link>
        </div>
      </div>

      {/* Next Required Action Banner */}
      <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1A1816]">Next Required Action</h2>
            <p className="text-xs text-[#5C5449] mt-0.5">
              {openDeficiencies.length > 0
                ? `${openDeficiencies.length} technical deficiency requires response within the statutory timeline.`
                : 'All statutory submissions are up-to-date. Keep track of upcoming compliance audit deadlines.'}
            </p>
          </div>
        </div>

        {openDeficiencies.length > 0 ? (
          <Link
            href="/scrutiny"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#1A1816] hover:bg-[#8C653B] transition-colors shrink-0"
          >
            <span>Resolve Deficiencies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            href="/applications"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#1A1816] bg-[#FAF8F5] hover:bg-[#F2ECE2] border border-[#EAE6DF] transition-colors shrink-0"
          >
            <span>View All Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Applications */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736B5E]">My Applications</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#8C653B]">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1A1816]">
              {myApplications.length}
            </span>
            <span className="text-[11px] text-[#8C8274]">Submissions</span>
          </div>
          <div className="text-[11px] text-[#736B5E] pt-2 border-t border-[#EAE6DF]/70 flex items-center justify-between">
            <span>Academic Year 2026-27</span>
            <Link href="/applications" className="text-[#8C653B] font-semibold hover:underline">
              View &rarr;
            </Link>
          </div>
        </div>

        {/* KPI 2: Open Deficiencies */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736B5E]">Open Deficiencies</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-rose-700">
              {openDeficiencies.length}
            </span>
            <span className="text-[11px] text-rose-600 font-medium">Pending Response</span>
          </div>
          <div className="text-[11px] text-[#736B5E] pt-2 border-t border-[#EAE6DF]/70 flex items-center justify-between">
            <span>Requires Evidence</span>
            <Link href="/scrutiny" className="text-[#8C653B] font-semibold hover:underline">
              Respond &rarr;
            </Link>
          </div>
        </div>

        {/* KPI 3: Compliance Obligations */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736B5E]">Compliance Due</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1A1816]">
              {complianceList.length}
            </span>
            <span className="text-[11px] text-emerald-800 font-medium">Statutory Mandates</span>
          </div>
          <div className="text-[11px] text-[#736B5E] pt-2 border-t border-[#EAE6DF]/70 flex items-center justify-between">
            <span>Mandatory Disclosures</span>
            <Link href="/compliance" className="text-[#8C653B] font-semibold hover:underline">
              Check &rarr;
            </Link>
          </div>
        </div>

        {/* KPI 4: Documents Repository */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#736B5E]">Document Vault</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <FolderClosed className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1A1816]">
              Verified
            </span>
          </div>
          <div className="text-[11px] text-[#736B5E] pt-2 border-t border-[#EAE6DF]/70 flex items-center justify-between">
            <span>Digital Vault Active</span>
            <Link href="/documents" className="text-[#8C653B] font-semibold hover:underline">
              Upload &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#EAE6DF] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1A1816]">
              My Active Applications
            </h2>
            <p className="text-xs text-[#736B5E]">
              Current status across intake, technical scrutiny, and committee stages
            </p>
          </div>
          <Link
            href="/applications"
            className="text-xs font-semibold text-[#8C653B] hover:text-[#1A1816]"
          >
            View Full Pipeline &rarr;
          </Link>
        </div>

        {myApplications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-[#8C653B] mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-[#1A1816]">No Applications Submitted Yet</h3>
            <p className="text-xs text-[#736B5E] max-w-sm mx-auto">
              You haven't initiated an approval process yet. Start by creating a New Institution LOA or Extension of Approval application.
            </p>
            <div className="pt-2">
              <Link
                href="/applications"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#8C653B] hover:bg-[#735330] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Application</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#736B5E] font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Application ID</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Submission Date</th>
                  <th className="px-5 py-3.5">Current Stage</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {myApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#1A1816]">
                      {app.id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#1A1816]">
                      {app.type}
                    </td>
                    <td className="px-5 py-3.5 text-[#5C5449]">
                      {app.submittedDate}
                    </td>
                    <td className="px-5 py-3.5 text-[#5C5449]">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F5EDE4] text-[#8C653B]">
                        {app.currentStage}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/applications?id=${app.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C653B] hover:text-[#1A1816]"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
