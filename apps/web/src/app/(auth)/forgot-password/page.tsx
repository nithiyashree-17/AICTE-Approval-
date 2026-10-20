'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.auth.forgotPassword({ email: values.email });
      setIsSubmitted(true);
      if (response.resetUrl) {
        setDevResetUrl(response.resetUrl);
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message?.replace(/API Error \[\d+\]: /, '') ||
          'Failed to dispatch password reset request. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            Password Recovery
          </h1>
          <p className="text-xs text-[#736B5E]">
            Enter your registered official email address to receive secure reset instructions
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {isSubmitted ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed text-left">
              <span className="font-bold block mb-1">Request Acknowledged</span>
              If an institutional account matching that email address is active in our statutory directory, password reset instructions have been dispatched.
            </div>

            {devResetUrl && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-1">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-700">
                  Dev Test Link (Mock Email Adapter)
                </span>
                <Link
                  href={devResetUrl}
                  className="font-mono text-[11px] text-[#8C653B] underline break-all"
                >
                  {devResetUrl}
                </Link>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1A1816] hover:bg-[#8C653B] transition-colors"
              >
                <span>Return to Portal Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
            <div className="space-y-1">
              <label
                htmlFor="email-input"
                className="block text-xs font-semibold text-[#1A1816]"
              >
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8274]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  placeholder="name@institution.ac.in"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 ${
                    errors.email ? 'border-rose-400' : 'border-[#EAE6DF]'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#8C653B] hover:bg-[#735330] focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 disabled:opacity-60 transition-all shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Request...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs font-medium text-[#736B5E] hover:text-[#1A1816]"
              >
                &larr; Remember your password? Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
