'use client';

import React from 'react';
import {
  Settings,
  Shield,
  UserCheck,
  Building2,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { useDemo } from '@/features/context/DemoContext';

export default function UsersSettingsPage() {
  const { currentUser, setCurrentUser } = useDemo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold tracking-widest uppercase text-[#8C653B]">
          SYSTEM CONFIGURATION &bull; RBAC
        </span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1816] mt-1">
          Settings &amp; Workflow Governance
        </h1>
        <p className="text-xs text-[#736B5E] mt-1">
          Configure approval workflow rulesets, regional boundaries, role-based access control, and notification escalations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Demonstration Profile */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-6 card-shadow space-y-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-[#8C653B]" />
            <h3 className="font-serif font-bold text-base text-[#1A1816]">
              Active User Session
            </h3>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-14 h-14 rounded-full object-cover border border-[#DFD8CC]"
            />
            <div>
              <h4 className="font-serif font-bold text-base text-[#1A1816]">
                {currentUser.name}
              </h4>
              <p className="text-xs text-[#8C653B] font-semibold">
                {currentUser.designation}
              </p>
              <p className="text-[11px] text-[#736B5E] mt-0.5">
                {currentUser.department}
              </p>
            </div>
          </div>

          <div className="text-xs text-[#736B5E] space-y-2">
            <p>
              <strong>Security Protocol:</strong> Dual-factor cryptographic token authentication enabled per Ministry of Education guidelines.
            </p>
            <p>
              <strong>Scope:</strong> Western &amp; Northern Region approvals, deficiency issuing, committee hearing convocation, and compliance audit oversight.
            </p>
          </div>
        </div>

        {/* Regulatory Rule Provinence */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-6 card-shadow space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#8C653B]" />
            <h3 className="font-serif font-bold text-base text-[#1A1816]">
              Approval Process Handbook (APH)
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8C8274]">Active Handbook Ruleset:</span>
              <span className="font-mono font-bold text-[#1A1816]">APH 2024-27 v4.2.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C8274]">Deficiency Cure Period:</span>
              <span className="font-mono font-bold text-[#1A1816]">14 Days (Statutory)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C8274]">Outbox Reconciliation:</span>
              <span className="font-mono font-bold text-[#059669]">Syncing every 15m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C8274]">Audit Retention Policy:</span>
              <span className="font-mono font-bold text-[#1A1816]">7 Years Immutable</span>
            </div>
          </div>

          <p className="text-[11px] text-[#8C8274]">
            Statutory criteria and tables are managed centrally. Any changes trigger full outbox re-evaluation across all open filings.
          </p>
        </div>
      </div>
    </div>
  );
}
