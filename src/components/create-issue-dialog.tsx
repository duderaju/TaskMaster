'use client';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  doc,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Bug,
  Book,
  CheckSquare,
  ShieldAlert,
  Ban,
  PlusCircle,
  CircleDashed,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  Tags,
  Triangle,
  User,
  RefreshCw,
  FolderKanban,
  SignalHigh,
  SignalMedium,
  SignalLow,
  X,
  Check,
  Eye,
} from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { StatusBadge, IssueStatus } from './status-badge';
import { PriorityBadge, IssuePriority } from './priority-badge';
import { DateProperty } from './ui/date-property';

const normalizeDate = (d: Date): Date => {
  const newDate = new Date(d);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const formSchema = z
  .object({
    title: z.string().min(1, 'Title is required.'),
    description: z.string().optional(),
    status: z.enum([
      'Backlog',
      'To Do',
      'In Progress',
      'In Review',
      'Done',
      'Canceled',
      'Blocked',
    ]),
    priority: z.enum(['None', 'Low', 'Medium', 'High', 'Urgent']),
    moduleId: z.string().optional(),
    assigneeId: z.string().optional(),
    labelIds: z.array(z.string()).optional(),
    storyPoints: z.number().optional(),
    cycle: z.string().optional(),
    startDate: z.date().optional(),
    dueDate: z.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.dueDate) {
      const today = normalizeDate(new Date());
      let minDueDate = today;

      if (data.startDate) {
        const normalizedStart = normalizeDate(data.startDate);
        minDueDate = normalizedStart > today ? normalizedStart : today;
      }

      if (normalizeDate(data.dueDate) < minDueDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Due date cannot be in the past or earlier than the start date.',
          path: ['dueDate'],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

const priorityOptions: {
  value: IssuePriority;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'None', label: 'None', icon: Ban },
  { value: 'Low', label: 'Low', icon: SignalLow },
  { value: 'Medium', label: 'Medium', icon: SignalMedium },
  { value: 'High', label: 'High', icon: SignalHigh },
  { value: 'Urgent', label: 'Urgent', icon: ShieldAlert },
];

const statusOptions: {
  value: IssueStatus;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'Backlog', label: 'Backlog', icon: CircleDashed },
  { value: 'To Do', label: 'To Do', icon: Circle },
  { value: 'In Progress', label: 'In Progress', icon: Clock },
  { value: 'In Review', label: 'In Review', icon: Eye },
  { value: 'Done', label: 'Done', icon: CheckCircle2 },
  { value: 'Canceled', label: 'Canceled', icon: XCircle },
  { value: 'Blocked', label: 'Blocked', icon: ShieldAlert },
];

const labelOptions = [
  { value: 'bug', label: 'Bug', color: 'bg-red-500' },
  { value: 'feature', label: 'Feature', color: 'bg-green-500' },
  { value: 'improvement', label: 'Improvement', color: 'bg-blue-500' },
];

const cycleOptions = [
  { value: 'no-cycle', label: 'No Cycle', icon: CircleDashed },
  { value: 'sprint-1', label: 'Sprint 1', icon: RefreshCw },
  { value: 'sprint-2', label: 'Sprint 2', icon: RefreshCw },
  { value: 'sprint-3', label: 'Sprint 3', icon: RefreshCw },
];

const storyPointOptions = [
  { value: '0', label: 'No estimate', icon: Triangle },
  { value: '0.5', label: '.5', icon: Triangle },
  { value: '1', label: '1', icon: Triangle },
  { value: '2', label: '2', icon: Triangle },
  { value: '3', label: '3', icon: Triangle },
  { value: '5', label: '5', icon: Triangle },
  { value: '8', label: '8', icon: Triangle },
  { value: '13', label: '13', icon: Triangle },
];

interface Module {
  id: string;
  name: string;
  key: string;
  lastIssueNumber: number;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

interface CreateIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAssigneeId?: string;
}

export function CreateIssueDialog({
  open,
  onOpenChange,
  defaultAssigneeId,
}: CreateIssueDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const organizationId = user?.organizationId;

  const modulesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'modules');
  }, [firestore, organizationId]);

  const { data: modules } = useCollection<Module>(modulesQuery);

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'members');
  }, [firestore, organizationId]);

  const { data: membersFromDb } = useCollection<Member>(membersQuery);

  const allMembers = (membersFromDb || []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'To Do',
      priority: 'None',
      moduleId: undefined,
      assigneeId: undefined,
      labelIds: [],
      storyPoints: 0,
      cycle: 'no-cycle',
    },
  });

  const { control, watch, setValue } = form;
  const startDate = watch('startDate');
  const dueDate = watch('dueDate');

  useEffect(() => {
    if (open) {
      form.reset({
        title: '',
        description: '',
        status: 'To Do',
        priority: 'None',
        moduleId: undefined,
        assigneeId: defaultAssigneeId,
        labelIds: [],
        storyPoints: 0,
        cycle: 'no-cycle',
        startDate: undefined,
        dueDate: undefined,
      });
    }
  }, [open, defaultAssigneeId, form]);

  const getMinDueDate = (): Date => {
    const today = normalizeDate(new Date());
    if (startDate) {
      const normalizedStart = normalizeDate(startDate);
      return normalizedStart > today ? normalizedStart : today;
    }
    return today;
  };

  const disableDueDate = (date: Date): boolean => {
    const dateToCheck = normalizeDate(date);
    const minDueDate = getMinDueDate();
    return dateToCheck < minDueDate;
  };

  useEffect(() => {
    const minDueDate = getMinDueDate();
    if (dueDate && normalizeDate(dueDate) < minDueDate) {
      setValue('dueDate', undefined, { shouldValidate: true });
    }
  }, [startDate, dueDate, setValue]);

  const onSubmit = async (data: FormValues) => {
    if (!firestore || !user || !organizationId) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Please wait for your session to load.',
      });
      return;
    }

    if (!data.moduleId) {
      toast({
        variant: 'destructive',
        title: 'No Module Selected',
        description: 'Please select a module.',
      });
      return;
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const moduleRef = doc(
          firestore,
          'organizations',
          organizationId,
          'modules',
          data.moduleId!
        );
        const moduleDoc = await transaction.get(moduleRef);

        if (!moduleDoc.exists()) {
          throw new Error('Module not found.');
        }

        const moduleData = moduleDoc.data() as Module;
        const newIssueNumber = (moduleData.lastIssueNumber || 0) + 1;
        const issueKey = `${moduleData.key}-${newIssueNumber}`;

        const issuesCollectionRef = collection(
          firestore,
          'organizations',
          organizationId,
          'issues'
        );
        const newIssueRef = doc(issuesCollectionRef);

        const finalData: any = {
          id: newIssueRef.id,
          key: issueKey,
          organizationId: organizationId,
          reporterId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          title: data.title,
          description: data.description || '',
          type: 'Task', // Default type since field is removed
          status: data.status,
          priority: data.priority,
          moduleId: data.moduleId,
          assigneeId: data.assigneeId || null,
          labelIds: data.labelIds || [],
          storyPoints: data.storyPoints || 0,
          cycle: data.cycle || 'no-cycle',
        };

        if (data.startDate) finalData.startDate = Timestamp.fromDate(data.startDate);
        if (data.dueDate) finalData.dueDate = Timestamp.fromDate(data.dueDate);

        transaction.set(newIssueRef, finalData);
        transaction.update(moduleRef, { lastIssueNumber: newIssueNumber });
      });

      toast({
        title: 'Issue Created',
        description: `"${data.title}" has been successfully created.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating issue:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Issue',
        description: error.message || 'An error occurred.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PlusCircle className="h-4 w-4" />
            </div>
            Create new work item
          </DialogTitle>
          <DialogDescription className="sr-only">
            Fill out the form to create a new work item.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col"
          >
            <div className="flex-grow overflow-y-auto px-6 space-y-4 pb-4">
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Issue Title"
                        className="text-lg p-2 h-auto border-input focus-visible:ring-2 focus-visible:ring-primary/20 bg-background font-semibold"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Click to add description..."
                        className="min-h-[150px] p-2 border-input focus-visible:ring-2 focus-visible:ring-primary/20 bg-background text-[15px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex-shrink-0 px-6 py-4">
              <div className="flex items-center gap-2 flex-wrap">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => {
                    const currentStatusConfig = StatusBadge.statusConfig[field.value as IssueStatus];
                    const StatusIcon = currentStatusConfig.icon;
                    return (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 px-2 py-1 text-xs [&>svg]:hidden border border-input bg-background hover:bg-muted focus:ring-0 cursor-pointer transition-all active:scale-95 data-[state=open]:bg-muted">
                              <div className="flex items-center gap-1.5 text-foreground font-bold uppercase tracking-tight">
                                <StatusIcon className={cn('h-4 w-4', currentStatusConfig.color)} />
                                {currentStatusConfig.label}
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="cursor-pointer transition-colors py-2">
                                <div className="flex items-center gap-2">
                                  <option.icon className={cn('h-4 w-4', StatusBadge.statusConfig[option.value]?.color)} />
                                  <span className="font-bold uppercase tracking-tight text-[11px]">{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    );
                  }}
                />
                <Controller
                  control={form.control}
                  name="priority"
                  render={({ field }) => {
                    const isDefault = !field.value || field.value === 'None';
                    const config = PriorityBadge.priorityConfig[field.value as IssuePriority];
                    return (
                      <FormItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'h-10 px-2 py-1 text-xs [&>svg]:hidden w-auto justify-start border-input hover:bg-muted focus-visible:ring-0 cursor-pointer transition-all active:scale-95 data-[state=open]:bg-muted',
                                !isDefault && config.className,
                                !isDefault && 'border-transparent'
                              )}
                              type="button"
                            >
                              <div className={cn('flex items-center gap-x-1.5 font-bold uppercase tracking-tight', isDefault && 'text-foreground')}>
                                <config.icon className={cn('h-4 w-4', !isDefault && config.iconClassName)} />
                                <span className="whitespace-nowrap">{isDefault ? 'None' : config.label}</span>
                              </div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {priorityOptions.map((option) => (
                              <DropdownMenuItem key={option.value} onSelect={() => field.onChange(option.value)} className="cursor-pointer transition-colors py-2">
                                <div className={cn('w-4 mr-2', field.value === option.value ? 'opacity-100' : 'opacity-0')}>
                                  <Check className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <option.icon className={cn('h-4 w-4', PriorityBadge.priorityConfig[option.value as IssuePriority]?.iconClassName)} />
                                  <span className="font-bold uppercase tracking-tight text-[11px]">{option.label}</span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => {
                    const selectedMember = allMembers.find((m) => m.id === field.value);
                    return (
                      <FormItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 px-2 py-1 text-xs [&>svg]:hidden w-auto justify-start border-input hover:bg-muted focus-visible:ring-0 cursor-pointer transition-all active:scale-95 data-[state=open]:bg-muted" type="button">
                              <div className="flex items-center gap-1.5 text-foreground font-bold uppercase tracking-tight">
                                {selectedMember ? (
                                  <Avatar className="h-5 w-5 border shadow-sm">
                                    <AvatarImage src={selectedMember.avatarUrl} />
                                    <AvatarFallback className="text-[10px]">{selectedMember.firstName?.[0]}{selectedMember.lastName?.[0]}</AvatarFallback>
                                  </Avatar>
                                ) : <User className="h-4 w-4 text-muted-foreground opacity-70" />}
                                <span>{selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : 'Assignees'}</span>
                              </div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="max-h-64 overflow-y-auto w-56">
                            {allMembers.map((member) => (
                              <DropdownMenuItem key={member.id} onSelect={() => field.onChange(field.value === member.id ? undefined : member.id)} className="cursor-pointer transition-colors py-2">
                                <div className={cn('w-4 mr-2', field.value === member.id ? 'opacity-100' : 'opacity-0')}><Check className="h-4 w-4 text-primary" /></div>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6 border shadow-sm"><AvatarImage src={member.avatarUrl} /><AvatarFallback className="text-[10px]">{member.firstName?.[0]}{member.lastName?.[0]}</AvatarFallback></Avatar>
                                  <span className="font-bold">{member.firstName} {member.lastName}</span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormItem>
                    );
                  }}
                />
                <Controller
                  control={form.control}
                  name="labelIds"
                  render={({ field }) => {
                    const selectedLabels = (field.value || []).map((id) => labelOptions.find((opt) => opt.value === id)).filter(Boolean);
                    return (
                      <FormItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 px-2 py-1 text-xs gap-1.5 justify-start [&>svg]:hidden border-input hover:bg-muted focus-visible:ring-0 cursor-pointer transition-all active:scale-95 data-[state=open]:bg-muted" type="button">
                              {selectedLabels.length > 0 ? (
                                <div className="flex items-center gap-2 font-bold uppercase tracking-tight text-foreground">
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                  <span>{selectedLabels.length} Labels</span>
                                </div>
                              ) : <div className="flex items-center gap-2 text-foreground font-bold uppercase tracking-tight"><Tags className="h-4 w-4 text-muted-foreground opacity-70" /><span>Labels</span></div>}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            {labelOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                className="cursor-pointer transition-colors py-2 px-3"
                                onSelect={() => {
                                  const currentLabels = field.value || [];
                                  field.onChange(currentLabels.includes(option.value) ? currentLabels.filter((l) => l !== option.value) : [...currentLabels, option.value]);
                                }}
                              >
                                <div className={cn('w-4 mr-2 flex items-center justify-center', field.value?.includes(option.value) ? 'opacity-100' : 'opacity-0')}>
                                  <Check className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex items-center gap-2">
                                  {option.color && <div className={cn('h-2.5 w-2.5 rounded-full', option.color)} />}
                                  <span className="font-bold">{option.label}</span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <DateProperty value={field.value} onSave={field.onChange} placeholder="Start Date" highlightToday={false} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <DateProperty value={field.value} onSave={field.onChange} placeholder="Due Date" disabled={disableDueDate} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="moduleId"
                  render={({ field }) => {
                    const selectedModule = modules?.find((p) => p.id === field.value);
                    return (
                      <FormItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 px-2 py-1 text-xs [&>svg]:hidden w-auto justify-start border-input hover:bg-muted focus-visible:ring-0 cursor-pointer transition-all active:scale-95 data-[state=open]:bg-muted" type="button">
                              <div className="flex items-center gap-1.5 text-foreground font-bold uppercase tracking-tight">
                                <FolderKanban className="h-4 w-4 text-muted-foreground opacity-70" />
                                <span>{selectedModule?.name || 'Module'}</span>
                              </div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="max-h-64 overflow-y-auto w-56">
                            {modules?.map((module) => (
                              <DropdownMenuItem key={module.id} onSelect={() => field.onChange(field.value === module.id ? undefined : module.id)} className="cursor-pointer transition-colors py-2">
                                <div className={cn('w-4 mr-2', field.value === module.id ? 'opacity-100' : 'opacity-0')}><Check className="h-4 w-4 text-primary" /></div>
                                <span className="font-bold truncate">{module.name}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="storyPoints"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value || 0)}>
                        <FormControl>
                          <SelectTrigger className="h-10 px-2 py-1 text-xs [&>svg]:hidden border border-input bg-background hover:bg-muted focus:ring-0 cursor-pointer transition-all active:scale-95 data-[state=open]:bg-muted">
                            <div className="flex items-center gap-1.5 text-foreground font-bold uppercase tracking-tight">
                              <Triangle className="h-4 w-4 text-muted-foreground opacity-70" />
                              <span>{field.value === 0 ? 'Estimate' : storyPointOptions.find(o => o.value === String(field.value))?.label}</span>
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {storyPointOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="cursor-pointer transition-colors py-2">
                              <div className="flex items-center gap-2">
                                <Triangle className="h-4 w-4 text-muted-foreground opacity-50" />
                                <span className="font-bold">{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cycle"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 px-2 py-1 text-xs [&>svg]:hidden border border-input bg-background hover:bg-muted focus:ring-0 cursor-pointer transition-all active:scale-95 data-[state=open]:bg-muted">
                            <div className="flex items-center gap-1.5 text-foreground font-bold uppercase tracking-tight">
                              {field.value && field.value !== 'no-cycle' ? (
                                <RefreshCw className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <CircleDashed className="h-4 w-4 text-muted-foreground opacity-70" />
                              )}
                              <span>{field.value === 'no-cycle' || !field.value ? 'Cycle' : cycleOptions.find(o => o.value === field.value)?.label}</span>
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cycleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="cursor-pointer transition-colors py-2">
                              <div className="flex items-center gap-2">
                                {option.icon && <option.icon className={cn('h-4 w-4', option.value !== 'no-cycle' ? 'text-yellow-500' : 'text-muted-foreground opacity-50')} />}
                                <span className="font-bold">{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-muted/50 border-t p-4 flex-shrink-0 justify-end flex items-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} type="button" className="font-bold px-6">Discard</Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="font-bold px-8 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Item
                </Button>
              </div>
            </div>
          </form>
        </Form>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
