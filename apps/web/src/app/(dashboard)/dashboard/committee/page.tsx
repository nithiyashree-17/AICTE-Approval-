'use client';

import React from 'react';
import Link from 'next/link';
import { Users2, ArrowRight } from 'lucide-react';
import ApplicationsPage from '../../applications/page';

export default function CommitteeDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-[#EAE6DF] pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5EDE4] text-[#8C653B] mb-2 border border-[#EAE6DF]">
          <Users2 className="w-3.5 h-3.5" />
          <span>Standing Hearing / Appellate Committee (SAC / SHC)</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1A1816]">
          Statutory Hearing &amp; Recommendations Panel
        </h1>
        <p className="text-xs text-[#736B5E] mt-1">
          Review institutional appeals, conduct statutory hearings, and record committee recommendations for the Competent Authority.
        </p>
      </div>

      <ApplicationsPage />
    </div>
  );
}
