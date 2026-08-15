'use client';
import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase, WithId } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InviteMemberDialog } from '@/components/invite-member-dialog';
import { MoreVertical, PlusCircle, Trash2, Edit, Send, Link as LinkIcon, Users, ShieldCheck, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { removeMember, revokeInvite, resendInvite } from '@/app/actions/user-org-actions';
import { EditRoleDialog } from '@/components/edit-role-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string;
}

interface Invite {
  email: string;
  role: string;
  createdAt: Timestamp;
}

type InviteWithId = WithId<Invite>;


const getInitials = (firstName: string, lastName: string) => {
  if (!firstName || !lastName) return '';
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

const toDate = (timestamp: Timestamp | Date | null | undefined): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return null;
};


export default function UsersAccessPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [inviteToRevoke, setInviteToRevoke] = useState<InviteWithId | null>(null);


  useEffect(() => {
    setMounted(true);
  }, []);

  const organizationId = user?.organizationId;

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'members');
  }, [firestore, organizationId]);

  const { data: members, isLoading: membersLoading } = useCollection<Member>(membersQuery);

  const invitesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'invites');
  }, [firestore, organizationId]);

  const { data: invites, isLoading: invitesLoading } = useCollection<Invite>(invitesQuery);
  
  const handleRemoveMember = async () => {
    if (!memberToRemove || !organizationId) return;

    const result = await removeMember({
      organizationId,
      memberId: memberToRemove.id,
    });

    if (result.success) {
      toast({
        title: 'Member Removed',
        description: `${memberToRemove.firstName} ${memberToRemove.lastName} has been removed from the organization.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Remove Member',
        description: result.error || 'An unknown error occurred.',
      });
    }
    setMemberToRemove(null);
  };

  const handleRevokeInvite = async () => {
    if (!inviteToRevoke || !organizationId) return;

    const result = await revokeInvite({
      organizationId,
      inviteId: inviteToRevoke.id,
    });

    if (result.success) {
      toast({
        title: 'Invitation Revoked',
        description: `The invitation for ${inviteToRevoke.email} has been successfully revoked.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Revoke Invitation',
        description: result.error || 'An unknown error occurred.',
      });
    }
    setInviteToRevoke(null);
  };
  
  const handleResendInvite = async (invite: InviteWithId) => {
    if (!organizationId) return;

    const result = await resendInvite({
      organizationId,
      inviteId: invite.id,
    });

    if (result.success) {
      toast({
        title: 'Invitation Resent',
        description: `Invitation has been resent to ${invite.email}.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Resend',
        description: result.error || 'An unknown error occurred.',
      });
    }
  };
  
  const handleCopyInviteLink = (inviteId: string) => {
    const inviteUrl = `${window.location.origin}/invite?token=${inviteId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
        title: "Invite Link Copied",
        description: "The invite link has been copied to your clipboard.",
    });
  };
  
  const isLoading = membersLoading || invitesLoading;


  return (
    <>
      <InviteMemberDialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen} />
      <EditRoleDialog open={!!memberToEdit} onOpenChange={(open) => !open && setMemberToEdit(null)} member={memberToEdit} />
       <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently remove {memberToRemove?.firstName} {memberToRemove?.lastName} from the organization. They will lose all access. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!inviteToRevoke} onOpenChange={(open) => !open && setInviteToRevoke(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to revoke this invitation?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will cancel the invitation for {inviteToRevoke?.email}. They will not be able to join the organization unless you invite them again.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevokeInvite}>Revoke Invitation</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight">Users & Access</h3>
            <p className="text-sm text-muted-foreground">
              Manage your team's lifecycle and organizational permissions.
            </p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto shadow-lg shadow-primary/20 font-bold h-11">
            <PlusCircle className="mr-2 h-5 w-5" />
            Invite User
          </Button>
        </div>

        <Card className="border-muted/60 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/20 border-b pb-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Members
            </CardTitle>
            <CardDescription>
              Current active users within the organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent border-b-muted/40">
                    <TableHead className="w-[300px] py-4 pl-6 text-xs font-black uppercase tracking-widest opacity-70">User Profile</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest opacity-70">Access Level</TableHead>
                    <TableHead className="text-right pr-6 text-xs font-black uppercase tracking-widest opacity-70">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i} className="border-b-muted/20">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                             <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : members && members.length > 0 ? (
                    members.map((member) => {
                      const isSelf = member.id === user?.uid;
                      return (
                        <TableRow key={member.id} className="group hover:bg-primary/[0.02] transition-colors border-b-muted/40">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-muted shadow-sm">
                                <AvatarImage src={member.avatarUrl} />
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate flex items-center gap-2">
                                  {member.firstName} {member.lastName}
                                  {isSelf && <Badge variant="secondary" className="text-[8px] h-3 px-1 font-black uppercase tracking-tighter">You</Badge>}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate opacity-70">{member.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-widest border-primary/20 bg-primary/5 text-primary/80">{member.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                             {!mounted ? <Skeleton className="h-8 w-8 ml-auto" /> : (
                               <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-50 px-3 py-2 text-center">Manage Member</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setMemberToEdit(member); }}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Permissions
                                  </DropdownMenuItem>
                                  {!isSelf && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 font-bold" onSelect={(e) => { e.preventDefault(); setMemberToRemove(member); }}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Remove from Org
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                               </DropdownMenu>
                             )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                     <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground italic text-sm">
                        No members found in this organization.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted/60 shadow-sm overflow-hidden bg-card/50">
          <CardHeader className="bg-muted/20 border-b pb-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-amber-500" />
              Pending Invitations
              {invites && invites.length > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white font-black text-[10px] h-5 px-1.5 min-w-[20px] justify-center">
                  {invites.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Users who have not yet accepted their workspace invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
              <Table>
                  <TableHeader className="bg-muted/10">
                      <TableRow className="hover:bg-transparent border-b-muted/40">
                          <TableHead className="w-[300px] py-4 pl-6 text-xs font-black uppercase tracking-widest opacity-70">Invite Recipient</TableHead>
                          <TableHead className="text-xs font-black uppercase tracking-widest opacity-70">Assigned Role</TableHead>
                          <TableHead className="text-xs font-black uppercase tracking-widest opacity-70 hidden sm:table-cell">Sent Date</TableHead>
                           <TableHead className="text-right pr-6 text-xs font-black uppercase tracking-widest opacity-70">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                   <TableBody>
                  {isLoading ? (
                    [...Array(2)].map((_, i) => (
                      <TableRow key={i} className="border-b-muted/20">
                          <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : invites && invites.length > 0 ? (
                      invites.map((invite) => {
                           const invitedAt = toDate(invite.createdAt);
                          return (
                              <TableRow key={invite.id} className="group hover:bg-amber-[0.02] transition-colors border-b-muted/40">
                                  <TableCell className="pl-6 py-4">
                                      <div className="flex flex-col">
                                          <span className="font-bold text-sm truncate">{invite.email}</span>
                                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                              <History className="h-2.5 w-2.5" />
                                              Created via invite
                                          </span>
                                      </div>
                                  </TableCell>
                                  <TableCell><Badge variant="outline" className="font-bold text-[10px] uppercase tracking-widest border-amber-200 bg-amber-50 text-amber-700">{invite.role}</Badge></TableCell>
                                  <TableCell className="text-[11px] text-muted-foreground font-medium whitespace-nowrap hidden sm:table-cell">
                                      {invitedAt ? formatDistanceToNow(invitedAt, { addSuffix: true }) : '...'}
                                  </TableCell>
                                  <TableCell className="text-right pr-6">
                                      {!mounted ? <Skeleton className="h-8 w-8 ml-auto" /> : <DropdownMenu modal={false}>
                                          <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 hover:bg-amber-100 transition-all h-8 w-8">
                                                  <MoreVertical className="h-4 w-4" />
                                              </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-52 shadow-2xl border-amber-200/50">
                                              <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-50 px-3 py-2 text-center">Invitation Actions</DropdownMenuLabel>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem onSelect={() => handleResendInvite(invite)} className="text-xs font-semibold cursor-pointer">
                                                  <Send className="mr-2 h-3.5 w-3.5 text-amber-600" />
                                                  Resend Link
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onSelect={() => handleCopyInviteLink(invite.id)} className="text-xs font-semibold cursor-pointer">
                                                  <LinkIcon className="mr-2 h-3.5 w-3.5" />
                                                  Copy Secure URL
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 font-bold text-xs cursor-pointer" onSelect={(e) => { e.preventDefault(); setInviteToRevoke(invite); }}>
                                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                  Revoke Invite
                                              </DropdownMenuItem>
                                          </DropdownMenuContent>
                                      </DropdownMenu>}
                                  </TableCell>
                              </TableRow>
                          )
                      })
                  ) : (
                      <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic text-sm">
                              No pending invitations at this time.
                          </TableCell>
                      </TableRow>
                  )}
                   </TableBody>
               </Table>
             </div>
          </CardContent>
        </Card>
        
        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest pt-4 border-t border-muted/60">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>RBAC Enforcement Active • TaskMaster v2.4.0</span>
        </div>
      </div>
    </>
  );
}
