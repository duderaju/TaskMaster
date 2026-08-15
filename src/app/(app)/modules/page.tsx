'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  doc,
  Timestamp,
} from 'firebase/firestore';
import {
  useFirestore,
  useCollection,
  useUser,
  deleteDocumentNonBlocking,
  useMemoFirebase,
} from '@/firebase';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban,
  PlusCircle,
  MoreHorizontal,
  LayoutGrid,
  List,
  Folder,
  Trash2,
  Pencil,
  MoreVertical,
  Calendar,
  Layers,
  Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateModuleDialog } from '@/components/create-module-dialog';

type ModuleStatus =
  | 'Draft'
  | 'Planned'
  | 'Active'
  | 'On Hold'
  | 'Archived'
  | 'Done';

interface Module {
  id: string;
  name: string;
  key: string;
  type: string;
  status: ModuleStatus;
  icon?: string;
  color: string;
  createdAt?: Timestamp | Date | null;
}

const toDate = (timestamp: Timestamp | Date | null | undefined): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return null;
};

const StatusIndicator = ({ status }: { status: ModuleStatus }) => {
  const getStatusClasses = () => {
    const baseClasses = 'h-2 w-2 rounded-full shadow-[0_0_5px_currentColor]';
    let colorClass = 'bg-gray-400';

    switch (status) {
      case 'Active':
        colorClass = 'bg-status-active text-emerald-500';
        break;
      case 'On Hold':
        colorClass = 'bg-status-on-hold text-slate-500';
        break;
      case 'Planned':
        colorClass = 'bg-status-planned text-amber-500';
        break;
      case 'Archived':
        colorClass = 'bg-status-archived text-zinc-500';
        break;
      case 'Draft':
        colorClass = 'bg-status-draft text-purple-500';
        break;
      case 'Done':
        colorClass = 'bg-status-done text-blue-500';
        break;
    }
    return cn(baseClasses, colorClass);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={getStatusClasses()} />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-[10px] font-black uppercase tracking-widest">{status}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function ModulesPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const organizationId = user?.organizationId;

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const canManageModules = user?.role === 'Admin' || user?.role === 'Project Manager';
  const isButtonDisabled = isUserLoading || !organizationId || !canManageModules;

  useEffect(() => {
    setMounted(true);
  }, []);

  const modulesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'modules');
  }, [firestore, organizationId]);

  const {
    data: modules,
    isLoading: modulesLoading,
    error: modulesError,
  } = useCollection<Module>(modulesQuery);

  const handleDeleteModule = () => {
    if (!moduleToDelete || !firestore || !organizationId) return;

    const moduleRef = doc(
      firestore,
      'organizations',
      organizationId,
      'modules',
      moduleToDelete.id
    );
    deleteDocumentNonBlocking(moduleRef);

    toast({
      title: 'Module Deletion Initiated',
      description: `"${moduleToDelete.name}" is being deleted.`,
    });
    setModuleToDelete(null);
  };

  const ModuleCard = ({ module: module }: { module: Module }) => {
    const creationDate = toDate(module.createdAt);
    return (
       <div
        className="group animate-slide-up-and-fade-in rounded-lg p-0.5 transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1"
        style={{ backgroundImage: module.color }}
      >
        <Card className="h-full w-full bg-card/95 backdrop-blur-sm border-none">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 flex items-start gap-4 min-w-0">
                <div
                  className="p-3 mt-1 rounded-xl shrink-0 shadow-lg"
                  style={{
                    backgroundImage: module.color,
                  }}
                >
                  <Folder className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground opacity-60">{module.key}</span>
                   </div>
                  <CardTitle className="text-lg font-bold text-foreground break-words leading-tight">
                    {module.name}
                  </CardTitle>
                </div>
              </div>
              {!mounted ? <Skeleton className="h-8 w-8" /> : canManageModules && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-muted -mr-2 -mt-2 shrink-0 h-8 w-8"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 shadow-2xl border-primary/20">
                    <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-50 px-3 py-2 text-center">
                      Workspace Action
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer font-bold text-xs"
                      onSelect={(e) => {
                        e.preventDefault();
                        router.push(`/modules/${module.id}/edit`);
                      }}
                    >
                      <Pencil className="mr-3 h-4 w-4 text-primary" />
                      Configure Module
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive font-bold text-xs cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                      onSelect={(e) => {
                        e.preventDefault();
                        setModuleToDelete(module);
                      }}
                    >
                      <Trash2 className="mr-3 h-4 w-4" />
                      Delete Module
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex items-center gap-2 bg-muted/30 px-2.5 py-1.5 rounded-full border w-fit">
              <StatusIndicator status={module.status} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{module.status}</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-70">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {creationDate ? format(creationDate, 'MMM d, yyyy') : 'Provisioning...'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    if (isUserLoading || (!modules && modulesLoading)) {
      return view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-muted/60 h-[180px]">
              <CardHeader className="gap-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border-2 rounded-2xl overflow-hidden bg-card/50">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-5 border-b border-muted last:border-0">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <Skeleton className="h-5 w-64" />
                    <div className="ml-auto flex gap-8">
                        <Skeleton className="h-5 w-24 hidden md:block" />
                        <Skeleton className="h-5 w-24 hidden lg:block" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
      );
    }

    if (modulesError) {
      toast({
        variant: 'destructive',
        title: 'Error loading modules',
        description: modulesError.message,
      });
      return (
        <div className="text-center py-24 bg-rose-50/50 border-2 border-dashed border-rose-200 rounded-3xl">
          <FolderKanban className="mx-auto h-12 w-12 text-rose-300 mb-4" />
          <p className="text-rose-600 font-bold">Failed to synchronize workspace modules.</p>
        </div>
      );
    }

    if (!modules || modules.length === 0) {
      return (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl animate-slide-up-and-fade-in bg-muted/5">
            <FolderKanban className="mx-auto h-16 w-16 text-muted-foreground opacity-20 mb-6" />
            <h3 className="text-xl font-bold tracking-tight">No active modules detected</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Begin your project lifecycle by defining your first organizational module.
            </p>
            {canManageModules && (
                <div className="mt-8">
                <Button onClick={() => setCreateDialogOpen(true)} className="shadow-lg shadow-primary/20 h-11 px-8 font-bold">
                    <PlusCircle className="mr-2 h-5 w-5" /> Initialize First Module
                </Button>
                </div>
            )}
        </div>
      );
    }

    if (view === 'grid') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module, index) => (
             <div
              key={module.id}
              className="animate-slide-up-and-fade-in"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
            >
              <ModuleCard module={module} />
            </div>
          ))}
        </div>
      );
    }

    if (view === 'list') {
      return (
        <div className="border-2 rounded-2xl overflow-hidden animate-slide-up-and-fade-in bg-card/50 backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b-2">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-5 pl-8 min-w-[280px] text-[10px] font-black uppercase tracking-widest opacity-60">Module Identity</TableHead>
                  <TableHead className="w-[140px] text-[10px] font-black uppercase tracking-widest opacity-60">Key Reference</TableHead>
                  <TableHead className="w-[160px] text-[10px] font-black uppercase tracking-widest opacity-60">Status</TableHead>
                  <TableHead className="hidden md:table-cell w-[140px] text-[10px] font-black uppercase tracking-widest opacity-60">Archetype</TableHead>
                  <TableHead className="hidden lg:table-cell w-[180px] text-[10px] font-black uppercase tracking-widest opacity-60">Initialized</TableHead>
                  <TableHead className="text-right pr-8 w-[80px] text-[10px] font-black uppercase tracking-widest opacity-60">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => {
                  const creationDate = toDate(module.createdAt);
                  return (
                    <TableRow key={module.id} className="group hover:bg-primary/[0.03] border-b-muted/40 transition-colors">
                      <TableCell className="py-4 pl-8">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white/10" style={{ backgroundImage: module.color }}>
                                <Folder className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-sm text-foreground truncate max-w-[240px]">
                                {module.name}
                            </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] font-black uppercase tracking-widest bg-muted/50 border-muted/80 text-muted-foreground px-2 py-0.5">
                            {module.key}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <StatusIndicator status={module.status} />
                          <span className="text-[11px] font-bold uppercase tracking-tight text-foreground/80">{module.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-tight opacity-70">
                            <Layers className="h-3.5 w-3.5" />
                            {module.type}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                            {creationDate ? format(creationDate, 'dd MMM yyyy') : '...'}
                         </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        {!mounted ? <Skeleton className="h-8 w-8 ml-auto" /> : canManageModules && (
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 shadow-2xl border-primary/20">
                              <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-50 px-3 py-2 text-center">Row Management</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="font-bold text-xs cursor-pointer py-2.5"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  router.push(`/modules/${module.id}/edit`);
                                }}
                              >
                                <Pencil className="mr-3 h-4 w-4 text-primary" />
                                Edit Configuration
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive font-bold text-xs cursor-pointer py-2.5 focus:bg-destructive/10 focus:text-destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setModuleToDelete(module);
                                }}
                              >
                                <Trash2 className="mr-3 h-4 w-4" />
                                Remove Module
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <AlertDialog
        open={!!moduleToDelete}
        onOpenChange={(open) => !open && setModuleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Destroy Module Instance?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground">
              This will permanently delete <span className="text-foreground font-bold">"{moduleToDelete?.name}"</span> and all associated project data. This action is recorded in the Audit Log and cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold">
              Confirm Destruction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateModuleDialog
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6 animate-in fade-in duration-500">
        <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/20">
                    <FolderKanban className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <span>Workspace Modules</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
                Manage and track all organizational project containers.
            </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center border-2 rounded-xl p-1 bg-card/50 border-muted h-11 shrink-0">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className={cn("h-9 w-9 rounded-lg transition-all", view === 'grid' && "bg-background shadow-sm text-primary")}
              onClick={() => setView('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className={cn("h-9 w-9 rounded-lg transition-all", view === 'list' && "bg-background shadow-sm text-primary")}
              onClick={() => setView('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {canManageModules && (
            <Button onClick={() => setCreateDialogOpen(true)} disabled={isButtonDisabled} className="h-11 px-6 font-bold shadow-lg shadow-primary/20 flex-1 sm:flex-none">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Module
            </Button>
          )}
        </div>
      </div>
      
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 pb-16">
        {renderContent()}
      </div>
    </>
  );
}
