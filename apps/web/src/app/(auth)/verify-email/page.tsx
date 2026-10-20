'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, MailCheck } from 'lucide-react';
import { api } from '@/lib/api';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  const handleVerify = useCallback(async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) return;
    setIsVerifying(true);
    setStatusMessage(null);
    setIsSuccess(null);

    try {
      const response = await api.auth.verifyEmail({
        token: tokenToVerify.trim(),
        email: emailFromUrl || undefined,
      });

      setIsSuccess(true);
      setStatusMessage(response.message);
      setUserStatus(response.status || 'ACTIVE');
    } catch (err: any) {
      setIsSuccess(false);
      setStatusMessage(
        err?.message?.replace(/API Error \[\d+\]: /, '') ||
          'Verification token is invalid or has expired. Please request a new verification link.'
      );
    } finally {
      setIsVerifying(false);
    }
  }, [emailFromUrl]);

  // Auto-verify if token is provided in the URL
  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl, handleVerify]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white border border-[#EAE6DF] rounded-2xl p-8 shadow-md text-center space-y-6">
        <Link href="/" aria-label="AICTE FlowGuard home" className="inline-block group">
          <img
            src="/logo.png"
            alt="AICTE FlowGuard"
            className="h-16 w-16 object-contain mx-auto transition-transform group-hover:scale-105"
          />
        </Link>

        <div className="space-y-2">
          <h1 className="font-serif font-bold text-2xl text-[#1A1816]">
            Official Email Verification
          </h1>
          <p className="text-xs text-[#736B5E]">
            Confirm your institutional email to activate your AICTE FlowGuard portal account
          </p>
        </div>

        {isVerifying ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#8C653B] animate-spin" />
            <p className="text-xs font-semibold text-[#5C5449]">
              Verifying security token against statutory registry...
            </p>
          </div>
        ) : isSuccess === true ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed text-left">
              <span className="font-bold block mb-1">Email Successfully Verified</span>
              {statusMessage}
            </div>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1A1816] hover:bg-[#8C653B] transition-colors shadow-xs"
            >
              <span>Continue to Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : isSuccess === false ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed text-left">
              <span className="font-bold block mb-1">Verification Failed</span>
              {statusMessage}
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#1A1816] hover:bg-[#8C653B] transition-colors"
              >
                Return to Login
              </Link>
              <Link
                href="/register"
                className="block text-xs font-medium text-[#8C653B] hover:text-[#1A1816]"
              >
                Register a new institutional account &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className="space-y-1">
              <label
                htmlFor="token-input"
                className="block text-xs font-semibold text-[#1A1816]"
              >
                Security Verification Token
              </label>
              <input
                id="token-input"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter or paste token from your email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-xs bg-white text-[#1A1816] focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50"
              />
            </div>

            <button
              onClick={() => handleVerify(tokenInput)}
              disabled={!tokenInput.trim() || isVerifying}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#8C653B] hover:bg-[#735330] disabled:opacity-50 transition-colors shadow-xs"
            >
              <MailCheck className="w-4 h-4" />
              <span>Verify Official Email</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
