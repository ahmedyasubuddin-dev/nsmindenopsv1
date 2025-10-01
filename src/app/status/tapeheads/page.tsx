
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
import type { InspectionSubmission, OeJob, FilmsReport, GantryReport } from '@/lib/data-store';
import type { Report, WorkItem } from '@/lib/types';
import { SailStatusCard } from '@/components/status/sail-status-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Layers } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface FilmsInfo {
    status: 'Prepped' | 'In Progress' | 'No Entry';
    workDate?: string;
    gantry?: string;
    notes?: string;
}

interface EnrichedWorkItem extends WorkItem {
  report: Report;
  filmsInfo: FilmsInfo;
  gantryHistory: GantryReport[];
  qcInspection?: InspectionSubmission;
  totalPanelsForSection: number;
}

export default function TapeheadsStatusPage() {
  const [selectedOe, setSelectedOe] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const firestore = useFirestore();

  const [tapeheadsSubmissions, setTapeheadsSubmissions] = useState<Report[]>([]);
  const [filmsData, setFilmsData] = useState<FilmsReport[]>([]);
  const [gantryReportsData, setGantryReportsData] = useState<GantryReport[]>([]);
  const [inspectionsData, setInspectionsData] = useState<InspectionSubmission[]>([]);
  const [oeJobs, setOeJobs] = useState<OeJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!firestore) return;
      try {
        setLoading(true);
        const [tapeheadsSnapshot, filmsSnapshot, gantrySnapshot, inspectionsSnapshot, jobsSnapshot] = await Promise.all([
          getDocs(collection(firestore, 'tapeheads_submissions')),
          getDocs(collection(firestore, 'films')),
          getDocs(collection(firestore, 'gantry_reports')),
          getDocs(collection(firestore, 'inspections')),
          getDocs(collection(firestore, 'jobs')),
        ]);
        setTapeheadsSubmissions(tapeheadsSnapshot.docs.map(doc => doc.data() as Report));
        setFilmsData(filmsSnapshot.docs.map(doc => doc.data() as FilmsReport));
        setGantryReportsData(gantrySnapshot.docs.map(doc => doc.data() as GantryReport));
        setInspectionsData(inspectionsSnapshot.docs.map(doc => doc.data() as InspectionSubmission));
        setOeJobs(jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OeJob)));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [firestore]);


  // Set default OE after data is loaded
  useEffect(() => {
    if (!loading && tapeheadsSubmissions && tapeheadsSubmissions.length > 0) {
        const mostRecentReport = [...tapeheadsSubmissions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const defaultOe = mostRecentReport.workItems?.[0]?.oeNumber;
        if (defaultOe && !selectedOe) {
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
    if (!selectedOe || !tapeheadsSubmissions) return [];

    const items: { [sailKey: string]: EnrichedWorkItem[] } = {};

    tapeheadsSubmissions.forEach(report => {
      report.workItems?.forEach(item => {
        if (item.oeNumber === selectedOe) {
          const sailKey = `${item.oeNumber}-${item.section}`;
          const sailNumber = sailKey;
          
          // --- Find Films Department Info ---
          let filmsInfo: FilmsInfo = { status: 'No Entry' };
          const finishedReport = (filmsData || []).find(fr => fr.sails_finished.some(s => s.sail_number === sailNumber));
          const startedReport = (filmsData || []).find(fr => fr.sails_started.some(s => s.sail_number === sailNumber));

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
          // --- End of Films Logic ---

          // --- Find Gantry Department Info ---
          const gantryHistory: GantryReport[] = [];
          (gantryReportsData || []).forEach(gantryReport => {
              gantryReport.molds?.forEach(mold => {
                  mold.sails?.forEach(sail => {
                      if (sail.sail_number === sailNumber) {
                          gantryHistory.push({
                              ...gantryReport,
                              molds: [{
                                  ...mold,
                                  sails: [sail]
                              }]
                          });
                      }
                  });
              });
          });
           // Sort history by most recent date
          gantryHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          // --- End of Gantry Logic ---

          // --- Find QC Inspection Info ---
          const qcInspection = (inspectionsData || []).find(qc => qc.oeNumber === sailNumber);
          // --- End of QC Logic ---

          // --- Get Total Panels for Section ---
          const oeJob = (oeJobs || []).find(job => job.oeBase === item.oeNumber);
          const oeSection = oeJob?.sections.find(sec => sec.sectionId === item.section);
          const totalPanelsForSection = oeSection ? (oeSection.panelEnd - oeSection.panelStart + 1) : 0;
          // --- End of Total Panels Logic ---
          
          if (!items[sailKey]) {
            items[sailKey] = [];
          }
          items[sailKey].push({ ...item, report, filmsInfo, gantryHistory, qcInspection, totalPanelsForSection });
        }
      });
    });

    // For each sail, we only want the most recent update.
    const latestWorkItems = Object.values(items).map(workLog => {
        // Find the most recent report for this specific sail
        return workLog.reduce((latest, current) => {
            return new Date(current.report.date) > new Date(latest.report.date) ? current : latest;
        });
    });

    // Sorting logic
    latestWorkItems.sort((a, b) => {
      if (sortBy === 'status') {
        if (a.endOfShiftStatus === b.endOfShiftStatus) {
            return new Date(b.report.date).getTime() - new Date(a.report.date).getTime();
        }
        return a.endOfShiftStatus === 'Completed' ? 1 : -1;
      }
      // Default to sorting by date
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

    

    