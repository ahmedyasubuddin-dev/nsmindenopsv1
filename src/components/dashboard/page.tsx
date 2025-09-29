
"use client";

import { useMemo, useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Factory, ShieldCheck, TrendingUp, Users, Wrench } from "lucide-react";
import { type FilmsReport, type GantryReport, type GraphicsTask, type InspectionSubmission, type OeJob } from '@/lib/data-store';
import type { Report } from '@/lib/types';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

const bottleneckChartConfig = {
  count: {
    label: "Active Items",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

type ActivityItem = {
    dept: string;
    oe: string;
    details: string;
    status: string;
    date: Date;
};


export default function DashboardPage() {
    const { firestore } = useFirebase();
    const [isClient, setIsClient] = useState(false);

    const tapeheadsQuery = useMemoFirebase(() => query(collection(firestore, 'tapeheads-submissions')), [firestore]);
    const { data: tapeheadsSubmissions, isLoading: isLoadingTapeheads } = useCollection<Report>(tapeheadsQuery);

    const filmsQuery = useMemoFirebase(() => query(collection(firestore, 'films')), [firestore]);
    const { data: filmsData, isLoading: isLoadingFilms } = useCollection<FilmsReport>(filmsQuery);

    const gantryQuery = useMemoFirebase(() => query(collection(firestore, 'gantry-reports')), [firestore]);
    const { data: gantryReportsData, isLoading: isLoadingGantry } = useCollection<GantryReport>(gantryQuery);

    const graphicsQuery = useMemoFirebase(() => query(collection(firestore, 'graphics-tasks')), [firestore]);
    const { data: graphicsTasksData, isLoading: isLoadingGraphics } = useCollection<GraphicsTask>(graphicsQuery);

    const inspectionsQuery = useMemoFirebase(() => query(collection(firestore, 'inspections')), [firestore]);
    const { data: inspectionsData, isLoading: isLoadingInspections } = useCollection<InspectionSubmission>(inspectionsQuery);

    const loading = isLoadingTapeheads || isLoadingFilms || isLoadingGantry || isLoadingGraphics || isLoadingInspections;

    useEffect(() => {
        setIsClient(true);
    }, []);

    const dashboardData = useMemo(() => {
        const safeTapeheads = tapeheadsSubmissions || [];
        const safeFilms = filmsData || [];
        const safeGantry = gantryReportsData || [];
        const safeGraphics = graphicsTasksData || [];
        const safeInspections = inspectionsData || [];

        // --- KPIs ---
        const activeWorkOrders = new Set(
            [
                ...safeTapeheads.flatMap(r => r.workItems?.map(wi => wi.oeNumber) || []),
                ...safeFilms.flatMap(r => [...r.sails_started, ...r.sails_finished]).map(s => s.sail_number.split('-')[0]),
                ...safeGantry.flatMap(r => r.molds?.flatMap(m => m.sails?.map(s => s.sail_number.split('-')[0]) || []) || []),
            ].filter(Boolean)
        );
        
        const totalMetersToday = safeTapeheads
            .reduce((sum, r) => sum + (r.total_meters || 0), 0);

        const qualityAlerts = safeInspections.filter(i => i.status !== 'Pass').length;
        
        const totalDowntimeMinutes = safeGantry
            .reduce((sum, r) => sum + (r.downtime?.reduce((dSum, d) => dSum + d.duration, 0) || 0), 0);
        
        // --- Activity Feed ---
        const tapeheadsActivity: ActivityItem[] = safeTapeheads.flatMap(r => 
            (r.workItems || []).map(wi => ({
                dept: 'Tapeheads',
                oe: `${wi.oeNumber}-${wi.section}`,
                details: `${r.operatorName} on ${r.thNumber} - ${wi.total_meters}m`,
                status: wi.endOfShiftStatus,
                date: new Date(r.date)
            }))
        );

        const filmsActivity: ActivityItem[] = safeFilms.flatMap(r => 
             r.sails_finished.map(s => ({
                dept: 'Films',
                oe: s.sail_number,
                details: `Prepped for Gantry ${r.gantry_number}`,
                status: 'Prepped',
                date: new Date(r.report_date)
            }))
        );
        
        const gantryActivity: ActivityItem[] = safeGantry.flatMap(r =>
            (r.molds || []).flatMap(m => 
                (m.sails || []).map(s => ({
                    dept: 'Gantry',
                    oe: s.sail_number,
                    details: `Stage: ${s.stage_of_process} on ${m.mold_number}`,
                    status: s.stage_of_process || 'In Progress',
                    date: new Date(r.date)
                }))
            )
        );
        
        const graphicsActivity: ActivityItem[] = safeGraphics
            .filter(t => t.status === 'done' && t.completedAt)
            .map(t => ({
                dept: 'Graphics',
                oe: t.tagId,
                details: `${t.type} task completed`,
                status: 'Completed',
                date: new Date(t.completedAt!)
            }));
            
         const allActivity = [...tapeheadsActivity, ...filmsActivity, ...gantryActivity, ...graphicsActivity]
            .sort((a, b) => b.date.getTime() - a.date.getTime());


        // --- Bottleneck Chart ---
        const bottleneckData = [
            { dept: 'Tapeheads', count: safeTapeheads.filter(r => (r.workItems || []).some(wi => wi.endOfShiftStatus === 'In Progress')).length },
            { dept: 'Films', count: safeFilms.filter(r => r.sails_started.length > 0 && r.sails_finished.length === 0).length },
            { dept: 'Gantry', count: safeGantry.filter(r => (r.molds || []).some(m => (m.sails || []).some(s => s.stage_of_process !== 'Lamination Inspection'))).length },
            { dept: 'Graphics', count: safeGraphics.filter(t => t.status === 'inProgress').length },
            { dept: 'QC', count: safeInspections.filter(i => i.status === 'Reinspection Required').length },
        ];


        return {
            activeWorkOrders: activeWorkOrders.size,
            totalMetersToday,
            qualityAlerts,
            totalDowntimeHours: (totalDowntimeMinutes / 60).toFixed(1),
            allActivity,
            bottleneckData,
        }

    }, [tapeheadsSubmissions, filmsData, gantryReportsData, graphicsTasksData, inspectionsData]);

  if (loading) {
      return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SRD: Minden Operations"
        description={isClient ? `Live overview of all department activities for ${format(new Date(), 'PPP')}.` : 'Loading...'}
      />

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Work Orders</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.activeWorkOrders}</div>
                    <p className="text-xs text-muted-foreground">OEs with activity</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Output</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.totalMetersToday.toLocaleString()}m</div>
                     <p className="text-xs text-muted-foreground">From Tapeheads department</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quality Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.qualityAlerts}</div>
                    <p className="text-xs text-muted-foreground">Sails needing reinspection or failed</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Downtime</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.totalDowntimeHours} <span className="text-sm text-muted-foreground">hrs</span></div>
                    <p className="text-xs text-muted-foreground">Across all departments</p>
                </CardContent>
            </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
         <Card className="lg:col-span-3">
             <CardHeader>
                <CardTitle>Live Activity Feed</CardTitle>
                <CardDescription>Most recent production events from all departments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                {dashboardData.allActivity.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                        <div className="flex-shrink-0 pt-1">
                             <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                {item.dept === 'Tapeheads' && <Users className="h-4 w-4 text-muted-foreground" />}
                                {item.dept === 'Films' && <CheckCircle className="h-4 w-4 text-muted-foreground" />}
                                {item.dept === 'Gantry' && <Factory className="h-4 w-4 text-muted-foreground" />}
                                {item.dept === 'Graphics' && <Users className="h-4 w-4 text-muted-foreground" />}
                             </span>
                        </div>
                        <div className="flex-1">
                             <div className="flex justify-between items-center">
                                <p className="font-semibold">{item.oe}</p>
                                <Badge variant="secondary">{item.dept}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">{item.details}</div>
                             {isClient && <p className="text-xs text-muted-foreground">{format(item.date, 'p')}</p>}
                        </div>
                    </div>
                ))}
            </CardContent>
         </Card>
         <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Production Queue</CardTitle>
                <CardDescription>Active work items by department.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={bottleneckChartConfig} className="h-80 w-full">
                    <BarChart
                        data={dashboardData.bottleneckData}
                        layout="vertical"
                        margin={{ left: 10, right: 10 }}
                    >
                        <CartesianGrid horizontal={false} />
                        <YAxis
                            dataKey="dept"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            className="text-xs"
                        />
                        <XAxis dataKey="count" type="number" hide />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}
