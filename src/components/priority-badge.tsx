'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { SignalHigh, SignalMedium, SignalLow, ShieldAlert, Ban } from 'lucide-react';

export type IssuePriority = 'None' | 'Low' | 'Medium' | 'High' | 'Urgent';

interface PriorityConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  iconClassName: string;
  className: string; 
}

const priorityConfigMap: Record<IssuePriority, PriorityConfig> = {
  'None': { 
    label: 'None', 
    icon: Ban, 
    color: 'text-slate-900 dark:text-slate-100', 
    bgColor: 'bg-slate-100 dark:bg-slate-800', 
    borderColor: 'border-slate-500 dark:border-slate-400',
    iconClassName: 'text-slate-500',
    className: 'bg-slate-100 border-slate-500 text-slate-900 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100'
  },
  'Low': { 
    label: 'Low', 
    icon: SignalLow, 
    color: 'text-blue-700 dark:text-blue-200', 
    bgColor: 'bg-blue-500/10 dark:bg-blue-900/60', 
    borderColor: 'border-blue-500 dark:border-blue-400',
    iconClassName: 'text-blue-600',
    className: 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900/60 dark:border-blue-700 dark:text-blue-100'
  },
  'Medium': { 
    label: 'Medium', 
    icon: SignalMedium, 
    color: 'text-amber-700 dark:text-amber-200', 
    bgColor: 'bg-amber-500/15 dark:bg-amber-900/60', 
    borderColor: 'border-amber-500 dark:border-amber-400',
    iconClassName: 'text-amber-600',
    className: 'bg-amber-100 border-amber-500 text-amber-900 dark:bg-amber-900/60 dark:border-amber-700 dark:text-amber-100'
  },
  'High': { 
    label: 'High', 
    icon: SignalHigh, 
    color: 'text-orange-700 dark:text-orange-100', 
    bgColor: 'bg-orange-500/15 dark:bg-orange-950/60', 
    borderColor: 'border-orange-500 dark:border-orange-400',
    iconClassName: 'text-orange-600',
    className: 'bg-orange-100 border-orange-500 text-orange-900 dark:bg-orange-950/60 dark:border-orange-800 dark:text-orange-100'
  },
  'Urgent': { 
    label: 'Urgent', 
    icon: ShieldAlert, 
    color: 'text-rose-700 dark:text-rose-200', 
    bgColor: 'bg-rose-500/15 dark:bg-rose-900/60', 
    borderColor: 'border-rose-500 dark:border-rose-400',
    iconClassName: 'text-rose-600',
    className: 'bg-rose-100 border-rose-500 text-rose-900 dark:bg-rose-900/60 dark:border-rose-700 dark:text-rose-100'
  },
};

const PriorityBadgeComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { priority: IssuePriority }
>(({ priority, className, ...props }, ref) => {
  const config = priorityConfigMap[priority] || priorityConfigMap['None'];

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center gap-x-1.5 rounded-md px-2.5 py-1 text-[11px] font-black uppercase tracking-widest transition-all duration-200 border-2 shadow-sm',
        config.bgColor,
        config.borderColor,
        config.color,
        className
      )}
      {...props}
    >
      <config.icon className={cn('h-3.5 w-3.5 flex-none', config.iconClassName)} />
      <span className="whitespace-nowrap">{config.label}</span>
    </div>
  );
});

PriorityBadgeComponent.displayName = 'PriorityBadge';

export const PriorityBadge = Object.assign(PriorityBadgeComponent, {
  priorityConfig: priorityConfigMap,
});
