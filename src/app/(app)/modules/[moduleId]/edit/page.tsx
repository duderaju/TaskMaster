'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { Settings2, Loader2, ChevronLeft, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
    { value: 'Kanban', label: 'Kanban Framework' },
    { value: 'Scrum', label: 'Scrum Framework' },
];

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const organizationId = user?.organizationId;

  const moduleRef = useMemo(() => 
    firestore && organizationId && moduleId
      ? doc(firestore, 'organizations', organizationId, 'modules', moduleId)
      : null, 
    [firestore, organizationId, moduleId]
  );

  const { data: moduleData, isLoading: moduleLoading } = useDoc(moduleRef);

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
    if (moduleData) {
      form.reset({
        name: moduleData.name,
        key: moduleData.key,
        type: moduleData.type,
        status: moduleData.status,
      });
    }
  }, [moduleData, form]);

  const onSubmit = (data: FormValues) => {
    if (!moduleRef) return;

    updateDocumentNonBlocking(moduleRef, {
      ...data,
      isArchived: data.status === 'Archived',
      updatedAt: new Date(),
    });

    toast({
      title: 'Module Updated',
      description: `"${data.name}" has been successfully updated.`,
    });

    router.push('/modules');
  };

  if (moduleLoading) {
    return (
      <div className="h-full min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md p-10 rounded-[2.5rem] bg-card/50 backdrop-blur-sm border border-muted shadow-2xl">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-6 w-1/2" />
                </div>
            </div>
            <div className="space-y-6">
                <Skeleton className="h-12 w-full rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-2xl mt-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 overflow-hidden">
      {/* Top Left Back Button - Google Standard Positioning */}
      <div className="absolute top-6 left-6">
         <Button 
            variant="ghost" 
            onClick={() => router.push('/modules')} 
            className="px-3 h-10 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground font-bold group transition-all"
          >
            <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Workspace
        </Button>
      </div>

      <Card className="w-full max-w-md bg-card border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-[2.5rem] overflow-hidden p-6 sm:p-8">
        <CardHeader className="p-0 mb-6">
           <div className="flex items-center gap-5">
             <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/5 shadow-sm">
                <Settings2 className="h-6 w-6" />
             </div>
             <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 mb-0.5 leading-none">Configuration Panel</p>
                <CardTitle className="text-xl font-bold tracking-tight truncate">Edit Module</CardTitle>
             </div>
           </div>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Module Identity</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Website Redesign" {...field} className="h-11 bg-muted/30 border-none rounded-xl focus-visible:ring-primary/20 text-sm font-semibold px-4" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Reference Key</FormLabel>
                    <FormControl>
                      <Input placeholder="MOD" {...field} className="h-11 bg-muted/30 border-none rounded-xl font-mono text-xs font-bold uppercase px-4" maxLength={5} />
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Framework</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 bg-muted/30 border-none rounded-xl text-xs font-bold px-4 focus:ring-0">
                              <SelectValue placeholder="Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                          {typeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="py-2.5 font-bold text-xs rounded-lg">
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
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Lifecycle Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-muted/30 border-none rounded-xl text-xs font-bold px-4 focus:ring-0">
                          <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                      {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="py-3 rounded-lg">
                              <div className="flex items-center gap-3 font-bold text-xs uppercase tracking-widest">
                                  <div className={cn('h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor]', option.color.replace('bg-', 'text-'))} />
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

            <div className="pt-6">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
                className="w-full h-12 rounded-2xl font-bold shadow-xl shadow-primary/20 active:scale-[0.98] transition-all text-sm bg-primary hover:bg-primary/90"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Commit Configuration'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
      
      <div className="mt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30">
        <ShieldCheck className="h-3 w-3" />
        Authorized Workspace Signature Verified
      </div>
    </div>
  );
}
