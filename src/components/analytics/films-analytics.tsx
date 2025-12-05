"use client"

import React, { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Factory, TrendingUp, CheckCircle, Clock, Package } from "lucide-react"
import { useCollection } from '@/lib/supabase/hooks/use-collection';
import { useUser } from '@/lib/supabase/provider';
import type { FilmsReport } from "@/lib/data-store"
import { format, parseISO } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Legend } from "recharts"

const chartConfig = {
  sailsStarted: {
    label: "Sails Started",
    color: "hsl(var(--chart-1))",
  },
  sailsFinished: {
    label: "Sails Finished",
    color: "hsl(var(--chart-2))",
  },
  completionRate: {
    label: "Completion Rate",
    color: "hsl(var(--chart-3))",
  },
}

export function FilmsAnalytics() {
  const { isUserLoading } = useUser();

  // Temporarily remove date filter to test if that's causing the timeout
  // If queries work without date filter, we know the issue is with the date column/index
  const { data: filmsData, isLoading, error: dataError } = useCollection<FilmsReport>(
    isUserLoading 
      ? null 
      : {
          table: 'films_reports',
          orderBy: { column: 'report_date', ascending: false },
          enabled: true,
          limit: 100, // Reduced limit for faster testing
          // Temporarily disabled date range to test
          // dateRange: {
          //   column: 'report_date',
          //   from: defaultDateFrom.toISOString(),
          // },
        }
  );

  const [filters, setFilters] = React.useState({
    dateRange: "30",
    gantry: "all",
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredData = useMemo(() => {
    if (!filmsData) return [];
    const now = new Date();
    const daysAgo = parseInt(filters.dateRange, 10);
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    return filmsData.filter(report => {
      const reportDate = new Date(report.report_date);
      const matchesDate = filters.dateRange === "all" || reportDate >= cutoffDate;
      const matchesGantry = filters.gantry === "all" || report.gantry_number === filters.gantry;
      return matchesDate && matchesGantry;
    });
  }, [filmsData, filters]);

  const kpiData = useMemo(() => {
    if (!filteredData) return { 
      totalStarted: 0, 
      totalFinished: 0, 
      completionRate: '0%', 
      avgDailyThroughput: 0,
      uniqueSails: 0
    };

    const totalStarted = filteredData.reduce((acc, report) => acc + (report.sails_started?.length || 0), 0);
    const totalFinished = filteredData.reduce((acc, report) => acc + (report.sails_finished?.length || 0), 0);
    const completionRate = totalStarted > 0 ? ((totalFinished / totalStarted) * 100) : 0;
    
    // Calculate unique sail numbers
    const allSailNumbers = new Set<string>();
    filteredData.forEach(report => {
      report.sails_started?.forEach(sail => allSailNumbers.add(sail.sail_number));
      report.sails_finished?.forEach(sail => allSailNumbers.add(sail.sail_number));
    });

    // Calculate average daily throughput
    const uniqueDates = new Set(filteredData.map(r => r.report_date));
    const avgDailyThroughput = uniqueDates.size > 0 ? (totalFinished / uniqueDates.size) : 0;

    return {
      totalStarted: totalStarted,
      totalFinished: totalFinished,
      completionRate: `${completionRate.toFixed(1)}%`,
      avgDailyThroughput: avgDailyThroughput.toFixed(1),
      uniqueSails: allSailNumbers.size,
    };
  }, [filteredData]);

  const dailyProduction = useMemo(() => {
    if (!filteredData) return [];
    const dailyData: Record<string, { date: string; started: number; finished: number; completionRate: number }> = {};

    filteredData.forEach(report => {
      const dateKey = format(parseISO(report.report_date), 'MMM dd');
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, started: 0, finished: 0, completionRate: 0 };
      }
      dailyData[dateKey].started += report.sails_started?.length || 0;
      dailyData[dateKey].finished += report.sails_finished?.length || 0;
    });

    // Calculate completion rate for each day
    Object.values(dailyData).forEach(day => {
      day.completionRate = day.started > 0 ? (day.finished / day.started) * 100 : 0;
    });

    return Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredData]);

  const gantryDistribution = useMemo(() => {
    if (!filteredData) return [];
    const gantryData: Record<string, { started: number; finished: number; reports: number }> = {};

    filteredData.forEach(report => {
      const gantry = report.gantry_number || 'Unknown';
      if (!gantryData[gantry]) {
        gantryData[gantry] = { started: 0, finished: 0, reports: 0 };
      }
      gantryData[gantry].started += report.sails_started?.length || 0;
      gantryData[gantry].finished += report.sails_finished?.length || 0;
      gantryData[gantry].reports += 1;
    });

    return Object.entries(gantryData).map(([gantry, data]) => ({
      name: `Gantry ${gantry}`,
      started: data.started,
      finished: data.finished,
      reports: data.reports,
      completionRate: data.started > 0 ? ((data.finished / data.started) * 100).toFixed(1) : 0,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredData]);

  const weeklyTrend = useMemo(() => {
    if (!filteredData) return [];
    const weeklyData: Record<string, { week: string; started: number; finished: number }> = {};

    filteredData.forEach(report => {
      const date = parseISO(report.report_date);
      const weekStart = format(date, 'MMM dd');
      const weekKey = weekStart;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { week: weekKey, started: 0, finished: 0 };
      }
      weeklyData[weekKey].started += report.sails_started?.length || 0;
      weeklyData[weekKey].finished += report.sails_finished?.length || 0;
    });

    return Object.values(weeklyData).sort((a, b) => 
      new Date(a.week).getTime() - new Date(b.week).getTime()
    );
  }, [filteredData]);

  const sailsInProgress = useMemo(() => {
    if (!filteredData) return [];
    const sailStatus: Record<string, { sail_number: string; startedDate: string; finishedDate: string | null; daysInProgress: number }> = {};

    filteredData.forEach(report => {
      const reportDate = report.report_date;
      
      // Track started sails
      report.sails_started?.forEach(sail => {
        if (!sailStatus[sail.sail_number]) {
          sailStatus[sail.sail_number] = {
            sail_number: sail.sail_number,
            startedDate: reportDate,
            finishedDate: null,
            daysInProgress: 0,
          };
        }
      });

      // Track finished sails
      report.sails_finished?.forEach(sail => {
        if (sailStatus[sail.sail_number]) {
          sailStatus[sail.sail_number].finishedDate = reportDate;
          const startDate = parseISO(sailStatus[sail.sail_number].startedDate);
          const finishDate = parseISO(reportDate);
          sailStatus[sail.sail_number].daysInProgress = Math.ceil(
            (finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          );
        } else {
          // Sail finished without being tracked as started
          sailStatus[sail.sail_number] = {
            sail_number: sail.sail_number,
            startedDate: reportDate,
            finishedDate: reportDate,
            daysInProgress: 0,
          };
        }
      });
    });

    // Calculate days in progress for unfinished sails
    const today = new Date();
    Object.values(sailStatus).forEach(sail => {
      if (!sail.finishedDate) {
        const startDate = parseISO(sail.startedDate);
        sail.daysInProgress = Math.ceil(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
    });

    return Object.values(sailStatus)
      .sort((a, b) => b.daysInProgress - a.daysInProgress)
      .slice(0, 10); // Top 10 longest in progress
  }, [filteredData]);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
          <p className="text-xs text-muted-foreground mt-2">Fetching last 30 days of data</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">Error loading analytics</p>
          <p className="text-sm text-muted-foreground">{dataError.message}</p>
          <p className="text-xs text-muted-foreground mt-2">Check browser console for details</p>
        </div>
      </div>
    );
  }

  if (!filmsData || filmsData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground font-semibold mb-2">No data available</p>
          <p className="text-sm text-muted-foreground">No reports found in the last 30 days.</p>
          <p className="text-xs text-muted-foreground mt-2">Try adjusting the date range filter or check if reports have been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sails Started</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalStarted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all gantries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sails Finished</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalFinished.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed production</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.completionRate}</div>
            <p className="text-xs text-muted-foreground mt-1">Finished / Started</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Throughput</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.avgDailyThroughput}</div>
            <p className="text-xs text-muted-foreground mt-1">Sails per day</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Sails</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.uniqueSails.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Distinct sail numbers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gantry</Label>
            <Select value={filters.gantry} onValueChange={(value) => handleFilterChange('gantry', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gantries</SelectItem>
                <SelectItem value="4">Gantry 4</SelectItem>
                <SelectItem value="6">Gantry 6</SelectItem>
                <SelectItem value="7">Gantry 7</SelectItem>
                <SelectItem value="8">Gantry 8</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Production</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyProduction}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="started" fill="hsl(var(--chart-1))" name="Sails Started" />
                  <Bar dataKey="finished" fill="hsl(var(--chart-2))" name="Sails Finished" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gantry Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gantryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="started" fill="hsl(var(--chart-1))" name="Started" />
                  <Bar dataKey="finished" fill="hsl(var(--chart-2))" name="Finished" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Production Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="started" stroke="hsl(var(--chart-1))" name="Sails Started" />
                <Line type="monotone" dataKey="finished" stroke="hsl(var(--chart-2))" name="Sails Finished" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gantry Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Gantry</th>
                  <th className="text-right p-2">Reports</th>
                  <th className="text-right p-2">Sails Started</th>
                  <th className="text-right p-2">Sails Finished</th>
                  <th className="text-right p-2">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {gantryDistribution.map((gantry) => (
                  <tr key={gantry.name} className="border-b">
                    <td className="p-2 font-medium">{gantry.name}</td>
                    <td className="p-2 text-right">{gantry.reports}</td>
                    <td className="p-2 text-right">{gantry.started}</td>
                    <td className="p-2 text-right">{gantry.finished}</td>
                    <td className="p-2 text-right">{gantry.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {sailsInProgress.length > 0 && (
    <Card>
      <CardHeader>
            <CardTitle>Sails In Progress (Longest Duration)</CardTitle>
      </CardHeader>
      <CardContent>
            <div className="space-y-2">
              {sailsInProgress.map((sail) => (
                <div key={sail.sail_number} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{sail.sail_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Started: {format(parseISO(sail.startedDate), 'MMM dd, yyyy')}
                      {sail.finishedDate && ` • Finished: ${format(parseISO(sail.finishedDate), 'MMM dd, yyyy')}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{sail.daysInProgress} days</p>
                    <p className="text-xs text-muted-foreground">
                      {sail.finishedDate ? 'Completed' : 'In Progress'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
      </CardContent>
    </Card>
      )}
    </div>
  );
}
    