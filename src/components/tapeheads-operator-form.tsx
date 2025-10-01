
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PlusCircle, Trash2 } from "lucide-react"
import { Checkbox } from "./ui/checkbox"
import { Separator } from "./ui/separator"
import React, { useEffect, useMemo, useState } from "react"
import { MultiSelect, MultiSelectOption } from "./ui/multi-select"
import { useRouter } from "next/navigation"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { addTapeheadsSubmission, updateTapeheadsSubmission, markPanelsAsCompleted } from "@/lib/data-store"
import type { Report, WorkItem, OeJob, OeSection } from "@/lib/data-store"
import { useCollection, useFirebase, useMemoFirebase, useAuth as useFirebaseAuth } from "@/firebase"
import { collection, query } from "firebase/firestore"

const tapeIdsList = [
    "928108", "938108", "938108T", "928128", "938128", "938128T", "*938138*",
    "938148", "928107", "938107", "928127", "938127", "938147", "938167",
    "926107", "936107", "926117", "936117", "936137", "936157", "936176",
    "926107Y", "936107Y", "926117Y", "936117Y", "936137Y", "936157Y", "936176Y",
    "937130", "937108", "937108BLK", "937148", "937108Y", "937148Y", "937152",
    "935100", "935120", "935121", "935148", "935148Y", "935169", "930505",
    "930515", "930535", "931010", "931011", "931013", "935000", "935001",
    "935003", "935030", "935031", "935033", "935603", "935621", "935623",
    "935648", "935667", "936606", "936607", "936608", "936617", "936618",
    "936607Y", "936617Y", "938608", "*938638*", "938608W", "GPFL50D-30H",
    "GPFL50D-40H", "GPFL50D-50H", "GPFL50D-70H", "GPFL50D-95H", "GPFL50D-125H",
    "0", "937630", "937130"
];
const tapeIds = [...new Set(tapeIdsList)];


const problemSchema = z.object({
  problem_reason: z.string().min(1, "Problem reason is required."),
  duration_minutes: z.coerce.number().optional(),
});

const tapeUsageSchema = z.object({
  tapeId: z.string().min(1, "Tape ID is required."),
  metersProduced: z.coerce.number().min(0, "Meters must be positive."),
  metersWasted: z.coerce.number().min(0, "Meters must be positive."),
});

const workItemSchema = z.object({
  oeNumber: z.string().min(1, "OE Number is required."),
  section: z.string().min(1, "Sail # is required."),
  endOfShiftStatus: z.string().min(1, "Status is required."),
  layer: z.string().optional(),
  tapes: z.array(tapeUsageSchema).min(1, "At least one tape must be logged."),
  hadSpinOut: z.boolean().default(false),
  spinOuts: z.coerce.number().optional(),
  spinOutDuration: z.coerce.number().optional(),
  problems: z.array(problemSchema).optional(),
  panelWorkType: z.enum(["individual", "nested"]).default("individual"),
  panelsWorkedOn: z.array(z.string()).min(1, "At least one panel must be selected."),
  nestedPanels: z.array(z.string()).optional(),
});


const tapeheadsOperatorSchema = z.object({
  date: z.date(),
  shift: z.string().min(1),
  shiftLeadName: z.string().min(1, "Shift lead name is required."),
  thNumber: z.string().min(1, "TH Number is required."),
  operatorName: z.string().min(1, "Operator name is required."),

  shiftStartTime: z.string().min(1, "Start time is required."),
  shiftEndTime: z.string().min(1, "End time is required."),
  hoursWorked: z.coerce.number().optional(),
  metersPerManHour: z.coerce.number().optional(),

  workItems: z.array(workItemSchema).min(1, "At least one work item must be added."),

  checklist: z.object({
    smoothFuseFull: z.boolean().default(false),
    bladesGlasses: z.boolean().default(false),
    paperworkUpToDate: z.boolean().default(false),
    debriefNewOperator: z.boolean().default(false),
    electricScissor: z.boolean().default(false),
    tubesAtEndOfTable: z.boolean().default(false),
    sprayTracksOnBridge: z.boolean().default(false),
    sharpiePens: z.boolean().default(false),
    broom: z.boolean().default(false),
    cleanedWorkStation: z.boolean().default(false),
    meterStickTwoIrons: z.boolean().default(false),
    thIsleTrashEmpty: z.boolean().default(false),
  })
});

type OperatorFormValues = z.infer<typeof tapeheadsOperatorSchema>;

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      {children}
      <Separator />
    </div>
  )
}

const checklistItems = [
    { id: 'smoothFuseFull', label: 'Smooth Fuse Full' },
    { id: 'bladesGlasses', label: 'Blades Glasses' },
    { id: 'paperworkUpToDate', label: 'Paperwork Up to Date' },
    { id: 'debriefNewOperator', label: 'Debrief New Operator' },
    { id: 'electricScissor', label: 'Electric Scissor' },
    { id: 'tubesAtEndOfTable', label: 'Tubes at End of Table' },
    { id: 'sprayTracksOnBridge', label: 'Spray Tracks on Bridge' },
    { id: 'sharpiePens', label: 'Sharpie Pens' },
    { id: 'broom', label: 'Broom' },
    { id: 'cleanedWorkStation', label: 'Cleaned Work Station' },
    { id: 'meterStickTwoIrons', label: 'Meter Stick / Two Irons' },
    { id: 'thIsleTrashEmpty', label: 'TH Isle Trash Empty' },
] as const;

interface TapeheadsOperatorFormProps {
  reportToEdit?: Report;
  onFormSubmit?: (report: Report) => void;
  onCancel?: () => void;
}


export function TapeheadsOperatorForm({ reportToEdit, onFormSubmit }: TapeheadsOperatorFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { firestore } = useFirebase();
  const { isUserLoading } = useFirebaseAuth();

  const jobsQuery = useMemoFirebase(() => query(collection(firestore, 'jobs')), []);
  const { data: oeJobs, isLoading: isLoadingJobs } = useCollection<OeJob>(jobsQuery);
  
  const isEditMode = !!reportToEdit;

  const defaultValues = useMemo(() => {
    if (!reportToEdit) {
      return {
          date: new Date(),
          shift: "1",
          shiftLeadName: "",
          thNumber: "",
          operatorName: "",
          shiftStartTime: "",
          shiftEndTime: "",
          workItems: [],
          checklist: checklistItems.reduce((acc, item) => ({...acc, [item.id]: false}), {})
      };
    }
    
    // Map from Report structure to form structure
    const workItems = (reportToEdit.workItems || []).map(item => ({
        oeNumber: item.oeNumber,
        section: item.section,
        endOfShiftStatus: item.endOfShiftStatus,
        layer: item.layer,
        tapes: item.tapes || [],
        hadSpinOut: item.had_spin_out,
        spinOuts: item.spin_outs,
        spinOutDuration: item.spin_out_duration_minutes,
        problems: item.issues,
        panelWorkType: item.nestedPanels && item.nestedPanels.length > 0 ? 'nested' : 'individual',
        panelsWorkedOn: item.panelsWorkedOn,
        nestedPanels: item.nestedPanels
    }));


    return {
      ...reportToEdit,
      date: new Date(reportToEdit.date),
      shift: String(reportToEdit.shift),
      workItems: workItems,
    };
  }, [reportToEdit]);


  const form = useForm<OperatorFormValues>({
    resolver: zodResolver(tapeheadsOperatorSchema),
    defaultValues: defaultValues,
    mode: "onBlur",
  });

  const { fields: workItemFields, append: appendWorkItem, remove: removeWorkItem } = useFieldArray({ control: form.control, name: "workItems" });

  const watchStartTime = useWatch({ control: form.control, name: "shiftStartTime" });
  const watchEndTime = useWatch({ control: form.control, name: "shiftEndTime" });
  const watchWorkItems = useWatch({ control: form.control, name: "workItems" });

  useEffect(() => {
    // Check for takeover state on component mount
    if (typeof window !== 'undefined') {
        const takeoverStateJSON = localStorage.getItem('tapeheadsTakeoverState');
        if (takeoverStateJSON) {
            const takeoverState = JSON.parse(takeoverStateJSON);
            const { report, workItemToContinue } = takeoverState;

            // Populate the form with data from the takeover state
            form.reset({
                date: new Date(), // Set to current date for the new shift
                shift: "1", // Or prompt for new shift
                shiftLeadName: report.shiftLeadName, // Keep lead name or clear
                thNumber: report.thNumber,
                operatorName: "", // Clear for new operator
                shiftStartTime: "", // Clear for new operator
                shiftEndTime: "", // Clear for new operator
                workItems: [{
                    ...workItemToContinue,
                    hadSpinOut: workItemToContinue.had_spin_out,
                    spinOuts: workItemToContinue.spin_outs,
                    spinOutDuration: workItemToContinue.spin_out_duration_minutes,
                    problems: workItemToContinue.issues,
                    panelWorkType: workItemToContinue.nestedPanels && workItemToContinue.nestedPanels.length > 0 ? 'nested' : 'individual',
                }],
                checklist: checklistItems.reduce((acc, item) => ({...acc, [item.id]: false}), {})
            });

            // Clear the state from localStorage so it's not reused
            localStorage.removeItem('tapeheadsTakeoverState');

            toast({
                title: "Taking Over Task",
                description: `Continuing work on ${workItemToContinue.oeNumber}-${workItemToContinue.section}. Please enter your details.`,
            });
        }
    }
  }, [form, toast]);


  useEffect(() => {
    if (reportToEdit) {
      form.reset(defaultValues as OperatorFormValues);
    }
  }, [reportToEdit, form, defaultValues]);
  
  const totalMetersProduced = useMemo(() => {
    return (watchWorkItems || []).reduce((sum, item) => {
        const itemTotal = (item.tapes || []).reduce((tapeSum, tape) => tapeSum + (tape.metersProduced || 0), 0);
        return sum + itemTotal;
    }, 0);
  }, [watchWorkItems]);

  useEffect(() => {
    if (watchStartTime && watchEndTime) {
      const start = new Date(`1970-01-01T${watchStartTime}:00`);
      let end = new Date(`1970-01-01T${watchEndTime}:00`);
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }
      const diffMs = end.getTime() - start.getTime();
      const hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(1));
      form.setValue("hoursWorked", hours);

      if (hours > 0 && totalMetersProduced > 0) {
        form.setValue("metersPerManHour", parseFloat((totalMetersProduced / hours).toFixed(1)));
      } else {
        form.setValue("metersPerManHour", 0);
      }
    }
  }, [watchStartTime, watchEndTime, totalMetersProduced, form]);
  
  async function onSubmit(values: OperatorFormValues) {
    // Logic to update panel statuses
    for (const item of values.workItems) {
        if (item.endOfShiftStatus === 'Completed') {
            await markPanelsAsCompleted(firestore, item.oeNumber, item.section, item.panelsWorkedOn);
        }
    }

    const reportData: Report = {
        id: reportToEdit?.id || `rpt_${Date.now()}`,
        date: values.date,
        shift: parseInt(values.shift, 10) as 1 | 2 | 3,
        shiftLeadName: values.shiftLeadName,
        thNumber: values.thNumber,
        operatorName: values.operatorName,
        shiftStartTime: values.shiftStartTime,
        shiftEndTime: values.shiftEndTime,
        hoursWorked: values.hoursWorked,
        metersPerManHour: values.metersPerManHour,
        workItems: values.workItems.map(item => {
            const totalMeters = (item.tapes || []).reduce((sum, tape) => sum + tape.metersProduced, 0);
            return {
                oeNumber: item.oeNumber,
                section: item.section,
                endOfShiftStatus: item.endOfShiftStatus as 'Completed' | 'In Progress',
                layer: item.layer,
                tapes: item.tapes,
                total_meters: totalMeters,
                total_tapes: (item.tapes || []).length,
                had_spin_out: item.hadSpinOut,
                spin_outs: item.spinOuts,
                spin_out_duration_minutes: item.spinOutDuration,
                issues: item.problems,
                panelsWorkedOn: item.panelsWorkedOn,
                nestedPanels: item.nestedPanels,
            }
        }),
        checklist: values.checklist,
        status: 'Submitted',
        total_meters: (values.workItems || []).reduce((sum, item) => {
            const itemTotal = (item.tapes || []).reduce((tapeSum, tape) => tapeSum + (tape.metersProduced || 0), 0);
            return sum + itemTotal;
        }, 0),
    };
    
    if (onFormSubmit) {
      await updateTapeheadsSubmission(firestore, reportData as Report);
      onFormSubmit(reportData as Report);
    } else {
      await addTapeheadsSubmission(firestore, reportData as Report);
      router.push('/report/tapeheads');
    }

    toast({
      title: isEditMode ? "Report Updated!" : "Operator Work Submitted!",
      description: `Your entry for ${values.operatorName} has been ${isEditMode ? 'updated' : 'recorded'}.`,
    });
  }
  
  if (isLoadingJobs || isUserLoading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
       {!isEditMode && (
          <CardHeader>
            <CardTitle>Operator Work Entry</CardTitle>
            <CardDescription>Log your detailed work for this OE section.</CardDescription>
          </CardHeader>
        )}
      <CardContent className={isEditMode ? "pt-6" : ""}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Section title="Shift Details">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="shift" render={({ field }) => (<FormItem><FormLabel>Shift</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="1">Shift 1</SelectItem><SelectItem value="2">Shift 2</SelectItem><SelectItem value="3">Shift 3</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="shiftLeadName" render={({ field }) => (<FormItem><FormLabel>Shift Lead Name</FormLabel><FormControl><Input placeholder="Lead's name" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </Section>

            <Section title="Operator Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="thNumber" render={({ field }) => (<FormItem><FormLabel>TH Number</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select TH..." /></SelectTrigger></FormControl><SelectContent>
                    <SelectItem value="TH-1">TH-1</SelectItem>
                    <SelectItem value="TH-2">TH-2</SelectItem>
                    <SelectItem value="TH-4">TH-4</SelectItem>
                    <SelectItem value="TH-5">TH-5</SelectItem>
                    <SelectItem value="TH-7">TH-7</SelectItem>
                  </SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="operatorName" render={({ field }) => (<FormItem><FormLabel>Operator Name</FormLabel><FormControl><Input placeholder="Your name" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </Section>
            
            <Section title="Time Tracking">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="shiftStartTime" render={({ field }) => (<FormItem><FormLabel>Shift Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="shiftEndTime" render={({ field }) => (<FormItem><FormLabel>Shift End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="hoursWorked" render={({ field }) => (<FormItem><FormLabel>Hours Worked</FormLabel><FormControl><Input type="number" {...field} readOnly className="bg-muted/70" /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="metersPerManHour" render={({ field }) => (<FormItem><FormLabel>Meters/Man-Hour</FormLabel><FormControl><Input type="number" {...field} readOnly className="bg-muted/70" /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                 </div>
              </Section>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-primary">Work Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendWorkItem({ oeNumber: '', section: '', endOfShiftStatus: 'Completed', tapes: [], panelsWorkedOn: [], panelWorkType: 'individual', nestedPanels: [], hadSpinOut: false, spinOutDuration: 0, problems: [] })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Work Item
                  </Button>
                </div>
                 {form.formState.errors.workItems && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.workItems.message}</p>
                 )}
                <div className="space-y-4">
                  {workItemFields.map((field, index) => (
                    <WorkItemCard key={field.id} index={index} remove={removeWorkItem} control={form.control} isEditMode={isEditMode} oeJobs={oeJobs || []} />
                  ))}
                </div>
              </div>

              <Section title="End-of-Shift Checklist">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {checklistItems.map(item => (
                           <FormField key={item.id} control={form.control} name={`checklist.${item.id}`} render={({ field }) => (
                              <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>{item.label}</FormLabel></FormItem>
                           )}/>
                      ))}
                  </div>
              </Section>

              <div className="flex justify-end">
                  <Button type="submit" size="lg">{isEditMode ? "Save Changes" : "Submit Operator Entry"}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
    </Card>
  )
}

function WorkItemCard({ index, remove, control, isEditMode, oeJobs }: { index: number, remove: (index: number) => void, control: any, isEditMode: boolean, oeJobs: OeJob[] }) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { isUserLoading } = useFirebaseAuth();
  
  const submissionsQuery = useMemoFirebase(() => isUserLoading ? null : query(collection(firestore, 'tapeheads-submissions')), [firestore, isUserLoading]);
  const { data: allSubmissions, isLoading: isLoadingSubmissions } = useCollection<Report>(submissionsQuery);

  const watchOeNumber = useWatch({ control, name: `workItems.${index}.oeNumber` });
  const watchSection = useWatch({ control, name: `workItems.${index}.section` });
  const watchPanelsWorkedOn = useWatch({ control, name: `workItems.${index}.panelsWorkedOn` });
  const watchPanelWorkType = useWatch({ control, name: `workItems.${index}.panelWorkType`});
  const watchStatus = useWatch({ control, name: `workItems.${index}.endOfShiftStatus` });
  const watchHadSpinout = useWatch({ control, name: `workItems.${index}.hadSpinOut` });
  
  const { fields: tapeFields, append: appendTape, remove: removeTape } = useFieldArray({ control: control, name: `workItems.${index}.tapes` });
  const { fields: problemFields, append: appendProblem, remove: removeProblem } = useFieldArray({ control: control, name: `workItems.${index}.problems` });
  const { fields: nestedPanelFields, append: appendNestedPanel, remove: removeNestedPanel } = useFieldArray({ control: control, name: `workItems.${index}.nestedPanels` });

  useEffect(() => {
    if (isLoadingSubmissions || !watchOeNumber || !watchSection || !watchPanelsWorkedOn || watchPanelsWorkedOn.length === 0 || isEditMode) {
      return;
    }

    const isPanelInProgress = (allSubmissions || []).some(report =>
      report.workItems?.some(item => {
        if (item.oeNumber !== watchOeNumber || item.section !== watchSection || item.endOfShiftStatus !== 'In Progress') {
          return false;
        }
        // Check for intersection of panels
        const inProgressPanels = item.panelsWorkedOn || [];
        const selectedPanels = watchPanelsWorkedOn || [];
        return selectedPanels.some(p => inProgressPanels.includes(p));
      })
    );

    if (isPanelInProgress) {
      toast({
        title: "Work In Progress",
        description: `One or more selected panels are already in progress. Check the dashboard to 'Take Over'.`,
        variant: "destructive",
      });
    }
  }, [watchOeNumber, watchSection, watchPanelsWorkedOn, toast, isEditMode, allSubmissions, isLoadingSubmissions]);
  
  const availableOes = useMemo(() => oeJobs ? [...new Set(oeJobs.map(j => j.oeBase))] : [], [oeJobs]);
  
  const availableSails = useMemo(() => watchOeNumber && oeJobs ? (oeJobs.find(j => j.oeBase === watchOeNumber)?.sections.map(s => s.sectionId) || []) : [], [watchOeNumber, oeJobs]);
  
  const panelOptions = useMemo(() => {
      if (!watchOeNumber || !watchSection || !oeJobs) return [];
      const job = oeJobs.find(j => j.oeBase === watchOeNumber);
      const sail = job?.sections.find(s => s.sectionId === watchSection);
      if (!sail) return [];
      
      const options: MultiSelectOption[] = [];
      const completedPanels = sail.completedPanels || [];

      for (let i = sail.panelStart; i <= sail.panelEnd; i++) {
          const panelId = `P${i}`;
          if (!completedPanels.includes(panelId)) {
            options.push({ value: panelId, label: panelId });
          }
      }
      return options;
  }, [watchOeNumber, watchSection, oeJobs]);

  return (
    <Card className="bg-muted/30 p-4 relative">
       <Button type="button" variant="ghost" size="icon" className="text-destructive absolute top-2 right-2" onClick={() => remove(index)}><Trash2 className="size-4" /></Button>
      <div className="space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField control={control} name={`workItems.${index}.oeNumber`} render={({ field }) => (<FormItem><FormLabel>OE Number</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an OE..." /></SelectTrigger></FormControl><SelectContent>{availableOes.map(oe => <SelectItem key={oe} value={oe}>{oe}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
             <FormField control={control} name={`workItems.${index}.section`} render={({ field }) => (<FormItem><FormLabel>Sail #</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!watchOeNumber}><FormControl><SelectTrigger><SelectValue placeholder="Select a Sail #" /></SelectTrigger></FormControl><SelectContent>{(availableSails || []).map(sailId => <SelectItem key={sailId} value={sailId}>{sailId}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
            <FormField control={control} name={`workItems.${index}.panelWorkType`} render={({ field }) => (
                <FormItem className="space-y-3"><FormLabel>Work Type</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="individual" /></FormControl><FormLabel className="font-normal">Individual</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="nested" /></FormControl><FormLabel className="font-normal">Nested</FormLabel></FormItem>
                </RadioGroup></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name={`workItems.${index}.panelsWorkedOn`} render={({ field }) => {
                const handleIndividualChange = (value: string) => field.onChange(value ? [value] : []);
                return <FormItem><FormLabel>Panels Worked On</FormLabel>{watchPanelWorkType === 'nested' ? <MultiSelect options={panelOptions} selected={field.value || []} onChange={field.onChange} placeholder="Select panels..." /> : <Select onValueChange={handleIndividualChange} value={field.value?.[0] || ""} disabled={panelOptions.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={panelOptions.length > 0 ? "Select a panel" : "All panels complete"} /></SelectTrigger></FormControl><SelectContent>{panelOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>}<FormMessage /></FormItem>
            }}/>
        </div>
         {watchPanelWorkType === 'nested' && (
            <div className="space-y-2 pt-4 border-t"><FormLabel>Nested Panel Details</FormLabel>
                {nestedPanelFields.map((field: any, nestedIndex: number) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <FormField control={control} name={`workItems.${index}.nestedPanels.${nestedIndex}`} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="e.g. P1a, P2b..." />} />
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeNestedPanel(nestedIndex)}><Trash2 className="size-4" /></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendNestedPanel('')}><PlusCircle className="mr-2 h-4 w-4"/>Add Nested Panel</Button>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <FormField control={control} name={`workItems.${index}.endOfShiftStatus`} render={({ field }) => (<FormItem><FormLabel>End of Shift Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Completed">Completed</SelectItem><SelectItem value="In Progress">In Progress</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            {watchStatus === "In Progress" && (
                 <FormField control={control} name={`workItems.${index}.layer`} render={({ field }) => (<FormItem><FormLabel>Layer</FormLabel><FormControl><Input placeholder="e.g., 5 of 12" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)} />
            )}
        </div>
        
        <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
                <FormLabel>Tape Usage</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => appendTape({ tapeId: '', metersProduced: 0, metersWasted: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Tape</Button>
            </div>
            {tapeFields.map((field: any, tapeIndex: number) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-2 border rounded-md">
                    <FormField control={control} name={`workItems.${index}.tapes.${tapeIndex}.tapeId`} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel className="text-xs">Tape ID</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Tape ID..."/></SelectTrigger></FormControl><SelectContent>{tapeIds.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    <FormField control={control} name={`workItems.${index}.tapes.${tapeIndex}.metersProduced`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Meters Produced</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={control} name={`workItems.${index}.tapes.${tapeIndex}.metersWasted`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Meters Wasted</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive md:hidden" onClick={() => removeTape(tapeIndex)}><Trash2 className="size-4"/></Button>
                </div>
            ))}
        </div>

          <div className="space-y-4 pt-4 border-t">
              <FormField control={control} name={`workItems.${index}.hadSpinOut`} render={({ field }) => (<FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Had Spin Out?</FormLabel></FormItem>)} />
              {watchHadSpinout && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={control} name={`workItems.${index}.spinOuts`} render={({ field }) => (<FormItem><FormLabel># of Spin-outs</FormLabel><FormControl><Input type="number" placeholder="1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={control} name={`workItems.${index}.spinOutDuration`} render={({ field }) => (<FormItem><FormLabel>Spin Out Duration (minutes)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
              )}
              <h4 className="font-medium pt-2">Problems</h4>
              {problemFields.map((field: any, problemIndex: number) => (
                  <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md">
                      <FormField control={control} name={`workItems.${index}.problems.${problemIndex}.problem_reason`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Problem Reason</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={control} name={`workItems.${index}.problems.${problemIndex}.duration_minutes`} render={({ field }) => (<FormItem><FormLabel>Duration (min)</FormLabel><FormControl><Input type="number" value={field.value ?? ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeProblem(problemIndex)}><Trash2 className="size-4" /></Button>
                  </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendProblem({ problem_reason: '', duration_minutes: 0 })}><PlusCircle className="mr-2 h-4 w-4"/>Add Problem</Button>
          </div>
      </div>
    </Card>
  );
}
