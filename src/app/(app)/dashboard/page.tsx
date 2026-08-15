'use client';

import { useMemo, useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  FolderKanban, 
  ListChecks, 
  UserCheck, 
  Users, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  Zap,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase
} from '@/firebase';
import { collection } from 'firebase/firestore';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend,
  Label
} from 'recharts';
import { 
  ChartConfig, 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const chartConfig = {
  value: {
    label: "Issues",
  },
  backlog: { label: "Backlog", color: "hsl(var(--muted-foreground))" },
  todo: { label: "To Do", color: "hsl(217, 91%, 60%)" },
  inprogress: { label: "In Progress", color: "hsl(38, 92%, 50%)" },
  inreview: { label: "In Review", color: "hsl(271, 91%, 65%)" },
  done: { label: "Done", color: "hsl(142, 71%, 45%)" },
  canceled: { label: "Canceled", color: "hsl(0, 84%, 60%)" },
  blocked: { label: "Blocked", color: "hsl(263, 70%, 50%)" },
  other: { label: "Other", color: "hsl(var(--muted))" },
} satisfies ChartConfig;

const statusMap: Record<string, string> = {
  'Backlog': 'backlog',
  'To Do': 'todo',
  'In Progress': 'inprogress',
  'In Review': 'inreview',
  'Done': 'done',
  'Canceled': 'canceled',
  'Blocked': 'blocked'
};

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const organizationId = user?.organizationId;

  // 1. Fetch Real-time Data with stabilized references
  const modulesQuery = useMemoFirebase(() => 
    organizationId ? collection(firestore, 'organizations', organizationId, 'modules') : null
  , [firestore, organizationId]);

  const issuesQuery = useMemoFirebase(() => 
    organizationId ? collection(firestore, 'organizations', organizationId, 'issues') : null
  , [firestore, organizationId]);

  const membersQuery = useMemoFirebase(() => 
    organizationId ? collection(firestore, 'organizations', organizationId, 'members') : null
  , [firestore, organizationId]);

  const { data: modules, isLoading: modulesLoading } = useCollection(modulesQuery);
  const { data: issues, isLoading: issuesLoading } = useCollection(issuesQuery);
  const { data: members, isLoading: membersLoading } = useCollection(membersQuery);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Compute KPI Logic
  const stats = useMemo(() => {
    if (!issues || !modules || !members || !user) return null;

    const myIssues = issues.filter(i => i.assigneeId === user.uid && i.status !== 'Done');
    const openIssues = issues.filter(i => i.status !== 'Done' && i.status !== 'Canceled');
    
    // Status distribution for chart
    const distribution = issues.reduce((acc: any, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {});

    // Map to chartData using slugs as "name" for proper ChartConfig association
    const chartData = Object.entries(distribution).map(([statusName, count]) => {
      const slug = statusMap[statusName] || 'other';
      return {
        statusSlug: slug,
        count: count,
        fill: `var(--color-${slug})`
      };
    });

    const totalIssues = issues.length;

    return {
      moduleCount: modules.length,
      openIssueCount: openIssues.length,
      myTaskCount: myIssues.length,
      teamCount: members.length,
      chartData,
      totalIssues,
      myIssues: myIssues.slice(0, 5),
      recentIssues: [...issues].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5)
    };
  }, [issues, modules, members, user]);

  const isLoading = !mounted || modulesLoading || issuesLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            Workspace Overview
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base font-medium">
            Welcome back, <span className="text-foreground font-bold">{user?.firstName}</span>. Here's your mission status.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-10 border-muted-foreground/20 font-bold" asChild>
            <Link href="/issues"><ListChecks className="mr-2 h-4 w-4" /> Issues</Link>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none h-10 shadow-lg shadow-primary/20 font-bold" asChild>
            <Link href="/issues?create=true"><TrendingUp className="mr-2 h-4 w-4" /> New Task</Link>
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Active Modules" 
          value={stats?.moduleCount || 0} 
          description="Projects currently in flight"
          icon={FolderKanban}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard 
          title="Open Issues" 
          value={stats?.openIssueCount || 0} 
          description="Tasks awaiting completion"
          icon={ListChecks}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
        />
        <StatCard 
          title="Your Tasks" 
          value={stats?.myTaskCount || 0} 
          description="Assigned items for you"
          icon={UserCheck}
          color="text-indigo-500"
          bgColor="bg-indigo-500/10"
        />
        <StatCard 
          title="Team Size" 
          value={stats?.teamCount || 0} 
          description="Members in organization"
          icon={Users}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Work Table */}
        <Card className="lg:col-span-2 shadow-sm border-muted-foreground/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div className="space-y-1">
              <CardTitle className="text-lg">Assigned to Me</CardTitle>
              <CardDescription className="text-xs sm:text-sm font-medium">Your top priority active items</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[11px] font-black uppercase tracking-widest text-primary hover:bg-primary/5" asChild>
              <Link href="/issues?assignee=me">View all <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[80px] sm:w-[100px] text-[10px] uppercase font-black tracking-widest opacity-60">Key</TableHead>
                    <TableHead className="text-[10px] uppercase font-black tracking-widest opacity-60">Summary</TableHead>
                    <TableHead className="text-[10px] uppercase font-black tracking-widest opacity-60">Status</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-black tracking-widest opacity-60">Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.myIssues.length ? stats.myIssues.map((issue) => (
                    <TableRow key={issue.id} className="hover:bg-primary/[0.02] transition-colors group">
                      <TableCell className="font-mono text-[10px] sm:text-xs font-bold text-muted-foreground/80">
                        {issue.key}
                      </TableCell>
                      <TableCell className="max-w-[150px] sm:max-w-none">
                        <Link href={`/issues?issueId=${issue.id}`} className="hover:underline font-bold text-xs sm:text-sm block truncate">
                          {issue.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={issue.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <PriorityBadge priority={issue.priority} />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic text-sm">
                        No active tasks assigned to you.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Chart - Elite UI Redesign */}
        <Card className="flex flex-col shadow-sm border-muted-foreground/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="items-center pb-0 border-b">
            <div className="w-full flex items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  Mission Pulse
                </CardTitle>
                <CardDescription className="text-[11px] font-black uppercase tracking-widest opacity-60">Work item distribution</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="statusSlug" />}
                />
                <Pie
                  data={stats?.chartData || []}
                  dataKey="count"
                  nameKey="statusSlug"
                  innerRadius={60}
                  outerRadius={80}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-black tracking-tighter"
                            >
                              {stats?.totalIssues.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground text-[10px] font-black uppercase tracking-widest"
                            >
                              Total Items
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
          <div className="mt-auto p-4 pt-0">
             <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {stats?.chartData.map((entry: any) => (
                  <div key={entry.statusSlug} className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full shrink-0" 
                      style={{ backgroundColor: chartConfig[entry.statusSlug as keyof typeof chartConfig]?.color || '#8884d8' }} 
                    />
                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground truncate">
                      {chartConfig[entry.statusSlug as keyof typeof chartConfig]?.label || entry.statusSlug}: <span className="text-foreground">{entry.count}</span>
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity / Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-muted-foreground/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg">Recently Created</CardTitle>
            <CardDescription className="text-xs sm:text-sm font-medium">Latest items added to the workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {stats?.recentIssues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/[0.03] transition-colors group">
                <div className="mt-1.5 flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                </div>
                <div className="space-y-1 min-w-0">
                  <Link href={`/issues?issueId=${issue.id}`} className="text-sm font-bold hover:underline block leading-tight truncate">
                    {issue.title}
                  </Link>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <span className="font-mono">{issue.key}</span>
                    <span className="opacity-30">•</span>
                    <span className="whitespace-nowrap">{issue.createdAt ? formatDistanceToNow(issue.createdAt.toDate(), { addSuffix: true }) : 'Just now'}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted-foreground/20 bg-card/50 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div className="space-y-1">
              <CardTitle className="text-lg">Active Modules</CardTitle>
              <CardDescription className="text-xs sm:text-sm font-medium">Performance by initiative</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[11px] font-black uppercase tracking-widest text-primary hover:bg-primary/5" asChild>
              <Link href="/modules">Manage <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules?.slice(0, 4).map((module) => {
                const moduleIssues = issues?.filter(i => i.moduleId === module.id) || [];
                const doneCount = moduleIssues.filter(i => i.status === 'Done').length;
                const progress = moduleIssues.length > 0 ? (doneCount / moduleIssues.length) * 100 : 0;

                return (
                  <div key={module.id} className="p-4 border-2 border-muted/60 rounded-xl hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-300 group flex flex-col h-full bg-background/40">
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-primary/10 text-primary shadow-sm">
                          <FolderKanban className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm leading-tight truncate">{module.name}</h4>
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{module.key}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 bg-muted/50 px-2.5 py-1 rounded-full border shadow-sm">
                        <div className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_5px_currentColor]", {
                          'bg-status-active text-emerald-500': module.status === 'Active',
                          'bg-status-on-hold text-slate-500': module.status === 'On Hold',
                          'bg-status-planned text-amber-500': module.status === 'Planned',
                          'bg-status-archived text-zinc-500': module.status === 'Archived',
                          'bg-status-draft text-purple-500': module.status === 'Draft',
                          'bg-status-done text-blue-500': module.status === 'Done',
                        })} />
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                          {module.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground opacity-70">{moduleIssues.length} issues</span>
                        <span className="text-primary">{Math.round(progress)}% done</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden border shadow-inner">
                        <div 
                          className="h-full bg-primary transition-all duration-1000 ease-in-out shadow-[0_0_10px_hsl(var(--primary)/40)]" 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, color, bgColor }: any) {
  return (
    <Card className="shadow-sm border-muted-foreground/20 hover:border-primary/50 hover:shadow-xl transition-all duration-500 bg-card/50 backdrop-blur-sm group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
          {title}
        </CardTitle>
        <div className={`flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 ${bgColor} ${color}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-4xl font-black tracking-tighter">{value}</div>
        <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/70 mt-1 flex items-center gap-1.5 line-clamp-1 uppercase tracking-tight">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
