
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import * as z from "zod"
import { PlusCircle, Trash2 } from "lucide-react"

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
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { Separator } from "./ui/separator"
import { addFilmsReport } from "@/lib/data-store"
import { formatISO } from "date-fns"
import { useFirestore } from "@/firebase"

const sailEntrySchema = z.object({
  sail_number: z.string().min(1, "Sail# is required."),
  comments: z.string().optional(),
});

const personnelEntrySchema = z.object({
  name: z.string().min(1, "Name is required."),
  start_time: z.string().min(1, "Start time is required."),
  end_time: z.string().min(1, "End time is required."),
  task: z.string().optional(),
});

const filmsReportSchema = z.object({
  report_date: z.date({ required_error: 'A date for the report is required.' }),
  gantry_mold_number: z.string().min(1, "Gantry/Mold selection is required."),
  sails_started: z.array(sailEntrySchema).optional(),
  sails_finished: z.array(sailEntrySchema).optional(),
  had_downtime: z.boolean().default(false),
  downtime: z.object({
    reason: z.string(),
    duration: z.coerce.number(),
  }).optional(),
  personnel: z.array(personnelEntrySchema).min(1, "At least one person is required."),
}).refine(data => {
    if (data.had_downtime) {
        return !!data.downtime && !!data.downtime.reason && data.downtime.duration > 0;
    }
    return true;
}, {
    message: "Downtime reason and duration are required when downtime is checked.",
    path: ["downtime"],
});

type FilmsReportFormValues = z.infer<typeof filmsReportSchema>;

const moldNumberOptions = [
    "Gantry 4/MOLD 105",
    "Gantry 6/MOLD 109",
    "Gantry 6/MOLD 110",
    "Gantry 7/MOLD 111",
    "Gantry 8/MOLD 100",
];

const downtimeReasons = [
    "Machine Breakdown",
    "Startup/Shutdown",
    "Film Roll Change",
    "Planned Downtime",
];

const defaultPersonnel = [
    { name: "Patricia", start_time: "06:00", end_time: "14:00", task: "cutting files" },
    { name: "Kathy", start_time: "06:00", end_time: "12:00", task: "taping" },
    { name: "Maribel", start_time: "06:00", end_time: "12:00", task: "taping" },
    { name: "Stephanie", start_time: "", end_time: "", task: "out" },
    { name: "Leslie N.", start_time: "", end_time: "", task: "out" },
];

const defaultValues: Partial<FilmsReportFormValues> = {
  report_date: new Date(),
  gantry_mold_number: "",
  sails_started: [],
  sails_finished: [],
  had_downtime: false,
  downtime: {
    reason: "",
    duration: 0,
  },
  personnel: defaultPersonnel,
};


function SailListSection({
  title,
  fields,
  append,
  remove,
  control,
  name
}: {
  title: string,
  fields: any[],
  append: (data: any) => void,
  remove: (index: number) => void,
  control: any,
  name: "sails_started" | "sails_finished"
}) {
  return (
    <Card className="bg-muted/40">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ sail_number: '', comments: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" />Add Sail
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-3 p-3 border rounded-md bg-background">
            <div className="grid gap-2 flex-1">
              <FormField
                control={control}
                name={`${name}.${index}.sail_number`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Sail#</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Sail#" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={control}
                name={`${name}.${index}.comments`}
                render={({ field }) => (
                  <FormItem>
                     <FormLabel className="sr-only">Comments</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional comments..." {...field} value={field.value ?? ''} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => remove(index)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-center text-muted-foreground py-4">No sails added to this list.</p>
        )}
      </CardContent>
    </Card>
  )
}


export function FilmsReportForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const form = useForm<FilmsReportFormValues>({
    resolver: zodResolver(filmsReportSchema),
    defaultValues,
  });

  const { fields: startedFields, append: appendStarted, remove: removeStarted } = useFieldArray({ control: form.control, name: "sails_started" });
  const { fields: finishedFields, append: appendFinished, remove: removeFinished } = useFieldArray({ control: form.control, name: "sails_finished" });
  const { fields: personnelFields, append: appendPersonnel, remove: removePersonnel } = useFieldArray({ control: form.control, name: "personnel" });
  
  const hadDowntime = useWatch({ control: form.control, name: "had_downtime" });

  function onSubmit(values: FilmsReportFormValues) {
    if (!firestore) {
        toast({ title: "Error", description: "Firestore not available.", variant: "destructive" });
        return;
    }
    const reportData = {
      report_date: formatISO(values.report_date),
      gantry_number: values.gantry_mold_number.split('/')[0].replace('Gantry ', '').trim(),
      sails_started: values.sails_started || [],
      sails_finished: values.sails_finished || [],
      // Storing personnel and downtime can be added here if needed in the future
    };

    addFilmsReport(firestore, reportData);

    toast({
      title: "Films Report Submitted!",
      description: "Your report has been successfully submitted.",
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">3D Films Shift Report</CardTitle>
                <CardDescription>Enter daily report details for the Films Department.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="report_date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="gantry_mold_number" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gantry / Mold</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a Gantry/Mold combination" /></SelectTrigger></FormControl>
                            <SelectContent>{moldNumberOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                 )} />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>Personnel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 {personnelFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md">
                        <FormField control={form.control} name={`personnel.${index}.name`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`personnel.${index}.start_time`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`personnel.${index}.end_time`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`personnel.${index}.task`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Task/Notes</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removePersonnel(index)}><Trash2 className="size-4" /></Button>
                    </div>
                 ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendPersonnel({ name: '', start_time: '', end_time: '', task: ''})}><PlusCircle className="mr-2 h-4 w-4"/>Add Person</Button>
            </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <SailListSection title="Sails Started" fields={startedFields} append={appendStarted} remove={removeStarted} control={form.control} name="sails_started" />
          <SailListSection title="Sails Finished" fields={finishedFields} append={appendFinished} remove={removeFinished} control={form.control} name="sails_finished" />
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Downtime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="had_downtime" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="text-base font-normal">Report Downtime?</FormLabel>
                    </FormItem>
                )} />
                {hadDowntime && (
                    <div className="p-4 border rounded-md grid md:grid-cols-2 gap-4">
                         <FormField control={form.control} name="downtime.reason" render={({ field }) => (
                            <FormItem><FormLabel>Reason</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger></FormControl><SelectContent>{downtimeReasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="downtime.duration" render={({ field }) => (
                            <FormItem><FormLabel>Duration (minutes)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
            <Button type="submit" size="lg">Submit Report</Button>
        </div>
      </form>
    </Form>
  )
}
