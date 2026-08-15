'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Lock, 
  Loader2, 
  Mail,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SecuritySettingsPage() {
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handlePasswordReset = async () => {
    if (!auth || !user?.email) return;
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ 
        title: "Reset Link Sent", 
        description: `We've sent password reset instructions to ${user.email}.` 
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Action Failed", 
        description: error.message 
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h3 className="text-lg font-medium">Security Settings</h3>
        <p className="text-sm text-muted-foreground">Manage your account security and password preferences.</p>
      </div>

      <Card className="border-muted/60">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Password Management</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-primary/10 bg-primary/5 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-primary">Account Protection</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your account is currently secured with standard authentication. We recommend using a strong, unique password.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/20 px-6 py-4 flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePasswordReset} 
            disabled={isResetting}
            className="font-semibold"
          >
            {isResetting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Send Reset Email
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-muted/60">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Session Security</CardTitle>
              <CardDescription>Review your active login sessions.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Session management is currently handled by your authentication provider. To clear all active sessions, please sign out and sign back in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
