'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Download,
  SlidersHorizontal,
  Lock,
  Database,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useDemo } from '@/features/context/DemoContext';
import { AuditRecord } from '@/lib/types';

export default function AuditReportsPage() {
  const { auditLogs } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'CRITICAL' | 'APPROVALS' | 'SYSTEM'>('ALL');
  const [dateRange, setDateRange] = useState('Last 7 days');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        categoryFilter === 'ALL' || log.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [auditLogs, searchQuery, categoryFilter]);

  const handleExportLogs = () => {
    const csv =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,User,Role,Action,Details,Category']
        .concat(
          filteredLogs.map(
            (l) => `"${l.timestamp}","${l.user}","${l.role}","${l.action}","${l.details}",${l.category}`
          )
        )
        .join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = 'aicte_immutable_audit_logs.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#8C653B]">
            COMPLIANCE &bull; AUDIT
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1816] mt-1">
            Audit Trail &amp; Logs
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8274]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs by user, action, or d..."
              className="pl-8 pr-4 py-2 text-xs bg-white border border-[#EAE6DF] rounded-lg w-64 text-[#1A1816] placeholder-[#8C8274] focus:outline-none focus:border-[#8C653B]"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1A1816] bg-white border border-[#EAE6DF] rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-[#8C653B]" />
            <span>Date Range:</span>
            <span className="font-bold">{dateRange}</span>
          </div>
        </div>
      </div>

      {/* 3 Top KPI Cards matching Screenshot 4 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Events */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C8274]">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Total Events
            </span>
            <Database className="w-4 h-4 text-[#8C8274]" />
          </div>
          <div className="my-2">
            <span className="font-serif font-bold text-4xl text-[#1A1816]">
              15,842
            </span>
          </div>
          <div className="text-[11px] text-[#059669] font-medium">
            +6.2% vs previous 7 days
          </div>
        </div>

        {/* Today's Events */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C8274]">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Today's Events
            </span>
            <Activity className="w-4 h-4 text-[#8C8274]" />
          </div>
          <div className="my-2">
            <span className="font-serif font-bold text-3xl text-[#1A1816]">
              214
            </span>
          </div>
          <div className="text-[11px] text-[#8C8274]">
            Peak at 10:00, 38 events
          </div>
        </div>

        {/* Critical Events */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C8274]">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Critical Events
            </span>
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="my-2">
            <span className="font-serif font-bold text-3xl text-[#1A1816]">
              18
            </span>
          </div>
          <div className="text-[11px] font-bold text-[#DC2626]">
            4 unresolved &bull; needs review
          </div>
        </div>
      </div>

      {/* Filter Tabs & Export Button Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(['ALL', 'CRITICAL', 'APPROVALS', 'SYSTEM'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#1A1816] text-white shadow-xs'
                  : 'bg-white border border-[#EAE6DF] text-[#736B5E] hover:bg-[#FAF8F5]'
              }`}
            >
              {cat === 'ALL' ? 'ALL EVENTS' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1A1816] bg-white border border-[#EAE6DF] rounded-lg hover:bg-[#FAF8F5]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8C653B]" />
            FILTER
          </button>

          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1A1816] rounded-lg hover:bg-[#2d2821] shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            EXPORT LOGS
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#8C8274] uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-5">Action</th>
                <th className="py-3 px-5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="py-4 px-5 font-mono text-[#8C8274] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-4 px-5 font-medium text-[#1A1816] whitespace-nowrap">
                    <div>{log.user}</div>
                    <div className="text-[10px] text-[#8C8274]">{log.role}</div>
                  </td>
                  <td className="py-4 px-5 font-semibold text-[#8C653B] whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-4 px-5 text-[#2D2821] max-w-lg leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info & pagination */}
        <div className="p-4 border-t border-[#EAE6DF] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#736B5E]">
          <span>Showing {filteredLogs.length} of 15,842 events &bull; Last 7 days</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="px-2.5 py-1 rounded bg-[#1A1816] text-white font-bold">
              1
            </button>
            <button className="px-2.5 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
              2
            </button>
            <button className="px-2.5 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
              3
            </button>
            <button className="p-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Statutory Immutability Disclaimer */}
      <div className="flex items-center gap-2 text-xs text-[#8C8274] pt-1">
        <Lock className="w-3.5 h-3.5 text-[#8C653B]" />
        <span>
          Audit logs are immutable and retained for 7 years per AICTE records policy.
        </span>
      </div>
    </div>
  );
}
