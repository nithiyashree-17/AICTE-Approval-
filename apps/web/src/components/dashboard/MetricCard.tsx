'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  subtextHighlight?: boolean;
  subtextType?: 'default' | 'danger' | 'success';
  icon?: LucideIcon;
  actionIcon?: LucideIcon;
  className?: string;
  isHero?: boolean;
}

export function MetricCard({
  label,
  value,
  subtext,
  subtextType = 'default',
  icon: Icon,
  actionIcon: ActionIcon,
  className,
  isHero = false,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-[#EAE6DF] rounded-xl p-6 card-shadow flex flex-col justify-between transition-all duration-150',
        className
      )}
    >
      <div className="flex items-center justify-between text-[#736B5E]">
        <span className="text-[11px] font-semibold tracking-wider uppercase">
          {label}
        </span>
        {ActionIcon && (
          <button className="text-[#8C8274] hover:text-[#1A1816] transition-colors p-1">
            <ActionIcon className="w-3.5 h-3.5" />
          </button>
        )}
        {Icon && !ActionIcon && (
          <Icon className="w-4 h-4 text-[#8C8274]" />
        )}
      </div>

      <div className="my-3">
        <span
          className={cn(
            'font-serif font-medium tracking-tight text-[#1A1816]',
            isHero ? 'text-4xl' : 'text-3xl'
          )}
        >
          {value}
        </span>
      </div>

      {subtext && (
        <div className="text-xs">
          {subtextType === 'danger' ? (
            <span className="font-semibold text-[#DC2626]">{subtext}</span>
          ) : subtextType === 'success' ? (
            <span className="font-semibold text-[#059669]">{subtext}</span>
          ) : (
            <span className="text-[#8C8274]">{subtext}</span>
          )}
        </div>
      )}
    </div>
  );
}
