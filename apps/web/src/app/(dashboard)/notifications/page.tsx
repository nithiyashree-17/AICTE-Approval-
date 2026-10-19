'use client';

import React, { useState, useMemo } from 'react';
import {
  Bell,
  SlidersHorizontal,
  Search,
  ShieldAlert,
  Mail,
  Clock,
  CheckCircle2,
  Check,
  UserCheck,
  AlertOctagon,
} from 'lucide-react';
import { useDemo } from '@/features/context/DemoContext';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AlertRecord } from '@/lib/types';

export default function NotificationsPage() {
  const { alerts, markAlertStatus, escalateAlert } = useDemo();
  const [filterTab, setFilterTab] = useState<'All' | 'Unread' | 'Critical' | 'Resolved'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(alerts[0]?.id || null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch =
        alert.alert.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab =
        filterTab === 'All'
          ? true
          : filterTab === 'Unread'
          ? alert.status === 'Unread'
          : filterTab === 'Critical'
          ? alert.severity === 'Critical'
          : alert.status === 'Resolved';

      return matchesSearch && matchesTab;
    });
  }, [alerts, searchQuery, filterTab]);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId);

  return (
    <div className="space-y-6">
      {/* Header & Preferences */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#8C653B]">
            COMPLIANCE OPERATIONS
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1816] mt-1">
            Alert &amp; Notification Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative p-2 rounded-lg bg-white border border-[#EAE6DF] text-[#1A1816]">
            <Bell className="w-4 h-4 text-[#8C653B]" />
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-[#1A1816] text-white text-[10px] font-bold rounded-full">
              12
            </span>
          </div>
          <button className="px-3.5 py-2 text-xs font-bold text-[#1A1816] bg-white border border-[#EAE6DF] rounded-lg hover:bg-[#FAF8F5] transition-colors">
            PREFERENCES
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards matching Screenshot 3 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Open Critical Card */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C8274]">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Open Critical
            </span>
            <ShieldAlert className="w-4 h-4 text-[#8C8274]" />
          </div>
          <div className="my-2">
            <span className="font-serif font-bold text-4xl text-[#1A1816]">
              02
            </span>
          </div>
          <div className="text-[11px] text-[#8C8274]">
            Requires action before 22 Jun 2026
          </div>
        </div>

        {/* Unread */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C8274]">
            <Mail className="w-4 h-4 text-[#8C8274]" />
          </div>
          <div className="my-2">
            <span className="font-serif font-bold text-3xl text-[#1A1816]">
              12
            </span>
          </div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-[#8C8274]">
            UNREAD
          </div>
        </div>

        {/* Avg Ack Time */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C8274]">
            <Clock className="w-4 h-4 text-[#8C8274]" />
          </div>
          <div className="my-2">
            <span className="font-serif font-bold text-3xl text-[#1A1816]">
              3.4h
            </span>
          </div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-[#8C8274]">
            AVG ACK TIME
          </div>
        </div>

        {/* Resolved (7D) */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C8274]">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="my-2">
            <span className="font-serif font-bold text-3xl text-[#1A1816]">
              28
            </span>
          </div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-[#8C8274]">
            RESOLVED (7D)
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE6DF] pb-2">
        <div className="flex items-center gap-6">
          {(['All', 'Unread', 'Critical', 'Resolved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-2 ${
                filterTab === tab
                  ? 'border-[#1A1816] text-[#1A1816]'
                  : 'border-transparent text-[#8C8274] hover:text-[#1A1816]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8274]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts"
              className="pl-8 pr-4 py-1.5 text-xs bg-white border border-[#EAE6DF] rounded-lg w-56 text-[#1A1816] placeholder-[#8C8274] focus:outline-none focus:border-[#8C653B]"
            />
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1A1816] bg-white border border-[#EAE6DF] rounded-lg hover:bg-[#FAF8F5]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8C653B]" />
            FILTER
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl card-shadow overflow-hidden">
        <div className="p-4 border-b border-[#EAE6DF] flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#1A1816]">Alerts</h3>
          <span className="text-xs text-[#8C8274]">
            All &bull; {filteredAlerts.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#8C8274] uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-5">Severity</th>
                <th className="py-3 px-5">Alert</th>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF]">
              {filteredAlerts.map((alert) => {
                const isSelected = selectedAlertId === alert.id;
                return (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#F7F2EA]'
                        : 'hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <td className="py-4 px-5">
                      <StatusBadge status={alert.severity} />
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-semibold text-[#1A1816]">{alert.alert}</p>
                      <span className="font-mono text-[10px] text-[#8C8274]">
                        {alert.id}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-[#8C8274]">
                      {alert.timestamp}
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={alert.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions Panel matching Screenshot 3 */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816]">
            Quick Actions
          </h4>
          <p className="text-[11px] text-[#8C8274]">
            Applies to selected alert:{' '}
            <span className="font-mono font-semibold text-[#8C653B]">
              {selectedAlert?.id || 'None selected'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={!selectedAlert}
            onClick={() => selectedAlert && markAlertStatus(selectedAlert.id, 'Read')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#1A1816] bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg hover:bg-[#F2ECE2] disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-[#8C653B]" />
            MARK AS READ
          </button>

          <button
            disabled={!selectedAlert}
            onClick={() =>
              selectedAlert &&
              markAlertStatus(selectedAlert.id, 'Resolved')
            }
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#1A1816] bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg hover:bg-[#F2ECE2] disabled:opacity-50 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#8C653B]" />
            RESOLVE
          </button>

          <button
            disabled={!selectedAlert}
            onClick={() => selectedAlert && escalateAlert(selectedAlert.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#991B1B] hover:bg-[#7f1d1d] rounded-lg disabled:opacity-50 transition-colors"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            ESCALATE
          </button>
        </div>
      </div>
    </div>
  );
}
