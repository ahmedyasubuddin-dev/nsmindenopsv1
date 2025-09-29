
"use client";

import type { Report, WorkItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, Layers, Clock, Shapes, Ruler, Wind, User, Calendar, CircleDot, Film, GanttChartSquare, XCircle, Hourglass, Factory, Wrench, Image as ImageIcon, ShieldCheck, FileDown, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "../ui/separator";
import type { InspectionSubmission, FilmsReport, GantryReport } from "@/lib/data-store";
import { Button } from "../ui/button";
import { generateSailStatusPdf } from "@/lib/generate-sail-status-pdf";
import { useToast } from "@/hooks/use-toast";

interface EnrichedWorkItem extends WorkItem {
  report: Report;
  filmsInfo: FilmsInfo;
  gantryHistory: GantryReport[];
  qcInspection?: InspectionSubmission;
  totalPanelsForSection: number;
}

interface SailStatusCardProps {
  item: EnrichedWorkItem;
}


interface FilmsInfo {
    status: 'Prepped' | 'In Progress' | 'No Entry';
    workDate?: string;
    gantry?: string;
    notes?: string;
}


const DetailItem = ({ icon, label, value, className }: { icon: React.ReactNode, label: string, value: React.ReactNode, className?: string }) => (
    <div className={cn("flex items-start gap-3", className)}>
        <div className="text-muted-foreground mt-0.5">{icon}</div>
        <div className="flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value}</p>
        </div>
    </div>
);

function FilmsStatusSection({ filmsInfo }: { filmsInfo: FilmsInfo }) {
  const getStatusBadge = () => {
    switch (filmsInfo.status) {
      case 'Prepped':
        return <Badge className="bg-green-600 text-white"><CheckCircle className="mr-1 h-3 w-3" /> Prepped</Badge>;
      case 'In Progress':
        return <Badge variant="outline" className="border-amber-500 text-amber-600"><Hourglass className="mr-1 h-3 w-3" /> In Progress</Badge>;
      case 'No Entry':
      default:
        return <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" /> No Entry</Badge>;
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-primary/90 flex items-center gap-2"><Film size={16}/>Films Department</h4>
            {getStatusBadge()}
        </div>
        {filmsInfo.status !== 'No Entry' && (
             <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pl-2">
                <DetailItem icon={<Calendar size={14}/>} label="Work Date" value={filmsInfo.workDate ? format(new Date(filmsInfo.workDate), 'MMM d, yyyy') : 'N/A'} />
                <DetailItem icon={<GanttChartSquare size={14}/>} label="Gantry Assigned" value={filmsInfo.gantry ? `Gantry ${filmsInfo.gantry}`: 'N/A'} />
                 {filmsInfo.notes && (
                    <div className="col-span-2">
                         <DetailItem icon={<CircleDot size={14}/>} label="Notes" value={filmsInfo.notes} />
                    </div>
                 )}
            </div>
        )}
    </div>
  )
}

function GantryStatusSection({ gantryHistory }: { gantryHistory: GantryReport[] }) {
    if (gantryHistory.length === 0) {
        return (
             <div>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-primary/90 flex items-center gap-2"><Factory size={16}/>Gantry Department</h4>
                    <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" /> No Entry</Badge>
                </div>
            </div>
        )
    }

    const latestEntry = gantryHistory[0];

    const getStageBadge = (stage: string) => {
        const completedStages = ["cured", "lamination", "lamination inspection", "move to cute"];
        const isCompleted = completedStages.some(s => stage.toLowerCase().includes(s));
        return (
             <Badge variant={isCompleted ? 'default' : 'outline'} className={isCompleted ? 'bg-green-600' : 'border-amber-500 text-amber-600'}>
                {isCompleted ? <CheckCircle className="mr-1 h-3 w-3"/> : <Hourglass className="mr-1 h-3 w-3"/>}
                {stage}
            </Badge>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-primary/90 flex items-center gap-2"><Factory size={16}/>Gantry Department</h4>
                {getStageBadge(latestEntry.molds?.[0]?.sails?.[0]?.stage_of_process || 'Unknown')}
            </div>
            {gantryHistory.map((entry, index) => (
              <div key={index} className="p-3 border rounded-md bg-background/50 mb-2">
                <div className="grid grid-cols-1 gap-y-3 text-sm">
                    <DetailItem icon={<Calendar size={14}/>} label="Date of Entry" value={format(new Date(entry.date), 'MMM d, yyyy')} />
                    <DetailItem icon={<GanttChartSquare size={14}/>} label="Gantry/Mold" value={entry.molds?.[0]?.mold_number || 'N/A'} />
                    <DetailItem icon={<CircleDot size={14}/>} label="Stage" value={entry.molds?.[0]?.sails?.[0]?.stage_of_process || 'N/A'} />
                    
                    {entry.molds?.[0]?.sails?.[0]?.issues && entry.molds[0].sails[0].issues !== "None" && (
                        <DetailItem icon={<AlertTriangle size={14} className="text-destructive"/>} label="Issues Reported" value={entry.molds[0].sails[0].issues} />
                    )}

                    {entry.molds?.[0]?.downtime_caused && (
                        <Badge variant="destructive" className="mt-1 w-fit">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Downtime Flagged
                        </Badge>
                    )}
                    
                    {entry.molds?.[0]?.images && entry.molds[0].images.length > 0 && (
                       <DetailItem 
                           icon={<ImageIcon size={14}/>} 
                           label="Visual Log" 
                           value={`${entry.molds[0].images.length} image(s) uploaded`} 
                       />
                    )}
                </div>
              </div>
            ))}
        </div>
    )
}

function QcInspectionSection({ qcInspection }: { qcInspection?: InspectionSubmission }) {
  if (!qcInspection) {
    return (
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-primary/90 flex items-center gap-2"><ShieldCheck size={16}/>QC Inspection</h4>
          <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" /> Not Inspected</Badge>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (qcInspection.status) {
      case 'Pass':
        return <Badge className="bg-green-600 text-white"><CheckCircle className="mr-1 h-3 w-3" /> {qcInspection.status}</Badge>;
      case 'Reinspection Required':
        return <Badge variant="destructive" className="bg-yellow-500"><AlertTriangle className="mr-1 h-3 w-3" /> {qcInspection.status}</Badge>;
      case 'Fail':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> {qcInspection.status}</Badge>;
      default:
        return <Badge variant="secondary">{qcInspection.status}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-primary/90 flex items-center gap-2"><ShieldCheck size={16}/>QC Inspection</h4>
        {getStatusBadge()}
      </div>
       <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pl-2">
          <DetailItem icon={<Calendar size={14}/>} label="Inspection Date" value={format(new Date(qcInspection.inspectionDate), 'MMM d, yyyy')} />
          <DetailItem icon={<User size={14}/>} label="Inspector" value={qcInspection.inspectorName} />
          <DetailItem icon={<CircleDot size={14}/>} label="Final Score" value={<span className="font-bold text-lg">{qcInspection.totalScore}</span>} />
      </div>
      {qcInspection.reinspection && (
         <div className="mt-2 p-2 bg-yellow-500/10 border-l-4 border-yellow-500 rounded">
            <DetailItem 
                icon={<AlertTriangle size={16} className="text-yellow-600"/>} 
                label={`Reinspection Outcome: ${qcInspection.reinspection.finalOutcome}`}
                value={qcInspection.reinspection.comments} 
            />
         </div>
      )}
    </div>
  );
}


export function SailStatusCard({ item }: SailStatusCardProps) {
  const { report, filmsInfo, gantryHistory, qcInspection, totalPanelsForSection, ...workItem } = item;
  const isCompleted = workItem.endOfShiftStatus === 'Completed';
  const { toast } = useToast();

  const handleExportPdf = async () => {
    toast({
        title: "Generating PDF...",
        description: "Your sail status report is being created.",
    });
    try {
        await generateSailStatusPdf(item);
    } catch(error) {
         console.error("PDF generation failed:", error);
         toast({
            title: "Error Generating PDF",
            description: "There was a problem creating the report.",
            variant: "destructive",
        });
    }
  }

  return (
    <Card className={cn("flex flex-col transition-all", isCompleted ? "border-green-200 bg-green-50/50 hover:border-green-300" : "border-amber-200 bg-amber-50/50 hover:border-amber-300")}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg font-bold">{workItem.oeNumber} - {workItem.section}</CardTitle>
                <div className="text-sm text-muted-foreground">
                    <Badge variant={workItem.nestedPanels && workItem.nestedPanels.length > 0 ? "default" : "secondary"}>
                        {workItem.nestedPanels && workItem.nestedPanels.length > 0 ? 'Nested Panels' : 'Individual Panels'}
                    </Badge>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportPdf}>
                <FileDown className="h-5 w-5" />
                <span className="sr-only">Export PDF</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        
         <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-primary/90 flex items-center gap-2"><User size={16}/>Tapeheads Department</h4>
                 <Badge variant={isCompleted ? "default" : "outline"} className={cn(isCompleted ? "bg-green-600" : "border-amber-500 text-amber-600")}>
                    {isCompleted ? <CheckCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                    {workItem.endOfShiftStatus}
                </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 pl-2">
                <DetailItem icon={<ClipboardList size={14}/>} label="Panels" value={`${workItem.panelsWorkedOn.length} of ${totalPanelsForSection}`} />
                <DetailItem icon={<Ruler size={14}/>} label="Total Meters" value={`${workItem.total_meters}m`} />
            </div>
        </div>

        <Separator />
        <FilmsStatusSection filmsInfo={filmsInfo} />
        <Separator />
        <GantryStatusSection gantryHistory={gantryHistory} />
        <Separator />
        <QcInspectionSection qcInspection={qcInspection} />
        
      </CardContent>
    </Card>
  );
}
