'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name is required.'),
  lastName: z.string().min(2, 'Last name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter.')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Must contain at least one number.')
    .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character.'),
});

type FormValues = z.infer<typeof formSchema>;

function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { user } = useUser();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inviteToken = searchParams.get('invite_token');
  const invitedEmail = searchParams.get('invited_email');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: '', lastName: '', email: invitedEmail || '', password: '' },
  });

  useEffect(() => {
    if (invitedEmail) {
      form.setValue('email', invitedEmail);
    }
  }, [invitedEmail, form]);

  useEffect(() => {
    if (user) {
      if (inviteToken) {
        router.push(`/invite?token=${inviteToken}`);
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router, searchParams, inviteToken]);

  const onSubmit = async (data: FormValues) => {
    if (!auth) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, {
        displayName: `${data.firstName} ${data.lastName}`.trim(),
      });
      
      await sendEmailVerification(userCredential.user).catch(err => {
        console.debug('[Auth SDK] Verification email failed:', err);
      });

      toast({ title: 'Success!', description: 'Account created. Redirecting...' });
    } catch (error: any) {
      console.debug('[Auth SDK] Registration failed:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.code === 'auth/email-already-in-use' ? 'This email is already in use.' : error.message,
      });
    }
  };

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!auth || isGoogleLoading) return;
    
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ 
      prompt: 'select_account',
      login_hint: invitedEmail || ''
    });

    try {
      await signInWithPopup(auth, provider);  
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (auth.currentUser) return;
        setIsGoogleLoading(false);
        return;
      }

      console.debug('[Auth SDK] Google Sign-up failed:', error);
      toast({ variant: 'destructive', title: 'Google Login Failed', description: error.message });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500 py-12 px-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <Logo />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground">Start managing your projects with TaskMaster</p>
        </div>
      </div>

      <Card className="border-muted/60 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 space-y-6">
          {inviteToken && (
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-500">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-tight">Onboarding Active</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your account will be linked to the invited workspace{invitedEmail ? ` as ${invitedEmail}` : ''}.
                </p>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="John" className="pl-10 h-11 bg-background/50 focus-visible:ring-primary" {...field} />
                        </div>
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
                      <FormLabel className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" className="h-11 bg-background/50 focus-visible:ring-primary" {...field} />
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
                    <FormLabel className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="name@company.com" className="pl-10 h-11 bg-background/50 focus-visible:ring-primary" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          className="pl-10 pr-10 h-11 bg-background/50 focus-visible:ring-primary" 
                          {...field} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="rounded-lg bg-primary/5 p-3 flex items-start gap-3 border border-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  By clicking sign up, you agree to our <span className="text-primary font-bold">Terms of Service</span> and <span className="text-primary font-bold">Privacy Policy</span>.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-bold text-base shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                disabled={form.formState.isSubmitting || isGoogleLoading}
              >
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold tracking-wider">Or</span>
            </div>
          </div>

          <Button 
            type="button"
            variant="outline" 
            className="w-full h-11 font-semibold border-muted-foreground/20 hover:bg-muted/50 transition-all hover:scale-[1.01] active:scale-[0.99] group" 
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || form.formState.isSubmitting}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.48-.98 7.31-2.64l-3.57-2.77c-1.01.68-2.31 1.09-3.74 1.09-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.68-.35-1.41-.35-2.09s.13-1.41.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-sm font-medium">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link href={`/sign-in${inviteToken ? '?invite_token=' + inviteToken : ''}${invitedEmail ? '&invited_email=' + invitedEmail : ''}`} className="text-primary hover:underline font-bold decoration-2 underline-offset-4">Sign in instead</Link>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}