'use client';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  setDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  doc,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { projectGradients } from '@/lib/project-gradients';

import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Folder, Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  key: z
    .string()
    .min(2, 'Key must be at least 2 characters.')
    .max(5, 'Key must be 5 characters or less.')
    .regex(/^[A-Z0-9]+$/, 'Key must be uppercase letters or numbers.'),
  type: z.enum(['Kanban', 'Scrum']),
  status: z.enum(['Draft', 'Planned', 'Active', 'On Hold', 'Archived', 'Done']),
});

type FormValues = z.infer<typeof formSchema>;

const statusOptions: { value: FormValues['status']; color: string }[] = [
  { value: 'Draft', color: 'bg-status-draft' },
  { value: 'Planned', color: 'bg-status-planned' },
  { value: 'Active', color: 'bg-status-active' },
  { value: 'On Hold', color: 'bg-status-on-hold' },
  { value: 'Done', color: 'bg-status-done' },
  { value: 'Archived', color: 'bg-status-archived' },
];

const typeOptions = [
    { value: 'Kanban', label: 'Kanban' },
    { value: 'Scrum', label: 'Scrum' },
];


interface CreateModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateModuleDialog({
  open,
  onOpenChange,
}: CreateModuleDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const organizationId = user?.organizationId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      key: '',
      type: 'Kanban',
      status: 'Planned',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const generateKey = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 4)
      .toUpperCase();
  };

  const onSubmit = async (data: FormValues) => {
    if (!firestore || !user || !organizationId) {
      toast({
        variant: 'destructive',
        title: 'Authentication or database error.',
        description: 'Please wait for your session to load and try again.',
      });
      return;
    }

    const modulesCollectionRef = collection(
      firestore,
      'organizations',
      organizationId,
      'modules'
    );
    
    const modulesSnapshot = await getCountFromServer(modulesCollectionRef);
    const moduleCount = modulesSnapshot.data().count;

    const assignedColor = projectGradients[moduleCount % projectGradients.length];

    const newModuleRef = doc(modulesCollectionRef);

    setDocumentNonBlocking(
      newModuleRef,
      {
        ...data,
        id: newModuleRef.id,
        organizationId: organizationId,
        leadId: user.uid,
        isArchived: data.status === 'Archived',
        color: assignedColor,
        createdAt: new Date(),
        serverCreatedAt: serverTimestamp(),
        lastIssueNumber: 0,
      },
      { merge: false }
    );

    toast({
      title: 'Module Creation Initiated',
      description: `"${data.name}" is being set up.`,
    });

    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                  <Folder className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle>Create a new module</DialogTitle>
                  <DialogDescription className="sr-only">
                    Let's get started with the basics. You can configure more
                    later.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Website Redesign"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          form.setValue('key', generateKey(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module Key</FormLabel>
                      <FormControl>
                        <Input placeholder="MOD" {...field} />
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
                      <FormLabel>Module Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} modal={false}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a module type" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {typeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Status</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} modal={false}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an initial status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                    <div className={cn('h-2.5 w-2.5 rounded-full', option.color)} />
                                    <span>{option.value}</span>
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
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isUserLoading ||
                  !organizationId ||
                  form.formState.isSubmitting
                }
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Module
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
