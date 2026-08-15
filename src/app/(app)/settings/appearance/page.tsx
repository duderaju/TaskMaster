'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from 'next-themes';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Check, Palette } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const appearanceFormSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'], {
    required_error: 'Please select a theme.',
  }),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

export default function AppearanceSettingsPage() {
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: 'system',
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && theme) {
      form.setValue('theme', theme as AppearanceFormValues['theme']);
    }
  }, [mounted, theme, form]);

  function onSubmit(data: AppearanceFormValues) {
    setTheme(data.theme);
    toast({
      title: 'Appearance Updated',
      description: `Theme has been set to ${data.theme}.`,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of your workspace.
        </p>
      </div>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Select the theme for your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!mounted ? (
                 <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-32" />
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormMessage />
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid max-w-md grid-cols-1 gap-4 pt-2 sm:grid-cols-3"
                        >
                          <FormItem>
                            <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                              <FormControl>
                                <RadioGroupItem value="light" className="sr-only" />
                              </FormControl>
                              <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                                <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                                  <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                                    <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                                    <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                  </div>
                                  <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                                    <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                                    <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                  </div>
                                  <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                                    <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                                    <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                  </div>
                                </div>
                              </div>
                              <span className="block w-full p-2 text-center font-normal">
                                Light
                              </span>
                            </FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                              <FormControl>
                                <RadioGroupItem value="dark" className="sr-only" />
                              </FormControl>
                              <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                                <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                                  <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                    <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                                    <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                  </div>
                                  <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                    <div className="h-4 w-4 rounded-full bg-slate-400" />
                                    <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                  </div>
                                  <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                    <div className="h-4 w-4 rounded-full bg-slate-400" />
                                    <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                  </div>
                                </div>
                              </div>
                              <span className="block w-full p-2 text-center font-normal">
                                Dark
                              </span>
                            </FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                              <FormControl>
                                <RadioGroupItem
                                  value="system"
                                  className="sr-only"
                                />
                              </FormControl>
                              <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                                <div className="flex h-[116px] items-center justify-center rounded-sm bg-secondary">
                                  <Palette className="h-8 w-8 text-muted-foreground" />
                                </div>
                              </div>
                              <span className="block w-full p-2 text-center font-normal">
                                System
                              </span>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Update Appearance</Button>
                </>
              )}
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}
