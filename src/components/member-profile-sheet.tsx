'use client';

import React from 'react';
import { 
  User, 
  ShieldCheck
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export type MemberStatus = 'Online' | 'Offline' | 'Active' | 'active';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string;
  status: MemberStatus;
  email: string;
}

const getInitials = (firstName: string, lastName: string) => {
  if (!firstName || !lastName) return '';
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

export const StatusIndicator = ({ status }: { status: MemberStatus }) => {
  const baseClasses =
    'h-3 w-3 rounded-full absolute bottom-0 right-0 border-2 border-background';
  let colorClass = '';
  switch (status) {
    case 'Online':
      colorClass = 'bg-green-500';
      break;
    case 'Active':
    case 'active':
      colorClass = 'bg-yellow-500';
      break;
    case 'Offline':
      colorClass = 'bg-gray-400';
      break;
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(baseClasses, colorClass)}></div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-[10px] font-bold uppercase tracking-widest">{status === 'active' ? 'Active' : status}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface MemberProfileSheetProps {
  member: Member | null;
  onClose: () => void;
  activeTaskCount: number;
  isTaskCountLoading: boolean;
}

export function MemberProfileSheet({
  member,
  onClose,
  activeTaskCount,
  isTaskCountLoading,
}: MemberProfileSheetProps) {
  const isMobile = useIsMobile();

  if (!member) return null;

  return (
    <Sheet open={!!member} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'p-0 border-none flex flex-col',
          isMobile ? 'h-[90%]' : 'w-full md:max-w-md'
        )}
      >
        <SheetHeader className="p-6 pb-4 border-b bg-muted/20">
          <SheetTitle className="text-lg">Team Identity Profile</SheetTitle>
          <SheetDescription className="text-xs uppercase font-bold tracking-widest opacity-70">
            Internal record details
          </SheetDescription>
        </SheetHeader>
        <div className="p-6 space-y-8 overflow-y-auto">
          <div className="flex flex-col items-center space-y-4 pt-4">
            <div className="relative">
              <Avatar className="h-28 w-24 border-4 border-background shadow-xl rounded-3xl">
                <AvatarImage
                  src={member.avatarUrl}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="object-cover"
                />
                <AvatarFallback className="text-3xl bg-primary/5 text-primary rounded-3xl">
                  {getInitials(member.firstName, member.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <StatusIndicator status={member.status} />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                {member.firstName} {member.lastName}
              </h2>
              <p className="text-muted-foreground font-medium text-sm">{member.email}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 rounded-xl border-2 border-muted/60 bg-card/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Access Level</span>
              </div>
              <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest bg-primary/5 border-primary/20 text-primary">
                {member.role}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-2 p-4 rounded-xl border-2 border-muted/60 bg-card/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Status</span>
                  <span className="font-bold text-sm">{member.status === 'active' ? 'Active' : member.status}</span>
               </div>
               <div className="flex flex-col gap-2 p-4 rounded-xl border-2 border-muted/60 bg-card/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Assigned Items</span>
                  <span className="font-black text-lg tracking-tighter text-primary">
                    {isTaskCountLoading ? (
                      <Skeleton className="h-6 w-6" />
                    ) : (
                      activeTaskCount
                    )}
                  </span>
               </div>
            </div>
          </div>
        </div>
        
        <div className="mt-auto p-6 bg-muted/30 border-t flex justify-center">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Authorized Workspace Member
            </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
