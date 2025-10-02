
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Pie, PieChart, Cell, Line, LineChart, ResponsiveContainer, Legend, Scatter, ScatterChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Factory, TrendingUp, Clock, Zap } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Badge } from "../ui/badge"
import type { PreggerReport } from "@/lib/types"
import { useFirestore } from "@/firebase"
import { collection, getDocs } from "firebase/firestore"
import { FirestorePermissionError } from "@/firebase"
import { errorEmitter } from "@/firebase/error-emitter"

const productionChartConfig = {
  shift1: { label: "Shift 1", color: "hsl(var(--chart-1))" },
  shift2: { label: "Shift 2", color: "hsl(var(--chart-2))" },
  shift3: { label: "Shift 3", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

const downtimeReasonsConfig = {
    mechanical: { label: 'Mechanical', color: 'hsl(var(--chart-1))' },
    electrical: { label: 'Electrical', color: 'hsl(var(--chart-2))' },
    material: { label: 'Material Shortage', color: 'hsl(var(--chart-3))' },
    other: { label: 'Other', color: 'hsl(var(--chart-4))' },
} satisfies ChartConfig;

const CustomLegend = () => {
  return <p className="text-xs text-center text-muted-foreground">Hover over chart to see details</p>;
};

export function PreggerAnalytics() {
  const [allData, setAllData] = React.useState<PreggerReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const firestore = useFirestore();
  const [filters, setFilters] = React.useState({
    dateFrom: '2023-10-25',
    dateTo: '2023-10-27',
    shift: 'all',
  });

  React.useEffect(() => {
    async function fetchData() {
        if (!firestore) return;
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(firestore, 'pregger_reports'));
            const data = snapshot.docs.map(doc => doc.data() as PreggerReport);
            setAllData(data);
        } catch (error) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'pregger_reports',
                operation: 'list'
            }));
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [firestore]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const data = React.useMemo(() => {
    return allData.filter(report => {
        const reportDate = new Date(report.report_date);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        
        if (fromDate && reportDate < fromDate) return false;
        if (toDate && reportDate > toDate) return false;
        if (filters.shift !== 'all' && String(report.shift) !== filters.shift) return false;
        
        return true;
    });
  }, [allData, filters]);
  
  const kpiData = React.useMemo(() => {
    const totalMeters = data.reduce((acc, report) => acc + report.workCompleted.reduce((sum, work) => sum + work.meters, 0), 0);
    const totalWaste = data.reduce((acc, report) => acc + report.workCompleted.reduce((sum, work) => sum + work.waste_meters, 0), 0);
    const totalDowntime = data.reduce((acc, report) => acc + (report.downtime?.reduce((sum, down) => sum + down.duration_minutes, 0) || 0), 0);
    const totalWorkingHours = data.reduce((acc, report) => acc + (report.personnel.length * 8), 0)
    
    const yieldRate = totalMeters > 0 ? 100 - (totalWaste / totalMeters) * 100 : 100;
    const operationalEfficiency = totalWorkingHours > 0 ? totalMeters / (totalWorkingHours - (totalDowntime / 60)) : 0;
    
    return {
      totalMeters: totalMeters.toLocaleString(),
      yieldRate: `${yieldRate.toFixed(1)}%`,
      totalDowntime: `${totalDowntime.toLocaleString()} min`,
      operationalEfficiency: `${operationalEfficiency.toFixed(1)} m/hr`,
    };
  }, [data]);
  
  const productionByDay = React.useMemo(() => {
    const dailyData: { [key: string]: any } = {};
    data.forEach(report => {
      const date = new Date(report.report_date).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { date, shift1: 0, shift2: 0, shift3: 0 };
      }
      const meters = report.workCompleted.reduce((sum, work) => sum + work.meters, 0);
      dailyData[date][`shift${report.shift}`] += meters;
    });
    return Object.values(dailyData);
  }, [data]);

  const downtimeByReason = React.useMemo(() => {
    const reasonData: { [key: string]: number } = {};
    data.forEach(report => {
      report.downtime?.forEach(d => {
        reasonData[d.reason] = (reasonData[d.reason] || 0) + d.duration_minutes;
      });
    });
    return Object.entries(reasonData).map(([name, value]) => ({ name, value }));
  }, [data]);

  if (loading) {
    return <p>Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Meters Produced</CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{kpiData.totalMeters}</div></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Operational Efficiency</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{kpiData.operationalEfficiency}</div></CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Yield Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{kpiData.yieldRate}</div></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Downtime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{kpiData.totalDowntime}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
            <div className="grid gap-2"><Label htmlFor="date-from">Date From</Label><Input id="date-from" type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="date-to">Date To</Label><Input id="date-to" type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)}/></div>
            <div className="grid gap-2"><Label htmlFor="shift-filter">Shift</Label>
                <Select value={filters.shift} onValueChange={value => handleFilterChange('shift', value)}>
                    <SelectTrigger id="shift-filter" className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Shifts</SelectItem><SelectItem value="1">Shift 1</SelectItem><SelectItem value="2">Shift 2</SelectItem><SelectItem value="3">Shift 3</SelectItem></SelectContent>
                </Select>
            </div>
            <Button>Apply Filters</Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="production">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="production">Production Trends</TabsTrigger>
          <TabsTrigger value="yield">Yield & Performance</TabsTrigger>
          <TabsTrigger value="shift">Shift Performance</TabsTrigger>
          <TabsTrigger value="downtime">Downtime & Drilldown</TabsTrigger>
        </TabsList>
        <TabsContent value="production" className="space-y-4">
            <Card>
                <CardHeader><CardTitle>Meters by Shift per Day</CardTitle></CardHeader>
                <CardContent>
                    <ChartContainer config={productionChartConfig} className="h-72 w-full">
                        <BarChart accessibilityLayer data={productionByDay}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar dataKey="shift1" stackId="a" fill="var(--color-shift1)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="shift2" stackId="a" fill="var(--color-shift2)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="shift3" stackId="a" fill="var(--color-shift3)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="yield" className="space-y-4">
             <Card>
                <CardHeader><CardTitle>Yield & Performance</CardTitle></CardHeader>
                <CardContent><p>Yield & Performance charts will be displayed here.</p></CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="shift" className="space-y-4">
             <Card>
                <CardHeader><CardTitle>Shift Performance</CardTitle></CardHeader>
                <CardContent><p>Shift Performance charts and tables will be displayed here.</p></CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="downtime" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>Downtime by Reason</CardTitle></CardHeader>
                    <CardContent>
                        <ChartContainer config={downtimeReasonsConfig} className="h-72 w-full">
                            <PieChart>
                                <Tooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={downtimeByReason} dataKey="value" nameKey="name" innerRadius={50}>
                                    {downtimeByReason.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={`var(--color-${entry.name})`} />
                                    ))}
                                </Pie>
                                <Legend content={<CustomLegend />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Report Drilldown</CardTitle></CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                       <Accordion type="single" collapsible className="w-full">
                         {data.map(report => (
                            <AccordionItem key={report.id} value={report.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <span>{new Date(report.report_date).toLocaleDateString()} - Shift {report.shift}</span>
                                        <Badge>
                                            {report.workCompleted.reduce((acc, w) => acc + w.meters, 0)}m
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-2 space-y-2">
                                    <h4 className="font-semibold">Work Completed</h4>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Tape ID</TableHead><TableHead>Meters</TableHead><TableHead>Waste</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {report.workCompleted.map((w,i) => <TableRow key={i}><TableCell>{w.tape_id}</TableCell><TableCell>{w.meters}</TableCell><TableCell>{w.waste_meters}</TableCell></TableRow>)}
                                        </TableBody>
                                    </Table>
                                     <h4 className="font-semibold pt-2">Personnel</h4>
                                      <Table>
                                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {report.personnel.map((p,i) => <TableRow key={i}><TableCell>{p.name}</TableCell><TableCell>{p.start_time}</TableCell><TableCell>{p.end_time}</TableCell></TableRow>)}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                         ))}
                       </Accordion>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
