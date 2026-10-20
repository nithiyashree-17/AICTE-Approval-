'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, Building2, LogIn } from 'lucide-react';

export default function RegisterSuccessPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your official email address';

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white border border-[#EAE6DF] rounded-2xl p-8 shadow-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif font-bold text-2xl text-[#1A1816]">
            Account Created Successfully
          </h1>
          <p className="text-xs text-[#5C5449] leading-relaxed">
            Your educational institution profile is registered and your login account is active.
          </p>
        </div>

        <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] text-left space-y-2">
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-[#8C653B] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-[#1A1816]">Registered Login Email</span>
              <p className="text-[#5C5449] font-mono mt-0.5 break-all font-semibold">
                {email}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-[#736B5E] pt-1">
            No email verification is required. You can immediately log in to access your institution dashboard and begin submitting statutory approval applications.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#1A1816] hover:bg-[#8C653B] transition-colors shadow-xs"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in to Portal Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center py-2 px-4 text-xs font-semibold text-[#736B5E] hover:text-[#1A1816] transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
