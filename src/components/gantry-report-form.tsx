
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form"
import * as z from "zod"
import { AlertCircle, PlusCircle, Trash2 } from "lucide-react"
import React from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "./image-upload"
import { Switch } from "./ui/switch"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { addGantryReport, type FilmsReport } from "@/lib/data-store"
import { useCollection, useFirebase, useMemoFirebase, useAuth as useFirebaseAuth, useFirestore } from "@/firebase"
import { collection, query } from "firebase/firestore"

const stageOfProcessOptions = [
    "RF Smart Mold Adjust", "Grid Base Film Installation", "Panel Installation", 
    "Tape Installation", "Iron Scarves", "Top Film Installation", "Supply Vacuum", 
    "Top Film Inspection", "Lamination", "Lamination Inspection", "Move to Cute"
];

const issueOptions = [
    "Creases", "Sail Damage", "Other Damage", "Debris", "Vacuum Issues", 
    "Lamination Issues", "Mold Shape Issues", "Panel Alignment Issues", "Other"
];

const moldNumberOptions = [
    "Gantry 4/MOLD 105",
    "Gantry 6/MOLD 109",
    "Gantry 6/MOLD 110",
    "Gantry 7/MOLD 111",
    "Gantry 8/MOLD 100",
];


const gantryReportSchema = z.object({
  report_date: z.date({ required_error: 'A date for the report is required.' }),
  shift: z.string({ required_error: 'Shift is required.' }),
  zone_leads: z.array(z.object({
    zone_number: z.string().min(1, "Zone is required."),
    lead_name: z.string().min(1, "Lead name is required."),
  })).min(1, "At least one zone lead is required."),
  personnel: z.array(z.object({
    employee_name: z.string().min(1, "Employee name is required."),
    start_time: z.string().min(1, "Start time is required."),
    end_time: z.string().min(1, "End time is required."),
  })).min(1, "At least one person is required."),
  personnel_exceptions: z.string().optional(),
  recognition: z.array(z.object({
    employee_name: z.string().min(1, "Employee name is required."),
    reason: z.string().optional(),
  })).optional(),
  molds: z.array(z.object({
    mold_number: z.string().min(1, "Mold number is required."),
    sails: z.array(z.object({
      sail_number: z.string().min(1, "Sail number is required."),
      stage_of_process: z.string().min(1, "Stage of process is required."),
      issue: z.string().min(1, "Issue is required"),
    })).min(1, "At least one sail is required."),
    images: z.any().optional(),
    downtime_caused: z.boolean().default(false),
    downtime_cause_description: z.string().optional(),
    downtime_duration_minutes: z.coerce.number().optional(),
    gantry_override_reason: z.string().optional(),
  })).min(1, "At least one mold is required."),
  maintenance: z.array(z.object({
    description: z.string().min(1, "Description is required."),
    duration_minutes: z.coerce.number().min(0, "Duration must be positive."),
    images: z.any().optional(),
  })).optional(),
  truck_runs: z.coerce.number().min(0, "Truck runs must be a positive number.").optional(),
});

type GantryReportFormValues = z.infer<typeof gantryReportSchema>;

const personnelDefaults = {
  "1": [
    { employee_name: "Michael", start_time: "06:00", end_time: "14:00" },
    { employee_name: "Andrew", start_time: "06:00", end_time: "14:00" },
    { employee_name: "Kevin", start_time: "06:00", end_time: "14:00" },
    { employee_name: "Jason", start_time: "06:00", end_time: "14:00" },
    { employee_name: "Lily", start_time: "06:00", end_time: "14:00" },
    { employee_name: "Olivia", start_time: "06:00", end_time: "14:00" },
    { employee_name: "Chris", start_time: "06:00", end_time: "14:00" },
    { employee_name: "Emma", start_time: "06:00", end_time: "14:00" },
  ],
  "2": [
    { employee_name: "David", start_time: "14:00", end_time: "22:00" },
    { employee_name: "Sophia", start_time: "14:00", end_time: "22:00" },
    { employee_name: "Daniel", start_time: "14:00", end_time: "22:00" },
    { employee_name: "Jacob", start_time: "14:00", end_time: "22:00" },
    { employee_name: "Grace", start_time: "14:00", end_time: "22:00" },
    { employee_name: "Ethan", start_time: "14:00", end_time: "22:00" },
    { employee_name: "Ava", start_time: "14:00", end_time: "22:00" },
    { employee_name: "Leo", start_time: "14:00", end_time: "22:00" },
  ],
  "3": [
    { employee_name: "Ryan", start_time: "22:00", end_time: "06:00" },
    { employee_name: "Mia", start_time: "22:00", end_time: "06:00" },
    { employee_name: "Lucas", start_time: "22:00", end_time: "06:00" },
    { employee_name: "Noah", start_time: "22:00", end_time: "06:00" },
    { employee_name: "Chloe", start_time: "22:00", end_time: "06:00" },
    { employee_name: "Jack", start_time: "22:00", end_time: "06:00" },
    { employee_name: "Ella", start_time: "22:00", end_time: "06:00" },
    { employee_name: "Aiden", start_time: "22:00", end_time: "06:00" },
  ],
};


const defaultValues: Partial<GantryReportFormValues> = {
  report_date: new Date(),
  shift: "1",
  zone_leads: [{ zone_number: "Zone 1", lead_name: "" }],
  personnel: personnelDefaults["1"],
  personnel_exceptions: "",
  recognition: [],
  molds: [{ mold_number: "", sails: [{ sail_number: "", stage_of_process: "", issue: "" }], images: [], downtime_caused: false }],
  maintenance: [],
  truck_runs: 0,
};

function Section({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function GantryReportForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const form = useForm<GantryReportFormValues>({
    resolver: zodResolver(gantryReportSchema),
    defaultValues,
    mode: "onBlur",
  });

  const { fields: zoneLeadFields, append: appendZoneLead, remove: removeZoneLead } = useFieldArray({ control: form.control, name: "zone_leads" });
  const { fields: personnelFields, append: appendPersonnel, remove: removePersonnel } = useFieldArray({ control: form.control, name: "personnel" });
  const { fields: recognitionFields, append: appendRecognition, remove: removeRecognition } = useFieldArray({ control: form.control, name: "recognition" });
  const { fields: moldFields, append: appendMold, remove: removeMold } = useFieldArray({ control: form.control, name: "molds" });
  const { fields: maintenanceFields, append: appendMaintenance, remove: removeMaintenance } = useFieldArray({ control: form.control, name: "maintenance" });
  
  const selectedShift = useWatch({ control: form.control, name: "shift" });

  React.useEffect(() => {
    if (selectedShift) {
        const defaultPersonnel = personnelDefaults[selectedShift as keyof typeof personnelDefaults] || [];
        form.setValue("personnel", defaultPersonnel);
    }
  }, [selectedShift, form]);


  async function onSubmit(values: GantryReportFormValues) {
    await addGantryReport(firestore, {
        ...values,
        report_date: values.report_date.toISOString(),
        date: values.report_date.toISOString(),
    });
    toast({
      title: "Gantry Report Submitted!",
      description: "Your detailed report has been successfully submitted.",
    });
    form.reset();
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Section title="Gantry Shift Report" description="Submit your shift report with production details and operational data.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField control={form.control} name="report_date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="shift" render={({ field }) => (<FormItem><FormLabel>Shift</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a shift" /></SelectTrigger></FormControl><SelectContent><SelectItem value="1">Shift 1</SelectItem><SelectItem value="2">Shift 2</SelectItem><SelectItem value="3">Shift 3</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
        </Section>
        
        <Section title="Zone Leads">
          <div className="space-y-4">
            {zoneLeadFields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative">
                <FormField control={form.control} name={`zone_leads.${index}.zone_number`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Zone #</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{[...Array(5)].map((_, i) => <SelectItem key={i} value={`Zone ${i+1}`}>Zone {i+1}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={`zone_leads.${index}.lead_name`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Lead Name</FormLabel><FormControl><Input placeholder="Lead name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeZoneLead(index)}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendZoneLead({ zone_number: 'Zone 1', lead_name: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Zone Lead</Button>
          </div>
        </Section>
        
        <Section title="Personnel">
          <div className="space-y-4">
            {personnelFields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative">
                <FormField control={form.control} name={`personnel.${index}.employee_name`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Employee Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={`personnel.${index}.start_time`} render={({ field }) => (<FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={`personnel.${index}.end_time`} render={({ field }) => (<FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removePersonnel(index)}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendPersonnel({ employee_name: '', start_time: '', end_time: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Personnel</Button>
            <FormField control={form.control} name="personnel_exceptions" render={({ field }) => (
                <FormItem className="pt-4"><FormLabel>Exceptions / Called Out Early / Left Early</FormLabel><FormControl><Textarea placeholder="Note any personnel exceptions here..." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
        </Section>
        
        <Section title="Atta Boy / Girl (Recognition)">
          <div className="space-y-4">
            {recognitionFields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative">
                <FormField control={form.control} name={`recognition.${index}.employee_name`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Employee Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={`recognition.${index}.reason`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Reason (Optional)</FormLabel><FormControl><Input placeholder="Reason for recognition" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeRecognition(index)}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendRecognition({ employee_name: '', reason: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Recognition</Button>
          </div>
        </Section>

        <Section title="Shift Productivity - Molds">
          <div className="space-y-6">
            {moldFields.map((moldField, moldIndex) => (
              <MoldField key={moldField.id} moldIndex={moldIndex} control={form.control} removeMold={removeMold} />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendMold({ mold_number: '', sails: [{ sail_number: '', stage_of_process: '', issue: '' }], images: [], downtime_caused: false })}><PlusCircle className="mr-2 h-4 w-4" />Add Mold</Button>
          </div>
        </Section>

        <Section title="Maintenance">
            <div className="space-y-4">
            {maintenanceFields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-4 p-4 border rounded-md relative">
                 <div className="flex items-end gap-4">
                    <FormField control={form.control} name={`maintenance.${index}.description`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Maintenance description" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`maintenance.${index}.duration_minutes`} render={({ field }) => (<FormItem><FormLabel>Duration (minutes)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeMaintenance(index)}><Trash2 className="size-4" /></Button>
                 </div>
                 <FormField
                    control={form.control}
                    name={`maintenance.${index}.images`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maintenance Visual Log</FormLabel>
                        <FormControl>
                          <ImageUpload 
                            value={field.value} 
                            onChange={field.onChange} 
                            maxFiles={5}
                            maxSize={5 * 1024 * 1024}
                            />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendMaintenance({ description: '', duration_minutes: 0, images:[] })}><PlusCircle className="mr-2 h-4 w-4" />Add Maintenance</Button>
          </div>
        </Section>
        
        <Section title="Truck Run Log">
             <FormField control={form.control} name="truck_runs" render={({ field }) => (
                <FormItem><FormLabel>Number of Truck Runs in This Shift</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
        </Section>

        <Button type="submit" size="lg" className="w-full">Submit Report</Button>
      </form>
    </Form>
  )
}

function MoldField({ moldIndex, control, removeMold }: { moldIndex: number, control: any, removeMold: (index: number) => void }) {
  const firestore = useFirestore();
  const { isUserLoading } = useFirebaseAuth();

  const filmsQuery = useMemoFirebase(() => {
    if (isUserLoading) return null;
    return query(collection(firestore, 'films_reports'))
  }, [firestore, isUserLoading]);
  const { data: filmsData, isLoading: isLoadingFilms } = useCollection<FilmsReport>(filmsQuery);

  const { fields: sailFields, append: appendSail, remove: removeSail } = useFieldArray({
    control,
    name: `molds.${moldIndex}.sails`
  });

  const downtimeCaused = useWatch({
      control,
      name: `molds.${moldIndex}.downtime_caused`,
  });

  const watchSails = useWatch({
    control,
    name: `molds.${moldIndex}.sails`
  });

  const watchMoldNumber = useWatch({
      control,
      name: `molds.${moldIndex}.mold_number`
  });
  
  const sailsReadyForGantry = React.useMemo(() => {
    if (!filmsData) return [];
    const finishedSails = filmsData.flatMap(report => report.sails_finished.map(sail => sail.sail_number));
    return [...new Set(finishedSails)]; // Return unique sail numbers
  }, [filmsData]);


  const gantryMismatch = React.useMemo(() => {
    if (!watchMoldNumber || !watchSails || !filmsData) return null;

    const getGantryNumberFromString = (str: string) => {
        const match = str.match(/Gantry\s*(\d+)/i);
        return match ? match[1] : null;
    };

    const selectedGantryNumber = getGantryNumberFromString(watchMoldNumber);
    if (!selectedGantryNumber) return null;

    for (const sail of watchSails) {
        if (!sail.sail_number) continue;
        const filmEntry = filmsData.find(f => f.sails_finished.some(s => s.sail_number === sail.sail_number));
        
        if (filmEntry && filmEntry.gantry_number && filmEntry.gantry_number !== selectedGantryNumber) {
            return {
                sailNumber: sail.sail_number,
                expected: filmEntry.gantry_number,
                actual: selectedGantryNumber
            };
        }
    }
    return null;
  }, [watchSails, watchMoldNumber, filmsData]);
  
  return (
    <Card className="p-4 bg-muted/30" key={`mold-${moldIndex}`}>
       <div className="flex items-center justify-between mb-4">
            <FormField
                control={control}
                name={`molds.${moldIndex}.mold_number`}
                render={({ field }) => (
                    <FormItem className="flex-1 max-w-sm">
                        <FormLabel>Mold Number</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a Gantry/MOLD"/>
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {moldNumberOptions.map(option => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeMold(moldIndex)}><Trash2 className="size-4" /></Button>
        </div>
        {gantryMismatch && (
            <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Gantry Mismatch Detected</AlertTitle>
                <AlertDescription className="space-y-3">
                    <p>
                        Sail <span className="font-bold">{gantryMismatch.sailNumber}</span> was assigned to Gantry <span className="font-bold">{gantryMismatch.expected}</span>, but you selected a mold on Gantry <span className="font-bold">{gantryMismatch.actual}</span>. Please provide a reason for this override below.
                    </p>
                    <FormField
                        control={control}
                        name={`molds.${moldIndex}.gantry_override_reason`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gantry Override Reason</FormLabel>
                                <FormControl><Textarea placeholder="Explain why the gantry is different from the one assigned by Films..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </AlertDescription>
            </Alert>
        )}
        <div className="space-y-4 pl-4 border-l-2 ml-2">
           <FormLabel>Sails</FormLabel>
           {sailFields.map((sailField, sailIndex) => (
               <div key={sailField.id} className="flex flex-col gap-2 p-2 border rounded-md relative bg-background">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField 
                        control={control} 
                        name={`molds.${moldIndex}.sails.${sailIndex}.sail_number`} 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Sail Number</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a finished sail..."/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {sailsReadyForGantry.map(sailNumber => (
                                            <SelectItem key={sailNumber} value={sailNumber}>{sailNumber}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />
                    <FormField control={control} name={`molds.${moldIndex}.sails.${sailIndex}.stage_of_process`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Stage of Process</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{stageOfProcessOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={control} name={`molds.${moldIndex}.sails.${sailIndex}.issue`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Issues</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{issueOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                   </div>
                   <Button type="button" variant="ghost" size="icon" className="text-destructive absolute top-1 right-1" onClick={() => removeSail(sailIndex)}><Trash2 className="size-4" /></Button>
               </div>
           ))}
           <Button type="button" variant="outline" size="sm" onClick={() => appendSail({ sail_number: '', stage_of_process: '', issue: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Sail</Button>
        </div>
        
        <div className="mt-6 space-y-4">
             <FormField
                control={control}
                name={`molds.${moldIndex}.images`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mold Visual Log</FormLabel>
                    <FormControl>
                      <ImageUpload 
                        value={field.value} 
                        onChange={field.onChange} 
                        maxFiles={5}
                        maxSize={5 * 1024 * 1024}
                        />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
            />
             <FormField
                control={control}
                name={`molds.${moldIndex}.downtime_caused`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="text-base font-normal">Downtime Caused?</FormLabel>
                  </FormItem>
                )}
              />
              {downtimeCaused && (
                  <Card className="p-4 space-y-4">
                      <FormField control={control} name={`molds.${moldIndex}.downtime_cause_description`} render={({ field }) => (<FormItem><FormLabel>Description of Downtime Cause</FormLabel><FormControl><Textarea {...field}/></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={control} name={`molds.${moldIndex}.downtime_duration_minutes`} render={({ field }) => (<FormItem><FormLabel>Downtime Duration (minutes)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </Card>
              )}
        </div>
    </Card>
  )
}

    
