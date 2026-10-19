'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className, size = 'sm' }: StatusBadgeProps) {
  const norm = status.toLowerCase();

  let styles = 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]';
  let dotColor = 'bg-[#6B7280]';

  if (norm.includes('approved') || norm.includes('compliant') && !norm.includes('non')) {
    styles = 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';
    dotColor = 'bg-[#10B981]';
  } else if (norm.includes('under review') || norm.includes('needs improvement') || norm.includes('medium')) {
    styles = 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
    dotColor = 'bg-[#F59E0B]';
  } else if (norm.includes('committee') || norm.includes('read')) {
    styles = 'bg-[#F5EFE6] text-[#684E31] border-[#E3D7C5]';
    dotColor = 'bg-[#8C653B]';
  } else if (norm.includes('rejected') || norm.includes('non-compliant') || norm.includes('critical')) {
    styles = 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
    dotColor = 'bg-[#EF4444]';
  } else if (norm.includes('high')) {
    styles = 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]';
    dotColor = 'bg-[#EA580C]';
  } else if (norm.includes('resolved')) {
    styles = 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
    dotColor = 'bg-[#22C55E]';
  } else if (norm.includes('submitted') || norm.includes('unread')) {
    styles = 'bg-[#F7F5F0] text-[#5C5449] border-[#E5E0D8]';
    dotColor = 'bg-[#8C8274]';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        styles,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
      {status}
    </span>
  );
}
