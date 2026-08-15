'use client';

import React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

const toDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return null;
};

const getInitials = (firstName: string, lastName: string) => {
  if (!firstName && !lastName) return '...';
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const IssuesTableView = ({ issues, members, isLoading, onRowClick, onDelete }: any) => (
  <div className="border-2 rounded-lg overflow-hidden bg-card shadow-lg">
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50 border-b-2">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[120px] font-black text-[10px] uppercase tracking-widest opacity-60">Issue Key</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest opacity-60">Summary</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest opacity-60">Status</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest opacity-60">Priority</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest opacity-60">Assignee</TableHead>
            <TableHead className="hidden lg:table-cell font-black text-[10px] uppercase tracking-widest opacity-60">Due Date</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase tracking-widest opacity-60 w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}><TableCell><Skeleton className="h-4 w-16" /></TableCell><TableCell><Skeleton className="h-4 w-64" /></TableCell><TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell><TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell><TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell><TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell></TableRow>
            ))
          ) : issues && issues.length > 0 ? (
            issues.map((issue: any) => {
              const dueDate = toDate(issue.dueDate);
              const assignee = members?.find((m: any) => m.id === issue.assigneeId);
              const isDone = issue.status === 'Done' || issue.status === 'Canceled';
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const isDueTodayOrPast = dueDate && new Date(dueDate).setHours(0, 0, 0, 0) <= today.getTime();
              return(
                <TableRow key={issue.id} onClick={() => onRowClick(issue.id)} className="cursor-pointer group hover:bg-primary/[0.03] transition-colors border-b-muted/40">
                  <TableCell className="font-mono text-xs text-muted-foreground font-bold uppercase tracking-tight">{issue.key}</TableCell>
                  <TableCell><span className="font-bold text-sm text-foreground truncate max-w-[250px] lg:max-w-md block">{issue.title}</span></TableCell>
                  <TableCell><StatusBadge status={issue.status} /></TableCell>
                  <TableCell><PriorityBadge priority={issue.priority} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 border-2 border-background shadow-sm ring-2 ring-transparent group-hover:ring-primary/10 transition-all">
                            <AvatarImage src={assignee?.avatarUrl || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/5 text-primary font-black">{assignee ? getInitials(assignee.firstName, assignee.lastName) : '?'}</AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:block truncate text-xs font-bold text-muted-foreground uppercase tracking-tight">{assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned'}</span>
                    </div>
                  </TableCell>
                  <TableCell className={cn('hidden lg:table-cell text-xs font-bold uppercase tracking-tight', !isDone && isDueTodayOrPast ? 'text-rose-600' : 'text-muted-foreground opacity-70')}>{dueDate ? format(dueDate, 'dd MMM yyyy') : '-'}</TableCell>
                  <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            type="button"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 shadow-2xl border-primary/20">
                          <DropdownMenuLabel className="text-center text-[10px] uppercase font-black tracking-widest opacity-50 px-3 py-2">Quick Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => onRowClick(issue.id)} className="font-bold text-xs uppercase tracking-tight cursor-pointer py-2.5">
                            <Pencil className="mr-3 h-3.5 w-3.5 text-primary" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => onDelete(issue)} className="text-destructive font-bold text-xs uppercase tracking-tight focus:bg-destructive/10 focus:text-destructive cursor-pointer py-2.5">
                            <Trash2 className="mr-3 h-3.5 w-3.5" />
                            Delete Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (<TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground font-medium italic">No matching items found. Refining your filters or create a new task.</TableCell></TableRow>)}
        </TableBody>
      </Table>
    </div>
  </div>
);