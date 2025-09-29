
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { PlusCircle, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useFirestore } from "@/firebase"
import { addPreggerReport } from "@/lib/data-store"

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


const preggerReportSchema = z.object({
  report_date: z.date({ required_error: 'A date for the report is required.' }),
  shift: z.string({ required_error: 'Shift is required.' }),
  workCompleted: z.array(z.object({
    tape_id: z.string().min(1, "Tape ID is required."),
    meters: z.coerce.number().min(0),
    waste_meters: z.coerce.number().min(0),
    material_description: z.string().min(1, "Description is required."),
  })).min(1, "At least one work item is required."),
  personnel: z.array(z.object({
    name: z.string().min(1, "Name is required."),
    start_time: z.string().min(1, "Start time is required."),
    end_time: z.string().min(1, "End time is required."),
  })).min(1, "At least one person is required."),
  downtime: z.array(z.object({
    reason: z.string().min(1, "Reason is required."),
    duration_minutes: z.coerce.number().min(0),
  })).optional(),
  briefing_items: z.string().optional(),
  current_work: z.string().optional(),
  operational_problems: z.string().optional(),
  personnel_notes: z.string().optional(),
  bonding_complete: z.boolean().default(false),
  epa_report: z.boolean().default(false),
  end_of_shift_checklist: z.boolean().default(false),
  images: z.any().optional(),
});

type PreggerReportFormValues = z.infer<typeof preggerReportSchema>;

const defaultValues: PreggerReportFormValues = {
  report_date: new Date(),
  shift: "1",
  workCompleted: [{ tape_id: "", meters: 0, waste_meters: 0, material_description: "" }],
  personnel: [{ name: "", start_time: "", end_time: "" }],
  downtime: [],
  briefing_items: "",
  current_work: "",
  operational_problems: "",
  personnel_notes: "",
  bonding_complete: false,
  epa_report: false,
  end_of_shift_checklist: false,
};

function SectionHeader({ title, description }: { title: string, description?: string }) {
  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

export function PreggerReportForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const form = useForm<PreggerReportFormValues>({
    resolver: zodResolver(preggerReportSchema),
    defaultValues,
  });

  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({
    control: form.control,
    name: "workCompleted",
  });

  const { fields: personnelFields, append: appendPersonnel, remove: removePersonnel } = useFieldArray({
    control: form.control,
    name: "personnel",
  });

  const { fields: downtimeFields, append: appendDowntime, remove: removeDowntime } = useFieldArray({
    control: form.control,
    name: "downtime",
  });


  async function onSubmit(values: PreggerReportFormValues) {
    await addPreggerReport(firestore, {
        ...values,
        report_date: values.report_date.toISOString(),
    });

    toast({
      title: "Pregger Report Submitted!",
      description: "Your detailed report has been successfully submitted.",
    });
    form.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Pregger Shift Report</CardTitle>
        <CardDescription>Fill out the comprehensive details for your shift.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FormField control={form.control} name="report_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Date</FormLabel>
                    <FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              <FormField control={form.control} name="shift" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a shift" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="1">Shift 1</SelectItem>
                        <SelectItem value="2">Shift 2</SelectItem>
                        <SelectItem value="3">Shift 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
            </div>

            <Separator />
            <SectionHeader title="Work Completed" description="Add each distinct work item completed during the shift."/>
            <div className="space-y-4">
              {workFields.map((field, index) => (
                <Card key={field.id} className="p-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField control={form.control} name={`workCompleted.${index}.tape_id`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tape ID</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Tape ID" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {tapeIds.map((id, idx) => <SelectItem key={`${id}-${idx}`} value={id}>{id}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    <FormField control={form.control} name={`workCompleted.${index}.meters`} render={({ field }) => (
                        <FormItem><FormLabel>Meters</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                    <FormField control={form.control} name={`workCompleted.${index}.waste_meters`} render={({ field }) => (
                        <FormItem><FormLabel>Waste (m)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                    <FormField control={form.control} name={`workCompleted.${index}.material_description`} render={({ field }) => (
                        <FormItem><FormLabel>Material Desc.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeWork(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendWork({ tape_id: '', meters: 0, waste_meters: 0, material_description: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Work Item
              </Button>
            </div>

            <Separator />
            <SectionHeader title="Personnel" description="Log all personnel who worked on this shift."/>
            <div className="space-y-4">
               {personnelFields.map((field, index) => (
                <Card key={field.id} className="p-4 relative">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name={`personnel.${index}.name`} render={({ field }) => (
                          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                       <FormField control={form.control} name={`personnel.${index}.start_time`} render={({ field }) => (
                          <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name={`personnel.${index}.end_time`} render={({ field }) => (
                          <FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                   </div>
                   <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removePersonnel(index)}>
                     <Trash2 className="size-4" />
                   </Button>
                 </Card>
               ))}
               <Button type="button" variant="outline" size="sm" onClick={() => appendPersonnel({ name: '', start_time: '', end_time: '' })}>
                 <PlusCircle className="mr-2 h-4 w-4" /> Add Person
               </Button>
             </div>

            <Separator />
            <SectionHeader title="Downtime" description="Record any periods of downtime."/>
            <div className="space-y-4">
              {downtimeFields.map((field, index) => (
                <Card key={field.id} className="p-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name={`downtime.${index}.reason`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="mechanical">Mechanical</SelectItem>
                              <SelectItem value="electrical">Electrical</SelectItem>
                              <SelectItem value="material">Material Shortage</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    <FormField control={form.control} name={`downtime.${index}.duration_minutes`} render={({ field }) => (
                        <FormItem><FormLabel>Duration (minutes)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeDowntime(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendDowntime({ reason: '', duration_minutes: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Downtime
              </Button>
            </div>

            <Separator />
            <SectionHeader title="Additional Notes" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField control={form.control} name="briefing_items" render={({ field }) => (<FormItem><FormLabel>Briefing Items</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="current_work" render={({ field }) => (<FormItem><FormLabel>Current Work</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="operational_problems" render={({ field }) => (<FormItem><FormLabel>Operational Problems</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="personnel_notes" render={({ field }) => (<FormItem><FormLabel>Personnel Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <Separator />
            <SectionHeader title="Checklist & Visuals" />
            <div className="space-y-4">
                <FormField control={form.control} name="bonding_complete" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Bonding Complete</FormLabel></FormItem>)} />
                <FormField control={form.control} name="epa_report" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>EPA Report</FormLabel></FormItem>)} />
                <FormField control={form.control} name="end_of_shift_checklist" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>End of Shift Checklist Complete</FormLabel></FormItem>)} />
            </div>
             <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visual Log</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input type="file" multiple accept="image/*" className="pl-12" onChange={(e) => field.onChange(e.target.files)} />
                             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Upload className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                    </FormControl>
                    <FormDescription>Upload up to 10 images (max 5MB each).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <Button type="submit">Submit Report</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
