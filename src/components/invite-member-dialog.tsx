
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/firebase';
import { createInvite } from '@/app/actions/user-org-actions';
import { useOrganization } from '@/hooks/use-organization';

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
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2, X, ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { USER_ROLES } from '@/lib/constants';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  role: z.string().min(1, 'Please select a role.'),
});

type FormValues = z.infer<typeof formSchema>;

const roleOptions = USER_ROLES.map(role => ({ value: role, label: role }));

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const { organization, isOrgLoading } = useOrganization(user?.organizationId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'Viewer',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: FormValues) => {
    if (!user || !organization) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description:
          'You must be logged in and have an active organization to send invites.',
      });
      return;
    }

    try {
      const result = await createInvite({
        email: data.email,
        role: data.role,
        organizationId: organization.id,
        inviterId: user.uid,
      });

      if (result.success) {
        toast({
          title: 'Invitation Sent',
          description: `An invite has been successfully sent to ${data.email}.`,
        });
        onOpenChange(false);
      } else {
        let description = result.error || 'An unknown server error occurred.';
        if (result.error?.includes('535')) {
           description = "SMTP Authentication Failed. Please check your credentials.";
        }
        
        toast({
          variant: 'destructive',
          title: 'Failed to Send Invitation',
          description: description,
          duration: 9000,
        });
      }
    } catch (error: any) {
      console.error('CRITICAL: Failed to execute createInvite:', error);
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: 'Could not send the invitation. Please check the console.',
        duration: 9000,
      });
    }
  };

  const isOrgReady = organization?.status === 'active';
  const isButtonDisabled = !isOrgReady || form.formState.isSubmitting || isOrgLoading;
    
  const getButtonText = () => {
      if (isOrgLoading) return "Preparing workspace...";
      if (form.formState.isSubmitting) return "Sending...";
      return "Send Invitation";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary shadow-sm">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Invite Team Member</DialogTitle>
                  <DialogDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground opacity-70">
                    {organization?.name || 'Workspace Onboarding'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="name@company.com" className="h-11 bg-muted/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Assigned Role</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} modal={false}>
                        <FormControl>
                        <SelectTrigger className="h-11 bg-muted/20">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {roleOptions.map((option) => (
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
              
              <div className="rounded-lg bg-emerald-500/5 p-3 flex items-start gap-3 border border-emerald-500/10">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Invitations remain valid for 7 days. New members will be assigned to your organization automatically upon joining.
                </p>
              </div>
            </div>

            <DialogFooter className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button" className="w-full sm:w-auto h-11 px-6 font-semibold">
                    Cancel
                </Button>
              </DialogClose>
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <span className="w-full sm:w-auto">
                      <Button type="submit" disabled={isButtonDisabled} className="w-full h-11 px-8 font-bold shadow-lg shadow-primary/20">
                        {(isOrgLoading || form.formState.isSubmitting) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {getButtonText()}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!isOrgReady && (
                    <TooltipContent>
                      <p>Preparing your workspace...</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
