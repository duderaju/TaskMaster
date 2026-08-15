'use client';
import { 
  Bell, 
  LogOut, 
  Settings as SettingsIcon, 
  UserCircle,
  LayoutGrid,
  PlusCircle,
  ChevronRight,
  ClipboardList,
  Users,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Zap,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect, useMemo } from 'react';
import { Skeleton } from './ui/skeleton';
import { 
  useAuth, 
  useUser, 
  useFirestore, 
  useCollection,
  updateDocumentNonBlocking 
} from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Logo } from './logo';

/**
 * Standard Navigation Highlight Classes (MNC Elite Quality)
 */
const getNavItemClasses = (isOpen: boolean) => cn(
  "group h-8 w-8 sm:h-9 sm:w-9 rounded-lg border transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 relative flex items-center justify-center shrink-0",
  isOpen 
    ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]" 
    : "border-transparent hover:bg-primary/5 hover:border-primary/50"
);

const getIconClasses = (isOpen: boolean) => cn(
  "h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200",
  isOpen ? "text-primary" : "text-muted-foreground group-hover:text-primary"
);

const getInitials = (firstName?: string, lastName?: string) => {
  if (!firstName && !lastName) return '';
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [launcherOpen, setLauncherOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const notificationsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore, user?.uid]);

  const { data: notifications } = useCollection<any>(notificationsQuery);
  const unreadCount = useMemo(() => notifications?.filter(n => !n.read).length || 0, [notifications]);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/sign-in');
    }
  };

  const markAsRead = (notificationId: string) => {
    if (!firestore || !user?.uid) return;
    const notificationRef = doc(firestore, 'users', user.uid, 'notifications', notificationId);
    updateDocumentNonBlocking(notificationRef, { read: true });
  };

  const markAllAsRead = () => {
    if (!notifications || !firestore || !user?.uid) return;
    notifications.forEach(n => {
      if (!n.read) {
        const ref = doc(firestore, 'users', user.uid, 'notifications', n.id);
        updateDocumentNonBlocking(ref, { read: true });
      }
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Task assigned': return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'Status changed': return <Zap className="h-4 w-4 text-amber-500" />;
      case 'Comment added': return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };
  
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-3 sm:px-4 md:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <SidebarTrigger className="shrink-0 md:hidden" />
        <Logo className="shrink-0" />
      </div>

      <div className="flex items-center gap-1 sm:gap-3 shrink-0 ml-2">
        <TooltipProvider>
          {/* Launcher */}
          <DropdownMenu open={launcherOpen} onOpenChange={setLauncherOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={getNavItemClasses(launcherOpen)}>
                    <LayoutGrid className={getIconClasses(launcherOpen)} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {!launcherOpen && <TooltipContent><p>Launcher</p></TooltipContent>}
            </Tooltip>
            <DropdownMenuContent align="end" className="w-72 p-2 shadow-2xl border-primary/20">
              <DropdownMenuLabel className="px-3 pt-2 pb-1 text-xs uppercase text-muted-foreground tracking-widest font-bold opacity-70">Workspace Hub</DropdownMenuLabel>
              <div className="grid grid-cols-3 gap-1 p-1">
                <LauncherItem href="/dashboard" icon={LayoutDashboard} label="Home" color="text-blue-500" />
                <LauncherItem href="/issues" icon={ClipboardList} label="Issues" color="text-purple-500" />
                <LauncherItem href="/modules" icon={FolderKanban} label="Modules" color="text-emerald-500" />
                <LauncherItem href="/teams" icon={Users} label="Teams" color="text-amber-500" />
                <LauncherItem href="/settings" icon={SettingsIcon} label="Settings" color="text-slate-500" />
              </div>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem asChild>
                <Link href="/settings/organization" className="flex items-center justify-between w-full cursor-pointer py-2 px-3 hover:bg-primary/5 rounded-md group">
                  <span className="text-sm font-semibold group-hover:text-primary transition-colors">Manage Organization</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Create */}
          <DropdownMenu open={quickOpen} onOpenChange={setQuickOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={getNavItemClasses(quickOpen)}>
                    <PlusCircle className={getIconClasses(quickOpen)} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {!quickOpen && <TooltipContent><p>Quick Action</p></TooltipContent>}
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56 shadow-2xl border-primary/20">
              <DropdownMenuLabel className="text-xs uppercase font-bold tracking-widest opacity-50 px-3 py-2">Create New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                <Link href="/issues?create=true">
                  <ClipboardList className="mr-3 h-4 w-4 text-purple-500" />
                  <span className="font-medium">New Work Item</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                <Link href="/modules?create=true">
                  <FolderKanban className="mr-3 h-4 w-4 text-emerald-500" />
                  <span className="font-medium">New Module</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                <Link href="/teams?invite=true">
                  <Users className="mr-3 h-4 w-4 text-amber-500" />
                  <span className="font-medium">Invite Colleague</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn(getNavItemClasses(notificationsOpen), "relative")}>
                    <Bell className={getIconClasses(notificationsOpen)} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-2 w-2 rounded-full bg-primary border-2 border-card shadow-sm animate-pulse" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {!notificationsOpen && <TooltipContent><p>Notifications</p></TooltipContent>}
            </Tooltip>
            <DropdownMenuContent align="end" className="w-80 shadow-2xl border-primary/20 p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                <span className="font-bold text-xs uppercase tracking-widest opacity-70">Notifications</span>
                {unreadCount > 0 && (
                  <Button variant="ghost" className="h-auto p-0 text-[10px] uppercase font-bold text-primary hover:bg-transparent hover:underline" onClick={markAllAsRead}>
                    Clear All
                  </Button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.map((n: any) => (
                    <DropdownMenuItem 
                      key={n.id} 
                      className={cn(
                        "flex items-start gap-3 p-4 cursor-pointer focus:bg-primary/5 border-b last:border-0 rounded-none",
                        !n.read && "bg-primary/[0.03]"
                      )}
                      onSelect={() => markAsRead(n.id)}
                    >
                      <div className="mt-1 p-2 rounded-lg bg-background border shadow-sm shrink-0">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        <p className={cn("text-sm leading-snug", !n.read ? "font-bold" : "font-medium opacity-80")}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter opacity-60">
                          {formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.read && <div className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
                        <Bell className="h-6 w-6 text-muted-foreground opacity-20" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-40">All Caught Up</p>
                  </div>
                )}
              </div>
              <DropdownMenuSeparator className="m-0" />
              <DropdownMenuItem className="justify-center font-bold text-[10px] uppercase tracking-widest py-3 cursor-pointer text-primary hover:bg-primary/5" asChild>
                <Link href="/settings/notifications">Notification Preferences</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          {!mounted ? (
            <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg" />
          ) : (
            <DropdownMenu open={userOpen} onOpenChange={setUserOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={getNavItemClasses(userOpen)}>
                  <Avatar className={cn("h-6 w-6 sm:h-7 sm:w-7 transition-all duration-300 ring-offset-2 ring-offset-background", userOpen ? "scale-90 ring-2 ring-primary/20" : "group-hover:scale-105")}>
                    <AvatarImage src={user?.avatarUrl || undefined} className="object-cover" />
                    <AvatarFallback className="text-[9px] sm:text-[10px] bg-primary/10 text-primary font-black uppercase tracking-tighter">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 shadow-2xl border-primary/20">
                <DropdownMenuLabel className="font-normal p-4 bg-muted/20">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate opacity-60">{user?.role || 'Member'}</p>
                    <p className="text-[11px] leading-none text-muted-foreground truncate pt-1 opacity-80">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup className="p-1">
                  <DropdownMenuItem asChild className="cursor-pointer py-2.5 rounded-md">
                    <Link href="/settings/profile" className="flex items-center">
                      <UserCircle className="mr-3 h-4 w-4 text-primary opacity-70" />
                      <span className="font-semibold">My Identity</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer py-2.5 rounded-md">
                    <Link href="/settings" className="flex items-center">
                      <SettingsIcon className="mr-3 h-4 w-4 text-primary opacity-70" />
                      <span className="font-semibold">Workspace Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <div className="p-1">
                    <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer py-2.5 rounded-md font-bold">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Sign Out</span>
                    </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TooltipProvider>
      </div>
    </header>
  );
}

function LauncherItem({ href, icon: Icon, label, color }: { href: string, icon: any, label: string, color: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:bg-muted group">
      <div className={cn("p-2.5 rounded-xl bg-muted/50 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="mt-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{label}</span>
    </Link>
  );
}
