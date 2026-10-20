'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Building2,
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { api } from '@/lib/api';

const passwordPolicyRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;

const registerSchema = z
  .object({
    institutionName: z
      .string()
      .min(3, 'Institution name must be at least 3 characters'),
    institutionType: z.enum(
      [
        'ENGINEERING',
        'MANAGEMENT',
        'PHARMACY',
        'ARCHITECTURE',
        'POLYTECHNIC',
        'HOTEL_MANAGEMENT',
        'MCA',
        'OTHER',
      ],
      { required_error: 'Please select institution category' }
    ),
    region: z.enum(
      ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTH_WEST', 'SOUTH_WEST'],
      { required_error: 'Please select AICTE administrative region' }
    ),
    state: z.string().min(2, 'State / Union Territory is required'),
    address: z.string().min(5, 'Campus postal address is required'),
    officialEmail: z
      .string()
      .email('Please enter a valid official institutional email address'),
    phone: z
      .string()
      .min(10, 'Contact phone number must be at least 10 digits'),
    contactPersonName: z
      .string()
      .min(3, 'Authorised contact person name is required'),
    contactPersonDesignation: z
      .string()
      .min(2, 'Designation (e.g. Principal / Registrar) is required'),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(
        passwordPolicyRegex,
        'Password must contain mixed case letters (A-Z, a-z), at least one number, and one symbol'
      ),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    consent: z.literal(true, {
      errorMap: () => ({
        message: 'You must confirm statutory authority and accuracy of submitted details',
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const REGIONS = [
  { value: 'NORTH', label: 'Northern Region (Kanpur / Delhi)' },
  { value: 'NORTH_WEST', label: 'North-Western Region (Chandigarh / Jaipur)' },
  { value: 'SOUTH', label: 'Southern Region (Chennai)' },
  { value: 'SOUTH_WEST', label: 'South-Western Region (Bangalore)' },
  { value: 'WEST', label: 'Western Region (Mumbai)' },
  { value: 'EAST', label: 'Eastern Region (Kolkata)' },
  { value: 'CENTRAL', label: 'Central Region (Bhopal)' },
];

const INSTITUTION_TYPES = [
  { value: 'ENGINEERING', label: 'Engineering & Technology' },
  { value: 'MANAGEMENT', label: 'Management (MBA / PGDM)' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'ARCHITECTURE', label: 'Architecture & Planning' },
  { value: 'POLYTECHNIC', label: 'Polytechnic / Applied Arts' },
  { value: 'HOTEL_MANAGEMENT', label: 'Hotel Management & Catering' },
  { value: 'MCA', label: 'Computer Applications (MCA)' },
  { value: 'OTHER', label: 'Other Technical Program' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      institutionName: '',
      state: '',
      address: '',
      officialEmail: '',
      phone: '',
      contactPersonName: '',
      contactPersonDesignation: '',
      password: '',
      confirmPassword: '',
      consent: true,
    },
  });

  const enteredPassword = watch('password', '');
  const hasMinLength = enteredPassword.length >= 12;
  const hasMixedCase = /[a-z]/.test(enteredPassword) && /[A-Z]/.test(enteredPassword);
  const hasNumber = /\d/.test(enteredPassword);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(enteredPassword);

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.auth.registerInstitution(values);
      // Navigate to success page
      router.push(
        `/register/success?email=${encodeURIComponent(values.officialEmail)}`
      );
    } catch (err: any) {
      setErrorMessage(
        err?.message?.replace(/API Error \[\d+\]: /, '') ||
          'Failed to complete institutional registration. Please check the form and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <Link href="/" aria-label="AICTE FlowGuard home" className="inline-block group">
            <img
              src="/logo.png"
              alt="AICTE FlowGuard"
              className="h-20 w-20 object-contain mx-auto transition-transform group-hover:scale-105"
            />
          </Link>
          <h1 className="font-serif font-bold text-3xl text-[#1A1816]">
            Register Educational Institution
          </h1>
          <p className="text-xs sm:text-sm text-[#736B5E] max-w-lg mx-auto">
            Self-registration for technical education institutions seeking Letter of Approval (LOA) or Extension of Approval (EOA)
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 sm:p-8 shadow-md">
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Institution Details */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C653B] flex items-center gap-1.5 pb-2 border-b border-[#EAE6DF]">
                <Building2 className="w-4 h-4" />
                <span>1. Institution Information</span>
              </h2>

              <div className="space-y-1">
                <label
                  htmlFor="institution-name"
                  className="block text-xs font-semibold text-[#1A1816]"
                >
                  Institution Legal Name *
                </label>
                <input
                  id="institution-name"
                  type="text"
                  placeholder="e.g. National Institute of Engineering & Technology"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                    errors.institutionName ? 'border-rose-400' : 'border-[#EAE6DF]'
                  }`}
                  {...register('institutionName')}
                />
                {errors.institutionName && (
                  <p className="text-[11px] text-rose-600">{errors.institutionName.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="institution-type"
                    className="block text-xs font-semibold text-[#1A1816]"
                  >
                    Institution Category *
                  </label>
                  <select
                    id="institution-type"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                      errors.institutionType ? 'border-rose-400' : 'border-[#EAE6DF]'
                    }`}
                    {...register('institutionType')}
                  >
                    <option value="">Select category...</option>
                    {INSTITUTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {errors.institutionType && (
                    <p className="text-[11px] text-rose-600">{errors.institutionType.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="region-select"
                    className="block text-xs font-semibold text-[#1A1816]"
                  >
                    AICTE Administrative Region *
                  </label>
                  <select
                    id="region-select"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                      errors.region ? 'border-rose-400' : 'border-[#EAE6DF]'
                    }`}
                    {...register('region')}
                  >
                    <option value="">Select region...</option>
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {errors.region && (
                    <p className="text-[11px] text-rose-600">{errors.region.message}</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="state-input"
                    className="block text-xs font-semibold text-[#1A1816]"
                  >
                    State / Union Territory *
                  </label>
                  <input
                    id="state-input"
                    type="text"
                    placeholder="e.g. Uttar Pradesh"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                      errors.state ? 'border-rose-400' : 'border-[#EAE6DF]'
                    }`}
                    {...register('state')}
                  />
                  {errors.state && (
                    <p className="text-[11px] text-rose-600">{errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="phone-input"
                    className="block text-xs font-semibold text-[#1A1816]"
                  >
                    Official Telephone / Mobile *
                  </label>
                  <input
                    id="phone-input"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                      errors.phone ? 'border-rose-400' : 'border-[#EAE6DF]'
                    }`}
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-rose-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="address-input"
                  className="block text-xs font-semibold text-[#1A1816]"
                >
                  Campus Postal Address *
                </label>
                <textarea
                  id="address-input"
                  rows={2}
                  placeholder="Complete postal address with Pin Code"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                    errors.address ? 'border-rose-400' : 'border-[#EAE6DF]'
                  }`}
                  {...register('address')}
                />
                {errors.address && (
                  <p className="text-[11px] text-rose-600">{errors.address.message}</p>
                )}
              </div>
            </div>

            {/* Section 2: Authorised Contact Person */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C653B] flex items-center gap-1.5 pb-2 border-b border-[#EAE6DF]">
                <User className="w-4 h-4" />
                <span>2. Authorised Representative &amp; Login Credentials</span>
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-semibold text-[#1A1816]"
                  >
                    Representative Full Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Dr. Rajesh Sharma"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                      errors.contactPersonName ? 'border-rose-400' : 'border-[#EAE6DF]'
                    }`}
                    {...register('contactPersonName')}
                  />
                  {errors.contactPersonName && (
                    <p className="text-[11px] text-rose-600">{errors.contactPersonName.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="contact-designation"
                    className="block text-xs font-semibold text-[#1A1816]"
                  >
                    Designation *
                  </label>
                  <input
                    id="contact-designation"
                    type="text"
                    placeholder="Registrar / Principal / Director"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                      errors.contactPersonDesignation ? 'border-rose-400' : 'border-[#EAE6DF]'
                    }`}
                    {...register('contactPersonDesignation')}
                  />
                  {errors.contactPersonDesignation && (
                    <p className="text-[11px] text-rose-600">{errors.contactPersonDesignation.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="official-email"
                  className="block text-xs font-semibold text-[#1A1816]"
                >
                  Official Institutional Email (Used as Login Username) *
                </label>
                <input
                  id="official-email"
                  type="email"
                  placeholder="registrar@niet-demo.ac.in"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                    errors.officialEmail ? 'border-rose-400' : 'border-[#EAE6DF]'
                  }`}
                  {...register('officialEmail')}
                />
                {errors.officialEmail && (
                  <p className="text-[11px] text-rose-600">{errors.officialEmail.message}</p>
                )}
              </div>

              {/* Password Fields with Policy Meter */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-[#1A1816]"
                  >
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 12 characters"
                      className={`w-full px-3.5 pr-10 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                        errors.password ? 'border-rose-400' : 'border-[#EAE6DF]'
                      }`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C8274] hover:text-[#1A1816]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-rose-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold text-[#1A1816]"
                  >
                    Confirm Password *
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-[#1A1816] placeholder:text-[#8C8274]/70 focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 transition-all ${
                      errors.confirmPassword ? 'border-rose-400' : 'border-[#EAE6DF]'
                    }`}
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-rose-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Password Policy Checklist */}
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] text-[11px] space-y-1">
                <p className="font-semibold text-[#5C5449] mb-1">Password Requirements:</p>
                <div className="grid grid-cols-2 gap-1 text-[#736B5E]">
                  <span className={hasMinLength ? 'text-emerald-700 font-medium' : ''}>
                    {hasMinLength ? '✓' : '•'} At least 12 characters
                  </span>
                  <span className={hasMixedCase ? 'text-emerald-700 font-medium' : ''}>
                    {hasMixedCase ? '✓' : '•'} Uppercase &amp; lowercase
                  </span>
                  <span className={hasNumber ? 'text-emerald-700 font-medium' : ''}>
                    {hasNumber ? '✓' : '•'} At least one number
                  </span>
                  <span className={hasSymbol ? 'text-emerald-700 font-medium' : ''}>
                    {hasSymbol ? '✓' : '•'} At least one special symbol
                  </span>
                </div>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-[#EAE6DF] text-[#8C653B] focus:ring-[#8C653B]"
                  {...register('consent')}
                />
                <span className="text-xs text-[#5C5449] leading-relaxed">
                  I solemnly declare that I am the legally authorised representative of this institution, and that all information submitted is true and conforming to AICTE Approval Process Handbook (APH) regulations.
                </span>
              </label>
              {errors.consent && (
                <p className="text-[11px] text-rose-600 mt-1 pl-6">{errors.consent.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#8C653B] hover:bg-[#735330] focus:outline-none focus:ring-2 focus:ring-[#8C653B]/50 disabled:opacity-60 transition-all shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Institutional Registration...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Institutional Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-4 border-t border-[#EAE6DF] text-center text-xs text-[#736B5E]">
            Already have an institutional account?{' '}
            <Link href="/login" className="font-semibold text-[#8C653B] hover:text-[#1A1816]">
              Sign in to Portal &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
