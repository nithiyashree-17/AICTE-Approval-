'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Building2,
} from 'lucide-react';
import { useAuth, getRoleHomeDashboard } from '@/features/context/AuthContext';
import { api } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const { isAuthenticated, roleHome, isLoading: authLoading, refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If user is already authenticated with an active session, forward to role dashboard
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && roleHome && roleHome !== '/login') {
      window.location.href = redirectParam || roleHome;
    }
  }, [authLoading, isAuthenticated, roleHome, redirectParam]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.auth.login({
        email: values.email,
        password: values.password,
      });

      // Refresh auth context with user session
      await refreshUser();

      // Retrieve primary role - strictly no 'INSTITUTION' fallback
      const userRole = response.user?.primaryRole || response.user?.roles?.[0];
      if (!userRole) {
        throw new Error('User has no assigned regulatory role. Access denied.');
      }

      // Canonical landing route
      const landingRoute = getRoleHomeDashboard(userRole);

      // Validate redirectParam as a relative path allowed for the user's role
      let destination = landingRoute;
      if (
        redirectParam &&
        redirectParam.startsWith('/') &&
        !redirectParam.startsWith('//') &&
        !redirectParam.includes('\\')
      ) {
        // Only allow redirect if permitted for this role
        const { isRouteAllowedForRole } = await import('@flowguard/shared');
        if (isRouteAllowedForRole(redirectParam, userRole)) {
          destination = redirectParam;
        }
      }

      // Hard navigation ensures edge middleware and layouts reload with clean cookies
      window.location.href = destination;
    } catch (err: any) {
      // Safe error message to prevent enumeration unless specific status message
      const rawMessage = err?.message || '';
      if (rawMessage.includes('verify your email')) {
        setErrorMessage('Your official email has not been verified. Please check your inbox.');
      } else if (rawMessage.includes('pending administrator approval')) {
        setErrorMessage('Your institution account is awaiting statutory administrator approval.');
      } else if (rawMessage.includes('temporarily locked')) {
        setErrorMessage(rawMessage.replace(/API Error \[\d+\]: /, ''));
      } else {
        setErrorMessage('Invalid credentials. Please verify your email and password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white border border-[#EAE6DF] rounded-2xl p-8 shadow-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" aria-label="AICTE FlowGuard home" className="group">
            <img
              src="/logo.png"
              alt="AICTE FlowGuard"
              className="h-20 w-20 object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          <div>
            <h1 className="font-serif font-bold text-2xl text-[#1A1816]">
              Sign in to Portal
            </h1>
            <p className="text-xs text-[#736B5E] mt-1">
              Statutory Approval &amp; Compliance Management
            </p>
          </div>
        </div>

        {/* Generic or Specific Error Message Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
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
                autoComplete="email"
                placeholder="name@institution.ac.in"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                  errors.email ? 'border-rose-400 focus:ring-rose-200' : 'border-[#EAE6DF]'
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

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password-input"
                className="block text-xs font-semibold text-[#1A1816]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-[#8C653B] hover:text-[#1A1816] font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8274]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••••"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                  errors.password ? 'border-rose-400 focus:ring-rose-200' : 'border-[#EAE6DF]'
                }`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C8274] hover:text-[#1A1816] focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-600 font-medium pl-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1A1816] hover:bg-[#8C653B] focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 disabled:opacity-60 transition-all shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Institution Registration Callout */}
        <div className="pt-4 border-t border-[#EAE6DF] text-center space-y-2">
          <p className="text-xs text-[#5C5449]">
            Representing a new or existing educational institution?
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C653B] hover:text-[#1A1816] transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Register Institution &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
