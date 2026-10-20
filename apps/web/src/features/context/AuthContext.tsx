'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export * from './demo-profiles';
import { AuthUser, DEMO_PROFILES, getRoleHomeDashboard, getRoleLabel } from './demo-profiles';


interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  roleHome: string;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
  loginAsDemo: (role: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const primaryRole =
          data.primaryRole ||
          (data.roles && data.roles[0]?.role?.name) ||
          (data.roles && data.roles[0]) ||
          'INSTITUTION';

        setUser({
          id: data.id,
          email: data.email,
          fullName: data.fullName,
          role: primaryRole,
          primaryRole,
          roles: Array.isArray(data.roles)
            ? data.roles.map((r: any) => (typeof r === 'string' ? r : r.role?.name || r.name))
            : [primaryRole],
          institutionId: data.institutionId,
          institutionName: data.institution?.name || data.institutionName,
          assignedRegion: data.assignedRegion,
          designation: data.designation,
        });
      } else {
        // Fallback to local demo user if stored in localStorage
        const stored = typeof window !== 'undefined' ? localStorage.getItem('flowguard_demo_user') : null;
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            setUser(DEMO_PROFILES.INSTITUTION);
          }
        } else {
          setUser(null);
        }
      }
    } catch {
      // In standalone demo mode when backend is offline
      const stored = typeof window !== 'undefined' ? localStorage.getItem('flowguard_demo_user') : null;
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(DEMO_PROFILES.INSTITUTION);
        }
      } else {
        setUser(DEMO_PROFILES.INSTITUTION);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginAsDemo = (role: string) => {
    const profile = DEMO_PROFILES[role] || DEMO_PROFILES.INSTITUTION;
    setUser(profile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('flowguard_demo_user', JSON.stringify(profile));
      document.cookie = `flowguard_demo=${profile.primaryRole}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `flowguard_session=demo; path=/; max-age=86400; SameSite=Lax`;
    }
    const target = getRoleHomeDashboard(profile.primaryRole);
    router.push(target);
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flowguard_demo_user');
      document.cookie = 'flowguard_demo=; path=/; max-age=0';
      document.cookie = 'flowguard_session=; path=/; max-age=0';
    }
    setUser(null);
    router.push('/login');
  };

  const roleHome = user ? getRoleHomeDashboard(user.primaryRole || user.role) : '/';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        roleHome,
        setUser,
        refreshUser,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
