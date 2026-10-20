'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileCheck2,
  ShieldCheck,
  Bell,
  ScrollText,
  FolderClosed,
  BarChart3,
  Settings,
  ClipboardList,
  Building2,
  ChevronDown,
  UserCheck,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '@/features/context/DemoContext';

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, setCurrentUser, alerts, backendConnected } = useDemo();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadAlertsCount = alerts.filter((a) => a.status === 'Unread').length;

  const navItems = [
    {
      label: 'Approvals',
      href: '/applications',
      icon: FileCheck2,
      active: pathname.startsWith('/applications') || pathname === '/dashboard' || pathname === '/',
    },
    {
      label: 'Compliance',
      href: '/compliance',
      icon: ShieldCheck,
      active: pathname.startsWith('/compliance'),
    },
    {
      label: 'Alerts',
      href: '/notifications',
      icon: Bell,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
      active: pathname.startsWith('/notifications'),
    },
    {
      label: 'Audit',
      href: '/reports',
      icon: ScrollText,
      active: pathname.startsWith('/reports') || pathname.startsWith('/audit'),
    },
    {
      label: 'Documents',
      href: '/documents',
      icon: FolderClosed,
      active: pathname.startsWith('/documents'),
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
      label: 'Settings',
      href: '/users',
      icon: Settings,
      active: pathname.startsWith('/users'),
    },
  ];

  const demoRoles = [
    {
      name: 'Dr. Ananya Sharma',
      designation: 'Senior Scrutiny Officer',
      role: 'OFFICER' as const,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160',
      department: 'Approval Bureau - Western & Northern',
    },
    {
      name: 'Prof. Ramesh Kulkarni',
      designation: 'Institutional Registrar',
      role: 'INSTITUTION' as const,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=160',
      department: 'Sunrise Institute of Technology',
      institutionName: 'Sunrise Institute of Technology',
    },
    {
      name: 'Dr. K. G. Radhakrishnan',
      designation: 'EVC Committee Chair',
      role: 'COMMITTEE' as const,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=160',
      department: 'Standing Hearing Committee - Southern',
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-[#FAF8F5] border-r border-[#EAE6DF] flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center gap-2.5 border-b border-[#EAE6DF]/70">
          <Link
            href="/applications"
            className="block focus:outline-none focus:ring-2 focus:ring-[#8C653B] rounded-2xl group transition-transform hover:scale-[1.02]"
          >
            <div className="w-24 h-24 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs flex items-center justify-center p-2 mx-auto">
              <img
                src="/logo.png"
                alt="AICTE FlowGuard Platform"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
          <div className="w-full">
            <h2 className="font-serif font-bold text-sm text-[#1A1816] tracking-tight">
              AICTE FlowGuard
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-1.5">
              <span className="text-[10px] uppercase tracking-wider text-[#8C653B] font-semibold">
                Approval Portal
              </span>
              <span className="text-[#8C8274] text-[9px]">&bull;</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border',
                  backendConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                )}
                title={backendConnected ? 'Live connected to http://localhost:4000/api/v1' : 'Connecting to API'}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  )}
                />
                {backendConnected ? 'API Live' : 'Connecting'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  item.active
                    ? 'bg-[#F2ECE2] text-[#1A1816] font-semibold shadow-xs'
                    : 'text-[#6B6255] hover:text-[#1A1816] hover:bg-[#F7F2EA]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-[18px] h-[18px]',
                      item.active ? 'text-[#8C653B]' : 'text-[#8C8274]'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#1A1816] text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role Profile & Demonstration Switcher */}
      <div className="p-3 border-t border-[#EAE6DF] relative">
        <div className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover border border-[#DFD8CC]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1A1816] truncate">
              {currentUser.name}
            </p>
            <p className="text-[11px] text-[#736B5E] truncate">
              {currentUser.designation}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
