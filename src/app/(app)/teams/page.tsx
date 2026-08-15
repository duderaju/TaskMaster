'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import {
  MoreVertical,
  Users,
  LayoutGrid,
  List,
  Search,
  ChevronDown,
  PlusCircle,
  Mail,
  Trash2,
  UserCheck,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { InviteMemberDialog } from '@/components/invite-member-dialog';
import { PendingInvitesDialog } from '@/components/pending-invites-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
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
import { CreateIssueDialog } from '@/components/create-issue-dialog';
import { removeMember } from '@/app/actions/user-org-actions';
import { MemberProfileSheet, type Member, StatusIndicator } from '@/components/member-profile-sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { USER_ROLES } from '@/lib/constants';

const getInitials = (firstName: string, lastName: string) => {
  if (!firstName || !lastName) return '';
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

export default function TeamsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const organizationId = user?.organizationId;
  const isMobile = useIsMobile();

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // 1. Members Subscription
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'members');
  }, [firestore, organizationId]);

  const { data: teamMembers, isLoading: membersLoading } = useCollection<Member>(membersQuery);
    
  // 2. Pending Invites Subscription
  const invitesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'invites');
  }, [firestore, organizationId]);

  const { data: pendingInvites, isLoading: invitesLoading } = useCollection<any>(invitesQuery);

  // 3. Active Issues Subscription
  const allActiveIssuesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return query(
        collection(firestore, 'organizations', organizationId, 'issues'),
        where('status', 'in', ['To Do', 'In Progress', 'Backlog', 'Blocked'])
    );
  }, [firestore, organizationId]);
  
  const { data: allActiveIssues, isLoading: allIssuesLoading } = useCollection(allActiveIssuesQuery);
  
  const memberTaskCounts = useMemo(() => {
      if (!allActiveIssues) return {};
      const counts: { [memberId: string]: number } = {};
      for (const issue of allActiveIssues) {
          if (issue.assigneeId) {
              counts[issue.assigneeId] = (counts[issue.assigneeId] || 0) + 1;
          }
      }
      return counts;
  }, [allActiveIssues]);

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isPendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [memberToAssign, setMemberToAssign] = useState<string | undefined>(undefined);
  const [isAssignTaskDialogOpen, setAssignTaskDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [viewedMember, setViewedMember] = useState<Member | null>(null);

  useEffect(() => {
    setMounted(true);
    if (isMobile) {
      setView('grid');
    }
  }, [isMobile]);

  const handleAssignTaskDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setMemberToAssign(undefined);
    }
    setAssignTaskDialogOpen(open);
  }, []);

  const handleCloseProfileSheet = useCallback(() => {
    setViewedMember(null);
  }, []);

  const filteredMembers = useMemo(() => {
    if (!teamMembers) return [];
    return teamMembers.filter((member) => {
      const name = `${member.firstName} ${member.lastName}`;
      const nameMatch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const roleMatch = selectedRole === 'All' || member.role === selectedRole;
      return nameMatch && roleMatch;
    });
  }, [searchQuery, selectedRole, teamMembers]);

  const handleAssignTask = (member: Member) => {
    setMemberToAssign(member.id);
    setAssignTaskDialogOpen(true);
  };

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

  const isLoading = isUserLoading || membersLoading || allIssuesLoading || invitesLoading;

  const EmptyState = () => (
    <div className="text-center py-16 border-2 border-dashed rounded-3xl animate-slide-up-and-fade-in mx-auto max-w-lg bg-muted/5">
      <Users className="mx-auto h-14 w-14 text-muted-foreground opacity-30 mb-6" />
      <h3 className="text-xl font-bold tracking-tight">Expand your team</h3>
      <p className="mt-2 text-sm text-muted-foreground px-8">
        Invite collaboration partners to your organization to start building your professional workspace.
      </p>
      {isAdmin && (
        <div className="mt-8">
          <Button onClick={() => setInviteDialogOpen(true)} className="shadow-lg shadow-primary/20">
            <PlusCircle className="mr-2 h-4 w-4" /> Send first invite
          </Button>
        </div>
      )}
    </div>
  );

  const renderGridView = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="border-muted/60 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredMembers.map((member) => {
          const isSelf = member.id === user?.uid;
          return (
            <Card
              key={member.id}
              className="transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 flex flex-col group border-muted/60 bg-card/50 backdrop-blur-sm overflow-hidden"
            >
              <CardHeader className="flex-grow pb-4">
                <div className="flex justify-between items-start">
                  <div className="relative">
                    <Avatar className="h-14 w-14 rounded-2xl shadow-md border-2 border-background">
                      <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} className="object-cover" />
                      <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                        {getInitials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <StatusIndicator status={member.status} />
                  </div>
                  {!mounted ? (
                    <Skeleton className="h-8 w-8" />
                  ) : (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 shadow-2xl border-primary/10">
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setViewedMember(member); }}>
                          <UserCheck className="mr-2 h-4 w-4" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleAssignTask(member); }}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Assign Task
                        </DropdownMenuItem>
                        {isAdmin && !isSelf && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 font-bold" onSelect={(e) => { e.preventDefault(); setMemberToRemove(member); }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Remove Member
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <CardTitle className="text-lg mt-4 font-bold flex items-center gap-2 tracking-tight">
                  {member.firstName} {member.lastName}
                  {isSelf && <Badge variant="secondary" className="text-[8px] h-3.5 px-1 font-black uppercase tracking-tighter bg-primary/10 text-primary">You</Badge>}
                </CardTitle>
                <CardDescription className="font-bold text-[10px] text-primary/70 uppercase tracking-widest opacity-80">{member.role}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_5px_hsl(var(--primary))]" />
                    {memberTaskCounts[member.id] || 0} items
                  </div>
                  <span className="font-medium lowercase italic opacity-50">active capacity</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    if (isLoading) {
      return (
        <div className="border-2 rounded-lg overflow-hidden bg-card shadow-sm">
           <Table>
             <TableHeader className="bg-muted/50">
               <TableRow>
                 <TableHead className="w-[300px] text-[10px] uppercase font-black tracking-widest opacity-60">Team Member</TableHead>
                 <TableHead className="text-[10px] uppercase font-black tracking-widest opacity-60">Access Level</TableHead>
                 <TableHead className="text-[10px] uppercase font-black tracking-widest opacity-60">Status</TableHead>
                 <TableHead className="text-right pr-8 text-[10px] uppercase font-black tracking-widest opacity-60">Capacity</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {[...Array(5)].map((_, i) => (
                 <TableRow key={i}>
                   <TableCell className="pl-8 py-4"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                   <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                   <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                   <TableCell className="text-right pr-8"><Skeleton className="h-6 w-8 ml-auto" /></TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
        </div>
      );
    }

    return (
      <div className="border-2 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-xl">
        <Table>
          <TableHeader className="bg-muted/50 border-b-2">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-5 pl-8 text-[10px] font-black uppercase tracking-widest opacity-60">Team Member</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Access Level</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Activity</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60 text-right pr-8">Capacity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => {
              const isSelf = member.id === user?.uid;
              return (
                <TableRow 
                  key={member.id} 
                  className="group hover:bg-primary/[0.03] transition-colors border-b-muted/40 cursor-pointer"
                  onClick={() => setViewedMember(member)}
                >
                  <TableCell className="pl-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-10 w-10 rounded-xl border-2 border-background shadow-sm">
                          <AvatarImage src={member.avatarUrl} className="object-cover" />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                        </Avatar>
                        <StatusIndicator status={member.status} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-foreground truncate flex items-center gap-2">
                          {member.firstName} {member.lastName}
                          {isSelf && <Badge variant="secondary" className="text-[8px] h-3.5 px-1 font-black uppercase tracking-tighter bg-primary/10 text-primary">You</Badge>}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate opacity-70">{member.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest bg-primary/5 border-primary/20 text-primary/80">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                       <Clock className="h-3 w-3 text-primary opacity-50" />
                       {member.status === 'active' || member.status === 'Online' ? 'Currently Active' : 'Offline'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <span className="text-sm font-black text-primary tabular-nums">{memberTaskCounts[member.id] || 0} items</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      <InviteMemberDialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen} />
      <PendingInvitesDialog open={isPendingDialogOpen} onOpenChange={setPendingDialogOpen} />
      <CreateIssueDialog open={isAssignTaskDialogOpen} onOpenChange={handleAssignTaskDialogOpenChange} defaultAssigneeId={memberToAssign} />
      
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Identity Removal Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {memberToRemove?.firstName} {memberToRemove?.lastName} from the organization. All active access will be revoked immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm Removal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MemberProfileSheet member={viewedMember} onClose={handleCloseProfileSheet} activeTaskCount={viewedMember ? memberTaskCounts[viewedMember.id] || 0 : 0} isTaskCountLoading={allIssuesLoading} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6 animate-in fade-in duration-500">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 tracking-tight">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-sm">
              <Users className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <span>Our Team</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Manage your elite collaboration circle and global permissions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {isAdmin && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setPendingDialogOpen(true)}
                className="flex-1 sm:flex-none h-11 border-muted/60 shadow-sm relative group bg-card/50"
              >
                <Mail className="mr-2 h-4 w-4" />
                Invites
                {pendingInvites && pendingInvites.length > 0 && (
                   <Badge className="ml-2 bg-amber-500 text-white border-none h-5 px-1.5 min-w-[20px] justify-center text-[10px] font-black">
                      {pendingInvites.length}
                   </Badge>
                )}
              </Button>
              <Button
                onClick={() => setInviteDialogOpen(true)}
                className="flex-1 sm:flex-none h-11 shadow-lg shadow-primary/20 font-bold px-6"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-8 gap-4">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40" />
          <Input
            placeholder="Search team by name or email..."
            className="pl-10 h-11 bg-card/50 border-muted/60 focus-visible:ring-primary/20 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          {!mounted ? (
            <Skeleton className="h-11 w-[160px]" />
          ) : (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 min-w-[160px] justify-between border-muted/60 bg-card/50 font-bold">
                  <span className="flex items-center gap-2 text-xs">
                    Role: <span className="text-primary">{selectedRole}</span>
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-30" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 shadow-2xl border-primary/10">
                <DropdownMenuItem onSelect={() => setSelectedRole('All')} className="font-bold text-xs uppercase tracking-widest">
                  All Roles
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {USER_ROLES.map((role) => (
                  <DropdownMenuItem key={role} onSelect={() => setSelectedRole(role)} className="text-sm font-medium">
                    {role}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Separator orientation="vertical" className="h-8 mx-2 hidden lg:block" />

          {!isMobile && (
            <div className="flex items-center border rounded-xl p-1 bg-muted/30 border-muted/60 h-11 shrink-0">
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className={cn("h-9 w-9 rounded-lg transition-all", view === 'grid' && "shadow-sm bg-background text-primary")}
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className={cn("h-9 w-9 rounded-lg transition-all", view === 'list' && "shadow-sm bg-background text-primary")}
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 pb-16">
        {teamMembers && teamMembers.length === 0 ? (
          <EmptyState />
        ) : view === 'grid' ? (
          renderGridView()
        ) : (
          renderListView()
        )}
      </div>
    </>
  );
}
