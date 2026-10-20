import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import React from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';

interface RoleLayoutProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export async function RoleGuardLayout({ children, allowedRoles }: RoleLayoutProps) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('flowguard_session')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  // Server-side re-check /auth/me to ensure user and role validity
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
    // API network failure or server reboot
  }

  if (!user) {
    redirect('/login');
  }

  const userRoles: string[] = Array.isArray(user.roles)
    ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.role?.name || r.name))
    : [user.primaryRole];

  const hasAccess = allowedRoles.some((role) => userRoles.includes(role));
  if (!hasAccess) {
    const { getRoleLandingRoute } = await import('@flowguard/shared');
    const landing = getRoleLandingRoute(user.primaryRole || userRoles[0]);
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
