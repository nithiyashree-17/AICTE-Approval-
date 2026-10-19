'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#FAF8F5]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Page Viewport */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* System Footer matching Inspo AI reference */}
        <footer className="border-t border-[#EAE6DF] px-8 py-4 text-center text-xs text-[#8C8274]">
          AICTE Approvals Portal &bull; v4.2.1 &bull; Data synced 2026-06-20 11:04 IST &bull; Regional Desk Operations
        </footer>
      </div>
    </div>
  );
}
