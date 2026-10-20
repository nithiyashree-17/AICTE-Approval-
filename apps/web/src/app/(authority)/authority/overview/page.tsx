'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, FileCheck2, ArrowRight } from 'lucide-react';
import ApplicationsPage from '@/app/(dashboard)/applications/page';

export default function CompetentAuthorityDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-[#EAE6DF] pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5EDE4] text-[#8C653B] mb-2 border border-[#EAE6DF]">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Competent Authority Decision Console</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1A1816]">
          Final Statutory Approval Decisions
        </h1>
        <p className="text-xs text-[#736B5E] mt-1">
          Cases in final DECISION_PENDING status awaiting formal human statutory determination. All decisions require mandatory reason recording and step-up authentication.
        </p>
      </div>

      <ApplicationsPage />
    </div>
  );
}
