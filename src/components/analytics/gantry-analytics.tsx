
"use client"

import * as React from "react"
import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Pie, PieChart, Cell, Line, LineChart, ResponsiveContainer, Legend, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Factory, TrendingUp, CheckCircle, AlertTriangle, Users } from "lucide-react"
import type { GantryReport } from "@/lib/types"
import { useFirestore } from "@/firebase"
import { collection, getDocs } from "firebase/firestore"

const classifySailType = (sailNumber?: string): 'Sail' | 'Panel' | 'Scarf' => {
  if (!sailNumber || sailNumber.length < 3) return 'Scarf';
  const suffix = sailNumber.slice(-3);
  if (/^00\d$/.test(suffix)) return 'Sail';
  if (/^\d00$/.test(suffix)) return 'Panel';
  return 'Scarf';
};

const productionByDayConfig: ChartConfig = {
    totalSails: { label: "Sails (00X)", color: "hsl(var(--chart-1))" },
    totalPanels: { label: "Panels (X00)", color: "hsl(var(--chart-2))" },
    totalScarfs: { label: "Scarfs (Other)", color: "hsl(var(--chart-4))" },
};

const shiftComparisonConfig: ChartConfig = {
    shift1: { label: "Shift 1", color: "hsl(var(--chart-1))" },
    shift2: { label: "Shift 2", color: "hsl(var(--chart-2))" },
    shift3: { label: "Shift 3", color: "hsl(var(--chart-3))" },
};

const issueTypesConfig: ChartConfig = {
    "Creases": { label: "Creases", color: "hsl(var(--chart-1))" },
    "Sail Damage": { label: "Sail Damage", color: "hsl(var(--chart-2))" },
    "Debris": { label: "Debris", color: "hsl(var(--chart-3))" },
    "Vacuum Issues": { label: "Vacuum Issues", color: "hsl(var(--chart-4))" },
    "Other": { label: "Other", color: "hsl(var(--chart-5))" },
}

export function GantryAnalytics() {
  const [allReports, setAllReports] = React.useState<GantryReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const firestore = useFirestore();
  const [filters, setFilters] = React.useState({
    shift: "all",
    dateRange: "30",
    zone: "all",
  });

  React.useEffect(() => {
    async function fetchData() {
        if (!firestore) return;
        setLoading(true);
        const snapshot = await getDocs(collection(firestore, 'gantry_reports'));
        const data = snapshot.docs.map(doc => ({...doc.data(), date: new Date(doc.data().date) } as GantryReport));
        setAllReports(data);
        setLoading(false);
    }
    fetchData();
  }, [firestore]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredReports = useMemo(() => {
    if (!allReports || allReports.length === 0) return [];
    return allReports.filter(report => {
      const matchesShift = filters.shift === "all" || report.shift === filters.shift;
      
      const reportDate = new Date(report.date);
      const now = new Date();
      const daysAgo = parseInt(filters.dateRange, 10);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const matchesDate = filters.dateRange === "all" || reportDate >= cutoffDate;
      
      return matchesShift && matchesDate;
    });
  }, [allReports, filters]);

  const allSails = React.useMemo(() => {
    if (!filteredReports) return [];
    return filteredReports.flatMap(report => 
      (report.molds || []).flatMap(mold => 
        (mold.sails || []).map(sail => ({
          ...sail,
          moldNumber: mold.mold_number,
          date: report.date,
          shift: report.shift,
          sail_type: classifySailType(sail.sail_number),
          hasIssues: !!(sail.issues && sail.issues.trim() && sail.issues !== 'None'),
          reportId: report.id,
          personnel: report.personnel,
        }))
      )
    );
  }, [filteredReports]);

  const coreMetrics = useMemo(() => {
    const totalSailsProcessed = allSails.length;
    const totalSails = allSails.filter(s => s.sail_type === 'Sail').length;
    const totalPanels = allSails.filter(s => s.sail_type === 'Panel').length;
    const totalScarfs = allSails.filter(s => s.sail_type === 'Scarf').length;
    
    const sailsWithZeroIssues = allSails.filter(s => !s.hasIssues).length;
    const quality = totalSailsProcessed > 0 ? Math.round((sailsWithZeroIssues / totalSailsProcessed) * 100) : 0;
    
    const totalWorkingHours = filteredReports.reduce((total, report) => {
      const personnelHours = (report.personnel?.length || 0) * 8;
      const downtimeHours = ((report.downtime?.reduce((sum, dt) => sum + (dt.duration || 0), 0) || 0) / 60);
      const maintenanceHours = ((report.maintenance?.reduce((sum, m) => sum + (m.duration || 0), 0) || 0) / 60);
      return total + Math.max(0, personnelHours - downtimeHours - maintenanceHours);
    }, 0);
    
    const efficiency = totalWorkingHours > 0 ? parseFloat((totalSailsProcessed / totalWorkingHours).toFixed(1)) : 0.0;
  
    return {
      totalSailsProcessed, totalSails, totalPanels, totalScarfs,
      quality, efficiency,
      totalPersonnel: new Set(filteredReports.flatMap(r => r.personnel?.map(p => p.name) || [])).size,
      sailsWithZeroIssues
    };
  }, [filteredReports, allSails]);

  const productivityData = useMemo(() => {
    const dailyData: Record<string, any> = {};
  
    filteredReports.forEach(report => {
      const date = report.date.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          totalSails: 0, totalPanels: 0, totalScarfs: 0,
          shift1: 0, shift2: 0, shift3: 0
        };
      }
  
      const sailTypeCounts = { Sail: 0, Panel: 0, Scarf: 0 };
      report.molds?.forEach(mold => {
        mold.sails?.forEach(sail => {
          const sailType = classifySailType(sail.sail_number);
          sailTypeCounts[sailType]++;
        });
      });
  
      dailyData[date].totalSails += sailTypeCounts.Sail;
      dailyData[date].totalPanels += sailTypeCounts.Panel;
      dailyData[date].totalScarfs += sailTypeCounts.Scarf;
      
      const shiftKey = `shift${report.shift}` as keyof typeof dailyData[string];
      dailyData[date][shiftKey] += Object.values(sailTypeCounts).reduce((sum, count) => sum + count, 0);
    });
  
    return Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredReports]);

  const downtimeAnalysis = useMemo(() => {
    const downtimeByReason: Record<string, number> = {};
    const downtimeByShift: Record<string, { total: number, count: number }> = {};
  
    filteredReports.forEach(report => {
      const shiftKey = `Shift ${report.shift}`;
      if (!downtimeByShift[shiftKey]) downtimeByShift[shiftKey] = { total: 0, count: 0 };
  
      report.downtime?.forEach(dt => {
        const reason = dt.reason || 'Unspecified';
        const reasonLower = reason.toLowerCase();
        
        if (!reasonLower.includes('break') && !reasonLower.includes('lunch') && !reasonLower.includes('planned')) {
          downtimeByReason[reason] = (downtimeByReason[reason] || 0) + (dt.duration || 0);
          downtimeByShift[shiftKey].total += (dt.duration || 0);
        }
      });
    });
  
    const totalDowntime = Object.values(downtimeByReason).reduce((a, b) => a + b, 0);

    const reasonsData = Object.entries(downtimeByReason)
      .map(([reason, duration]) => ({
        name: reason,
        value: duration,
        fill: `hsl(var(--chart-${(Object.keys(downtimeByReason).indexOf(reason) % 5) + 1}))`
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const shiftsData = Object.entries(downtimeByShift).map(([shift, data]) => ({
        name: shift,
        duration: Math.round(data.total)
    }));
  
    return { reasonsData, shiftsData, totalDowntime };
  }, [filteredReports]);
  
    const rootCauseAnalysis = useMemo(() => {
        const issueCounts: Record<string, number> = {};
        const sailsWithIssues = allSails.filter(s => s.hasIssues && s.issues !== 'Other' && s.issues !== 'None');

        sailsWithIssues.forEach(sail => {
            const issue = sail.issues || "Unknown";
            issueCounts[issue] = (issueCounts[issue] || 0) + 1;
        });

        const issueData = Object.entries(issueCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

        return { issueData, sailsWithIssues };
    }, [allSails]);
    
    const stageFlowAnalysis = useMemo(() => {
        const stageCounts: Record<string, number> = {};
        allSails.forEach(sail => {
            const stage = sail.stage_of_process || "Unknown";
            stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        });
        return Object.entries(stageCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [allSails]);

  if (loading) {
    return <p>Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
                <div className="grid gap-2"><Label>Date Range</Label><Select value={filters.dateRange} onValueChange={v => handleFilterChange('dateRange', v)}><SelectTrigger className="w-40"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="7">Last 7 Days</SelectItem><SelectItem value="14">Last 14 Days</SelectItem><SelectItem value="30">Last 30 Days</SelectItem><SelectItem value="all">All Time</SelectItem></SelectContent></Select></div>
                <div className="grid gap-2"><Label>Shift</Label><Select value={filters.shift} onValueChange={v => handleFilterChange('shift', v)}><SelectTrigger className="w-40"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="1">Shift 1</SelectItem><SelectItem value="2">Shift 2</SelectItem><SelectItem value="3">Shift 3</SelectItem></SelectContent></Select></div>
            </CardContent>
        </Card>

        <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="productivity">Productivity</TabsTrigger>
                <TabsTrigger value="root_cause">Root Cause Analysis</TabsTrigger>
                <TabsTrigger value="stage_flow">Stage Flow</TabsTrigger>
                <TabsTrigger value="downtime">Downtime</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Processed</CardTitle><Factory className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{coreMetrics.totalSailsProcessed}</div><p className="text-xs text-muted-foreground">{coreMetrics.totalSails} Sails, {coreMetrics.totalPanels} Panels, {coreMetrics.totalScarfs} Scarfs</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Efficiency Score</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{coreMetrics.efficiency}</div><p className="text-xs text-muted-foreground">Items per effective hour</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Quality Rate</CardTitle><CheckCircle className="h-4 w-4 text-green-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{coreMetrics.quality}%</div><p className="text-xs text-muted-foreground">{coreMetrics.sailsWithZeroIssues} defect-free items</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Personnel</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{coreMetrics.totalPersonnel}</div><p className="text-xs text-muted-foreground">Across all shifts</p></CardContent></Card>
                </div>
                <Card>
                    <CardHeader><CardTitle>Daily Production Trends</CardTitle><CardDescription>21-day trend of all processed items.</CardDescription></CardHeader>
                    <CardContent>
                        <ChartContainer config={productionByDayConfig} className="h-72 w-full">
                            <AreaChart data={productivityData.slice(-21)} accessibilityLayer>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis/>
                                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                <Legend />
                                <Area dataKey="totalSails" type="natural" fill="var(--color-totalSails)" fillOpacity={0.4} stroke="var(--color-totalSails)" stackId="a" />
                                <Area dataKey="totalPanels" type="natural" fill="var(--color-totalPanels)" fillOpacity={0.4} stroke="var(--color-totalPanels)" stackId="a" />
                                <Area dataKey="totalScarfs" type="natural" fill="var(--color-totalScarfs)" fillOpacity={0.4} stroke="var(--color-totalScarfs)" stackId="a" />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="productivity">
                 <div className="grid gap-4 grid-cols-1">
                     <Card>
                        <CardHeader><CardTitle>Shift Comparison</CardTitle><CardDescription>Total items processed by each shift.</CardDescription></CardHeader>
                        <CardContent>
                             <ChartContainer config={shiftComparisonConfig} className="h-72 w-full">
                                <BarChart data={productivityData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Bar dataKey="shift1" stackId="a" fill="var(--color-shift1)" />
                                    <Bar dataKey="shift2" stackId="a" fill="var(--color-shift2)" />
                                    <Bar dataKey="shift3" stackId="a" fill="var(--color-shift3)" />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                 </div>
            </TabsContent>
            <TabsContent value="root_cause" className="space-y-4">
                 <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Reported Issue Frequency</CardTitle></CardHeader>
                        <CardContent>
                            <ChartContainer config={issueTypesConfig} className="h-72 w-full">
                                <BarChart data={rootCauseAnalysis.issueData} layout="vertical">
                                    <CartesianGrid horizontal={false} />
                                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={100} />
                                    <XAxis dataKey="value" type="number" />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="value" radius={4}>
                                        {rootCauseAnalysis.issueData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`var(--color-${entry.name})`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Sails with Reported Issues</CardTitle></CardHeader>
                        <CardContent className="max-h-80 overflow-y-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>Sail #</TableHead><TableHead>Issue</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {rootCauseAnalysis.sailsWithIssues.map(sail => (
                                        <TableRow key={sail.reportId + sail.sail_number}>
                                            <TableCell>{sail.sail_number}</TableCell>
                                            <TableCell>{sail.issues}</TableCell>
                                            <TableCell>{sail.date.toISOString().split('T')[0]}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                 </div>
            </TabsContent>
             <TabsContent value="stage_flow" className="space-y-4">
                 <Card>
                    <CardHeader><CardTitle>Work In Progress by Stage</CardTitle><CardDescription>Count of sails currently in each process stage.</CardDescription></CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-96 w-full">
                           <BarChart data={stageFlowAnalysis} layout="vertical">
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={150} />
                                <XAxis dataKey="value" type="number" />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4} />
                           </BarChart>
                        </ChartContainer>
                    </CardContent>
                 </Card>
            </TabsContent>
            <TabsContent value="downtime">
                 <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                     <Card>
                        <CardHeader><CardTitle>Top 5 Downtime Reasons</CardTitle><CardDescription>Total downtime: {Math.round(downtimeAnalysis.totalDowntime)} minutes</CardDescription></CardHeader>
                        <CardContent>
                             <ChartContainer config={{}} className="h-72 w-full">
                                <PieChart>
                                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={downtimeAnalysis.reasonsData} dataKey="value" nameKey="name" innerRadius={50} >
                                         {downtimeAnalysis.reasonsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Downtime by Shift</CardTitle><CardDescription>Total operational downtime in minutes.</CardDescription></CardHeader>
                        <CardContent>
                            <ChartContainer config={shiftComparisonConfig} className="h-72 w-full">
                                <BarChart data={downtimeAnalysis.shiftsData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="duration" radius={4}>
                                    {downtimeAnalysis.shiftsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`var(--color-${entry.name.replace(" ", "").toLowerCase()})`} />
                                    ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                 </div>
            </TabsContent>
        </Tabs>
    </div>
  )
}

    