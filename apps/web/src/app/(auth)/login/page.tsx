'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, ArrowRight, Lock } from 'lucide-react';
import { useDemo } from '@/features/context/DemoContext';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useDemo();

  const handleQuickLogin = (role: {
    name: string;
    designation: string;
    role: 'OFFICER' | 'INSTITUTION' | 'COMMITTEE' | 'REGIONAL_ADMIN';
    avatar: string;
    department: string;
  }) => {
    setCurrentUser(role);
    router.push('/applications');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-white border border-[#EAE6DF] rounded-2xl p-8 card-shadow space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-3">
          <img
            src="/logo.png"
            alt="AICTE Approve - FlowGuard Platform"
            className="h-16 w-auto max-w-[260px] object-contain rounded-xl shadow-sm"
          />
          <div>
            <h1 className="font-serif font-bold text-xl text-[#1A1816]">
              FlowGuard Platform
            </h1>
            <p className="text-xs text-[#736B5E] mt-0.5">
              Integrated Approval Workflow Automation &amp; Compliance Monitoring (PS ID: 26262)
            </p>
          </div>
        </div>

        {/* Local Demo Account Switcher */}
        <div className="space-y-3 pt-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#8C8274] block">
            Select Demonstration Profile
          </span>

          <button
            onClick={() =>
              handleQuickLogin({
                name: 'Dr. Ananya Sharma',
                designation: 'Senior Scrutiny Officer',
                role: 'OFFICER',
                avatar:
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160',
                department: 'Approval Bureau - Western & Northern',
              })
            }
            className="w-full p-3.5 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] hover:bg-[#F2ECE2] text-left flex items-center justify-between transition-colors group"
          >
            <div>
              <div className="font-bold text-xs text-[#1A1816]">
                Dr. Ananya Sharma
              </div>
              <div className="text-[11px] text-[#736B5E]">
                Scrutiny Officer &bull; Approval Bureau
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8C8274] group-hover:text-[#1A1816] transition-colors" />
          </button>

          <button
            onClick={() =>
              handleQuickLogin({
                name: 'Prof. Ramesh Kulkarni',
                designation: 'Institutional Registrar',
                role: 'INSTITUTION',
                avatar:
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=160',
                department: 'Sunrise Institute of Technology',
              })
            }
            className="w-full p-3.5 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] hover:bg-[#F2ECE2] text-left flex items-center justify-between transition-colors group"
          >
            <div>
              <div className="font-bold text-xs text-[#1A1816]">
                Prof. Ramesh Kulkarni
              </div>
              <div className="text-[11px] text-[#736B5E]">
                Institutional Representative &bull; Sunrise Inst.
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8C8274] group-hover:text-[#1A1816] transition-colors" />
          </button>

          <button
            onClick={() =>
              handleQuickLogin({
                name: 'Dr. K. G. Radhakrishnan',
                designation: 'EVC Committee Chair',
                role: 'COMMITTEE',
                avatar:
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=160',
                department: 'Standing Hearing Committee - Southern',
              })
            }
            className="w-full p-3.5 rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] hover:bg-[#F2ECE2] text-left flex items-center justify-between transition-colors group"
          >
            <div>
              <div className="font-bold text-xs text-[#1A1816]">
                Dr. K. G. Radhakrishnan
              </div>
              <div className="text-[11px] text-[#736B5E]">
                Committee Chair &bull; Statutory Panel
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8C8274] group-hover:text-[#1A1816] transition-colors" />
          </button>
        </div>

        <div className="pt-2 text-center">
          <Link
            href="/applications"
            className="text-xs font-semibold text-[#8C653B] hover:text-[#1A1816]"
          >
            Continue as Guest Reviewer &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
