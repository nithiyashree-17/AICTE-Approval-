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
  const { currentUser, setCurrentUser, alerts } = useDemo();
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
        <div className="px-5 pt-5 pb-4 flex flex-col gap-2">
          <Link href="/applications" className="block focus:outline-none focus:ring-1 focus:ring-[#8C653B] rounded-lg">
            <img
              src="/logo.png"
              alt="AICTE Approve"
              className="h-11 w-auto max-w-[200px] object-contain rounded-lg shadow-xs"
            />
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-[#8C653B] font-semibold pl-1">
            FlowGuard Platform
          </span>
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
        <button
          onClick={() => setShowRoleMenu(!showRoleMenu)}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F2ECE2] transition-colors text-left"
        >
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
          <ChevronDown className="w-4 h-4 text-[#8C8274]" />
        </button>

        {showRoleMenu && (
          <div className="absolute bottom-16 left-3 right-3 bg-white border border-[#EAE6DF] rounded-xl shadow-dropdown p-2 z-50">
            <p className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-[#8C653B]">
              Switch Demonstration Role
            </p>
            {demoRoles.map((role) => (
              <button
                key={role.name}
                onClick={() => {
                  setCurrentUser(role);
                  setShowRoleMenu(false);
                }}
                className={cn(
                  'w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center gap-2 mt-1',
                  currentUser.name === role.name
                    ? 'bg-[#F5EDE4] font-semibold text-[#1A1816]'
                    : 'hover:bg-[#FAF8F5] text-[#5C5449]'
                )}
              >
                <UserCheck className="w-3.5 h-3.5 text-[#8C653B]" />
                <div>
                  <div className="text-[12px]">{role.name}</div>
                  <div className="text-[10px] text-[#8C8274]">{role.designation}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
