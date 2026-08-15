'use client';
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  Users,
  FolderKanban,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarRail,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Logo } from './logo';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/modules', icon: FolderKanban, label: 'Modules' },
  { href: '/issues', icon: ClipboardList, label: 'Issues' },
  { href: '/teams', icon: Users, label: 'Teams' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  
  // On mobile, we are never "collapsed" in the icon-only sense. 
  // We only hide labels on desktop when the user has explicitly collapsed the sidebar.
  const isCollapsed = state === "collapsed" && !isMobile;

  const handleNavClick = () => {
    if (isMobile) {
      // Immediate close on mobile for snappy feel
      setOpenMobile(false);
    }
  };

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader className="h-16 flex flex-row items-center px-4 gap-2 group-data-[collapsible=icon]:justify-center overflow-hidden">
        {isMobile ? (
          <Logo showTextOnMobile />
        ) : (
          <>
            {!isCollapsed && <Logo className="flex-1 animate-in fade-in duration-300" />}
            <SidebarTrigger className={cn(
              "transition-all duration-200 h-9 w-9 shrink-0",
              isCollapsed ? "mx-auto" : "ml-auto"
            )} />
          </>
        )}
      </SidebarHeader>
      <SidebarContent className="py-2">
        <SidebarMenu className="px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  onClick={handleNavClick}
                  className={cn(
                    "transition-all duration-200 h-10 px-3",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary hover:text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className={cn(
                      "font-semibold transition-all duration-200", 
                      isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </SidebarPrimitive>
  );
}
