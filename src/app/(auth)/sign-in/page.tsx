'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithCustomToken
} from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowLeft,
  KeyRound,
  Send,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { generateAndSendEmailOTP, verifyEmailOTP } from '@/app/actions/auth-actions';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type FormValues = z.infer<typeof formSchema>;

function SignInForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { user } = useUser();
  
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'selection' | 'email-reset' | 'otp-entry'>('selection');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inviteToken = searchParams.get('invite_token');
  const invitedEmail = searchParams.get('invited_email');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: invitedEmail || '', password: '' },
  });

  useEffect(() => {
    if (invitedEmail) {
      form.setValue('email', invitedEmail);
    }
  }, [invitedEmail, form]);

  useEffect(() => {
    if (user) {
      const redirectUrl = searchParams.get('redirect_url');
      
      if (inviteToken) {
        router.push(`/invite?token=${inviteToken}`);
      } else {
        router.push(redirectUrl || '/dashboard');
      }
    }
  }, [user, router, searchParams, inviteToken]);

  const onSubmit = async (data: FormValues) => {
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
    } catch (error: any) {
      console.debug('[Auth SDK] Sign-in failed:', error);
      let message = 'Invalid email or password.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        message = "The credentials provided are incorrect. Please try again.";
      }
      toast({ variant: 'destructive', title: 'Sign In Failed', description: message });
    }
  };

  const handlePasswordReset = async () => {
    if (!auth || !resetEmail) return;
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({ 
        title: "Reset Link Sent", 
        description: `We've sent password reset instructions to ${resetEmail}.` 
      });
      setIsResetDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSendOTP = async () => {
    if (!resetEmail) return;
    setIsResetting(true);
    const result = await generateAndSendEmailOTP(resetEmail);
    if (result.success) {
      toast({ title: "Verification Code Sent", description: `Check your inbox at ${resetEmail}.` });
      setRecoveryStep('otp-entry');
    } else {
      toast({ variant: "destructive", title: "Failed to send code", description: result.error });
    }
    setIsResetting(false);
  };

  const handleVerifyOTP = async () => {
    if (!resetEmail || !otpCode || !auth) return;
    setIsResetting(true);
    const result = await verifyEmailOTP(resetEmail, otpCode);
    if (result.success && result.token) {
      try {
        await signInWithCustomToken(auth, result.token);
        toast({ title: "Sign-in Successful" });
        setIsResetDialogOpen(false);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Authentication Failed", description: error.message });
      }
    } else {
      toast({ variant: "destructive", title: "Verification Failed", description: result.error });
    }
    setIsResetting(false);
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
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 400 * (i + 1)));
          if (auth.currentUser) return;
        }
        setIsGoogleLoading(false);
        return;
      }

      console.debug('[Auth SDK] Google sign-in failed:', error);
      toast({ variant: 'destructive', title: 'Google Login Failed', description: error.message });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500 py-12 px-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <Logo />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">Log in to manage your workspace activities</p>
        </div>
      </div>

      <Card className="border-muted/60 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 space-y-6">
          {inviteToken && (
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-500">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-tight">Identity Required</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Please sign in using <span className="font-bold text-foreground">{invitedEmail || 'the invited email'}</span> to join the workspace.
                </p>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="name@company.com" 
                          className={cn(
                            "pl-10 h-11 bg-background/50 focus-visible:ring-primary",
                            invitedEmail && "border-primary/50 bg-primary/[0.02]"
                          )} 
                          {...field} 
                        />
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
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                      <button 
                        type="button" 
                        className="font-bold text-xs text-primary hover:underline"
                        onClick={() => {
                          setResetEmail(form.getValues('email'));
                          setRecoveryStep('selection');
                          setIsResetDialogOpen(true);
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
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
              <Button
                type="submit"
                className="w-full h-11 font-bold text-base shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                disabled={form.formState.isSubmitting || isGoogleLoading}
              >
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
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
        <span className="text-muted-foreground">New to TaskMaster? </span>
        <Link href={`/sign-up${inviteToken ? '?invite_token=' + inviteToken : ''}${invitedEmail ? '&invited_email=' + invitedEmail : ''}`} className="text-primary hover:underline font-bold decoration-2 underline-offset-4">Create an account</Link>
      </div>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl">Account Recovery</DialogTitle>
            <DialogDescription>
              Choose how you would like to sign in to your workspace.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            {recoveryStep === 'selection' && (
              <div className="space-y-3">
                <button 
                  onClick={() => setRecoveryStep('email-reset')}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-muted hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Reset permanent password</p>
                      <p className="text-xs text-muted-foreground">Get a link to create a new password</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
                </button>

                <button 
                  onClick={() => {
                    setRecoveryStep('otp-entry');
                    if (resetEmail) handleSendOTP();
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-muted hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Sign in with verification code</p>
                      <p className="text-xs text-muted-foreground">Get a secure code sent to your email</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
                </button>
              </div>
            )}

            {recoveryStep === 'email-reset' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm your email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="email@company.com" 
                      value={resetEmail} 
                      onChange={(e) => setResetEmail(e.target.value)} 
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    className="w-full h-11 font-bold" 
                    onClick={handlePasswordReset}
                    disabled={isResetting || !resetEmail}
                  >
                    {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Send Reset Link
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full h-11 font-medium text-muted-foreground"
                    onClick={() => setRecoveryStep('selection')}
                    disabled={isResetting}
                  >
                    Try another way
                  </Button>
                </div>
              </div>
            )}

            {recoveryStep === 'otp-entry' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                {!otpCode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="email@company.com" 
                          value={resetEmail} 
                          onChange={(e) => setResetEmail(e.target.value)} 
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                    <Button 
                      className="w-full h-11 font-bold" 
                      onClick={handleSendOTP}
                      disabled={isResetting || !resetEmail}
                    >
                      {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Verification Code"}
                    </Button>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification Code</Label>
                  <Input 
                    placeholder="000000" 
                    maxLength={6}
                    value={otpCode} 
                    onChange={(e) => setOtpCode(e.target.value)} 
                    className="text-center text-lg tracking-widest h-12"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    className="w-full h-11 font-bold" 
                    onClick={handleVerifyOTP}
                    disabled={isResetting || otpCode.length !== 6}
                  >
                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & Sign In
                  </Button>
                  <div className="flex justify-between items-center px-1">
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-xs font-bold"
                      onClick={handleSendOTP}
                      disabled={isResetting}
                    >
                      Resend Code
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="h-auto p-0 text-xs text-muted-foreground"
                      onClick={() => setRecoveryStep('selection')}
                      disabled={isResetting}
                    >
                      Try another way
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-muted/30 p-4 border-t flex justify-center">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Secure Identity Verification</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}