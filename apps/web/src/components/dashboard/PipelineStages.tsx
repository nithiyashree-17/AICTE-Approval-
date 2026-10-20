'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Application } from '@/lib/types';

interface PipelineStagesProps {
  applications: Application[];
  onRefresh?: () => void;
}

export function PipelineStages({ applications, onRefresh }: PipelineStagesProps) {
  // Compute live stage breakdown directly from database records
  const total = applications.length;
  const submittedCount = applications.filter((a) => a.status === 'Submitted').length;
  const reviewCount = applications.filter((a) => a.status === 'Under Review').length;
  const committeeCount = applications.filter((a) => a.status === 'Committee').length;
  const approvedCount = applications.filter((a) => a.status === 'Approved').length;

  const stages = [
    {
      label: 'SUBMITTED',
      count: submittedCount,
      pct: total > 0 ? `${Math.round((submittedCount / total) * 100)}%` : '0%',
      active: submittedCount > 0,
    },
    {
      label: 'UNDER REVIEW',
      count: reviewCount,
      pct: total > 0 ? `${Math.round((reviewCount / total) * 100)}%` : '0%',
      active: reviewCount > 0,
    },
    {
      label: 'COMMITTEE',
      count: committeeCount,
      pct: total > 0 ? `${Math.round((committeeCount / total) * 100)}%` : '0%',
      active: committeeCount > 0,
    },
    {
      label: 'APPROVED',
      count: approvedCount,
      pct: total > 0 ? `${Math.round((approvedCount / total) * 100)}%` : '0%',
      active: approvedCount > 0,
    },
  ];

  return (
    <div className="bg-white border border-[#EAE6DF] rounded-xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-serif font-bold text-lg text-[#1A1816]">
            Pipeline Stages
          </h2>
          <p className="text-xs text-[#8C8274] mt-0.5">
            Distribution of {total} live applications across current statutory stages
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#5C5449] border border-[#EAE6DF] rounded-lg hover:bg-[#FAF8F5] transition-colors"
        >
          <RotateCcw className="w-3 h-3 text-[#8C653B]" />
          REFRESH
        </button>
      </div>

      {/* Visual Progress Connector */}
      <div className="relative py-4 px-6">
        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-[#EAE6DF] -translate-y-1/2" />
        <div className="relative flex justify-between items-center z-10">
          {stages.map((stage, idx) => (
            <div key={stage.label} className="flex flex-col items-center">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 ${
                  idx < 3
                    ? 'border-[#1A1816] bg-white'
                    : 'border-[#8C653B] bg-[#8C653B]'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Numerical Breakdowns */}
      <div className="grid grid-cols-4 gap-4 pt-3 border-t border-[#F2ECE2] text-left">
        {stages.map((stage) => (
          <div key={stage.label} className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif font-bold text-xl text-[#1A1816]">
                {stage.count}
              </span>
              <span className="text-[11px] text-[#8C8274] font-medium">
                {stage.pct}
              </span>
            </div>
            <p className="text-[11px] tracking-wider uppercase font-semibold text-[#736B5E]">
              {stage.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
