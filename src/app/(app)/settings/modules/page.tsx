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
  WithId,
} from '@/firebase';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateModuleDialog } from '@/components/create-module-dialog';
import { Badge } from '@/components/ui/badge';

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
  createdAt?: Timestamp | Date | null;
}

const statusStyles: Record<ModuleStatus, string> = {
  Active: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-900',
  Planned: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-900',
  Draft: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400 dark:border-purple-900',
  'On Hold': 'bg-slate-500/10 text-slate-700 border-slate-200 dark:text-slate-400 dark:border-slate-900',
  Archived: 'bg-zinc-500/10 text-zinc-700 border-zinc-200 dark:text-zinc-400 dark:border-zinc-900',
  Done: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-900',
};

export default function ModulesSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const organizationId = user?.organizationId;

  const [moduleToDelete, setModuleToDelete] = useState<WithId<Module> | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modulesQuery = useMemo(() => {
    if (!firestore || !organizationId) return null;
    return query(
      collection(firestore, 'organizations', organizationId, 'modules')
    );
  }, [firestore, organizationId]);

  const {
    data: modules,
    isLoading: modulesLoading,
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
  
  const isLoading = isUserLoading || modulesLoading;

  return (
    <>
       <AlertDialog
        open={!!moduleToDelete}
        onOpenChange={(open) => !open && setModuleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              module "{moduleToDelete?.name}" and all of its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateModuleDialog
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Modules</h3>
        <p className="text-sm text-muted-foreground">
          Manage all modules within your organization.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>All Modules</CardTitle>
              <CardDescription>
                A list of all modules in the organization.
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="shrink-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Create Module</span>
              <span className="sm:hidden">Create</span>
            </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : modules && modules.length > 0 ? (
                  modules.map((module) => (
                    <TableRow key={module.id} className="group">
                      <TableCell className="font-medium">{module.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs font-bold uppercase tracking-tight">{module.key}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{module.type}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "font-bold text-[10px] uppercase tracking-widest px-2.5 py-0.5 border transition-all",
                            statusStyles[module.status] || "bg-muted text-muted-foreground"
                          )}
                        >
                          {module.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!mounted ? <Skeleton className="h-8 w-8 ml-auto" /> : <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuLabel className="text-center text-[10px] uppercase font-black tracking-widest opacity-50">Actions</DropdownMenuLabel>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onSelect={() => router.push(`/modules/${module.id}/edit`)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Module
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 font-bold" onSelect={() => setModuleToDelete(module)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Module
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                         </DropdownMenu>}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                      No modules found in this organization.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
