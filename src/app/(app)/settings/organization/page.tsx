'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, AlertTriangle, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const orgFormSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters.'),
});

type OrgFormValues = z.infer<typeof orgFormSchema>;

export default function OrganizationSettingsPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const organizationId = user?.organizationId;

  const orgDocRef = useMemo(() =>
    organizationId && firestore
      ? doc(firestore, 'organizations', organizationId)
      : null, [firestore, organizationId]);
      
  const { data: orgData, isLoading: isOrgLoading } = useDoc(orgDocRef);

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgFormSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (orgData) {
      form.reset({
        name: orgData.name || '',
      });
    }
  }, [orgData, form]);

  const onSubmit: SubmitHandler<OrgFormValues> = (data) => {
    if (!orgDocRef) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot find organization details.',
      });
      return;
    }

    updateDocumentNonBlocking(orgDocRef, {
      name: data.name,
    });

    toast({
      title: 'Organization Updated',
      description: 'Your organization name has been successfully updated.',
    });
  };

  const isLoading = isUserLoading || isOrgLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div className="space-y-1">
        <h3 className="text-2xl font-bold tracking-tight">Organization Profile</h3>
        <p className="text-sm text-muted-foreground">
          Manage your workspace's identity and global configuration.
        </p>
      </div>

      <Card className="border-muted/60 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="bg-muted/20 pb-6 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Workspace Identity</CardTitle>
                  <CardDescription>
                    Visible to all members in the navigation and emails.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 px-4 sm:px-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-11 w-full max-w-md" />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Organization Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Acme Corporation"
                          {...field}
                          className="w-full sm:max-w-md h-11 bg-background/50 border-muted/60 focus-visible:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
            <CardFooter className="border-t bg-muted/10 px-4 sm:px-6 py-4 flex justify-end">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || isLoading || !form.formState.isDirty}
                className="w-full sm:w-auto font-bold shadow-lg shadow-primary/10"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card className="border-destructive/20 shadow-sm bg-destructive/[0.01]">
          <CardHeader className="border-b border-destructive/10">
              <div className="flex items-center gap-3 text-destructive">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Critical Actions</CardTitle>
                  <CardDescription className="text-destructive/70">
                      Irreversible operations that affect all workspace data.
                  </CardDescription>
                </div>
              </div>
          </CardHeader>
          <CardContent className="pt-6 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <p className="font-bold text-foreground">Delete Workspace</p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                      Permanently remove this organization and all associated modules, issues, and member data.
                    </p>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full sm:w-auto font-bold shadow-lg shadow-destructive/10 h-11 px-6"
                  onClick={() => toast({ title: "Verification Required", description: "Please contact support to initiate organization deletion." })}
                >
                    <Trash2 className="mr-2 h-4 w-4"/>
                    Delete Organization
                </Button>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
