
"use client";

import { useState, useMemo, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { getOeSection, type InspectionSubmission, type OeJob, type FilmsReport, type GantryReport } from '@/lib/data-store';
import type { Report, WorkItem } from '@/lib/types';
import { SailStatusCard } from '@/components/status/sail-status-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Layers } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { getRoleFromEmail, hasPermission } from '@/lib/roles';

interface FilmsInfo {
    status: 'Prepped' | 'In Progress' | 'No Entry';
    workDate?: string;
    gantry?: string;
    notes?: string;
}

interface GantryInfo {
    moldNumber: string;
    stage: string;
    issues?: string;
    downtimeCaused?: boolean;
    date: string;
    images?: any[];
}

interface EnrichedWorkItem extends WorkItem {
  report: Report;
  filmsInfo: FilmsInfo;
  gantryHistory: GantryInfo[];
  qcInspection?: InspectionSubmission;
  totalPanelsForSection: number;
}

export default function TapeheadsStatusPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [selectedOe, setSelectedOe] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const role = getRoleFromEmail(user?.email);
  
  const canView = (permission: any) => hasPermission(role, permission);

  const tapeheadsQuery = useMemoFirebase(() => (isUserLoading || !canView('nav:report:tapeheads')) ? null : query(collection(firestore, 'tapeheads-submissions')), [firestore, isUserLoading, role]);
  const { data: tapeheadsSubmissions, isLoading: isLoadingTapeheads } = useCollection<Report>(tapeheadsQuery);

  const filmsQuery = useMemoFirebase(() => (isUserLoading || !canView('nav:report:films')) ? null : query(collection(firestore, 'films')), [firestore, isUserLoading, role]);
  const { data: filmsData, isLoading: isLoadingFilms } = useCollection<FilmsReport>(filmsQuery);

  const gantryQuery = useMemoFirebase(() => (isUserLoading || !canView('nav:report:gantry')) ? null : query(collection(firestore, 'gantry-reports')), [firestore, isUserLoading, role]);
  const { data: gantryReportsData, isLoading: isLoadingGantry } = useCollection<GantryReport>(gantryQuery);

  const inspectionsQuery = useMemoFirebase(() => (isUserLoading || !canView('nav:qc')) ? null : query(collection(firestore, 'inspections')), [firestore, isUserLoading, role]);
  const { data: inspectionsData, isLoading: isLoadingInspections } = useCollection<InspectionSubmission>(inspectionsQuery);

  const jobsQuery = useMemoFirebase(() => isUserLoading ? null : query(collection(firestore, 'jobs')), [firestore, isUserLoading]);
  const { data: oeJobs, isLoading: isLoadingJobs } = useCollection<OeJob>(jobsQuery);
  
  const loading = isLoadingTapeheads || isLoadingFilms || isLoadingGantry || isLoadingInspections || isLoadingJobs || isUserLoading;

  useEffect(() => {
    if (!loading && tapeheadsSubmissions && tapeheadsSubmissions.length > 0 && !selectedOe) {
        const mostRecentReport = [...tapeheadsSubmissions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const defaultOe = mostRecentReport.workItems?.[0]?.oeNumber;
        if (defaultOe) {
            setSelectedOe(defaultOe);
            setSearchTerm(defaultOe);
        }
    }
  }, [loading, tapeheadsSubmissions, selectedOe]);

  const totalPanelsForOe = useMemo(() => {
    if (!selectedOe || !oeJobs) return 0;
    const job = oeJobs.find(j => j.oeBase === selectedOe);
    if (!job) return 0;
    return job.sections.reduce((total, section) => {
        return total + (section.panelEnd - section.panelStart + 1);
    }, 0);
  }, [selectedOe, oeJobs]);

  const sailWorkItems = useMemo(() => {
    if (!selectedOe || !tapeheadsSubmissions || !filmsData || !gantryReportsData || !inspectionsData || !oeJobs) return [];

    const items: { [sailKey: string]: EnrichedWorkItem[] } = {};

    tapeheadsSubmissions.forEach(report => {
      report.workItems?.forEach(item => {
        if (item.oeNumber === selectedOe) {
          const sailKey = `${item.oeNumber}-${item.section}`;
          const sailNumber = sailKey;
          
          let filmsInfo: FilmsInfo = { status: 'No Entry' };
          const finishedReport = filmsData.find(fr => fr.sails_finished.some(s => s.sail_number === sailNumber));
          const startedReport = filmsData.find(fr => fr.sails_started.some(s => s.sail_number === sailNumber));

          if (finishedReport) {
              const finishedSail = finishedReport.sails_finished.find(s => s.sail_number === sailNumber);
              filmsInfo = {
                  status: 'Prepped',
                  workDate: finishedReport.report_date,
                  gantry: finishedReport.gantry_number,
                  notes: finishedSail?.comments,
              };
          } else if (startedReport) {
              filmsInfo = {
                  status: 'In Progress',
                  workDate: startedReport.report_date,
                  gantry: startedReport.gantry_number,
              };
          }

          const gantryHistory: GantryInfo[] = [];
          gantryReportsData.forEach(gantryReport => {
              gantryReport.molds?.forEach(mold => {
                  mold.sails?.forEach(sail => {
                      if (sail.sail_number === sailNumber) {
                          gantryHistory.push({
                              moldNumber: mold.mold_number,
                              stage: sail.stage_of_process || 'N/A',
                              issues: sail.issues,
                              downtimeCaused: mold.downtime_caused,
                              date: gantryReport.date,
                              images: mold.images,
                          });
                      }
                  });
              });
          });
          gantryHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          const qcInspection = inspectionsData.find(qc => qc.oeNumber === sailNumber);
          
          const oeJob = oeJobs.find(job => job.oeBase === item.oeNumber);
          const oeSection = oeJob?.sections.find(sec => sec.sectionId === item.section);
          const totalPanelsForSection = oeSection ? (oeSection.panelEnd - oeSection.panelStart + 1) : 0;
          
          if (!items[sailKey]) {
            items[sailKey] = [];
          }
          items[sailKey].push({ ...item, report, filmsInfo, gantryHistory, qcInspection, totalPanelsForSection });
        }
      });
    });

    const latestWorkItems = Object.values(items).map(workLog => {
        return workLog.reduce((latest, current) => {
            return new Date(current.report.date) > new Date(latest.report.date) ? current : latest;
        });
    });

    latestWorkItems.sort((a, b) => {
      if (sortBy === 'status') {
        if (a.endOfShiftStatus === b.endOfShiftStatus) {
            return new Date(b.report.date).getTime() - new Date(a.report.date).getTime();
        }
        return a.endOfShiftStatus === 'Completed' ? 1 : -1;
      }
      return new Date(b.report.date).getTime() - new Date(a.report.date).getTime();
    });

    return latestWorkItems;

  }, [selectedOe, sortBy, tapeheadsSubmissions, filmsData, gantryReportsData, inspectionsData, oeJobs]);
  
  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      setSelectedOe(searchTerm);
  };

  if (loading) {
      return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sail Status Viewer"
        description="Enter an Order Entry number to see the status of all its associated sails."
      >
        <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search by OE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[200px]"
              />
            </form>
            <Select onValueChange={(value) => setSortBy(value as 'date' | 'status')} value={sortBy}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="status">Sort by Status</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </PageHeader>

      {selectedOe ? (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Panels for {selectedOe}</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalPanelsForOe}</div>
                    <p className="text-xs text-muted-foreground">Across all sails for this OE.</p>
                </CardContent>
            </Card>
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sailWorkItems.length > 0 ? (
                    sailWorkItems.map((item, index) => (
                        <SailStatusCard key={`${item.oeNumber}-${item.section}-${index}`} item={item} />
                    ))
                ) : (
                    <Card className="md:col-span-2 xl:col-span-3">
                        <CardContent className="p-10 text-center">
                            <p className="text-muted-foreground">No Tapeheads work recorded for OE# {selectedOe}.</p>
                        </CardContent>
                    </Card>
                )}
             </div>
        </div>
      ) : (
        <Card>
            <CardContent className="p-10 text-center">
                <p className="text-muted-foreground">Please enter an OE number and press Enter to view sail statuses.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
