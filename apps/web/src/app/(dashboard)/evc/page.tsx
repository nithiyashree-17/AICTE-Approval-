'use client';

import React, { useState } from 'react';
import {
  Compass,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Building,
  FileCheck2,
} from 'lucide-react';
import { useDemo } from '@/features/context/DemoContext';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ApplicationDetailsModal } from '@/components/workflow/ApplicationDetailsModal';
import { Application } from '@/lib/types';

export default function EvcTrackingPage() {
  const { applications, scheduleEvc } = useDemo();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const evcApps = applications.filter(
    (a) => a.status === 'Committee' || a.evcScheduled
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold tracking-widest uppercase text-[#8C653B]">
          EXPERT VISIT COMMITTEE &bull; ON-SITE AUDIT
        </span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1816] mt-1">
          EVC Committee &amp; Physical Verification
        </h1>
        <p className="text-xs text-[#736B5E] mt-1">
          Manage Expert Visit Committee (EVC) panel rosters, scheduling, geo-tagged on-site verifications, and compliance checklists.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8274]">
            Scheduled Inspections
          </span>
          <p className="font-serif font-bold text-3xl text-[#1A1816] mt-2">
            {evcApps.filter((a) => a.evcScheduled).length}
          </p>
          <span className="text-xs text-[#8C653B] font-semibold mt-1 block">
            Upcoming in next 14 days
          </span>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8274]">
            Panel Pool Available
          </span>
          <p className="font-serif font-bold text-3xl text-[#1A1816] mt-2">
            142
          </p>
          <span className="text-xs text-[#059669] font-semibold mt-1 block">
            Empanelled AICTE Senior Academicians
          </span>
        </div>

        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8274]">
            Pending Committee Hearings
          </span>
          <p className="font-serif font-bold text-3xl text-[#8C653B] mt-2">
            64
          </p>
          <span className="text-xs text-[#736B5E] font-semibold mt-1 block">
            Standing Hearing Committees (SHC)
          </span>
        </div>
      </div>

      {/* EVC Schedule Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl card-shadow overflow-hidden">
        <div className="p-5 border-b border-[#EAE6DF] flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-[#1A1816]">
            Active EVC Inspections &amp; Assignments
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#8C8274] uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Assigned Expert Panel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF]">
              {evcApps.map((app) => (
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
                  <td className="py-4 px-4 font-mono text-[#8C653B] font-bold">
                    {app.evcScheduled || 'Awaiting Schedule'}
                  </td>
                  <td className="py-4 px-4 text-[#5C5449]">
                    {app.evcCommittee && app.evcCommittee.length > 0 ? (
                      <div>{app.evcCommittee.join(', ')}</div>
                    ) : (
                      <span className="text-[#8C8274] italic">
                        Panel empanelment in progress
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
                      className="px-3 py-1 bg-[#8C653B] text-white rounded text-xs font-bold hover:bg-[#73522E] transition-colors"
                    >
                      Manage EVC
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
