'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { useAuth } from '@/features/context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, roleHome } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Top Navigation */}
      <TopNavbar />

      {/* Prototype Notice Banner */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs font-semibold text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Prototype – synthetic data only. This is an engineering prototype and not an official AICTE system.
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col justify-center">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F5EDE4] text-[#8C653B] border border-[#EAE6DF]">
              <ShieldCheck className="w-4 h-4 text-[#8C653B]" />
              <span>Statutory Compliance &amp; Approval Automation</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A1816] tracking-tight leading-[1.15]">
              Unified Regulatory Architecture for AICTE Approvals
            </h1>

            <p className="text-base sm:text-lg text-[#5C5449] max-w-2xl leading-relaxed">
              Automated end-to-end statutory governance for technical education institutions across India. Seamlessly manage application intakes, technical scrutiny, expert visit committees, and compliance obligations.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {isAuthenticated ? (
                <Link
                  href={roleHome}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-[#1A1816] hover:bg-[#8C653B] transition-all shadow-md group"
                >
                  <span>Go to Role Dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-[#1A1816] hover:bg-[#8C653B] transition-all shadow-md group"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Portal Login</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-[#1A1816] bg-white hover:bg-[#F5EDE4] border border-[#EAE6DF] transition-all shadow-2xs"
                  >
                    <UserPlus className="w-4 h-4 text-[#8C653B]" />
                    <span>Register Institution</span>
                  </Link>
                </>
              )}
            </div>

            {/* Feature Highlights */}
            <div className="grid sm:grid-cols-3 gap-4 pt-6 border-t border-[#EAE6DF]/80">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#8C653B] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-bold text-[#1A1816]">Scoped RBAC</h2>
                  <p className="text-[11px] text-[#736B5E]">Strict regional &amp; institution boundary controls</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#8C653B] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-bold text-[#1A1816]">Multi-Stage Scrutiny</h2>
                  <p className="text-[11px] text-[#736B5E]">Intake, technical desk, EVC &amp; committee reviews</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#8C653B] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-bold text-[#1A1816]">Immutable Audit</h2>
                  <p className="text-[11px] text-[#736B5E]">Complete statutory provenance on all actions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual / Portal Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#EAE6DF] rounded-2xl p-8 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#EAE6DF]">
                <div>
                  <h2 className="text-sm font-bold text-[#1A1816]">Institutional Access</h2>
                  <p className="text-xs text-[#736B5E]">Self-registration &amp; approval tracking</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#F5EDE4] flex items-center justify-center text-[#8C653B]">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-4 text-xs text-[#5C5449]">
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]/70 space-y-1">
                  <div className="font-semibold text-[#1A1816]">New Institutions (LOA)</div>
                  <p className="text-[#736B5E]">
                    Submit self-registration with verified credentials to initiate Letter of Approval applications.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]/70 space-y-1">
                  <div className="font-semibold text-[#1A1816]">Existing Institutions (EOA)</div>
                  <p className="text-[#736B5E]">
                    Manage annual Extension of Approval submissions, resolve technical deficiencies, and respond to compliance audits.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/register"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs text-white bg-[#8C653B] hover:bg-[#735330] transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Start Institution Registration</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAE6DF] px-8 py-5 text-center text-xs text-[#8C8274] bg-[#FAF8F5]">
        AICTE FlowGuard &bull; Regulatory Approval &amp; Statutory Compliance System
      </footer>
    </div>
  );
}
