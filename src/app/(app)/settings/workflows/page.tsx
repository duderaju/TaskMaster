
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, 
  Plus, 
  GripVertical, 
  Settings2,
  Trash2,
  MoreVertical,
  Layers,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  CircleDashed,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useFirestore, useUser, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, limit, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';

// --- Types & Schemas ---

type StateType = 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Done';

interface WorkflowState {
  id: string;
  name: string;
  type: StateType;
  color: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  states: WorkflowState[];
  isDefault: boolean;
  createdAt: any;
}

const stateFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  type: z.enum(['Backlog', 'To Do', 'In Progress', 'In Review', 'Done']),
});

type StateFormValues = z.infer<typeof stateFormSchema>;

const typeConfigs: Record<StateType, { color: string; icon: any }> = {
  'Backlog': { color: 'bg-slate-500', icon: CircleDashed },
  'To Do': { color: 'bg-blue-500', icon: Circle },
  'In Progress': { color: 'bg-amber-500', icon: Clock },
  'In Review': { color: 'bg-purple-500', icon: Eye },
  'Done': { color: 'bg-green-500', icon: CheckCircle2 },
};

// --- Components ---

export default function WorkflowsSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const organizationId = user?.organizationId;

  const [isStateDialogOpen, setStateDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<WorkflowState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch Workflows
  const workflowsQuery = useMemo(() => {
    if (!firestore || !organizationId) return null;
    return query(collection(firestore, 'organizations', organizationId, 'workflows'), limit(1));
  }, [firestore, organizationId]);

  const { data: workflows, isLoading } = useCollection<Workflow>(workflowsQuery);
  const currentWorkflow = workflows?.[0];

  // 2. Initialize Default Workflow if none exists
  useEffect(() => {
    if (!isLoading && !currentWorkflow && firestore && organizationId) {
      const initDefaultWorkflow = () => {
        const workflowsRef = collection(firestore, 'organizations', organizationId, 'workflows');
        const defaultStates: WorkflowState[] = [
          { id: crypto.randomUUID(), name: 'Backlog', type: 'Backlog', color: 'bg-slate-500' },
          { id: crypto.randomUUID(), name: 'To Do', type: 'To Do', color: 'bg-blue-500' },
          { id: crypto.randomUUID(), name: 'In Progress', type: 'In Progress', color: 'bg-amber-500' },
          { id: crypto.randomUUID(), name: 'In Review', type: 'In Review', color: 'bg-purple-500' },
          { id: crypto.randomUUID(), name: 'Done', type: 'Done', color: 'bg-green-500' },
        ];
        
        addDocumentNonBlocking(workflowsRef, {
          name: 'Standard Development Workflow',
          description: 'The default workflow used for all modules.',
          states: defaultStates,
          isDefault: true,
          createdAt: serverTimestamp(),
        });
      };
      initDefaultWorkflow();
    }
  }, [isLoading, currentWorkflow, firestore, organizationId]);

  // 3. State Actions
  const form = useForm<StateFormValues>({
    resolver: zodResolver(stateFormSchema),
    defaultValues: { name: '', type: 'To Do' },
  });

  const onOpenAddState = () => {
    setEditingState(null);
    form.reset({ name: '', type: 'To Do' });
    setStateDialogOpen(true);
  };

  const onOpenEditState = (state: WorkflowState) => {
    setEditingState(state);
    form.reset({ name: state.name, type: state.type });
    setStateDialogOpen(true);
  };

  const onSaveState = (values: StateFormValues) => {
    if (!currentWorkflow || !firestore || !organizationId) return;
    setIsSaving(true);

    const workflowRef = doc(firestore, 'organizations', organizationId, 'workflows', currentWorkflow.id);
    let updatedStates = [...currentWorkflow.states];

    if (editingState) {
      updatedStates = updatedStates.map(s => 
        s.id === editingState.id ? { ...s, name: values.name, type: values.type, color: typeConfigs[values.type].color } : s
      );
    } else {
      updatedStates.push({
        id: crypto.randomUUID(),
        name: values.name,
        type: values.type,
        color: typeConfigs[values.type].color,
      });
    }

    updateDocumentNonBlocking(workflowRef, { states: updatedStates });
    toast({ title: editingState ? 'State updated' : 'State added' });
    setStateDialogOpen(false);
    setIsSaving(false);
  };

  const onDeleteState = (stateId: string) => {
    if (!currentWorkflow || !firestore || !organizationId) return;
    if (currentWorkflow.states.length <= 2) {
      toast({ variant: 'destructive', title: 'Cannot delete', description: 'Workflows must have at least 2 states.' });
      return;
    }

    const workflowRef = doc(firestore, 'organizations', organizationId, 'workflows', currentWorkflow.id);
    const updatedStates = currentWorkflow.states.filter(s => s.id !== stateId);
    updateDocumentNonBlocking(workflowRef, { states: updatedStates });
    toast({ title: 'State removed' });
  };

  const onMoveState = (index: number, direction: 'up' | 'down') => {
    if (!currentWorkflow || !firestore || !organizationId) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentWorkflow.states.length) return;

    const workflowRef = doc(firestore, 'organizations', organizationId, 'workflows', currentWorkflow.id);
    const updatedStates = [...currentWorkflow.states];
    [updatedStates[index], updatedStates[newIndex]] = [updatedStates[newIndex], updatedStates[index]];
    updateDocumentNonBlocking(workflowRef, { states: updatedStates });
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Workflows</h3>
          <p className="text-sm text-muted-foreground">
            Define the custom states and lifecycles for your work items.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => toast({ title: "Feature coming soon", description: "Multi-workflow support is currently in development." })}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {!currentWorkflow ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-semibold">No workflow found</h4>
            <p className="text-sm text-muted-foreground max-w-xs">
              Initializing your organization's standard workflow...
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-muted/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  {currentWorkflow.name}
                </CardTitle>
                <CardDescription>
                  {currentWorkflow.description}
                </CardDescription>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-muted/60 overflow-hidden">
              {currentWorkflow.states.map((state, index) => {
                const Icon = typeConfigs[state.type]?.icon || Circle;
                const iconColorClass = state.color.replace('bg-', 'text-');
                
                return (
                  <div 
                    key={state.id} 
                    className={cn(
                      "flex items-center justify-between p-4 transition-colors hover:bg-muted/50",
                      index !== currentWorkflow.states.length - 1 ? 'border-b border-muted/60' : ''
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          disabled={index === 0}
                          onClick={() => onMoveState(index, 'up')}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          disabled={index === currentWorkflow.states.length - 1}
                          onClick={() => onMoveState(index, 'down')}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Icon className={cn("h-5 w-5", iconColorClass)} />
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold leading-none">{state.name}</p>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            {state.type}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenEditState(state)}>
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="text-center">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onOpenEditState(state)}>
                            <Settings2 className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteState(state.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove State
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" className="w-full border-dashed" onClick={onOpenAddState}>
              <Plus className="mr-2 h-4 w-4" />
              Add Workflow State
            </Button>
          </CardContent>
        </Card>
      )}

      {/* State Dialog */}
      <Dialog open={isStateDialogOpen} onOpenChange={setStateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingState ? 'Edit Workflow State' : 'Add Workflow State'}</DialogTitle>
            <DialogDescription>
              States define the stages of work in your modules.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSaveState)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ready for QA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Backlog">Backlog</SelectItem>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="In Review">In Review</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setStateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingState ? 'Save Changes' : 'Add State'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
