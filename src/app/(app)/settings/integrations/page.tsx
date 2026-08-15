
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Github, 
  Slack, 
  Globe, 
  CheckCircle2, 
  Plus, 
  CloudLightning,
  Loader2,
  Trash2,
  MoreVertical,
  Link as LinkIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, useOrganization } from '@/firebase';
import { collection, query, serverTimestamp, doc, orderBy } from 'firebase/firestore';
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
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';

interface Webhook {
  id: string;
  name: string;
  url: string;
  active: boolean;
  createdAt: any;
}

const webhookFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  url: z.string().url('Please enter a valid URL.'),
});

type WebhookFormValues = z.infer<typeof webhookFormSchema>;

const availableIntegrations = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications to channels when issues are created or updated.',
    icon: Slack,
    category: 'Communication',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link pull requests to issues and automate status changes.',
    icon: Github,
    category: 'Development',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Attach files directly from your Google Drive to work items.',
    icon: Globe,
    category: 'Storage',
  },
];

export default function IntegrationsSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const organizationId = user?.organizationId;
  const { organization, isOrgLoading } = useOrganization(organizationId);

  const [isWebhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const webhooksQuery = useMemo(() => {
    if (!firestore || !organizationId) return null;
    return query(collection(firestore, 'organizations', organizationId, 'webhooks'), orderBy('createdAt', 'desc'));
  }, [firestore, organizationId]);

  const { data: webhooks, isLoading: webhooksLoading } = useCollection<Webhook>(webhooksQuery);

  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: { name: '', url: '' },
  });

  const handleToggleIntegration = (id: string, currentStatus: boolean) => {
    if (!firestore || !organizationId) return;
    const orgRef = doc(firestore, 'organizations', organizationId);
    
    updateDocumentNonBlocking(orgRef, {
      [`integrations.${id}`]: !currentStatus
    });

    toast({
      title: !currentStatus ? `${id.charAt(0).toUpperCase() + id.slice(1)} Connected` : `${id.charAt(0).toUpperCase() + id.slice(1)} Disconnected`,
      description: !currentStatus 
        ? `Successfully enabled the ${id} integration.` 
        : `Disabled the ${id} integration.`,
    });
  };

  const onToggleWebhookStatus = (webhookId: string, currentStatus: boolean) => {
    if (!firestore || !organizationId) return;
    const webhookRef = doc(firestore, 'organizations', organizationId, 'webhooks', webhookId);
    updateDocumentNonBlocking(webhookRef, { active: !currentStatus });
    toast({ title: !currentStatus ? 'Webhook enabled' : 'Webhook paused' });
  };

  const onDeleteWebhook = (webhookId: string) => {
    if (!firestore || !organizationId) return;
    const webhookRef = doc(firestore, 'organizations', organizationId, 'webhooks', webhookId);
    deleteDocumentNonBlocking(webhookRef);
    toast({ title: 'Webhook deleted', variant: 'destructive' });
  };

  const onCreateWebhook = async (values: WebhookFormValues) => {
    if (!firestore || !organizationId) return;
    setIsSaving(true);

    try {
      const webhooksRef = collection(firestore, 'organizations', organizationId, 'webhooks');
      await addDocumentNonBlocking(webhooksRef, {
        ...values,
        active: true,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Webhook created' });
      setWebhookDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to create webhook', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isOrgLoading || webhooksLoading;

  if (isLoading && !organization) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect your workspace with the tools your team already uses.
        </p>
      </div>

      <div className="grid gap-4">
        {availableIntegrations.map((integration) => {
          const isConnected = !!organization?.integrations?.[integration.id];
          return (
            <Card key={integration.id} className="overflow-hidden border-muted/60 transition-all">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition-colors",
                      isConnected ? "bg-primary/5 border-primary/20" : "bg-muted/50"
                    )}>
                      <integration.icon className={cn("h-6 w-6", isConnected ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold leading-none">{integration.name}</h4>
                        {isConnected && (
                          <Badge variant="secondary" className="h-5 gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-[10px] uppercase font-bold tracking-tight">Connected</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground max-w-md line-clamp-2">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-muted">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 sm:flex-none h-9"
                      onClick={() => toast({ title: "Configuration", description: "Integration settings are coming soon." })}
                    >
                      Configure
                    </Button>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground sm:hidden">
                        {isConnected ? 'Enabled' : 'Disabled'}
                      </span>
                      <Switch 
                        checked={isConnected} 
                        onCheckedChange={() => handleToggleIntegration(integration.id, isConnected)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <CloudLightning className="h-4 w-4 text-primary" />
              Webhooks
            </h3>
            <p className="text-sm text-muted-foreground">
              Build your own integrations by receiving real-time events.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setWebhookDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Webhook
          </Button>
        </div>

        <div className="grid gap-3">
          {webhooks && webhooks.length > 0 ? (
            webhooks.map((webhook) => (
              <Card key={webhook.id} className={cn("border-muted/60 transition-all", !webhook.active && "opacity-70 grayscale-[0.5] bg-muted/20")}>
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
                      <LinkIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold truncate">{webhook.name}</h4>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px] sm:max-w-md">
                        {webhook.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch 
                      checked={webhook.active}
                      onCheckedChange={() => onToggleWebhookStatus(webhook.id, webhook.active)}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDeleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 rounded-xl border border-dashed border-muted bg-muted/10">
              <p className="text-sm text-muted-foreground mb-4">No custom webhooks configured yet.</p>
              <Button variant="outline" size="sm" onClick={() => setWebhookDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Webhook
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isWebhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              Enter a destination URL to receive real-time notifications about workspace events.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateWebhook)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. My Production API" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endpoint URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.yourdomain.com/webhook" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setWebhookDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Webhook
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
