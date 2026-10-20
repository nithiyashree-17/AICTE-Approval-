'use client';

import React from 'react';
import { ScrollText, ShieldCheck } from 'lucide-react';
import AuditReportsPage from '../../reports/page';

export default function AuditorDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-[#EAE6DF] pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5EDE4] text-[#8C653B] mb-2 border border-[#EAE6DF]">
          <ScrollText className="w-3.5 h-3.5" />
          <span>Independent Statutory Auditor (Read-Only)</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1A1816]">
          Audit Trail &amp; Regulatory Compliance Inspection
        </h1>
        <p className="text-xs text-[#736B5E] mt-1">
          Complete, tamper-evident statutory audit provenance for every state transition, deficiency notice, EVC visit, and institutional submission. All write actions are strictly restricted.
        </p>
      </div>

      <AuditReportsPage />
    </div>
  );
}
