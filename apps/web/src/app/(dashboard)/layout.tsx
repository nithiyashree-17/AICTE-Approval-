'use client';

import React from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Top Navigation Bar */}
      <TopNavbar />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl w-full mx-auto">
        {children}
      </main>

      {/* System Footer */}
      <footer className="border-t border-[#EAE6DF] px-8 py-5 text-center text-xs text-[#8C8274] bg-[#FAF8F5]">
        AICTE FlowGuard &bull; Regulatory Approval &amp; Statutory Compliance System
      </footer>
    </div>
  );
}
