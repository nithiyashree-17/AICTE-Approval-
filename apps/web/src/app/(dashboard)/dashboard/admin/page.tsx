'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  Settings,
  Database,
  ArrowRight,
  Server,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import UsersPage from '../../users/page';

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EAE6DF] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5EDE4] text-[#8C653B] mb-2 border border-[#EAE6DF]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>System Administrator Console</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1816]">
            System Administration &amp; Governance
          </h1>
          <p className="text-xs text-[#736B5E] mt-1">
            Manage users, grant regional scopes, configure regulatory workflow rulesets, and monitor BullMQ processing queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Database &amp; Redis Queues Operational</span>
          </div>
        </div>
      </div>

      <UsersPage />
    </div>
  );
}
