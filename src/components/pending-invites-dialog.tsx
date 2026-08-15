'use client';
import { useMemo, useState, useEffect } from 'react';
import {
  collection,
  Timestamp,
} from 'firebase/firestore';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
  WithId,
} from '@/firebase';
import { revokeInvite, resendInvite } from '@/app/actions/user-org-actions';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Mail, XCircle, X, ShieldAlert, History, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Invite {
  email: string;
  role: string;
  createdAt: Timestamp;
}

type InviteWithId = WithId<Invite>;

interface PendingInvitesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PendingInvitesDialog({
  open,
  onOpenChange,
}: PendingInvitesDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const organizationId = user?.organizationId;

  const invitesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'invites');
  }, [firestore, organizationId]);

  const { data: pendingInvites, isLoading: invitesLoading } =
    useCollection<Invite>(invitesQuery);

  const handleRevoke = async (invite: InviteWithId) => {
    if (!organizationId) return;
    setProcessingId(invite.id);

    try {
      const result = await revokeInvite({ organizationId, inviteId: invite.id });
      if (result.success) {
        toast({
          title: 'Invitation Revoked',
          description: `The invitation for ${invite.email} has been revoked.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Revoke',
          description: result.error || 'An unknown error occurred.',
        });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleResend = async (invite: InviteWithId) => {
    if (!organizationId) return;
    setProcessingId(invite.id);

    try {
      const result = await resendInvite({ organizationId, inviteId: invite.id });
      if (result.success) {
        toast({
          title: 'Invitation Resent',
          description: `A new invitation has been sent to ${invite.email}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Resend',
          description: result.error || 'An unknown error occurred.',
        });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const toDate = (timestamp: Timestamp | Date | null | undefined): Date | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp;
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    return null;
  };
  
  const isLoading = invitesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary shadow-sm">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl">Pending Invitations</DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-70">
                Awaiting team onboarding
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="space-y-4 p-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-3 w-3/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingInvites && pendingInvites.length > 0 ? (
              pendingInvites.map((invite) => {
                const creationDate = toDate(invite.createdAt);
                const isProcessing = processingId === invite.id;

                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-muted group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 border shadow-sm">
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                          {invite.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm truncate">{invite.email}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="h-4 text-[9px] px-1.5 font-black uppercase tracking-tighter bg-primary/10 text-primary/80">
                                {invite.role}
                            </Badge>
                            {creationDate && (
                                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                    <History className="h-2.5 w-2.5" />
                                    {formatDistanceToNow(creationDate, { addSuffix: true })}
                                </span>
                            )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              onClick={() => handleResend(invite)}
                              disabled={!!processingId}
                            >
                              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Resend Invitation</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleRevoke(invite)}
                              disabled={!!processingId}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Revoke Invitation</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
                    <Mail className="h-6 w-6 text-muted-foreground opacity-20" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-40">No pending invitations</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 bg-muted/30 border-t flex justify-center">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                <ShieldAlert className="h-3 w-3" />
                Invitations expire in 7 days
            </p>
        </div>
        
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
