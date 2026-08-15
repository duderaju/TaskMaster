'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useDoc, 
  useMemoFirebase,
  updateDocumentNonBlocking, 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  WithId 
} from '@/firebase';
import { 
  collection, 
  query, 
  doc, 
  Timestamp, 
  serverTimestamp, 
  orderBy, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Loader2, 
  ArrowLeft, 
  History, 
  Link as LinkIcon, 
  Paperclip, 
  Trash2, 
  Pencil, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  User, 
  Users,
  FolderKanban, 
  Calendar, 
  Triangle, 
  RefreshCw, 
  Tags, 
  CircleDot, 
  Signal, 
  ArrowUp, 
  ArrowDown, 
  Ban, 
  ShieldAlert, 
  SignalHigh, 
  SignalMedium, 
  SignalLow, 
  CircleDashed, 
  Circle, 
  Eye, 
  X,
  XCircle,
  FileIcon,
  Bug,
  Book,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { EditableField, type SelectOption } from '@/components/editable-field';
import { DateProperty } from '@/components/ui/date-property';
import { AddLinkDialog } from '@/components/add-link-dialog';
import { type IssueStatus } from '@/components/status-badge';
import { PriorityBadge, type IssuePriority } from '@/components/priority-badge';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// --- Internal Types ---

interface Attachment {
  id: string;
  fileName: string;
  downloadURL: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  isUploading?: boolean;
}

interface LinkItemData {
  id: string;
  url: string;
  title: string;
  addedAt: Timestamp;
  addedBy: string;
}

interface Issue {
  id: string;
  key: string;
  title: string;
  type: 'Bug' | 'Story' | 'Task';
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId?: string;
  reporterId: string;
  moduleId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedById?: string;
  description: string;
  startDate?: Timestamp;
  dueDate?: Timestamp;
  storyPoints?: number;
  labelIds?: string[];
  cycle?: string;
  attachments?: Attachment[];
  links?: LinkItemData[];
}

interface Module {
  id: string;
  name: string;
  key: string;
}

interface Organization {
  id: string;
  name: string;
  members: { [key: string]: string };
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

interface Comment {
  id: string;
  issueId: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
}

// --- Helpers ---

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

const normalizeDate = (d: Date): Date => {
  const newDate = new Date(d);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const statusOptions: SelectOption[] = [
  { value: 'Backlog', label: 'Backlog', icon: CircleDashed },
  { value: 'To Do', label: 'To Do', icon: Circle },
  { value: 'In Progress', label: 'In Progress', icon: Clock },
  { value: 'In Review', label: 'In Review', icon: Eye },
  { value: 'Done', label: 'Done', icon: CheckCircle2 },
  { value: 'Canceled', label: 'Canceled', icon: XCircle },
  { value: 'Blocked', label: 'Blocked', icon: ShieldAlert },
];

const priorityOptions: SelectOption[] = [
  { value: 'None', label: 'None', icon: Ban },
  { value: 'Low', label: 'Low', icon: SignalLow },
  { value: 'Medium', label: 'Medium', icon: SignalMedium },
  { value: 'High', label: 'High', icon: SignalHigh },
  { value: 'Urgent', label: 'Urgent', icon: ShieldAlert },
];

const labelOptions: SelectOption[] = [
  { value: 'bug', label: 'Bug', color: 'bg-red-500' },
  { value: 'feature', label: 'Feature', color: 'bg-green-500' },
  { value: 'improvement', label: 'Improvement', color: 'bg-blue-500' },
];

const cycleOptions: SelectOption[] = [
  { value: 'no-cycle', label: 'No Cycle', icon: CircleDashed },
  { value: 'sprint-1', label: 'Sprint 1', icon: RefreshCw },
  { value: 'sprint-2', label: 'Sprint 2', icon: RefreshCw },
  { value: 'sprint-3', label: 'Sprint 3', icon: RefreshCw },
];

const storyPointOptions: SelectOption[] = [
  { value: '0', label: 'No estimate' },
  { value: '0.5', label: '0.5' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '5', label: '5' },
  { value: '8', label: '8' },
  { value: '13', label: '13' },
];

// --- Sub-components ---

const PropertiesItem = ({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-y-1.5 sm:grid sm:grid-cols-[140px_1fr] sm:items-center sm:gap-x-4">
    <div className="flex items-center gap-2 text-[13px] sm:text-sm font-medium text-muted-foreground">
      <Icon className="h-3.5 w-3.5 sm:h-4 w-4" />
      <span>{label}</span>
    </div>
    <div className="text-foreground min-h-[32px] flex items-center">{children}</div>
  </div>
);

const AttachmentItem = ({ attachment, onRemove, onPreview, members, currentUser }: { 
  attachment: Attachment, 
  onRemove?: (id: string) => void, 
  onPreview: (url: string) => void,
  members: WithId<Member>[],
  currentUser: WithId<Member> | null
}) => {
  const isImage = attachment.fileType?.startsWith('image/');
  const uploader = useMemo(() => {
    if (attachment.isUploading) return currentUser;
    return members.find(m => m.id === attachment.uploadedBy);
  }, [attachment.isUploading, attachment.uploadedBy, members, currentUser]);

  const uploadDate = useMemo(() => attachment.isUploading ? new Date() : toDate(attachment.uploadedAt), [attachment.isUploading, attachment.uploadedAt]);

  return (
    <div className="flex items-center justify-between p-2 rounded-md group hover:bg-muted/30 transition-colors border border-transparent">
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        {isImage ? (
          <div 
            className="h-8 w-8 rounded overflow-hidden cursor-pointer flex-shrink-0 border bg-muted shadow-sm"
            onClick={() => onPreview(attachment.downloadURL)}
          >
            <img src={attachment.downloadURL} alt={attachment.fileName} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-8 w-8 flex items-center justify-center rounded bg-muted/50 border flex-shrink-0">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-medium text-foreground truncate">{attachment.fileName}</span>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
            <span>{(attachment.fileSize / 1024).toFixed(0)} KB</span>
            {uploadDate && (
              <>
                <span className="opacity-50">•</span>
                <span className="whitespace-nowrap">{formatDistanceToNow(uploadDate, { addSuffix: true })}</span>
              </>
            )}
            {attachment.isUploading && (
              <>
                <span className="opacity-50">•</span>
                <span className="text-primary animate-pulse">Uploading...</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
        {uploader && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={uploader?.avatarUrl || undefined} />
                  <AvatarFallback className="text-[10px] bg-muted">
                    {uploader ? getInitials(uploader.firstName, uploader.lastName) : <User className="h-3 w-3 text-muted-foreground" />}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{uploader ? `${uploader.firstName} ${uploader.lastName}`: 'Uploader'} uploaded {uploadDate ? `on ${format(uploadDate, 'MMM dd, yyyy')}` : ''}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-destructive hover:bg-destructive/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onRemove && onRemove(attachment.id); }}
          title="Delete attachment"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

const LinkItem = ({ link, onRemove, onEdit }: { link: LinkItemData, onRemove: (id: string) => void, onEdit: (link: LinkItemData) => void }) => {
  const { toast } = useToast();
  const addDate = toDate(link.addedAt);
  const domain = useMemo(() => {
    try { return new URL(link.url).hostname; } catch { return ""; }
  }, [link.url]);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    toast({ title: 'Link copied to clipboard!' });
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-md group hover:bg-muted/30 transition-colors border border-transparent">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 overflow-hidden text-[13px] flex-1">
        <div className="h-6 w-6 flex items-center justify-center rounded bg-muted/50 border flex-shrink-0">
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt="favicon"
            className="h-3.5 w-3.5 object-contain"
            onError={(e) => (e.currentTarget.src = "")}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-foreground truncate">{link.title}</span>
          {addDate && <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{formatDistanceToNow(addDate, { addSuffix: true })}</span>}
        </div>
      </a>
      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted transition-colors" onClick={handleCopy}>
                <CopyIcon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Copy link</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 hover:bg-muted transition-colors"
          onClick={(e) => { e.stopPropagation(); onEdit(link); }}
          title="Edit link"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-destructive hover:bg-destructive/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onRemove(link.id); }}
          title="Delete link"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

function CopyIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
}

// --- Main Export ---

export const IssueDetailPanel = ({
  issueId,
  onClose,
  modules,
  organization,
  members,
  onImagePreview
}: {
  issueId: string | null;
  onClose: () => void;
  modules: WithId<Module>[] | null;
  organization: WithId<Organization> | null;
  members: WithId<Member>[];
  onImagePreview: (url: string) => void;
}) => {
  const firestore = useFirestore();
  const { user } = useUser();
  const organizationId = user?.organizationId;
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [issueToDelete, setIssueToDelete] = useState<WithId<Issue> | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<WithId<Comment> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string; name: string; size: number; type: string, previewUrl?: string }[]>([]);
  const [commentSortOrder, setCommentSortOrder] = useState<'desc' | 'asc'>('desc');
  
  const [isLinkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItemData | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [titleCharCount, setTitleCharCount] = useState<React.ReactNode>(null);
  const [descriptionCharCount, setDescriptionCharCount] = useState<React.ReactNode>(null);

  const issueRef = useMemoFirebase(
    () =>
      firestore && issueId && organizationId
        ? doc(firestore, 'organizations', organizationId, 'issues', issueId)
        : null,
    [firestore, organizationId, issueId]
  );
  
  const { data: issue, isLoading: issueLoading } = useDoc<Issue>(issueRef);

  const commentsQuery = useMemoFirebase(() => {
    if (!issueRef) return null;
    return query(collection(issueRef, 'comments'), orderBy('createdAt', commentSortOrder));
  }, [issueRef, commentSortOrder]);

  const { data: comments } = useCollection<Comment>(commentsQuery);

  /**
   * AUTOSAVE UPDATES: Direct commit to Firestore for modern side-panel experience.
   */
  const handleUpdate = useCallback((field: keyof Issue, value: any, action: 'add' | 'remove' | 'set' = 'set') => {
    if (!issueRef || !user || !issue) return;
    
    let updateData: any = {};
    
    if (field === 'labelIds' && action !== 'set') {
      const currentLabels = (issue.labelIds || []);
      updateData.labelIds = action === 'add' 
        ? Array.from(new Set([...currentLabels, value])) 
        : currentLabels.filter(l => l !== value);
    } else {
      updateData[field] = value;
    }

    if (field === 'startDate' || field === 'dueDate') {
        updateData[field] = value ? Timestamp.fromDate(new Date(value)) : null;
    }

    updateData.updatedAt = serverTimestamp();
    updateData.updatedById = user.uid;

    updateDocumentNonBlocking(issueRef, updateData);
  }, [issueRef, user, issue]);

  const getMinDueDate = useCallback((): Date => {
    const today = normalizeDate(new Date());
    const startDateVal = toDate(issue?.startDate);
    if (startDateVal) {
      const normalizedStart = normalizeDate(startDateVal);
      if (normalizedStart > today) return normalizedStart;
    }
    return today;
  }, [issue?.startDate]);

  const disableDueDate = useCallback((date: Date): boolean => {
    const dateToCheck = normalizeDate(date);
    const minDueDate = getMinDueDate();
    return dateToCheck < minDueDate;
  }, [getMinDueDate]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user || !issueRef || !organizationId || !issue) return;
    setIsCommenting(true);
    const newComment = { issueId: issue.id, userId: user.uid, text: commentText, createdAt: serverTimestamp() };
    const commentsCollectionRef = collection(firestore, 'organizations', organizationId, 'issues', issue.id, 'comments');
    await addDocumentNonBlocking(commentsCollectionRef, newComment);
    setCommentText('');
    setIsCommenting(false);
    toast({ title: "Comment added" });
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !organizationId || !issue) return;
    const commentRef = doc(firestore, 'organizations', organizationId, 'issues', issue.id, 'comments', editingComment.id);
    updateDocumentNonBlocking(commentRef, { text: editingComment.text });
    setEditingComment(null);
    toast({ title: 'Comment updated' });
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !organizationId || !issue) return;
    const commentRef = doc(firestore, 'organizations', organizationId, 'issues', issue.id, 'comments', commentToDelete.id);
    deleteDocumentNonBlocking(commentRef);
    setCommentToDelete(null);
    toast({ title: 'Comment deleted' });
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user || !organizationId || !issueRef || !issue) return;
    const FILE_SIZE_LIMIT = 700 * 1024;
    const validFilesToUpload = [];
    const oversizedFiles = [];

    for (const file of Array.from(files)) {
      if (file.size > FILE_SIZE_LIMIT) oversizedFiles.push(file.name);
      else validFilesToUpload.push({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, file, previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined });
    }

    if (oversizedFiles.length > 0) {
      toast({ variant: 'destructive', title: 'File(s) Too Large', description: `${oversizedFiles.join(', ')} exceed(s) the 700KB size limit.`, duration: 9000 });
    }

    if (validFilesToUpload.length === 0) return;

    setUploadingFiles(prev => [...prev, ...validFilesToUpload.map(f => ({ id: f.id, name: f.name, size: f.size, type: f.type, previewUrl: f.previewUrl }))]);
    
    for (const upload of validFilesToUpload) {
      const { id, file } = upload;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const dataUri = reader.result as string;
          const attachmentMetadata: Attachment = { id, fileName: file.name, downloadURL: dataUri, fileSize: file.size, fileType: file.type, uploadedAt: Timestamp.now(), uploadedBy: user.uid };
          updateDocumentNonBlocking(issueRef, { attachments: arrayUnion(attachmentMetadata) });
          toast({ title: 'File attached', description: `Successfully uploaded ${file.name}` });
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not attach "${file.name}".`, duration: 9000 });
          setUploadingFiles(prev => prev.filter(f => f.id !== id));
        }
      };
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    if (!issueRef || !issue) return;
    setUploadingFiles(prev => prev.filter(f => f.id !== attachmentId));
    const attachmentToRemove = (issue.attachments || []).find(att => att.id === attachmentId);
    if (!attachmentToRemove) return;
    updateDocumentNonBlocking(issueRef, { attachments: arrayRemove(attachmentToRemove) });
    toast({ title: 'Attachment removed' });
  };

  const handleSaveLink = (data: { url: string; title?: string }, linkId?: string) => {
    if (!user || !issueRef || !issue) return;
    if (linkId) {
      const originalLinks = issue.links || [];
      const linkIndex = originalLinks.findIndex(l => l.id === linkId);
      if (linkIndex === -1) return;
      const newLinks = [...originalLinks];
      newLinks[linkIndex] = { ...newLinks[linkIndex], url: data.url, title: data.title || data.url };
      updateDocumentNonBlocking(issueRef, { links: newLinks });
      toast({ title: 'Link updated' });
    } else {
      const newLink: LinkItemData = { id: crypto.randomUUID(), url: data.url, title: data.title || data.url, addedBy: user.uid, addedAt: Timestamp.now() };
      updateDocumentNonBlocking(issueRef, { links: arrayUnion(newLink) });
      toast({ title: 'Link added' });
    }
  };

  const handleRemoveLink = (linkId: string) => {
    if (!issueRef || !issue || !issue.links) return;
    const linkToRemove = issue.links.find(l => l.id === linkId);
    if (!linkToRemove) return;
    updateDocumentNonBlocking(issueRef, { links: arrayRemove(linkToRemove) });
    toast({ title: 'Link removed' });
  };

  if (!issue && issueLoading) {
    return (
      <Sheet open={!!issueId} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className={cn('p-0 border-none transition-all duration-200 ease-in-out', isMobile ? 'h-[95%]' : 'w-full max-w-4xl')}>
          <SheetHeader className="p-4 border-b">
            <SheetTitle><Skeleton className="h-6 w-48" /></SheetTitle>
            <SheetDescription className="sr-only">Issue details are loading.</SheetDescription>
          </SheetHeader>
          <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!issue) return null;

  const creationDate = toDate(issue.createdAt);
  const reporter = members.find(m => m.id === issue.reporterId);
  const currentUserMember = members.find(m => m.id === user?.uid) || null;
  const currentUserRole = organization?.members[user?.uid || '']?.toLowerCase() || null;
  const canManageIssue = currentUserRole === 'admin' || currentUserRole === 'project manager';
  const isDone = issue.status === 'Done' || issue.status === 'Canceled';

  const allAttachments = [
    ...(issue.attachments || []),
    ...uploadingFiles.filter(file => !(issue.attachments || []).some(att => att.id === file.id))
        .map(f => ({ id: f.id, fileName: f.name, fileSize: f.size, fileType: f.type, downloadURL: f.previewUrl || "", isUploading: true }))
  ] as Attachment[];

  const memberOptions: SelectOption[] = members.map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName}`, avatarUrl: m.avatarUrl, fallback: `${m.firstName?.[0] || ''}${m.lastName?.[0] || ''}` }));
  const moduleOptions: SelectOption[] = (modules || []).map(p => ({ value: p.id, label: p.name, icon: FolderKanban }));

  return (
    <Sheet open={!!issueId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className={cn('p-0 border-none flex flex-col', isMobile ? 'h-[95%]' : 'w-full md:max-w-2xl lg:max-w-4xl xl:max-w-5xl')} onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="p-4 border-b flex-shrink-0 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-primary/10 transition-colors"><ArrowLeft className="h-4 w-4" /></Button>
            <SheetTitle className="sr-only">Issue Details</SheetTitle>
            <SheetDescription className="sr-only">Detailed view and management panel for a single issue.</SheetDescription>
            <div className="flex items-center gap-1 sm:gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(window.location.origin + '/issues?issueId=' + issue.id); toast({ title: 'Link copied to clipboard!' }); }}><LinkIcon className="h-4 w-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Copy item link</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {canManageIssue && (
                <Button variant="ghost" size="icon" onClick={() => setIssueToDelete(issue)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>
        
        <AlertDialog open={!!issueToDelete} onOpenChange={(open) => !open && setIssueToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the issue "{issueToDelete?.title}".</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (!issueToDelete || !firestore || !organizationId) return; deleteDocumentNonBlocking(doc(firestore, 'organizations', organizationId, 'issues', issueToDelete.id)); toast({ title: 'Issue Deletion Initiated' }); onClose(); }}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Comment?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteComment}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AddLinkDialog open={isLinkDialogOpen} onOpenChange={setLinkDialogOpen} onSave={handleSaveLink} linkToEdit={editingLink} />

        <ScrollArea className="flex-grow">
          <div className="p-4 md:p-6 space-y-8 pb-16">
            <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" multiple accept="image/*,application/pdf,application/zip,text/plain" />
            
            <div className="space-y-3">
              <div className="flex justify-between items-baseline"><div className="text-[11px] sm:text-sm font-mono font-bold tracking-tight text-muted-foreground uppercase opacity-70">{issue.key}</div></div>
              <div className="relative">
                <EditableField fieldName="title" initialValue={issue.title} onSave={(value: string) => handleUpdate('title', value)} maxLength={255} placeholder="Issue title" className="text-xl md:text-2xl font-bold tracking-tight leading-tight" renderCharCount={setTitleCharCount} />
                <div className="absolute bottom-0 right-0 flex w-full justify-end -mb-6">{titleCharCount}</div>
              </div>
              <div className="relative pt-4">
                <EditableField fieldName="description" initialValue={issue.description} onSave={(value: string) => handleUpdate('description', value)} editType="textarea" isTextarea maxLength={1000} placeholder="Click to add description..." className="text-[15px] sm:text-base text-foreground/90 leading-relaxed" renderCharCount={setDescriptionCharCount} />
                
                <div className="mt-6 flex flex-col gap-4">
                  <div className="flex flex-col items-end relative">
                    <div className="h-0 w-full relative">
                      <div className="absolute bottom-0 right-0 mb-1.5">
                        {descriptionCharCount}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                      <History className="h-3 w-3" />
                      <span>Last edited {creationDate ? formatDistanceToNow(creationDate, { addSuffix: true }) : '...'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 font-semibold text-[11px] sm:text-xs" onClick={() => { setEditingLink(null); setLinkDialogOpen(true); }}><LinkIcon className="h-3.5 w-3.5" />Add Link</Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 font-semibold text-[11px] sm:text-xs" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}><Paperclip className="h-3.5 w-3.5" />Attach File</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordions for Attachments and Links */}
            {(allAttachments.length > 0 || (issue.links || []).length > 0) && (
              <div className="space-y-4">
                <Accordion type="multiple" className="w-full">
                  {allAttachments.length > 0 && (
                    <AccordionItem value="attachments" className="border-b-0 px-1">
                      <AccordionTrigger className="hover:no-underline py-3 text-[13px] sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          <span>Attachments</span>
                          <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-bold bg-muted/50">
                            {allAttachments.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-1">
                          {allAttachments.map((att) => (
                            <AttachmentItem 
                              key={att.id} 
                              attachment={att} 
                              onRemove={handleRemoveAttachment} 
                              onPreview={onImagePreview}
                              members={members}
                              currentUser={currentUserMember}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {(issue.links || []).length > 0 && (
                    <AccordionItem value="links" className="border-b-0 px-1">
                      <AccordionTrigger className="hover:no-underline py-3 text-[13px] sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          <span>Links</span>
                          <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-bold bg-muted/50">
                            {(issue.links || []).length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-1">
                          {(issue.links || []).map((link) => (
                            <LinkItem 
                              key={link.id} 
                              link={link} 
                              onRemove={handleRemoveLink} 
                              onEdit={(l) => { setEditingLink(l); setLinkDialogOpen(true); }}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
            )}
            
            {/* Properties */}
            <div className="pt-6 border-t">
              <h3 className="text-[13px] sm:text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Issue Properties</h3>
              <div className="space-y-5">
                <PropertiesItem icon={CircleDot} label="State"><EditableField initialValue={issue.status} onSave={(value) => handleUpdate('status', value)} fieldName="status" editType="select" selectOptions={statusOptions} showHoverIcon open={openMenu === 'status'} onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'status' : null)} /></PropertiesItem>
                <PropertiesItem icon={Users} label="Assignees"><EditableField initialValue={issue.assigneeId} onSave={(value) => handleUpdate('assigneeId', value)} fieldName="assigneeId" editType="select" selectOptions={memberOptions} placeholder="Unassigned" showHoverIcon open={openMenu === 'assigneeId'} onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'assigneeId' : null)} /></PropertiesItem>
                <PropertiesItem icon={Signal} label="Priority"><EditableField initialValue={issue.priority} onSave={(value) => handleUpdate('priority', value)} fieldName="priority" editType="select" selectOptions={priorityOptions} open={openMenu === 'priority'} onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'priority' : null)} /></PropertiesItem>
                <PropertiesItem icon={User} label="Created by">{reporter ? (<div className="flex items-center gap-2 font-medium text-[13px] sm:text-sm"><Avatar className="h-6 w-6"><AvatarImage src={reporter.avatarUrl || undefined} /><AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{getInitials(reporter.firstName, reporter.lastName)}</AvatarFallback></Avatar><span>{reporter.firstName} {reporter.lastName}</span></div>) : (<div className="text-muted-foreground italic text-sm">System generated</div>)}</PropertiesItem>
                <PropertiesItem icon={FolderKanban} label="Module"><EditableField initialValue={issue.moduleId} onSave={(value) => handleUpdate('moduleId', value)} fieldName="moduleId" editType="select" selectOptions={moduleOptions} placeholder="No module" showHoverIcon open={openMenu === 'moduleId'} onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'moduleId' : null)} /></PropertiesItem>
                <PropertiesItem icon={Calendar} label="Start date"><DateProperty value={issue.startDate} onSave={(value) => handleUpdate('startDate', value)} placeholder="Add start date" highlightToday={false} variant="ghost" open={openMenu === 'startDate'} onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'startDate' : null)} /></PropertiesItem>
                <PropertiesItem icon={Calendar} label="Due date"><DateProperty value={issue.dueDate} onSave={(value) => handleUpdate('dueDate', value)} placeholder="Add due date" disabled={disableDueDate} variant="ghost" open={openMenu === 'dueDate'} onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'dueDate' : null)} highlightToday={!isDone} /></PropertiesItem>
                <PropertiesItem icon={Triangle} label="Estimate"><EditableField initialValue={issue.storyPoints} onSave={(value) => handleUpdate('storyPoints', Number(value))} fieldName="storyPoints" editType="select" selectOptions={storyPointOptions} placeholder="None" showHoverIcon open={openMenu === 'storyPoints'} onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'storyPoints' : null)} /></PropertiesItem>
                <PropertiesItem icon={RefreshCw} label="Cycle"><EditableField initialValue={issue.cycle} onSave={(value) => handleUpdate('cycle', value)} fieldName="cycle" editType="select" selectOptions={cycleOptions} placeholder="No Cycle" showHoverIcon open={openMenu === 'cycle'} onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'cycle' : null)} /></PropertiesItem>
                <PropertiesItem icon={Tags} label="Labels"><EditableField initialValue={issue.labelIds || []} onSave={(value, action) => handleUpdate('labelIds', value, action)} fieldName="labels" editType="select" selectOptions={labelOptions} placeholder="Add labels..." open={openMenu === 'labels'} onOpenChange={(isOpen) => setOpenMenu(isOpen ? 'labels' : null)} /></PropertiesItem>
              </div>
            </div>

            <Separator />
            <div className="pt-2">
              <div className='flex items-center justify-between mb-6'><h3 className="text-[13px] sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">Activity Feed</h3><Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold uppercase tracking-tighter" onClick={() => setCommentSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}>{commentSortOrder === 'desc' ? <ArrowUp className="h-3 w-3 mr-1.5" /> : <ArrowDown className="h-3 w-3 mr-1.5" />}Sort</Button></div>
              <div className="flex gap-3 w-full mb-8"><Avatar className="h-8 w-8 shrink-0"><AvatarImage src={currentUserMember?.avatarUrl || undefined} /><AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">{currentUserMember ? getInitials(currentUserMember.firstName, currentUserMember.lastName) : <User className="h-4 w-4" />}</AvatarFallback></Avatar><div className='w-full space-y-2'><Textarea placeholder="Share progress or ask a question..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="min-h-[100px] text-[13px] bg-muted/20 border-muted focus-visible:ring-primary/20" /><div className="flex justify-end"><Button onClick={handleAddComment} disabled={!commentText.trim() || isCommenting} className="h-8 px-4 text-xs font-bold uppercase tracking-widest shadow-lg">{isCommenting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Post Comment</Button></div></div></div>
              <div className='space-y-6'>
                {(comments || []).length > 0 ? (comments || []).map((comment) => { 
                  const commenter = members.find(m => m.id === comment.userId); 
                  const createdAtVal = toDate(comment.createdAt); 
                  return (
                    <div key={comment.id} className="flex gap-3 w-full group">
                      <Avatar className="h-8 w-8 shrink-0 shadow-sm"><AvatarImage src={commenter?.avatarUrl || undefined} /><AvatarFallback className="bg-muted text-[10px] font-bold">{commenter ? getInitials(commenter.firstName, commenter.lastName) : <User className="h-4 w-4" />}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="text-xs truncate"><span className="font-bold text-foreground">{commenter ? `${commenter.firstName} ${commenter.lastName}` : 'System User'}</span><span className="text-muted-foreground ml-2 opacity-60 font-medium">{createdAtVal ? formatDistanceToNow(createdAtVal, { addSuffix: true }) : 'just now'}</span></div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                                type="button"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuItem onSelect={() => setEditingComment({ id: comment.id, text: comment.text })} className="font-medium text-xs cursor-pointer">
                                <Pencil className="mr-2 h-3.5 w-3.5" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setCommentToDelete(comment as WithId<Comment>)} className="text-destructive font-bold text-xs focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                                <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {editingComment?.id === comment.id ? (
                          <div className="mt-2 space-y-2"><Textarea value={editingComment.text} onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })} className="min-h-[80px] text-[13px]" /><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" className="h-7 px-3 text-[11px] font-bold" onClick={() => setEditingComment(null)}>Cancel</Button><Button size="sm" className="h-7 px-3 text-[11px] font-bold" onClick={handleUpdateComment}>Save Changes</Button></div></div>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none mt-1 p-3 bg-muted/40 rounded-lg border border-muted/60"><p className="text-[13px] leading-relaxed text-foreground/80">{comment.text}</p></div>
                        )}
                      </div>
                    </div>
                  ) 
                }) : (
                  <div className="text-center py-12 px-4 rounded-xl border border-dashed bg-muted/10"><div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3"><Clock className="h-5 w-5 text-muted-foreground opacity-20" /></div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-40">No activity yet</p></div>
                )}
              </div>
              
              <div className="h-32" aria-hidden="true" />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
