'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, UserCog, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { updateMemberRole } from '@/app/actions/user-org-actions';
import { useUser } from '@/firebase';
import { USER_ROLES } from '@/lib/constants';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

const formSchema = z.object({
  role: z.string().min(1, 'Please select a role.'),
});

type FormValues = z.infer<typeof formSchema>;

const roleOptions = USER_ROLES.map(role => ({ value: role, label: role }));

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
}

export function EditRoleDialog({ open, onOpenChange, member }: EditRoleDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const organizationId = user?.organizationId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'Viewer',
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({ role: member.role });
    }
  }, [member, form]);

  const onSubmit = async (data: FormValues) => {
    if (!member || !organizationId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Member or organization data is missing.' });
      return;
    }

    const result = await updateMemberRole({
      organizationId,
      memberId: member.id,
      newRole: data.role,
    });

    if (result.success) {
      toast({
        title: 'Role Updated',
        description: `${member.firstName} ${member.lastName}'s role has been updated to ${data.role}.`,
      });
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error || 'An unknown error occurred.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
              <UserCog className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle>Edit Role for {member?.firstName} {member?.lastName}</DialogTitle>
              <DialogDescription>
                Select a new role for this team member.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} modal={false}>
                    <FormControl>
                      <SelectTrigger>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
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
