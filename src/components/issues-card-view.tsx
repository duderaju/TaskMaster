'use client';

import React from 'react';
import { Bug, Book, CheckSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/status-badge';
import { PriorityBadge } from '@/components/priority-badge';

const getInitials = (firstName: string, lastName: string) => {
  if (!firstName && !lastName) return '...';
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const issueTypeIcons: any = {
  Bug: Bug,
  Story: Book,
  Task: CheckSquare,
};

export const IssuesCardView = ({ issues, members, isLoading, onCardClick }: any) => (
  <div className="grid grid-cols-1 gap-3">
    {isLoading ? (
      [...Array(5)].map((_, i) => (
        <Card key={i} className="border-muted/60 shadow-sm"><CardContent className="p-4 space-y-3"><div className="flex justify-between items-center"><Skeleton className="h-4 w-16" /><Skeleton className="h-6 w-6 rounded-full" /></div><Skeleton className="h-5 w-3/4" /><div className="flex items-center gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div></CardContent></Card>))
    ) : issues && issues.length > 0 ? (
      issues.map((issue: any) => {
        const IssueIcon = issueTypeIcons[issue.type] || CheckSquare;
        const assignee = members?.find((m: any) => m.id === issue.assigneeId);
        return (
          <Card key={issue.id} onClick={() => onCardClick(issue.id)} className="cursor-pointer border-muted/60 hover:border-primary/30 transition-all active:scale-[0.98] active:bg-muted/20 shadow-sm group">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <IssueIcon className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
                  <span className="text-[11px] text-muted-foreground font-mono font-bold tracking-tight uppercase">{issue.key}</span>
                </div>
                <Avatar className="h-6 w-6 ring-2 ring-transparent group-hover:ring-primary/10 transition-all shadow-sm">
                  <AvatarImage src={assignee?.avatarUrl || undefined} />
                  <AvatarFallback className="text-[9px] bg-primary/5 text-primary font-black">{assignee ? getInitials(assignee.firstName, assignee.lastName) : '?'}</AvatarFallback>
                </Avatar>
              </div>
              <p className="font-bold text-sm text-foreground line-clamp-2 leading-tight mb-4">{issue.title}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 scale-90 -ml-2">
                  <StatusBadge status={issue.status} />
                </div>
                <div className="scale-90 -mr-2">
                  <PriorityBadge priority={issue.priority} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })
    ) : (<Card className="border-dashed bg-muted/10"><CardContent className="h-32 flex items-center justify-center text-center text-muted-foreground font-medium text-sm">No work items found in this view.</CardContent></Card>)}
  </div>
);
