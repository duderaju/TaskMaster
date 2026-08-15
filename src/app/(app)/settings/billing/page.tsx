'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Download, 
  Receipt,
  Users,
  HardDrive,
  Calendar,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Zap,
  Star
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const invoices = [
  { id: 'INV-2025-002', date: 'Feb 1, 2025', amount: '$49.00', status: 'Paid' },
  { id: 'INV-2025-001', date: 'Jan 1, 2025', amount: '$49.00', status: 'Paid' },
  { id: 'INV-2024-012', date: 'Dec 1, 2024', amount: '$49.00', status: 'Paid' },
  { id: 'INV-2024-011', date: 'Nov 1, 2024', amount: '$49.00', status: 'Paid' },
];

export default function BillingSettingsPage() {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: "Action Initiated",
      description: `${action} request is being processed. This is a prototype interaction.`,
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header & Main Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Billing & Subscription</h3>
            <p className="text-muted-foreground text-sm">
              Manage your workspace plan, usage limits, and payment history.
            </p>
          </div>
          <Button 
            className="w-full sm:w-auto shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-6 active:scale-[0.98] transition-all"
            onClick={() => handleAction("Upgrade Plan")}
          >
            <Zap className="mr-2 h-4 w-4 fill-current" />
            Upgrade Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            label="Next Payment" 
            value="March 1, 2025" 
            icon={Calendar} 
            color="text-primary" 
            bgColor="bg-primary/5" 
          />
          <StatCard 
            label="Estimated Bill" 
            value="$49.00" 
            icon={DollarSign} 
            color="text-emerald-600" 
            bgColor="bg-emerald-500/5" 
          />
          <StatCard 
            label="Active Plan" 
            value="Pro Business" 
            icon={Star} 
            color="text-blue-600" 
            bgColor="bg-blue-500/5" 
            className="sm:col-span-2 lg:col-span-1"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plan & Usage Details */}
        <Card className="lg:col-span-2 border-muted/60 shadow-sm overflow-hidden bg-card flex flex-col">
          <CardHeader className="border-b bg-muted/20 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg">Subscription Overview</CardTitle>
                <CardDescription>You are currently on the Pro Business monthly plan.</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-black text-[10px] uppercase tracking-widest shrink-0">
                PRO PLAN
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-10 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {/* Team Usage */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold">Team Members</span>
                  </div>
                  <div className="text-sm font-mono font-bold">
                    <span className="text-primary">12</span> / <span className="text-muted-foreground">50</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress value={24} className="h-2 bg-muted" />
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-tight text-muted-foreground">
                    <span>24% Capacity</span>
                    <span>38 Seats left</span>
                  </div>
                </div>
              </div>

              {/* Storage Usage */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      <HardDrive className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold">Asset Storage</span>
                  </div>
                  <div className="text-sm font-mono font-bold">
                    <span className="text-primary">4.2</span> / <span className="text-muted-foreground">100 GB</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress value={4.2} className="h-2 bg-muted" />
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-tight text-muted-foreground">
                    <span>4.2% Capacity</span>
                    <span>95.8 GB left</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-muted/10">
              <div className="space-y-1 text-center md:text-left">
                <p className="font-bold text-sm">Need more resources?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Scale your team or storage capacity instantly with an Enterprise add-on.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full md:w-auto font-bold border-2 shrink-0 h-9 px-4 hover:bg-primary hover:text-white transition-colors"
                onClick={() => handleAction("Contact Sales")}
              >
                Contact Sales
              </Button>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Secure subscription billing
            </div>
            <Button 
              variant="link" 
              className="text-xs font-bold p-0 h-auto text-primary"
              onClick={() => handleAction("Manage Plan Limits")}
            >
              Manage Plan Limits
            </Button>
          </CardFooter>
        </Card>

        {/* Payment & Settings */}
        <div className="space-y-6">
          <Card className="border-muted/60 shadow-sm overflow-hidden h-fit bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative p-5 sm:p-6 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg overflow-hidden group min-h-[160px] flex flex-col justify-between">
                {/* Visual Flair */}
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
                <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="h-8 w-12 bg-white/95 rounded flex items-center justify-center font-black italic text-blue-900 text-[10px]">
                      VISA
                    </div>
                    <Badge variant="outline" className="text-[9px] border-white/20 text-white/80 bg-white/5 font-black tracking-widest">PRIMARY</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg sm:text-xl font-mono tracking-widest font-bold">•••• 4242</p>
                    <div className="flex justify-between items-center opacity-70 text-[9px] font-black uppercase tracking-tighter">
                      <span>Expires 12/26</span>
                      <span className="truncate ml-2">TaskMaster Global</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" className="text-xs h-9 font-bold active:scale-95 transition-all" onClick={() => handleAction("Update Payment Method")}>
                  Update
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-9 font-bold text-destructive hover:bg-destructive/5 hover:text-destructive active:scale-95 transition-all" onClick={() => handleAction("Remove Payment Method")}>
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted/60 shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <QuickLinkButton label="Billing Preferences" onClick={() => handleAction("Billing Preferences")} />
              <QuickLinkButton label="Tax Information" onClick={() => handleAction("Tax Information")} />
              <QuickLinkButton label="Cancel Subscription" destructive onClick={() => handleAction("Cancel Subscription")} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoices */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
              <Receipt className="h-5 w-5 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-bold">Payment History</h4>
          </div>
          <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground hover:text-foreground" onClick={() => handleAction("View All Invoices")}>
            View All
          </Button>
        </div>
        
        <Card className="border-2 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[140px] sm:w-[200px] font-black text-[10px] uppercase tracking-widest pl-6">Invoice ID</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest hidden sm:table-cell">Billing Date</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Amount</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="w-[60px] text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="group hover:bg-muted/30">
                    <TableCell className="font-mono text-sm font-bold pl-6 text-foreground/80">{invoice.id}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-semibold hidden sm:table-cell">{invoice.date}</TableCell>
                    <TableCell className="font-bold text-sm text-right">{invoice.amount}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] uppercase font-black tracking-widest px-2">
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleAction(`Download ${invoice.id}`)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download {invoice.id}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
      
      <div className="pt-8 border-t flex flex-col items-center gap-2 text-center">
        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
          Secure Payments by Stripe • TaskMaster v2.4.0-Stable
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bgColor, className }: any) {
  return (
    <Card className={cn("border-2 shadow-sm transition-all hover:shadow-md", bgColor, className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center bg-white/50 shadow-sm", color)}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-70 truncate", color)}>{label}</p>
            <p className="text-lg sm:text-xl font-bold truncate leading-tight mt-0.5">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLinkButton({ label, destructive = false, onClick }: { label: string, destructive?: boolean, onClick?: () => void }) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick}
      className={cn(
        "w-full justify-between text-xs font-bold h-10 hover:bg-muted group transition-all",
        destructive ? "text-destructive/80 hover:text-destructive hover:bg-destructive/5" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
    </Button>
  );
}
