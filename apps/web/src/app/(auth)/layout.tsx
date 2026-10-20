import React from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <TopNavbar />
      <main className="flex-1 flex flex-col justify-center">
        {children}
      </main>
    </div>
  );
}
