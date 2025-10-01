
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { addTapeheadsSubmission } from '@/lib/data-store';
import type { Report } from '@/lib/types';
import { PageHeader } from '@/components/page-header';

const historicalData: Omit<Report, 'id'>[] = [
  {
    operatorName: "John Doe",
    shift: 1,
    thNumber: "TH-1",
    date: new Date("2024-07-15T14:00:00Z"),
    status: "Submitted",
    shiftLeadName: "Lead A",
    shiftStartTime: "06:00",
    shiftEndTime: "14:00",
    hoursWorked: 8,
    total_meters: 1250,
    workItems: [{
      oeNumber: "OAUS32160", section: "001", endOfShiftStatus: 'Completed',
      tapes: [{ tapeId: '928108', metersProduced: 1250, metersWasted: 50 }],
      total_meters: 1250, total_tapes: 1, had_spin_out: false,
      panelsWorkedOn: ["P1", "P2", "P3", "P4", "P5"]
    }],
    checklist: { smoothFuseFull: true, bladesGlasses: true, paperworkUpToDate: true, debriefNewOperator: true, electricScissor: true, tubesAtEndOfTable: true, sprayTracksOnBridge: true, sharpiePens: true, broom: true, cleanedWorkStation: true, meterStickTwoIrons: true, thIsleTrashEmpty: true }
  },
  {
    operatorName: "Jane Smith",
    shift: 2,
    thNumber: "TH-2",
    date: new Date("2024-07-15T22:00:00Z"),
    status: "Submitted",
    shiftLeadName: "Lead B",
    shiftStartTime: "14:00",
    shiftEndTime: "22:00",
    hoursWorked: 8,
    total_meters: 980,
    workItems: [{
      oeNumber: "OAUS32160", section: "002", endOfShiftStatus: 'In Progress', layer: "8 of 15",
      tapes: [{ tapeId: '938108', metersProduced: 980, metersWasted: 20 }],
      total_meters: 980, total_tapes: 1, had_spin_out: true, spin_outs: 1, spin_out_duration_minutes: 15,
      panelsWorkedOn: ["P10", "P11", "P12"]
    }],
    checklist: { smoothFuseFull: true, bladesGlasses: true, paperworkUpToDate: false, debriefNewOperator: false, electricScissor: true, tubesAtEndOfTable: true, sprayTracksOnBridge: true, sharpiePens: true, broom: true, cleanedWorkStation: false, meterStickTwoIrons: true, thIsleTrashEmpty: true }
  },
  {
    operatorName: "Mike Ross",
    shift: 1,
    thNumber: "TH-4",
    date: new Date("2024-07-16T14:00:00Z"),
    status: "Submitted",
    shiftLeadName: "Lead A",
    shiftStartTime: "06:00",
    shiftEndTime: "14:00",
    hoursWorked: 8,
    total_meters: 2100,
    workItems: [
      {
        oeNumber: "OAUS32161", section: "001", endOfShiftStatus: 'Completed',
        tapes: [{ tapeId: '928128', metersProduced: 1100, metersWasted: 30 }],
        total_meters: 1100, total_tapes: 1, had_spin_out: false,
        panelsWorkedOn: ["P1", "P2", "P3", "P4"]
      },
      {
        oeNumber: "OAUS32161", section: "002", endOfShiftStatus: 'Completed',
        tapes: [{ tapeId: '938128', metersProduced: 1000, metersWasted: 25 }],
        total_meters: 1000, total_tapes: 1, had_spin_out: false,
        panelsWorkedOn: ["P5", "P6", "P7", "P8"]
      }
    ],
    checklist: { smoothFuseFull: true, bladesGlasses: true, paperworkUpToDate: true, debriefNewOperator: true, electricScissor: true, tubesAtEndOfTable: true, sprayTracksOnBridge: true, sharpiePens: true, broom: true, cleanedWorkStation: true, meterStickTwoIrons: true, thIsleTrashEmpty: true }
  }
];

export default function SeedDataPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSeedData = async () => {
    setIsLoading(true);
    try {
      for (const reportData of historicalData) {
        const reportWithId = { ...reportData, id: `rpt_hist_${Date.now()}_${Math.random()}` } as Report;
        await addTapeheadsSubmission(firestore, reportWithId);
      }
      toast({
        title: "Success!",
        description: "3 historical records have been added to your database.",
      });
    } catch (error) {
      console.error("Error seeding data:", error);
      toast({
        title: "Error",
        description: "There was a problem seeding the data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        <PageHeader 
            title="Database Seeding Utility"
            description="Add sample data to your application."
        />
        <Card>
            <CardHeader>
            <CardTitle>Add Historical Tapeheads Reports</CardTitle>
            <CardDescription>
                Click the button below to add three sample shift reports to the Firestore database.
                This will allow you to test the dashboard, review, and status pages with pre-filled data.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Button onClick={handleSeedData} disabled={isLoading}>
                {isLoading ? "Seeding..." : "Seed Historical Data"}
            </Button>
            </CardContent>
        </Card>
    </div>
  );
}
