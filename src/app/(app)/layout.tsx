'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { useUser } from '@/firebase/auth/use-user';
import { Loader2, Zap } from 'lucide-react';
import { useOrganization } from '@/hooks/use-organization';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="h-20 w-20 rounded-[2rem] bg-primary flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/20 animate-pulse">
            <Zap className="h-10 w-10 fill-current" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-2xl font-black tracking-tighter">TaskMaster</p>
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-muted/50 border border-muted-foreground/10 shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
              {label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const { organization, isOrgLoading } = useOrganization(user?.organizationId);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user && organization?.status === 'active') {
      setIsReady(true);
      return;
    }

    if (isUserLoading || isOrgLoading) {
      return;
    }

    if (!user) {
      const redirectUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    if (!organization || organization.status !== 'active') {
      const timeout = setTimeout(() => {
        if (!organization || organization.status !== 'active') {
          router.replace('/sign-in');
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }

    setIsReady(true);
  }, [isUserLoading, isOrgLoading, user, organization, router, pathname, searchParams]);

  if (!isReady) {
    return <LoadingScreen label={isUserLoading ? 'Authenticating Identity' : 'Entering Workspace'} />;
  }

  if (!user || !organization || organization.status !== 'active') {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden animate-in fade-in duration-300">
        <Sidebar />
        <SidebarInset className="flex flex-1 flex-col min-w-0 transition-all duration-200">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto scroll-smooth">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen label="Loading" />}>
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  );
}