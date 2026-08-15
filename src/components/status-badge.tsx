'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { Circle, Clock, CheckCircle2, XCircle, ShieldAlert, CircleDashed, Eye } from 'lucide-react';

export type IssueStatus = 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Done' | 'Canceled' | 'Blocked';

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const statusConfigMap: Record<IssueStatus, StatusConfig> = {
  'Backlog': { 
    label: 'Backlog', 
    icon: CircleDashed, 
    color: 'text-slate-900 dark:text-slate-100', 
    bgColor: 'bg-slate-200 dark:bg-slate-800', 
    borderColor: 'border-slate-500 dark:border-slate-400' 
  },
  'To Do': { 
    label: 'To Do', 
    icon: Circle, 
    color: 'text-blue-700 dark:text-blue-200', 
    bgColor: 'bg-blue-500/15 dark:bg-blue-900/60', 
    borderColor: 'border-blue-500 dark:border-blue-400' 
  },
  'In Progress': { 
    label: 'In Progress', 
    icon: Clock, 
    color: 'text-amber-700 dark:text-amber-200', 
    bgColor: 'bg-amber-500/20 dark:bg-amber-900/60', 
    borderColor: 'border-amber-500 dark:border-amber-400' 
  },
  'In Review': { 
    label: 'In Review', 
    icon: Eye, 
    color: 'text-indigo-700 dark:text-indigo-200', 
    bgColor: 'bg-indigo-500/15 dark:bg-indigo-900/60', 
    borderColor: 'border-indigo-500 dark:border-indigo-400' 
  },
  'Done': { 
    label: 'Done', 
    icon: CheckCircle2, 
    color: 'text-emerald-700 dark:text-emerald-200', 
    bgColor: 'bg-emerald-500/20 dark:bg-emerald-900/60', 
    borderColor: 'border-emerald-500 dark:border-emerald-400' 
  },
  'Canceled': { 
    label: 'Canceled', 
    icon: XCircle, 
    color: 'text-zinc-700 dark:text-zinc-200', 
    bgColor: 'bg-zinc-200 dark:bg-zinc-800', 
    borderColor: 'border-zinc-500 dark:border-zinc-400' 
  },
  'Blocked': { 
    label: 'Blocked', 
    icon: ShieldAlert, 
    color: 'text-rose-700 dark:text-rose-200', 
    bgColor: 'bg-rose-500/15 dark:bg-rose-900/60', 
    borderColor: 'border-rose-500 dark:border-rose-400' 
  },
};

const StatusBadgeComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { status: IssueStatus }
>(({ status, className, ...props }, ref) => {
  const config = statusConfigMap[status] || { 
    label: 'Unknown', 
    icon: Circle, 
    color: 'text-gray-700', 
    bgColor: 'bg-muted', 
    borderColor: 'border-transparent' 
  };

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
      <config.icon className={cn('h-3.5 w-3.5 flex-none')} />
      <span className="whitespace-nowrap">{config.label}</span>
    </div>
  );
});

StatusBadgeComponent.displayName = 'StatusBadge';

export const StatusBadge = Object.assign(StatusBadgeComponent, {
    statusConfig: statusConfigMap,
});
