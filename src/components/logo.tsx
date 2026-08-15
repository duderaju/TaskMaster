import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, showTextOnMobile = false }: { className?: string, showTextOnMobile?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 overflow-hidden", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
        <Zap className="h-5 w-5 fill-current" />
      </div>
      <span className={cn(
        "text-xl font-bold tracking-tight text-foreground whitespace-nowrap transition-all duration-200",
        showTextOnMobile ? "inline-block" : "hidden sm:inline-block"
      )}>
        TaskMaster
      </span>
    </div>
  );
}
