'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  ShieldCheck, 
  Filter, 
  User, 
  Clock, 
  Globe, 
  FileText,
  ChevronDown,
  Loader2,
  History,
  Activity,
  X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase 
} from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { formatDistanceToNow, format } from 'date-fns';

const CATEGORIES = ['All', 'Create', 'Update', 'Delete', 'Security'];

interface AuditLogEntry {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  timestamp: Timestamp;
  details?: string;
  ip?: string;
  category?: string;
}

export default function AuditLogSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const organizationId = user?.organizationId;
  const isAdmin = user?.role === 'Admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Guarded Query: Only run if user is confirmed as Admin
  const logsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !isAdmin) return null;
    return query(collection(firestore, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
  }, [firestore, isUserLoading, isAdmin]);

  const { data: logs, isLoading: logsLoading } = useCollection<AuditLogEntry>(logsQuery);

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, 'organizations', organizationId, 'members');
  }, [firestore, organizationId]);

  const { data: members } = useCollection<any>(membersQuery);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => {
      const actor = members?.find(m => m.id === log.userId);
      const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'System';
      
      const matchesSearch = 
        actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entityType + ': ' + log.entityId).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = activeCategory === 'All' || log.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory, logs, members]);

  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    
    const headers = ['Timestamp', 'Actor', 'Action', 'Entity', 'Details'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => {
        const actor = members?.find(m => m.id === log.userId);
        const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'System';
        return [
          format(log.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss'),
          `"${actorName}"`,
          `"${log.action}"`,
          `"${log.entityType}: ${log.entityId}"`,
          `"${log.details || ''}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-log-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: 'Export Successful', description: `${filteredLogs.length} entries exported to CSV.` });
  };

  if (isUserLoading || (logsLoading && isAdmin)) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Synchronizing global logs...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
        <div className="h-20 w-20 rounded-3xl bg-destructive/5 flex items-center justify-center text-destructive border-2 border-destructive/10">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Security Restriction</h3>
          <p className="text-muted-foreground max-w-sm text-sm font-medium">
            The Audit Log contains high-sensitivity organizational data and is restricted to workspace administrators.
          </p>
        </div>
        <Button variant="outline" className="font-bold h-10 border-2" onClick={() => window.history.back()}>
          Return to Safety
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20 shrink-0">
            <History className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Workspace Audit Log</h3>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              Monitoring {filteredLogs.length} real-time operations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExport} 
            variant="outline" 
            className="h-11 px-5 border-2 hover:bg-primary/5 font-black text-[11px] uppercase tracking-widest"
            disabled={filteredLogs.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50" />
            <Input 
              placeholder="Search by actor, action, or entity ID..." 
              className="pl-11 h-12 border-muted/60 focus-visible:ring-primary/20 bg-background/50 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 border-2 w-full sm:w-auto px-5 bg-background font-bold text-xs">
                  <Filter className="mr-2 h-4 w-4 text-primary opacity-70" />
                  Category: <span className="text-primary ml-1.5">{activeCategory}</span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-2xl border-primary/20">
                <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest opacity-50 px-3 py-2.5">Filter by Action Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CATEGORIES.map(cat => (
                  <DropdownMenuCheckboxItem
                    key={cat}
                    checked={activeCategory === cat}
                    onCheckedChange={() => setActiveCategory(cat)}
                    className="py-3 font-bold text-xs"
                  >
                    {cat}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {(searchTerm || activeCategory !== 'All') && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-12 w-12 shrink-0 border-2 hover:bg-destructive/5 hover:text-destructive text-muted-foreground transition-all"
                onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table - Responsive & One-Line Content */}
      <div className="border-2 rounded-2xl shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-muted/50 border-b-2">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest opacity-60 pl-8 w-[240px]">Initiated By</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60 w-[180px]">Action Category</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Entity Target</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60 w-[180px]">Date & Time</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60 text-right pr-8 w-[140px]">Source IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const actor = members?.find(m => m.id === log.userId);
                  return (
                    <TableRow key={log.id} className="group hover:bg-primary/[0.03] border-b-muted/40 transition-colors">
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <Avatar className="h-8 w-8 border-2 border-background shadow-sm shrink-0">
                            <AvatarImage src={actor?.avatarUrl} />
                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black uppercase">
                              {actor ? actor.firstName[0] : 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-foreground truncate leading-none">{actor ? `${actor.firstName} ${actor.lastName}` : 'System Processor'}</span>
                            <span className="text-[10px] text-muted-foreground truncate opacity-70 font-medium mt-0.5">{actor?.email || 'automated@taskmaster.io'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 border-2 shadow-sm whitespace-nowrap",
                            log.category === 'Delete' && "bg-rose-500/15 text-rose-700 border-rose-500",
                            log.category === 'Security' && "bg-amber-500/15 text-amber-700 border-amber-500",
                            log.category === 'Create' && "bg-emerald-500/15 text-emerald-700 border-emerald-500",
                            log.category === 'Update' && "bg-blue-500/15 text-blue-700 border-blue-500"
                          )}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[300px] whitespace-nowrap">
                          <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 border">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold text-foreground/90 truncate uppercase tracking-tight">
                              {log.entityType}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono truncate" title={log.entityId}>
                              {log.entityId}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tight whitespace-nowrap">
                          <Clock className="h-3 w-3 opacity-40 text-primary" />
                          {formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-2 text-[10px] font-mono font-bold text-muted-foreground opacity-70 whitespace-nowrap">
                          <Globe className="h-3 w-3 opacity-40" />
                          {log.ip || '0.0.0.0'}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-80 text-center">
                    <div className="flex flex-col items-center justify-center space-y-6 opacity-60">
                      <div className="p-8 rounded-[2rem] bg-muted/40 border-2 border-dashed border-muted-foreground/20 animate-pulse">
                        <ShieldCheck className="h-14 w-14 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xl font-bold text-foreground">No Logs Detected</p>
                        <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">Critical actions will be captured here automatically once they occur in the workspace.</p>
                      </div>
                      {(searchTerm || activeCategory !== 'All') && (
                        <Button 
                          variant="link" 
                          className="font-black text-xs uppercase tracking-widest text-primary" 
                          onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}
                        >
                          Clear all active filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-muted/80">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>ISO 27001 Compliance Monitoring Active</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] text-muted-foreground/70 font-black uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            Immutable Store
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            365 Day Retention
          </div>
        </div>
      </div>
    </div>
  );
}
