'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useOrganization, 
  useMemoFirebase,
  WithId 
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  ChevronDown, 
  Search, 
  ArrowUpDown, 
  X, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/use-debounce';
import { CreateIssueDialog } from '@/components/create-issue-dialog';
import { IssueDetailPanel } from '@/components/issue-detail-panel';
import { IssuesTableView } from '@/components/issues-table-view';
import { IssuesCardView } from '@/components/issues-card-view';
import { IssueStatus, StatusBadge } from '@/components/status-badge';
import { IssuePriority, PriorityBadge } from '@/components/priority-badge';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';

const priorityOrder: any = { 'Urgent': 5, 'High': 4, 'Medium': 3, 'Low': 2, 'None': 1 };

function IssuesPageInner() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const organizationId = user?.organizationId;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [issueToDelete, setIssueToDelete] = useState<any | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const { organization, isOrgLoading } = useOrganization(organizationId);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState('createdAt-desc');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const issuesPerPage = 10;

  useEffect(() => {
    const issueIdFromUrl = searchParams.get('issueId');
    if (issueIdFromUrl) setSelectedIssueId(issueIdFromUrl);
  }, [searchParams]);

  const handleSetSelectedIssue = (issueId: string | null) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (issueId) current.set('issueId', issueId);
    else current.delete('issueId');
    router.push(`${pathname}${current.toString() ? '?' + current.toString() : ''}`);
    setSelectedIssueId(issueId);
  };

  const issuesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'issues');
  }, [firestore, organizationId]);

  const { data: allIssues, isLoading: issuesLoading } = useCollection<any>(issuesQuery);

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'members');
  }, [firestore, organizationId]);
  
  const { data: membersFromDb, isLoading: membersLoading } = useCollection<any>(membersQuery);
  
  const modulesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'modules');
  }, [firestore, organizationId]);

  const { data: modules, isLoading: modulesLoading } = useCollection<any>(modulesQuery);
  
  const allMembers = useMemo(() => [...(membersFromDb || [])], [membersFromDb]);
  const isLoading = isUserLoading || issuesLoading || membersLoading || modulesLoading || isOrgLoading;

  const filteredAndSortedIssues = useMemo(() => {
    if (!allIssues) return [];
    let issues = [...allIssues];
    if (statusFilter.length > 0) issues = issues.filter(issue => statusFilter.includes(issue.status));
    if (priorityFilter.length > 0) issues = issues.filter(issue => priorityFilter.includes(issue.priority));
    if (assigneeFilter.length > 0) issues = issues.filter(issue => assigneeFilter.includes(issue.assigneeId || 'unassigned'));
    if (debouncedSearchTerm) issues = issues.filter(issue => issue.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || issue.key.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    
    const [sortField, sortDirection] = sortOption.split('-') as ['createdAt' | 'updatedAt' | 'priority', 'asc' | 'desc'];
    issues.sort((a, b) => {
      let compare = 0;
      if (sortField === 'priority') {
        compare = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
      } else {
        const aVal = a[sortField]?.seconds || 0;
        const bVal = b[sortField]?.seconds || 0;
        compare = aVal - bVal;
      }
      if (sortDirection === 'desc') compare *= -1;
      return compare || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
    return issues;
  }, [allIssues, statusFilter, priorityFilter, assigneeFilter, debouncedSearchTerm, sortOption]);

  const paginatedIssues = useMemo(() => {
    const startIndex = (currentPage - 1) * issuesPerPage;
    return filteredAndSortedIssues.slice(startIndex, startIndex + issuesPerPage);
  }, [filteredAndSortedIssues, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedIssues.length / issuesPerPage);

  const paginationRange = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    const leftSiblingIndex = Math.max(currentPage - 1, 1);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages);
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;
    if (!shouldShowLeftDots && shouldShowRightDots) return [...Array.from({ length: 5 }, (_, idx) => idx + 1), '...', totalPages];
    if (shouldShowLeftDots && !shouldShowRightDots) return [1, '...', ...Array.from({ length: 5 }, (_, idx) => totalPages - 4 + idx)];
    return [1, '...', ...Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, idx) => leftSiblingIndex + idx), '...', totalPages];
  }, [totalPages, currentPage]);

  const statusOptions = Object.keys(StatusBadge.statusConfig).map(status => ({
    value: status,
    label: StatusBadge.statusConfig[status as IssueStatus].label,
    icon: StatusBadge.statusConfig[status as IssueStatus].icon,
    color: StatusBadge.statusConfig[status as IssueStatus].color,
  }));

  const priorityOptions = Object.keys(PriorityBadge.priorityConfig).map(priority => ({
    value: priority,
    label: PriorityBadge.priorityConfig[priority as IssuePriority].label,
    icon: PriorityBadge.priorityConfig[priority as IssuePriority].icon,
    iconClassName: PriorityBadge.priorityConfig[priority as IssuePriority].iconClassName,
  }));

  const memberOptions = [{ value: 'unassigned', label: 'Unassigned', icon: User }, ...allMembers.map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName}`, avatarUrl: m.avatarUrl || undefined, fallback: `${m.firstName?.[0] || ''}${m.lastName?.[0] || ''}`.toUpperCase() }))];

  return (
    <>
      <AlertDialog open={!!issueToDelete} onOpenChange={(open) => !open && setIssueToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. All data for this issue will be permanently removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (!issueToDelete || !firestore || !organizationId) return; deleteDocumentNonBlocking(doc(firestore, 'organizations', organizationId, 'issues', issueToDelete.id)); toast({ title: 'Issue Deletion Initiated' }); if (selectedIssueId === issueToDelete.id) handleSetSelectedIssue(null); setIssueToDelete(null); }}>Delete Permanently</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null); }}>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none w-screen h-screen max-w-none flex items-center justify-center" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <img src={previewImage!} alt="Preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-md shadow-2xl" />
          <DialogClose asChild><button className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full text-white bg-black/50 hover:bg-black/75 hover:scale-110 transition-all cursor-pointer z-50"><X className="h-6 w-6" /></button></DialogClose>
        </DialogContent>
      </Dialog>

      <CreateIssueDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Workspace Issues</h1>
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
            Monitoring {filteredAndSortedIssues?.length || 0} active work items
          </p>
        </div>
        <Button className="w-full sm:w-auto h-11 px-6 font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all" onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Task
        </Button>
      </div>
      
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50" />
          <Input placeholder="Search by title, key, or tag..." className="pl-10 h-11 bg-card/50 border-muted/60 focus-visible:ring-primary/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="h-11 px-4 border-muted/60 bg-card/50 hover:bg-muted/50">Status <ChevronDown className="ml-2 h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-48">{statusOptions.map(option => (<DropdownMenuCheckboxItem key={option.value} checked={statusFilter.includes(option.value)} onSelect={e => e.preventDefault()} onCheckedChange={() => setStatusFilter(prev => prev.includes(option.value) ? prev.filter(s => s !== option.value) : [...prev, option.value])}><div className="flex items-center gap-2"><option.icon className={cn("h-4 w-4", option.color)} /><span>{option.label}</span></div></DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="h-11 px-4 border-muted/60 bg-card/50 hover:bg-muted/50">Assignee <ChevronDown className="ml-2 h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-56 max-h-80 overflow-y-auto">{memberOptions.map(option => (<DropdownMenuCheckboxItem key={option.value} checked={assigneeFilter.includes(option.value)} onSelect={e => e.preventDefault()} onCheckedChange={() => setAssigneeFilter(prev => prev.includes(option.value) ? prev.filter(s => s !== option.value) : [...prev, option.value])}><div className="flex items-center gap-2">{'avatarUrl' in option && option.avatarUrl ? <Avatar className="h-5 w-5"><AvatarImage src={option.avatarUrl || undefined} /><AvatarFallback className="text-[9px] font-bold">{'fallback' in option ? option.fallback : ''}</AvatarFallback></Avatar> : <User className="h-4 w-4" />}<span className="truncate">{option.label}</span></div></DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="h-11 px-4 border-muted/60 bg-card/50 hover:bg-muted/50">Priority <ChevronDown className="ml-2 h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-48">{priorityOptions.map(option => (<DropdownMenuCheckboxItem key={option.value} checked={priorityFilter.includes(option.value)} onSelect={e => e.preventDefault()} onCheckedChange={() => setPriorityFilter(prev => prev.includes(option.value) ? prev.filter(s => s !== option.value) : [...prev, option.value])}><div className="flex items-center gap-2"><option.icon className={cn("h-4 w-4", option.iconClassName)} /><span>{option.label}</span></div></DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu>
          
          <Separator orientation="vertical" className="h-8 mx-1 hidden lg:block" />
          
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 border border-transparent hover:border-muted hover:bg-muted/50"><ArrowUpDown className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-3 py-2">Sort Preferences</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuRadioGroup value={sortOption} onValueChange={setSortOption}><DropdownMenuRadioItem value="createdAt-desc" className="text-sm font-medium">Newest First</DropdownMenuRadioItem><DropdownMenuRadioItem value="createdAt-asc" className="text-sm font-medium">Oldest First</DropdownMenuRadioItem><DropdownMenuRadioItem value="updatedAt-desc" className="text-sm font-medium">Recently Updated</DropdownMenuRadioItem><DropdownMenuRadioItem value="priority-desc" className="text-sm font-medium">Highest Priority</DropdownMenuRadioItem><DropdownMenuRadioItem value="priority-asc" className="text-sm font-medium">Lowest Priority</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
        </div>
      </div>
      
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
        {isMobile ? (
          <IssuesCardView issues={paginatedIssues} members={allMembers} isLoading={isLoading} onCardClick={handleSetSelectedIssue} />
        ) : (
          <IssuesTableView issues={paginatedIssues} members={allMembers} isLoading={isLoading} onRowClick={handleSetSelectedIssue} onDelete={setIssueToDelete} router={router} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col-reverse items-center justify-between gap-4 mt-8 sm:flex-row border-t pt-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 text-center sm:text-left">
            Showing <strong>{(currentPage - 1) * issuesPerPage + 1}-{Math.min(currentPage * issuesPerPage, filteredAndSortedIssues.length)}</strong> of <strong>{filteredAndSortedIssues.length}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-9 w-9 border-muted/60" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 border-muted/60" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {paginationRange?.map((page, index) => typeof page === 'string' ? <span key={index} className="px-2 py-1 text-muted-foreground">...</span> : <Button key={index} variant={page === currentPage ? "default" : "outline"} size="icon" className="h-9 w-9 border-muted/60" onClick={() => setCurrentPage(page)}>{page}</Button>)}
            <Button variant="outline" size="icon" className="h-9 w-9 border-muted/60" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 border-muted/60" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <IssueDetailPanel issueId={selectedIssueId} onClose={() => handleSetSelectedIssue(null)} modules={modules} organization={organization} members={allMembers} onImagePreview={setPreviewImage} />
    </>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <IssuesPageInner />
    </Suspense>
  );
}