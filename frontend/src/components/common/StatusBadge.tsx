import React from 'react';
import { cn } from '../../lib/utils';
import { SuggestionStatus, TriggerReason, ProductStatus } from '../../types';

interface StatusBadgeProps {
  status?: SuggestionStatus | ProductStatus | string;
  trigger?: TriggerReason | string;
  origin?: 'AUTO' | 'MANUAL';
  className?: string;
}

export function StatusBadge({ status, trigger, origin, className }: StatusBadgeProps) {
  // Suggestion / Product status styles
  if (status) {
    const s = status.toUpperCase();
    if (s === 'PENDING' || s === 'PRICE_REVIEW_PENDING') {
      return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80", className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
          {s === 'PRICE_REVIEW_PENDING' ? 'REVIEW PENDING' : 'PENDING'}
        </span>
      );
    }
    if (s === 'ACCEPTED' || s === 'APPROVED' || s === 'EXECUTED' || s === 'ACTIVE') {
      return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80", className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          {s}
        </span>
      );
    }
    if (s === 'REJECTED' || s === 'CANCELLED' || s === 'OUT_OF_STOCK') {
      return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/80", className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
          {s === 'OUT_OF_STOCK' ? 'OUT OF STOCK' : s}
        </span>
      );
    }
  }

  // Trigger reason badges
  if (trigger) {
    const t = trigger.toUpperCase();
    if (t === 'INVENTORY_LOW' || t === 'CRITICAL_STOCK') {
      return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200 tracking-wide", className)}>
          ⚠️ LOW STOCK
        </span>
      );
    }
    if (t === 'DEMAND_SPIKE') {
      return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 tracking-wide", className)}>
          🔥 DEMAND SPIKE
        </span>
      );
    }
    if (t === 'MANUAL') {
      return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 tracking-wide", className)}>
          👤 MANUAL
        </span>
      );
    }
  }

  // Origin badges
  if (origin === 'AUTO') {
    return (
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200", className)}>
        AUTO-TRIGGERED
      </span>
    );
  }
  if (origin === 'MANUAL') {
    return (
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200", className)}>
        MANUAL REQUEST
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800", className)}>
      {status || trigger}
    </span>
  );
}
