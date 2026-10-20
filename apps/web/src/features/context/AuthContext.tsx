'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  primaryRole: string;
  roles?: string[];
  institutionId?: string | null;
  institutionName?: string | null;
  assignedRegion?: string | null;
  designation?: string | null;
}

import { getRoleLandingRoute, ROLE_LABELS, RoleType } from '@flowguard/shared';

export function getRoleHomeDashboard(role?: string): string {
  return getRoleLandingRoute(role);
}

export function getRoleLabel(role?: string): string {
  if (!role) return 'Public User';
  const normalized = role.toUpperCase() as RoleType;
  return ROLE_LABELS[normalized] || role;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  roleHome: string;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
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
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
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
