
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

const notificationsFormSchema = z.object({
  // In-app notifications
  inApp: z.object({
    issueAssigned: z.boolean().default(true),
    statusChanged: z.boolean().default(true),
    commentAdded: z.boolean().default(false),
    sprintStarted: z.boolean().default(false),
  }),
  // Email notifications
  email: z.object({
    issueAssigned: z.boolean().default(true),
    statusChanged: z.boolean().default(true),
    commentAdded: z.boolean().default(false),
    sprintStarted: z.boolean().default(true),
  }),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

export default function NotificationsSettingsPage() {
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    // TODO: Load these defaults from user settings in Firestore
    defaultValues: {
      inApp: {
        issueAssigned: true,
        statusChanged: true,
        commentAdded: true,
        sprintStarted: false,
      },
      email: {
        issueAssigned: true,
        statusChanged: true,
        commentAdded: false,
        sprintStarted: true,
      },
    },
  });

  function onSubmit(data: NotificationsFormValues) {
    // TODO: Save these settings to the user's profile in Firestore
    toast({
      title: 'Notifications settings saved',
      description: 'Your preferences have been updated.',
    });
    form.reset(data); // Reset form to new default values after saving
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications.
        </p>
      </div>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Choose where you want to receive notifications for different events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* In-App Notifications */}
              <div>
                <h4 className="text-md font-medium mb-4">In-App Notifications</h4>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="inApp.issueAssigned"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Task Assigned
                          </FormLabel>
                          <FormDescription>
                            Receive a notification when a task is assigned to you.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="inApp.statusChanged"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Status Changed
                          </FormLabel>
                          <FormDescription>
                            Get notified when the status of an issue you're assigned to changes.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="inApp.commentAdded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            New Comment
                          </FormLabel>
                          <FormDescription>
                            Be notified when someone comments on an issue you reported or are assigned to.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Email Notifications */}
              <div>
                <h4 className="text-md font-medium mb-4">Email Notifications</h4>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email.issueAssigned"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Task Assigned
                          </FormLabel>
                          <FormDescription>
                            Receive an email when a task is assigned to you.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email.statusChanged"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Status Changed Digest
                          </FormLabel>
                          <FormDescription>
                            Get a daily digest of status changes for issues you follow.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email.sprintStarted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Sprint Updates
                          </FormLabel>
                          <FormDescription>
                            Receive emails when a sprint starts or ends.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <div className="border-t p-6 flex justify-end">
              <Button type="submit" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Preferences
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
