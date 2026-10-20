'use client';

import React from 'react';
import EvcTrackingPage from '@/app/(dashboard)/evc/page';

export default function EvcMemberDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-[#EAE6DF] pb-4">
        <h1 className="text-3xl font-serif font-bold text-[#1A1816]">
          Assigned EVC Inspections
        </h1>
        <p className="text-xs text-[#736B5E] mt-1">
          View your assigned institution visits, download verification checklists, and submit observation reports.
        </p>
      </div>

      <EvcTrackingPage />
    </div>
  );
}
