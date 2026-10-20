'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Calendar, ArrowRight } from 'lucide-react';
import EvcTrackingPage from '@/app/(dashboard)/evc/page';

export default function EvcCoordinatorDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EAE6DF] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5EDE4] text-[#8C653B] mb-2 border border-[#EAE6DF]">
            <Compass className="w-3.5 h-3.5" />
            <span>EVC Regional Coordinator Desk</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1816]">
            Expert Visit Committee Operations
          </h1>
          <p className="text-xs text-[#736B5E] mt-1">
            Coordinate physical and virtual inspection schedules, manage expert member assignments, and monitor report submissions.
          </p>
        </div>

        <Link
          href="/evc"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#1A1816] hover:bg-[#8C653B] transition-colors shadow-2xs"
        >
          <span>EVC Calendar</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <EvcTrackingPage />
    </div>
  );
}
