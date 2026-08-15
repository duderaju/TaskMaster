
'use client';
import { useEffect, useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { acceptInvite } from '@/app/actions/user-org-actions';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Mail, 
  LogOut, 
  UserCheck, 
  ShieldCheck, 
  ChevronRight, 
  UserPlus, 
  LogIn, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * High-Fidelity Invitation Hub
 * Handles the seamless transition between email invites and workspace entry.
 */
function InviteHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const token = searchParams.get('token');

  // Fetch invite details for display with stabilized reference
  const inviteLookupRef = useMemo(() => 
    firestore && token ? doc(firestore, 'invites', token) : null
  , [firestore, token]);
  
  const { data: inviteInfo, isLoading: isInviteLoading } = useDoc(inviteLookupRef);

  const handleAcceptInvite = async () => {
    const firebaseUser = auth.currentUser;
    if (!token || !firebaseUser) return;
    
    setIsProcessing(true);
    
    try {
      const result = await acceptInvite({ inviteId: token, userId: firebaseUser.uid });
      if (result.success) {
        toast({ 
          title: result.alreadyMember ? 'Already a Member' : 'Invitation Accepted!', 
          description: result.alreadyMember ? `You are already part of ${result.organizationName}.` : `Welcome to ${result.organizationName}!` 
        });
        
        // Force token refresh to pick up new Custom Claims
        await firebaseUser.getIdToken(true);
        router.push('/dashboard');
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Failed to Join', 
          description: result.error || 'This invitation may be invalid or expired.' 
        });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Accept invite error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'An Error Occurred', 
        description: 'Could not process your invitation. Please try again.' 
      });
      setIsProcessing(false);
    }
  };

  const handleSwitchAccount = async () => {
    await auth.signOut();
    const emailHint = inviteInfo?.email ? `&invited_email=${encodeURIComponent(inviteInfo.email)}` : '';
    router.replace(`/sign-in?invite_token=${token}${emailHint}`);
  };

  if (isUserLoading || isInviteLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-8 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (!token || (!inviteInfo && !isInviteLoading)) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-8 bg-background">
        <Card className="max-w-md w-full text-center border-muted/60 shadow-xl">
          <CardHeader>
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>This link is invalid, revoked, or has already expired.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full h-11 font-bold" onClick={() => router.replace('/sign-in')}>Return to Sign In</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const invitedEmail = inviteInfo?.email;
  const isIdentityMismatch = user && invitedEmail && user.email?.toLowerCase() !== invitedEmail.toLowerCase();

  // --- UNAUTHENTICATED STATE ---
  if (!user) {
    const emailHint = invitedEmail ? `&invited_email=${encodeURIComponent(invitedEmail)}` : '';
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-8 bg-background">
        <div className="max-w-md w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-sm border border-primary/20">
              <Mail className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Join the Team</h1>
            <p className="text-muted-foreground font-medium">You've been invited to join an organization on TaskMaster.</p>
          </div>

          <Card className="border-muted/60 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center border-b bg-muted/20 pb-6">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-70">Assigned Access Level</span>
                <div className="flex justify-center pt-1">
                  <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 text-sm font-bold uppercase tracking-tight">
                    {inviteInfo?.role || 'Member'}
                  </Badge>
                </div>
                {invitedEmail && (
                  <p className="text-[11px] font-bold text-muted-foreground mt-3 uppercase tracking-tighter opacity-80">
                    Invited as <span className="text-primary">{invitedEmail}</span>
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-8 px-8 pb-8">
              <Button className="w-full h-12 font-bold shadow-lg shadow-primary/20 text-base active:scale-[0.98] transition-all" asChild>
                <Link href={`/sign-up?invite_token=${token}${emailHint}`}>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create New Account
                </Link>
              </Button>
              <Button variant="outline" className="w-full h-12 font-bold border-2 active:scale-[0.98] transition-all" asChild>
                <Link href={`/sign-in?invite_token=${token}${emailHint}`}>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In with Existing
                </Link>
              </Button>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-4 flex justify-center items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Enterprise Security Verified</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED STATE ---
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-md w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Identity Confirmed</h1>
          <p className="text-muted-foreground">Ready to accept your invitation and enter the workspace.</p>
        </div>

        <Card className="border-muted/60 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
          {isIdentityMismatch ? (
            <div className="bg-rose-500/10 border-b border-rose-500/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-rose-600 tracking-tight">Identity Mismatch</p>
                <p className="text-[11px] leading-relaxed text-rose-700 font-medium">
                  This invite was sent to <span className="font-bold underline">{invitedEmail}</span>, but you are signed in as <span className="font-bold">{user.email}</span>.
                </p>
              </div>
            </div>
          ) : (
            <CardHeader className="text-center border-b bg-muted/20 pb-4">
              <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Joining as</span>
                  <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 text-sm font-bold uppercase">
                      {inviteInfo?.role || 'Member'}
                  </Badge>
              </div>
            </CardHeader>
          )}

          <CardContent className="space-y-6 pt-6 px-8">
            <div className="flex flex-col items-center gap-4 p-5 rounded-2xl bg-primary/[0.03] border-2 border-primary/5 relative group">
              <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                <AvatarImage src={user.avatarUrl} className="object-cover" />
                <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-bold text-lg leading-none">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-muted-foreground truncate max-w-[250px] mt-1">{user.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              {isIdentityMismatch ? (
                <Button 
                  className="w-full h-12 font-bold shadow-lg text-base active:scale-[0.98] transition-all"
                  onClick={handleSwitchAccount}
                  disabled={isProcessing}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Switch to {invitedEmail}
                </Button>
              ) : (
                <Button 
                  className="w-full h-12 font-bold shadow-lg text-base active:scale-[0.98] transition-all"
                  onClick={handleAcceptInvite}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                  Join Workspace
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full h-10 font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group",
                  isIdentityMismatch && "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                )}
                onClick={isIdentityMismatch ? handleAcceptInvite : handleSwitchAccount}
                disabled={isProcessing}
              >
                {isIdentityMismatch ? (
                  <>Continue as {user.email} anyway <ChevronRight className="ml-1 h-3 w-3" /></>
                ) : (
                  <><LogOut className="mr-2 h-3.5 w-3.5" /> Switch Account</>
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-4 flex justify-center items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Secure Handshake Complete</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-8 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
      </div>
    }>
      <InviteHandler />
    </Suspense>
  );
}
