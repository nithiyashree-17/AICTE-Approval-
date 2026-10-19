'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useDemo } from '@/features/context/DemoContext';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function CompliancePage() {
  const { complianceList, initiateComplianceCheck } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'All' | 'Compliant' | 'Needs Improvement' | 'Non-Compliant'>('All');
  const [selectedInst, setSelectedInst] = useState(complianceList[3]?.name || 'National Institute of Skill Development');
  const [auditScope, setAuditScope] = useState('Full review, all categories');
  const [checkStarted, setCheckStarted] = useState(false);

  const filteredInstitutions = useMemo(() => {
    return complianceList.filter((inst) => {
      const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterTab === 'All' || inst.status === filterTab;
      return matchesSearch && matchesStatus;
    });
  }, [complianceList, searchQuery, filterTab]);

  const handleStartCheck = (e: React.FormEvent) => {
    e.preventDefault();
    initiateComplianceCheck(selectedInst, auditScope);
    setCheckStarted(true);
    setTimeout(() => setCheckStarted(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-[#8C8274]">Home &gt; Compliance Status</span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1816] mt-1">
            Compliance Status
          </h1>
          <p className="text-xs text-[#736B5E] mt-1">
            Monitoring against AICTE norms across 1,248 approved technical institutions.
          </p>
        </div>

        {/* Search & Export */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8274]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search institutions"
              className="pl-8 pr-4 py-2 text-xs bg-white border border-[#EAE6DF] rounded-lg w-64 text-[#1A1816] placeholder-[#8C8274] focus:outline-none focus:border-[#8C653B]"
            />
          </div>

          <button
            onClick={() => {
              const csv =
                'data:text/csv;charset=utf-8,' +
                ['Institution,Compliance Score,Last Audit,Status']
                  .concat(
                    complianceList.map(
                      (c) => `"${c.name}",${c.complianceScore}%,${c.lastAudit},${c.status}`
                    )
                  )
                  .join('\n');
              const link = document.createElement('a');
              link.href = encodeURI(csv);
              link.download = 'compliance_status.csv';
              link.click();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1A1816] bg-white border border-[#EAE6DF] rounded-lg hover:bg-[#FAF8F5] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#8C653B]" />
            EXPORT
          </button>
        </div>
      </div>

      {/* Top Metrics Row: Radial Gauge (Left) & Category Breakdown (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Overall Compliance Score Radial Meter */}
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-6 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#8C8274]">
              Overall Compliance Score
            </span>
            <span className="text-[11px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">
              +2.3%
            </span>
          </div>

          {/* SVG Semi-Circle Radial Gauge */}
          <div className="my-4 flex flex-col items-center justify-center relative">
            <svg viewBox="0 0 160 90" className="w-52 overflow-visible">
              {/* Background Arc */}
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke="#EAE6DF"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Progress Arc */}
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke="#1A1816"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="188.5"
                strokeDashoffset="24.5" // 87% progress
              />
            </svg>
            <div className="absolute bottom-1 flex flex-col items-center">
              <span className="font-serif font-bold text-3xl text-[#1A1816]">
                87%
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#8C8274] font-bold">
                Compliance
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F2ECE2] flex items-center justify-between">
            <div>
              <span className="font-serif font-bold text-2xl text-[#1A1816]">
                78.4%
              </span>
              <p className="text-[10px] text-[#059669] font-medium">
                Up 2.3% from last quarter
              </p>
            </div>
            <p className="text-[11px] text-[#8C8274] text-right max-w-[130px]">
              Average compliance across 1,248 institutions
            </p>
          </div>
        </div>

        {/* Middle/Right (2 cols): Compliance by Category */}
        <div className="md:col-span-2 bg-white border border-[#EAE6DF] rounded-xl p-6 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-[#1A1816]">
              Compliance by Category
            </h3>
            <span className="text-xs font-semibold text-[#8C8274]">Q2 2026</span>
          </div>

          <div className="space-y-4 my-2">
            {/* Faculty */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#1A1816]">Faculty</span>
                  <span className="text-[#8C8274] text-[11px] ml-2">
                    1,102 institutions reporting
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-[#1A1816]">
                    82.1%
                  </span>
                  <span className="text-[11px] text-[#059669] font-medium">Compliant</span>
                </div>
              </div>
              <div className="w-full bg-[#FAF8F5] border border-[#EAE6DF] h-2 rounded-full overflow-hidden">
                <div className="bg-[#1A1816] h-full rounded-full" style={{ width: '82.1%' }} />
              </div>
            </div>

            {/* Infrastructure */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#1A1816]">Infrastructure</span>
                  <span className="text-[#8C8274] text-[11px] ml-2">
                    1,164 institutions reporting
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-[#8C653B]">
                    75.6%
                  </span>
                  <span className="text-[11px] text-[#8C653B] font-medium">Needs Improvement</span>
                </div>
              </div>
              <div className="w-full bg-[#FAF8F5] border border-[#EAE6DF] h-2 rounded-full overflow-hidden">
                <div className="bg-[#8C653B] h-full rounded-full" style={{ width: '75.6%' }} />
              </div>
            </div>

            {/* Curriculum */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#1A1816]">Curriculum</span>
                  <span className="text-[#8C8274] text-[11px] ml-2">
                    1,231 institutions reporting
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-[#1A1816]">
                    79.5%
                  </span>
                  <span className="text-[11px] text-[#059669] font-medium">Compliant</span>
                </div>
              </div>
              <div className="w-full bg-[#FAF8F5] border border-[#EAE6DF] h-2 rounded-full overflow-hidden">
                <div className="bg-[#1A1816] h-full rounded-full" style={{ width: '79.5%' }} />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F2ECE2] flex items-center justify-between text-xs text-[#8C8274]">
            <span>Norm threshold for full compliance: 80.0%</span>
            <span className="text-[#8C653B] font-semibold cursor-pointer hover:underline flex items-center gap-1">
              View methodology <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Institutions Table (Left) & Initiate Check / Attention Required (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Institutions Table (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#EAE6DF] rounded-xl card-shadow overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-[#EAE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1816]">
                  Institutions
                </h3>
                <span className="text-xs text-[#8C8274]">1,248 total</span>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Compliant', 'Needs Improvement', 'Non-Compliant'] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilterTab(tab)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                        filterTab === tab
                          ? 'bg-[#1A1816] text-white'
                          : 'bg-[#FAF8F5] text-[#736B5E] hover:bg-[#F2ECE2]'
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
                <span className="text-[11px] text-[#8C8274] px-2 py-1 border border-[#EAE6DF] rounded-md">
                  Last 6 months
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#8C8274] uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Compliance Score</th>
                    <th className="py-3 px-4">Last Audit</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {filteredInstitutions.map((inst) => (
                    <tr key={inst.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#1A1816]">
                        {inst.name}
                      </td>
                      <td className="py-3.5 px-4 font-serif font-bold text-[#1A1816]">
                        {inst.complianceScore}%
                      </td>
                      <td className="py-3.5 px-4 text-[#8C8274] font-mono">
                        {inst.lastAudit}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={inst.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedInst(inst.name);
                          }}
                          className="text-[11px] font-semibold text-[#8C653B] hover:text-[#1A1816] transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t border-[#EAE6DF] bg-[#FAF8F5] flex items-center justify-between text-xs text-[#736B5E]">
            <span>Showing 8 of 1,248 institutions</span>
            <div className="flex items-center gap-1">
              <button className="px-2.5 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
                Previous
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
              <button className="px-2.5 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Initiate Check & Attention Required */}
        <div className="space-y-6">
          {/* Initiate Compliance Check (Dark High Contrast Card) */}
          <div className="bg-[#1A1816] text-white rounded-xl p-5 shadow-lg border border-[#2D2821] space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#EAE6DF]" />
              <h3 className="font-serif font-bold text-base text-white">
                Initiate Compliance Check
              </h3>
            </div>
            <p className="text-xs text-[#A8A196]">
              Select an institution to start a new compliance audit.
            </p>

            <form onSubmit={handleStartCheck} className="space-y-3 pt-1">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#A8A196]">
                  Institution
                </label>
                <select
                  value={selectedInst}
                  onChange={(e) => setSelectedInst(e.target.value)}
                  className="w-full mt-1 p-2 text-xs bg-[#2A2622] border border-[#3E3832] rounded-lg text-white focus:outline-none focus:border-[#8C653B]"
                >
                  {complianceList.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#A8A196]">
                  Audit Scope
                </label>
                <select
                  value={auditScope}
                  onChange={(e) => setAuditScope(e.target.value)}
                  className="w-full mt-1 p-2 text-xs bg-[#2A2622] border border-[#3E3832] rounded-lg text-white focus:outline-none focus:border-[#8C653B]"
                >
                  <option value="Full review, all categories">
                    Full review, all categories
                  </option>
                  <option value="Faculty cadre shortfall only">
                    Faculty cadre shortfall only
                  </option>
                  <option value="Infrastructure & Fire NOC verification">
                    Infrastructure &amp; Fire NOC verification
                  </option>
                  <option value="Curriculum & Autonomous lab audit">
                    Curriculum &amp; Autonomous lab audit
                  </option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-white text-[#1A1816] font-bold text-xs rounded-lg hover:bg-[#F2ECE2] transition-colors mt-2"
              >
                {checkStarted ? 'CHECK INITIATED!' : 'START CHECK'}
              </button>

              <p className="text-[10px] text-[#A8A196] text-center pt-1">
                Notifies the institution's compliance officer
              </p>
            </form>
          </div>

          {/* Attention Required Card */}
          <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 card-shadow space-y-4">
            <h4 className="text-[11px] uppercase font-bold tracking-wider text-[#8C8274]">
              Attention Required
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF]">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#1A1816]">
                    14 institutions below 70%
                  </p>
                  <p className="text-[11px] text-[#8C8274] mt-0.5">
                    Escalated for re-audit by 15 Jul 2026
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE6DF]">
                <Clock className="w-4 h-4 text-[#8C653B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#1A1816]">
                    32 audits overdue
                  </p>
                  <p className="text-[11px] text-[#8C8274] mt-0.5">
                    Last inspection older than 6 months
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/notifications"
              className="text-xs font-semibold text-[#8C653B] hover:text-[#1A1816] flex items-center gap-1.5 transition-colors pt-1 block"
            >
              Open alert queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
