'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileCheck2,
  ShieldCheck,
  ClipboardList,
  Compass,
  FolderClosed,
  ScrollText,
  Bell,
  Settings,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Building2,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, getRoleLabel, getRoleHomeDashboard } from '@/features/context/AuthContext';
import { useDemo } from '@/features/context/DemoContext';

export function TopNavbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, roleHome } = useAuth();
  const { alerts } = useDemo();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadAlertsCount = alerts.filter((a) => a.status === 'Unread').length;

  const currentRole = user?.primaryRole?.toUpperCase() || (user as any)?.role?.toUpperCase() || '';

  // Role-aware navigation links
  const getNavItems = () => {
    if (!isAuthenticated || !user) return [];

    const items = [
      {
        label: 'Dashboard',
        href: roleHome,
        icon: LayoutDashboard,
        active: pathname === roleHome,
      },
    ];

    if (currentRole === 'INSTITUTION') {
      items.push(
        {
          label: 'Applications',
          href: '/applications',
          icon: FileCheck2,
          active: pathname.startsWith('/applications'),
        },
        {
          label: 'Compliance',
          href: '/compliance',
          icon: ShieldCheck,
          active: pathname.startsWith('/compliance'),
        },
        {
          label: 'Documents',
          href: '/documents',
          icon: FolderClosed,
          active: pathname.startsWith('/documents'),
        }
      );
    } else if (currentRole === 'SCRUTINY_OFFICER' || currentRole === 'OFFICER') {
      items.push(
        {
          label: 'Scrutiny Desk',
          href: '/scrutiny',
          icon: ClipboardList,
          active: pathname.startsWith('/scrutiny'),
        },
        {
          label: 'Applications',
          href: '/applications',
          icon: FileCheck2,
          active: pathname.startsWith('/applications'),
        },
        {
          label: 'Documents',
          href: '/documents',
          icon: FolderClosed,
          active: pathname.startsWith('/documents'),
        }
      );
    } else if (currentRole === 'EVC_COORDINATOR' || currentRole === 'EVC_MEMBER' || currentRole === 'COMMITTEE') {
      items.push(
        {
          label: 'EVC Tracking',
          href: '/evc',
          icon: Compass,
          active: pathname.startsWith('/evc'),
        },
        {
          label: 'Applications',
          href: '/applications',
          icon: FileCheck2,
          active: pathname.startsWith('/applications'),
        },
        {
          label: 'Reports',
          href: '/reports',
          icon: ScrollText,
          active: pathname.startsWith('/reports'),
        }
      );
    } else if (currentRole === 'AUDITOR') {
      items.push(
        {
          label: 'Applications',
          href: '/applications',
          icon: FileCheck2,
          active: pathname.startsWith('/applications'),
        },
        {
          label: 'Compliance',
          href: '/compliance',
          icon: ShieldCheck,
          active: pathname.startsWith('/compliance'),
        },
        {
          label: 'Audit Trail',
          href: '/reports',
          icon: ScrollText,
          active: pathname.startsWith('/reports') || pathname.startsWith('/audit'),
        }
      );
    } else {
      // REGIONAL_OFFICER, BUREAU_OFFICER, COMPETENT_AUTHORITY, SYSTEM_ADMIN
      items.push(
        {
          label: 'Applications',
          href: '/applications',
          icon: FileCheck2,
          active: pathname.startsWith('/applications'),
        },
        {
          label: 'Compliance',
          href: '/compliance',
          icon: ShieldCheck,
          active: pathname.startsWith('/compliance'),
        },
        {
          label: 'Scrutiny Desk',
          href: '/scrutiny',
          icon: ClipboardList,
          active: pathname.startsWith('/scrutiny'),
        },
        {
          label: 'EVC Tracking',
          href: '/evc',
          icon: Compass,
          active: pathname.startsWith('/evc'),
        },
        {
          label: 'Audit & Reports',
          href: '/reports',
          icon: ScrollText,
          active: pathname.startsWith('/reports') || pathname.startsWith('/audit'),
        }
      );

      if (currentRole === 'SYSTEM_ADMIN' || currentRole === 'SYSTEM_ADMINISTRATOR') {
        items.push({
          label: 'Settings',
          href: '/users',
          icon: Settings,
          active: pathname.startsWith('/users'),
        });
      }
    }

    return items;
  };

  const navItems = getNavItems();
  const logoHref = isAuthenticated && user ? roleHome : '/';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE6DF] select-none shadow-xs">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 sm:h-28 gap-4">
          {/* Logo link: ONLY the logo image, slightly increased size, NO text after it */}
          <Link
            href={logoHref}
            aria-label="AICTE FlowGuard home"
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-[#8C653B] rounded-lg group shrink-0 py-1"
          >
            <img
              src="/logo.png"
              alt="AICTE FlowGuard"
              className="h-20 w-20 sm:h-24 sm:w-24 object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              /* Public / Logged-out header controls */
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#1A1816] hover:text-[#8C653B] bg-white hover:bg-[#F2ECE2] border border-[#EAE6DF] rounded-xl transition-all shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#8C653B] hover:bg-[#735330] rounded-xl transition-all shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Institution</span>
                </Link>
              </div>
            ) : (
              /* Logged-in header controls */
              <div className="flex items-center gap-3">
                {/* Notification Bell with Badge */}
                <Link
                  href="/notifications"
                  className="relative p-2 text-[#736B5E] hover:text-[#1A1816] hover:bg-[#F2ECE2] rounded-lg transition-colors border border-transparent hover:border-[#EAE6DF]"
                  title="Alerts & Notifications"
                  aria-label="Alerts and Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadAlertsCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold ring-2 ring-[#FAF8F5]">
                      {unreadAlertsCount}
                    </span>
                  )}
                </Link>

                {/* Profile Menu (Name, Role Label, Logout) */}
                <div className="relative">
                  <button
                    id="profile-menu-button"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-[#EAE6DF] bg-white hover:bg-[#F2ECE2] transition-colors focus:outline-none"
                    aria-expanded={showProfileMenu}
                    aria-label="User profile menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#8C653B] text-white flex items-center justify-center text-xs font-bold border border-[#EAE6DF]">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-xs font-bold text-[#1A1816] leading-tight truncate max-w-[140px]">
                        {user?.fullName || 'User'}
                      </p>
                      <p className="text-[10px] text-[#8C653B] font-semibold leading-tight truncate max-w-[140px]">
                        {getRoleLabel(user?.primaryRole || (user as any)?.role)}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8C8274]" />
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-[#EAE6DF] rounded-xl shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 border-b border-[#EAE6DF]">
                        <p className="text-xs font-bold text-[#1A1816]">
                          {user?.fullName}
                        </p>
                        <p className="text-[11px] text-[#736B5E] truncate">
                          {user?.email}
                        </p>
                        <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5EDE4] text-[#8C653B]">
                          {getRoleLabel(user?.primaryRole || (user as any)?.role)}
                        </div>
                        {user?.institutionName && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#5C5449]">
                            <Building2 className="w-3 h-3 text-[#8C8274]" />
                            <span className="truncate">{user.institutionName}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-1">
                        <Link
                          href={roleHome}
                          onClick={() => setShowProfileMenu(false)}
                          className="w-full text-left p-2 rounded-lg text-xs hover:bg-[#FAF8F5] text-[#5C5449] flex items-center gap-2 transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-[#8C653B]" />
                          <span>Role Dashboard</span>
                        </Link>
                        <button
                          id="logout-button"
                          onClick={async () => {
                            setShowProfileMenu(false);
                            await logout();
                          }}
                          className="w-full text-left p-2 rounded-lg text-xs hover:bg-rose-50 text-rose-700 flex items-center gap-2 transition-colors font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Navigation Bar (Tabs across top - shown only when authenticated) */}
      {isAuthenticated && navItems.length > 0 && (
        <nav className="border-t border-[#EAE6DF]/70 bg-[#F5EDE4]/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150',
                      item.active
                        ? 'bg-[#1A1816] text-white font-semibold shadow-xs'
                        : 'text-[#5C5449] hover:text-[#1A1816] hover:bg-[#F2ECE2]'
                    )}
                  >
                    <Icon className={cn('w-3.5 h-3.5', item.active ? 'text-white' : 'text-[#8C653B]')} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
