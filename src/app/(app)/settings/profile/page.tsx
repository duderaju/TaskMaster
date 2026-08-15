'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useRef, useState, useMemo } from 'react';
import { updateUserProfile } from '@/app/actions/user-actions';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';


const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email.').optional(),
  organizationId: z.string().optional(),
  role: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileSettingsPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      organizationId: '',
      role: '',
    },
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        organizationId: userData.organizationId || '',
        role: userData.role || 'Viewer',
      });
      setPreviewUrl(userData?.avatarUrl || user?.photoURL || null);
    }
  }, [userData, user, form]);

 const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user || !user.organizationId) {
        toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update your profile.',
        });
        return
    };

    const { id, update } = toast({
      title: "Updating Profile",
      description: "Please wait while we save your changes.",
    });

    try {
        const formData = new FormData();
        formData.append('userId', user.uid);
        formData.append('organizationId', user.organizationId);
        formData.append('firstName', data.firstName);
        formData.append('lastName', data.lastName);
        
        await updateUserProfile(formData);
        
        update({
            id: id,
            title: 'Profile Updated',
            description: 'Your profile has been successfully updated.',
        });
        form.reset(data);
    } catch (error) {
        console.error('Profile update error:', error);
        update({
            id: id,
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not save your profile. Please try again.',
        });
    }
  };
  
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !user.organizationId) return;

    if (file.size > 1 * 1024 * 1024) { 
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please select an image smaller than 1MB.',
      });
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      setPreviewUrl(dataUri);

      const formData = new FormData();
      formData.append('userId', user.uid);
      formData.append('organizationId', user.organizationId);
      formData.append('dataUri', dataUri);
      formData.append('firstName', form.getValues('firstName'));
      formData.append('lastName', form.getValues('lastName'));

      try {
        await updateUserProfile(formData);
        toast({
          title: 'Avatar Updated',
          description: 'Your new profile picture has been saved globally.',
        });
      } catch (error) {
        console.error('Avatar upload error:', error);
        setPreviewUrl(userData?.avatarUrl || user?.photoURL || null);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'Could not save your profile picture. Please try again.',
        });
      } finally {
        setIsUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
  };

  const isLoading = isUserLoading || isUserDataLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">My Profile</h3>
          <Skeleton className="h-4 w-64" />
        </div>
        <Card className="border-muted/60">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">My Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you across the workspace.
        </p>
      </div>
      <Card className="border-muted/60">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={handleAvatarClick}
                          disabled={isUploading}
                          className="relative group rounded-full shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border border-muted shadow-sm">
                            <AvatarImage src={previewUrl || undefined} className="object-cover" />
                            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                              {getInitials(userData?.firstName, userData?.lastName)}
                            </AvatarFallback>
                          </Avatar>
                           <div className={cn(
                              "absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white transition-opacity",
                              isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            )}>
                              {isUploading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                              ) : (
                                <Camera className="h-6 w-6" />
                              )}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to upload a profile picture</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                  />
                <div className="text-center sm:text-left space-y-1">
                    <CardTitle className="text-xl">Profile Information</CardTitle>
                    <CardDescription>
                        Update your photo and personal details.
                    </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input placeholder="Your email address" {...field} disabled />
                    </FormControl>
                     <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                  control={form.control}
                  name="organizationId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Organization ID</FormLabel>
                      <FormControl>
                          <Input placeholder="Your Organization ID" {...field} disabled />
                      </FormControl>
                      <FormDescription>
                        The unique identifier for your workspace.
                      </FormDescription>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Current Role</FormLabel>
                        <FormControl>
                            <Input {...field} disabled />
                        </FormControl>
                        <FormDescription>
                            Managed by the organization administrator.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <div className="pt-2">
                  <Button type="submit" className="w-full sm:w-auto" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
                      {form.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Profile
                  </Button>
                 </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}
