
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from './page-header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from './ui/badge';
import { CheckCircle, Edit, ChevronsRight } from 'lucide-react';
import type { Report, WorkItem } from '@/lib/data-store';
import { Progress } from './ui/progress';
import { DatePicker } from './ui/date-picker';
import { format, isSameDay } from 'date-fns';
import { useCollection, useFirebase, useMemoFirebase, useAuth as useFirebaseAuth } from '@/firebase';
import { collection, query } from 'firebase/firestore';

function SubmittedReportCard({ report, workItem, itemIndex }: { report: Report, workItem: WorkItem, itemIndex: number }) {
    const router = useRouter();
    const checklistItems = report.checklist ? Object.values(report.checklist) : [];
    const checklistCompleted = checklistItems.filter(Boolean).length;
    const checklistTotal = checklistItems.length;
    const checklistPercentage = checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;
    
    const panelText = workItem.panelsWorkedOn?.join(', ');

    const handleTakeOver = () => {
        // Store the state in localStorage to be picked up by the form
        const takeoverState = {
            report,
            workItemToContinue: workItem,
        };
        localStorage.setItem('tapeheadsTakeoverState', JSON.stringify(takeoverState));
        router.push('/report/tapeheads/entry');
    };

    return (
        <Card className="shadow-md transition-all hover:shadow-lg flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{workItem.oeNumber}-{workItem.section}</CardTitle>
                        <CardDescription>
                            <span className="font-semibold">Panels:</span> {panelText}
                        </CardDescription>
                    </div>
                     <Badge variant="outline">Shift {report.shift}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-grow">
                 <p className="text-sm text-muted-foreground">
                    Started: {format(new Date(report.date), 'MM/dd')}, Shift {report.shift} by <span className="font-medium">{report.operatorName}</span> on {report.thNumber}
                </p>
                <div>
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Checklist</span>
                        <span className="text-xs font-semibold">{checklistPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={checklistPercentage} className="h-2" />
                </div>
            </CardContent>
             <CardContent className="flex justify-end gap-2">
                 {workItem.endOfShiftStatus === 'Completed' ? (
                     <Badge variant="default">
                       <CheckCircle className="mr-1 h-3 w-3" />
                       Completed
                    </Badge>
                 ) : (
                    <>
                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                           <ChevronsRight className="mr-1 h-3 w-3"/>
                           In Progress {workItem.layer && `(${workItem.layer})`}
                        </Badge>
                        <Button size="sm" variant="secondary" onClick={handleTakeOver}>
                            Take Over
                        </Button>
                    </>
                 )}
            </CardContent>
        </Card>
    );
}

export function TapeheadsWorkDashboard() {
    const { firestore } = useFirebase();
    const { isUserLoading } = useFirebaseAuth();
    const [date, setDate] = useState<Date | undefined>(new Date());

    const reportsQuery = useMemoFirebase(() => isUserLoading ? null : query(collection(firestore, 'tapeheads-submissions')), [firestore, isUserLoading]);
    const { data: reports, isLoading: loading } = useCollection<Report>(reportsQuery);

    const filteredWorkItems = React.useMemo(() => {
        if (!reports) return [];
        return reports.flatMap(report => 
            (report.workItems || []).map((workItem, index) => ({ report, workItem, id: `${report.id}-${index}` }))
        ).filter(({ report, workItem }) => {
            // Rule 1: Always show items that are 'In Progress'
            if (workItem.endOfShiftStatus === 'In Progress') {
                return true;
            }
            // Rule 2: For other statuses (like 'Completed'), only show if the date matches the filter
            if (date && isSameDay(new Date(report.date), date)) {
                return true;
            }
            return false;
        });
    }, [date, reports]);
    
    if (loading) {
        return <div>Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tapeheads Dashboard"
                description="Record your work for a new OE section or review recent submissions."
            >
                <div className="flex items-center gap-4">
                    <div className="w-48">
                        <DatePicker value={date} onChange={setDate} />
                    </div>
                    <Button asChild size="lg">
                        <Link href="/report/tapeheads/entry">Record Work</Link>
                    </Button>
                </div>
            </PageHeader>
            
            <h2 className="text-xl font-semibold tracking-tight">
                Showing In-Progress Tasks & Completed for {date ? date.toLocaleDateString() : 'All Dates'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredWorkItems.length > 0 ? (
                    filteredWorkItems.map(({ report, workItem, id }) => (
                         <SubmittedReportCard key={id} report={report} workItem={workItem} itemIndex={0} />
                    ))
                ) : (
                    <Card className="col-span-full">
                        <CardContent className="p-6 text-center text-muted-foreground">
                            No matching submissions found for the selected criteria.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

    