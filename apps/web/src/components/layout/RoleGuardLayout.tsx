import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import React from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { DEMO_PROFILES, getRoleHomeDashboard } from '@/features/context/demo-profiles';

interface RoleLayoutProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export async function RoleGuardLayout({ children, allowedRoles }: RoleLayoutProps) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('flowguard_session')?.value;
  const demoRole = cookieStore.get('flowguard_demo')?.value;

  // 1. Standalone Demo Mode (Zero-Backend / Offline Presentation Support)
  if (demoRole || sessionToken === 'demo') {
    const activeRole = demoRole || 'INSTITUTION';
    const demoUser = DEMO_PROFILES[activeRole] || DEMO_PROFILES.INSTITUTION;

    // Verify if current demo role is permitted in this section
    const userRoles = demoUser.roles || [demoUser.primaryRole];
    const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasAccess) {
      // In demo mode, redirect gracefully to their active role's dashboard
      const landing = getRoleHomeDashboard(demoUser.primaryRole);
      redirect(landing);
    }

    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
        <TopNavbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
        <footer className="border-t border-[#EAE6DF] px-8 py-5 text-center text-xs text-[#8C8274] bg-[#FAF8F5]">
          AICTE FlowGuard &bull; Regulatory Approval &amp; Statutory Compliance System (Standalone Presentation Mode)
        </footer>
      </div>
    );
  }

  // 2. No session or demo token present
  if (!sessionToken) {
    redirect('/login');
  }

  // 3. Regular Backend Verification (with resilient offline demo fallback)
  const apiUrl = process.env.API_URL || 'http://localhost:4000/api/v1';
  let user: any = null;

  try {
    const res = await fetch(`${apiUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        Cookie: `flowguard_session=${sessionToken}`,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      user = await res.json();
    }
  } catch (err) {
    // If backend is unreachable on this machine, fallback gracefully to allowed demo role
    const fallbackRole = allowedRoles[0];
    user = DEMO_PROFILES[fallbackRole] || DEMO_PROFILES.INSTITUTION;
  }

  if (!user) {
    redirect('/login');
  }

  const userRoles: string[] = Array.isArray(user.roles)
    ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.role?.name || r.name))
    : [user.primaryRole];

  const hasAccess = allowedRoles.some((role) => userRoles.includes(role));
  if (!hasAccess) {
    const landing = getRoleHomeDashboard(user.primaryRole || userRoles[0]);
    redirect(landing);
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <TopNavbar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
      <footer className="border-t border-[#EAE6DF] px-8 py-5 text-center text-xs text-[#8C8274] bg-[#FAF8F5]">
        AICTE FlowGuard &bull; Regulatory Approval &amp; Statutory Compliance System
      </footer>
    </div>
  );
}
