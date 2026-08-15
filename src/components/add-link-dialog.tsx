'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { useEffect } from 'react';
import { type Timestamp } from 'firebase/firestore';

const formSchema = z.object({
  url: z.string().url('Please enter a valid URL.'),
  title: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// The data structure for a link, matching what's in issues/page.tsx
interface LinkItemData {
  id: string;
  url: string;
  title: string;
  addedAt: Timestamp;
  addedBy: string;
}

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: FormValues, id?: string) => void;
  linkToEdit?: LinkItemData | null;
}

export function AddLinkDialog({ open, onOpenChange, onSave, linkToEdit }: AddLinkDialogProps) {
  const isEditing = !!linkToEdit;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      title: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (isEditing) {
        form.reset({ url: linkToEdit.url, title: linkToEdit.title });
      } else {
        form.reset({ url: '', title: '' });
      }
    }
  }, [open, linkToEdit, form, isEditing]);

  const onSubmit = (data: FormValues) => {
    onSave(data, linkToEdit?.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit link' : 'Add link'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Type or paste a URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Display title
                    <span className="ml-2 text-xs font-normal text-muted-foreground">Optional</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="What you'd like to see this link as" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? 'Save Changes' : 'Add Link'}
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
