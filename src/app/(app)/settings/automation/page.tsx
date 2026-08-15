'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Zap, 
  Plus, 
  PlayCircle, 
  Clock, 
  UserPlus, 
  MessageSquare,
  Repeat,
  Loader2,
  Trash2,
  MoreVertical,
  Settings2,
  History,
  Sparkles
} from 'lucide-react';
import { useFirestore, useUser, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp, doc, orderBy } from 'firebase/firestore';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
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

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  active: boolean;
  createdAt: any;
}

const ruleFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().min(10, 'Please provide a clear description.'),
  trigger: z.string().min(1, 'Please select a trigger.'),
});

type RuleFormValues = z.infer<typeof ruleFormSchema>;

const triggerOptions = [
  { value: 'Issue created', icon: Zap, description: 'Runs when a new issue is added.' },
  { value: 'Status changed', icon: Repeat, description: 'Runs when an issue status transitions.' },
  { value: 'Schedule', icon: Clock, description: 'Runs at a specific time interval.' },
  { value: 'User assigned', icon: UserPlus, description: 'Runs when an assignee is set.' },
  { value: 'Comment added', icon: MessageSquare, description: 'Runs when a new comment is posted.' },
];

const templateData = [
  { 
    name: "Critical bug alert", 
    description: "Notify team when an issue priority is set to Urgent.", 
    trigger: "Status changed", 
    icon: Zap, 
    color: "text-red-500" 
  },
  { 
    name: "Weekly digest", 
    description: "Send a summary of all completed tasks every Friday at 5:00 PM.", 
    trigger: "Schedule", 
    icon: Clock, 
    color: "text-blue-500" 
  },
  { 
    name: "Auto-assign lead", 
    description: "Assign module lead automatically when a new story is created.", 
    trigger: "Issue created", 
    icon: UserPlus, 
    color: "text-purple-500" 
  }
];

export default function AutomationSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const organizationId = user?.organizationId;

  const [isRuleDialogOpen, setRuleDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);

  const rulesQuery = useMemo(() => {
    if (!firestore || !organizationId) return null;
    return query(collection(firestore, 'organizations', organizationId, 'automation_rules'), orderBy('createdAt', 'desc'));
  }, [firestore, organizationId]);

  const { data: rules, isLoading } = useCollection<AutomationRule>(rulesQuery);

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: { name: '', description: '', trigger: 'Issue created' },
  });

  const onToggleStatus = (ruleId: string, currentStatus: boolean) => {
    if (!firestore || !organizationId) return;
    const ruleRef = doc(firestore, 'organizations', organizationId, 'automation_rules', ruleId);
    updateDocumentNonBlocking(ruleRef, { active: !currentStatus });
    toast({
      title: !currentStatus ? 'Rule enabled' : 'Rule paused',
      description: `The automation rule has been updated.`,
    });
  };

  const onDeleteRule = (ruleId: string) => {
    if (!firestore || !organizationId) return;
    const ruleRef = doc(firestore, 'organizations', organizationId, 'automation_rules', ruleId);
    deleteDocumentNonBlocking(ruleRef);
    toast({ title: 'Rule deleted', variant: 'destructive' });
  };

  const onCreateRule = async (values: RuleFormValues) => {
    if (!firestore || !organizationId) return;
    setIsSaving(true);

    try {
      const rulesRef = collection(firestore, 'organizations', organizationId, 'automation_rules');
      await addDocumentNonBlocking(rulesRef, {
        ...values,
        active: true,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Automation rule created' });
      setRuleDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to create rule', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseTemplate = async (template: typeof templateData[0]) => {
    if (!firestore || !organizationId) return;
    setCreatingTemplateId(template.name);

    try {
      const rulesRef = collection(firestore, 'organizations', organizationId, 'automation_rules');
      await addDocumentNonBlocking(rulesRef, {
        name: template.name,
        description: template.description,
        trigger: template.trigger,
        active: true,
        createdAt: serverTimestamp(),
      });

      toast({ 
        title: 'Template Applied', 
        description: `"${template.name}" has been added to your rules.` 
      });
    } catch (error) {
      console.error(error);
      toast({ 
        title: 'Failed to apply template', 
        variant: 'destructive' 
      });
    } finally {
      setCreatingTemplateId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Automation</h3>
          <p className="text-muted-foreground">
            Create rules to automate repetitive tasks and keep your team in sync.
          </p>
        </div>
        <Button onClick={() => setRuleDialogOpen(true)} className="w-full sm:w-auto shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <div className="grid gap-4">
        {rules && rules.length > 0 ? (
          rules.map((rule) => {
            const TriggerIcon = triggerOptions.find(t => t.value === rule.trigger)?.icon || Zap;
            return (
              <Card key={rule.id} className={cn(
                "group relative overflow-hidden transition-all duration-200 border-muted/60 hover:border-primary/30 hover:shadow-md",
                !rule.active && "bg-muted/30 border-dashed"
              )}>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row sm:items-center p-5 sm:p-6 gap-6">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                      rule.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground grayscale"
                    )}>
                      <TriggerIcon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className={cn("font-bold text-lg leading-none", !rule.active && "text-muted-foreground")}>
                          {rule.name}
                        </h4>
                        {!rule.active && (
                          <Badge variant="outline" className="h-5 text-[10px] uppercase font-bold text-muted-foreground border-muted-foreground/30">
                            Paused
                          </Badge>
                        )}
                      </div>
                      <p className={cn("text-sm text-muted-foreground max-w-2xl leading-relaxed line-clamp-2", !rule.active && "opacity-60")}>
                        {rule.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                          Trigger: <span className="text-foreground">{rule.trigger}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                          <PlayCircle className="h-3.5 w-3.5 text-emerald-500" />
                          Action: <span className="text-foreground">Execute custom logic</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:pl-6 sm:border-l border-muted">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:block">
                          {rule.active ? 'Active' : 'Paused'}
                        </span>
                        <Switch 
                          checked={rule.active} 
                          onCheckedChange={() => onToggleStatus(rule.id, rule.active)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-center">Manage Rule</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toast({ title: "Configuration", description: "Editing rules is currently in development." })}>
                              <Settings2 className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: "Execution", description: "Manual trigger initiated..." })}>
                              <PlayCircle className="mr-2 h-4 w-4" /> Run Now
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: "History", description: "Last run: Success (2h ago)" })}>
                              <History className="mr-2 h-4 w-4" /> View History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => onDeleteRule(rule.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Rule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-2 border-dashed bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="text-xl font-bold">No automation rules</h4>
              <p className="text-muted-foreground max-w-sm mt-2 mb-8">
                You haven't created any automation rules yet. Start by clicking "Create Rule" to build your first workflow.
              </p>
              <Button onClick={() => setRuleDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first rule
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Templates Section */}
      <div className="pt-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold">Rule Templates</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templateData.map((template, i) => {
            const isCreating = creatingTemplateId === template.name;
            return (
              <Card key={i} className="flex flex-col hover:bg-muted/50 border-muted/60 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <template.icon className={cn("h-5 w-5", template.color)} />
                    <CardTitle className="text-sm font-bold">{template.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {template.description}
                  </p>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 mt-4 text-xs font-bold text-primary self-start items-center" 
                    disabled={isCreating}
                    onClick={() => handleUseTemplate(template)}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      'Use this template →'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl">Create Automation Rule</DialogTitle>
            <DialogDescription>
              Define a trigger and description for your new automated workflow.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateRule)}>
              <div className="p-6 space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Rule Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Notify team on critical bugs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Describe what this rule does..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trigger"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Trigger Event</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select a trigger" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {triggerOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="py-3">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-1 rounded bg-muted">
                                  <option.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="font-bold text-sm leading-none">{option.value}</span>
                                  <span className="text-[10px] text-muted-foreground mt-1">{option.description}</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="p-6 pt-2 bg-muted/30 border-t gap-2 flex-col sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setRuleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Rule
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
