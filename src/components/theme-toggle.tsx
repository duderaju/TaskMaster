"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Check } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

// Standardize highlighting with the rest of the navigation suite
const getNavItemClasses = (isOpen: boolean) => cn(
  "group h-9 w-9 rounded-lg border transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 relative flex items-center justify-center shrink-0",
  isOpen 
    ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]" 
    : "border-transparent hover:bg-primary/5 hover:border-primary/50"
);

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton className="h-9 w-9 rounded-lg" />
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={getNavItemClasses(open)}>
          <Sun className={cn(
            "h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0", 
            open ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          )} />
          <Moon className={cn(
            "absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100", 
            open ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 p-1">
        <ThemeOption active={theme === 'light'} onClick={() => setTheme("light")} icon={Sun} label="Light" />
        <ThemeOption active={theme === 'dark'} onClick={() => setTheme("dark")} icon={Moon} label="Dark" />
        <ThemeOption active={theme === 'system'} onClick={() => setTheme("system")} icon={Monitor} label="System" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ThemeOption({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <DropdownMenuItem 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between cursor-pointer px-2 py-2 rounded-sm",
        active && "bg-accent text-accent-foreground"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {active && <Check className="h-4 w-4 text-primary" />}
    </DropdownMenuItem>
  );
}