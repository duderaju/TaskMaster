
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  User,
  Building,
  ShieldCheck,
  SlidersHorizontal,
  Bell,
  Blocks,
  Bot,
  CreditCard,
  History,
  Palette,
  FolderKanban,
  Lock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

const sidebarNavItems = [
  {
    title: 'My Profile',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'Security',
    href: '/settings/security',
    icon: Lock,
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: Palette,
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
  },
];

const adminSidebarNavItems = [
  {
    title: 'Organization',
    href: '/settings/organization',
    icon: Building,
  },
  {
    title: 'Users & Access',
    href: '/settings/users',
    icon: ShieldCheck,
  },
  {
    title: 'Modules',
    href: '/settings/modules',
    icon: FolderKanban,
  },
  {
    title: 'Workflows',
    href: '/settings/workflows',
    icon: SlidersHorizontal,
  },
  {
    title: 'Integrations',
    href: '/settings/integrations',
    icon: Blocks,
  },
  {
    title: 'Automation',
    href: '/settings/automation',
    icon: Bot,
  },
  {
    title: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
  },
  {
    title: 'Audit Log',
    href: '/settings/audit-log',
    icon: History,
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const isCompactView = useIsMobile(768); // Optimized standard breakpoint
  const router = useRouter();

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const handleNavigation = (value: string) => {
    router.push(value);
  };

  if (isCompactView) {
    return (
      <div className="flex min-h-full w-full flex-col">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Settings Navigation</label>
          <Select onValueChange={handleNavigation} value={pathname}>
            <SelectTrigger className="w-full h-11 border-muted/60 bg-card/50">
              <SelectValue placeholder="Navigate to..." />
            </SelectTrigger>
            <SelectContent className="max-h-[60vh]">
              <h3 className="px-3 py-2 text-[10px] uppercase text-muted-foreground tracking-widest font-black opacity-50">User Preferences</h3>
              {sidebarNavItems.map((item) => (
                <SelectItem key={item.href} value={item.href} className="py-2.5">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-primary opacity-70" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                </SelectItem>
              ))}
              {isAdmin && (
                <>
                  <h3 className="px-3 pt-4 pb-2 text-[10px] uppercase text-muted-foreground tracking-widest font-black opacity-50">Admin Center</h3>
                  {adminSidebarNavItems.map((item) => (
                    <SelectItem key={item.href} value={item.href} className="py-2.5">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-primary opacity-70" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        <main className="flex w-full flex-1 flex-col pb-12">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-1 flex-col lg:flex-row lg:gap-8 xl:gap-12">
        <aside className="w-full lg:w-1/5 xl:w-64 shrink-0">
          <nav className="grid items-start gap-1 text-sm font-medium sticky top-6">
            <h3 className="px-4 mt-2 mb-3 text-[10px] uppercase text-muted-foreground tracking-widest font-black opacity-50">User Preferences</h3>
            {sidebarNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-150',
                  pathname === item.href 
                    ? 'bg-primary/10 text-primary font-bold border border-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className={cn('h-4 w-4', pathname === item.href ? 'text-primary' : 'opacity-70')} />
                {item.title}
              </Link>
            ))}
            {isAdmin && (
              <>
                <h3 className="px-4 mt-8 mb-3 text-[10px] uppercase text-muted-foreground tracking-widest font-black opacity-50">Admin Center</h3>
                {adminSidebarNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-150',
                      pathname.startsWith(item.href) 
                        ? 'bg-primary/10 text-primary font-bold border border-primary/20' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4', pathname.startsWith(item.href) ? 'text-primary' : 'opacity-70')} />
                    {item.title}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
