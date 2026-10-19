'use client';

import React, { useState } from 'react';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  Shield,
  FileCheck,
} from 'lucide-react';
import { useDemo } from '@/features/context/DemoContext';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ApplicationDetailsModal } from '@/components/workflow/ApplicationDetailsModal';
import { Application } from '@/lib/types';

export default function ScrutinyDeskPage() {
  const { applications, resolveDeficiency } = useDemo();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const underReviewApps = applications.filter(
    (a) => a.status === 'Under Review' || a.status === 'Submitted'
  );

  const allDeficiencies = applications.flatMap((a) =>
    a.deficiencies.map((d) => ({ ...d, appId: a.id, institution: a.institution }))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold tracking-widest uppercase text-[#8C653B]">
          SCRUTINY CELL &bull; REGIONAL OPERATIONS
        </span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1816] mt-1">
          Scrutiny &amp; Deficiency Desk
        </h1>
        <p className="text-xs text-[#736B5E] mt-1">
          Review application dossiers against AICTE Approval Process Handbook (APH) norms, record deficiency notices, and verify institutional resubmissions.
        </p>
      </div>

      {/* Scrutiny KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8274]">
            Queued for Scrutiny
          </span>
          <p className="font-serif font-bold text-3xl text-[#1A1816] mt-2">
            {underReviewApps.length}
          </p>
          <span className="text-xs text-[#8C653B] font-semibold mt-1 block">
            Average turnaround: 3.2 days
          </span>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8274]">
            Active Deficiencies
          </span>
          <p className="font-serif font-bold text-3xl text-[#DC2626] mt-2">
            {allDeficiencies.filter((d) => d.status !== 'Resolved').length}
          </p>
          <span className="text-xs text-[#DC2626] font-semibold mt-1 block">
            Across {applications.length} active filings
          </span>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8274]">
            Rectified Deficiencies
          </span>
          <p className="font-serif font-bold text-3xl text-[#059669] mt-2">
            {allDeficiencies.filter((d) => d.status === 'Resolved').length}
          </p>
          <span className="text-xs text-[#059669] font-semibold mt-1 block">
            Verified compliant with APH
          </span>
        </div>
      </div>

      {/* Main Scrutiny Queue Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl card-shadow overflow-hidden">
        <div className="p-5 border-b border-[#EAE6DF] flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#1A1816]">
              Scrutiny Casework Queue
            </h3>
            <span className="text-xs text-[#8C8274]">
              Mandatory dual-scrutiny protocol active
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#8C8274] uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Assigned Officer</th>
                <th className="py-3 px-4">Deficiencies</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF]">
              {underReviewApps.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <td className="py-4 px-4 font-mono font-bold text-[#1A1816]">
                    {app.id}
                  </td>
                  <td className="py-4 px-4 font-medium text-[#1A1816]">
                    <div>{app.institution}</div>
                    <div className="text-[10px] text-[#8C8274]">{app.region}</div>
                  </td>
                  <td className="py-4 px-4 text-[#736B5E]">
                    {app.reviewer || 'Unassigned'}
                  </td>
                  <td className="py-4 px-4">
                    {app.deficiencies.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[#DC2626] font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {app.deficiencies.length} Notice(s)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#059669]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Clear
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApp(app);
                      }}
                      className="px-3 py-1 bg-[#1A1816] text-white rounded text-xs font-bold hover:bg-[#333] transition-colors"
                    >
                      Conduct Scrutiny
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deficiency Log Matrix */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow space-y-4">
        <h3 className="font-serif font-bold text-base text-[#1A1816]">
          All Active Deficiency Dispatches
        </h3>

        <div className="space-y-3">
          {allDeficiencies.map((def) => (
            <div
              key={def.id}
              className="p-4 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#8C653B]">{def.id}</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#EAE6DF] text-[10px] font-semibold text-[#1A1816]">
                    {def.category}
                  </span>
                  <span className="font-semibold text-[#1A1816]">
                    {def.institution} ({def.appId})
                  </span>
                </div>
                <p className="text-[#5C5449]">{def.observation}</p>
                <p className="text-[#8C8274] text-[11px]">
                  <strong>Deadline:</strong> {def.deadline} &bull; <strong>Action:</strong> {def.actionRequired}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={def.status} />
                {def.status !== 'Resolved' && (
                  <button
                    onClick={() =>
                      resolveDeficiency(
                        def.appId,
                        def.id,
                        'Evidentiary rectification confirmed by Scrutiny Desk.'
                      )
                    }
                    className="px-3 py-1 bg-[#065F46] text-white rounded text-xs font-semibold hover:bg-[#044e39] transition-colors"
                  >
                    Verify &amp; Clear
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
