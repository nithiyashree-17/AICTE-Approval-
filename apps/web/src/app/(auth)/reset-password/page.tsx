'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

const passwordPolicyRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset security token is required'),
    newPassword: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(
        passwordPolicyRegex,
        'Password must contain mixed case letters, at least one number, and one symbol'
      ),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const enteredPassword = watch('newPassword', '');
  const hasMinLength = enteredPassword.length >= 12;
  const hasMixedCase = /[a-z]/.test(enteredPassword) && /[A-Z]/.test(enteredPassword);
  const hasNumber = /\d/.test(enteredPassword);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(enteredPassword);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await api.auth.resetPassword({
        token: values.token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err?.message?.replace(/API Error \[\d+\]: /, '') ||
          'Failed to reset password. The reset link may be invalid or expired.'
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
            Set New Password
          </h1>
          <p className="text-xs text-[#736B5E]">
            Create a secure password conforming to statutory access policy
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

        {isSuccess ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed text-left">
              <span className="font-bold block mb-1">Password Successfully Updated</span>
              Your account password has been updated. You can now access your case workspace with your new credentials.
            </div>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1A1816] hover:bg-[#8C653B] transition-colors"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
            <input type="hidden" {...register('token')} />

            {!tokenFromUrl && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#1A1816]">
                  Reset Security Token *
                </label>
                <input
                  type="text"
                  placeholder="Paste reset token from email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-xs bg-white text-[#1A1816] focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50"
                  {...register('token')}
                />
                {errors.token && (
                  <p className="text-[11px] text-rose-600">{errors.token.message}</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1A1816]">
                New Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8274]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 12 characters"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 ${
                    errors.newPassword ? 'border-rose-400' : 'border-[#EAE6DF]'
                  }`}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C8274] hover:text-[#1A1816]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-[11px] text-rose-600">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1A1816]">
                Confirm New Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter new password"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 ${
                  errors.confirmPassword ? 'border-rose-400' : 'border-[#EAE6DF]'
                }`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Checklist */}
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] text-[11px] space-y-1">
              <p className="font-semibold text-[#5C5449] mb-1">Password Requirements:</p>
              <div className="grid grid-cols-2 gap-1 text-[#736B5E]">
                <span className={hasMinLength ? 'text-emerald-700 font-medium' : ''}>
                  {hasMinLength ? '✓' : '•'} At least 12 chars
                </span>
                <span className={hasMixedCase ? 'text-emerald-700 font-medium' : ''}>
                  {hasMixedCase ? '✓' : '•'} Uppercase &amp; lowercase
                </span>
                <span className={hasNumber ? 'text-emerald-700 font-medium' : ''}>
                  {hasNumber ? '✓' : '•'} At least one number
                </span>
                <span className={hasSymbol ? 'text-emerald-700 font-medium' : ''}>
                  {hasSymbol ? '✓' : '•'} Special symbol
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#8C653B] hover:bg-[#735330] focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 disabled:opacity-60 transition-all shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Reset &amp; Save Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
