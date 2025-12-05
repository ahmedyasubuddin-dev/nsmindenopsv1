

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import React, { useState, useEffect } from "react"
import { PlusCircle, Trash2, AlertTriangle } from "lucide-react"

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
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "./ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { GraphicsKanbanBoard } from "./graphics/graphics-kanban-board"
import type { GraphicsTask as Task } from "@/lib/data-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "./ui/dialog"
import { sendShippingNotification } from "@/ai/flows/send-notification-flow"
import { PageHeader } from "@/components/page-header"
import { useCollection } from '@/lib/supabase/hooks/use-collection';
import { useUser } from '@/lib/supabase/provider';
import { Alert, AlertTitle, AlertDescription } from "./ui/alert"


const personnelSchema = z.object({
    name: z.string().min(1, "Name is required."),
    start_time: z.string().min(1, "Start time is required."),
    end_time: z.string().min(1, "End time is required."),
    notes: z.string().optional(),
});

const maintenanceTaskSchema = z.object({
    description: z.string().min(1, "Description is required."),
    duration_mins: z.coerce.number().min(0, "Duration must be positive."),
    personnel_count: z.coerce.number().min(1, "Personnel count must be at least 1."),
});


const graphicsReportSchema = z.object({
  personnel: z.array(personnelSchema).min(1, "At least one person is required."),
  maintenance_tasks: z.array(maintenanceTaskSchema).optional(),
  daily_maintenance: z.object({
    mutoh_head_area: z.boolean().default(false),
    mutoh_head_rest: z.boolean().default(false),
    plotter_adhesive: z.boolean().default(false),
    vacuum_table_cleaned: z.boolean().default(false),
    air_filters_checked: z.boolean().default(false),
  }).default({}),
});

type GraphicsReportFormValues = z.infer<typeof graphicsReportSchema>;


function Section({ title, description, children, actions }: { title: string, description?: string, children: React.ReactNode, actions?: React.ReactNode }) {
  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="font-headline text-xl text-primary">{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
                {actions}
            </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
  )
}

export function GraphicsReportForm() {
    const { toast } = useToast();
    const { isUserLoading } = useUser();
    
        // Only fetch last 30 days for faster loading
        const tasksDateFrom = new Date();
        tasksDateFrom.setDate(tasksDateFrom.getDate() - 30);

        const { data: tasks, isLoading: isLoadingTasks, error: tasksError } = useCollection<Task>(
          isUserLoading
            ? null
            : {
                table: 'graphics_tasks',
                orderBy: { column: 'created_at', ascending: false },
                enabled: true,
                limit: 200,
                dateRange: {
                  column: 'created_at',
                  from: tasksDateFrom.toISOString(),
                },
              }
        );
    
    const [notifiedTags, setNotifiedTags] = useState<Set<string>>(new Set());

    const form = useForm<GraphicsReportFormValues>({
        resolver: zodResolver(graphicsReportSchema),
        defaultValues: {
            personnel: [],
            maintenance_tasks: [],
            daily_maintenance: {
                mutoh_head_area: false,
                mutoh_head_rest: false,
                plotter_adhesive: false,
                vacuum_table_cleaned: false,
                air_filters_checked: false,
            }
        },
        mode: "onBlur"
    });

     useEffect(() => {
        if (!tasks) return;

        const checkFinishedTags = async () => {
            const finishedTagIds = new Set<string>();
            const tagTaskMap: Record<string, Task[]> = {};

            tasks.forEach(task => {
                if (!task.tagId) return;
                if (!tagTaskMap[task.tagId]) {
                    tagTaskMap[task.tagId] = [];
                }
                tagTaskMap[task.tagId].push(task);
            });

            for (const tagId in tagTaskMap) {
                const associatedTasks = tagTaskMap[tagId];
                const allTasksDone = associatedTasks.every(t => t.status === 'done');
                const anyTaskMarkedFinished = associatedTasks.some(t => t.isFinished);

                if (allTasksDone && anyTaskMarkedFinished) {
                    finishedTagIds.add(tagId);
                }
            }


            for (const tagId of finishedTagIds) {
                if (notifiedTags.has(tagId)) continue; 

                console.log(`Tag ID ${tagId} is marked as finished. Sending notification...`);
                try {
                    const result = await sendShippingNotification(tagId);
                    if (result.success) {
                        toast({
                            title: "Shipping Notification Sent!",
                            description: `The shipping department has been notified that Tag ID ${tagId} is ready for pickup.`
                        });
                        setNotifiedTags(prev => new Set(prev).add(tagId));
                    } else {
                         toast({
                            title: "Notification Failed",
                            description: result.message,
                            variant: "destructive"
                        });
                    }
                } catch (error) {
                    console.error("Failed to send notification:", error);
                    toast({
                        title: "Error",
                        description: "An error occurred while sending the shipping notification.",
                        variant: "destructive"
                    });
                }
            }
        };

        if (tasks.length > 0) {
            checkFinishedTags();
        }
    }, [tasks, notifiedTags, toast]);

    const { fields: personnelFields, append: appendPersonnel, remove: removePersonnel } = useFieldArray({ control: form.control, name: "personnel" });
    const { fields: maintenanceFields, append: appendMaintenance, remove: removeMaintenance } = useFieldArray({ control: form.control, name: "maintenance_tasks" });
    
    const addNewTask = async (type: 'cutting' | 'inking') => {
        const timestamp = Date.now();
        
        if (type === 'cutting') {
             const cuttingTask: Omit<Task, 'id'> = {
                type: 'cutting', tagId: '', status: 'todo',
                content: '', tagType: 'Sail', startedAt: new Date().toISOString(),
            };
            const inkingTask: Omit<Task, 'id'> = {
                type: 'inking', tagId: '', status: 'todo',
                content: '', tagType: 'Sail', startedAt: new Date().toISOString(),
            };
            await fetch('/api/graphics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cuttingTask),
            });
            await fetch('/api/graphics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(inkingTask),
            });
            toast({ title: "Task Pair Added", description: `A new Cutting and Inking task pair has been created.` });

        } else {
            const inkingTask: Omit<Task, 'id'> = {
                type: 'inking', tagId: '', status: 'todo',
                content: '', tagType: 'Sail', startedAt: new Date().toISOString(),
            };
             await fetch('/api/graphics', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(inkingTask),
             });
             toast({ title: "Task Added", description: `A new Inking task has been created.` });
        }
    }
    
    const onUpdateTask = async (updatedTask: Task) => {
        await fetch(`/api/graphics/${updatedTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTask),
        });
        
        if (updatedTask.type === 'cutting') {
            const correspondingInkingId = updatedTask.id.replace('cut-', 'ink-');
            const inkingTask = tasks?.find(t => t.id === correspondingInkingId);
            if (inkingTask) {
                const syncedInkingTask = {
                    ...inkingTask,
                    tagId: updatedTask.tagId,
                    tagType: updatedTask.tagType,
                    sidedness: updatedTask.sidedness,
                    sideOfWork: updatedTask.sideOfWork,
                    content: updatedTask.content,
                };
                await fetch(`/api/graphics/${syncedInkingTask.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(syncedInkingTask),
                });
            }
        }
    }
    
    const onDeleteTask = async (taskId: string) => {
        await fetch(`/api/graphics/${taskId}`, {
          method: 'DELETE',
        });
        toast({ title: "Task Deleted", variant: "destructive" });
    }

    const cuttingTasks = tasks?.filter(t => t.type === 'cutting') || [];
    const inkingTasks = tasks?.filter(t => t.type === 'inking') || [];

    if (isLoadingTasks) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading tasks...</p>
                </div>
            </div>
        );
    }

    if (tasksError) {
        return (
            <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                <p className="text-destructive font-semibold">Error loading tasks</p>
                <p className="text-sm text-muted-foreground mt-1">{tasksError.message}</p>
                <p className="text-xs text-muted-foreground mt-2">The app will continue to work, but tasks may not be up to date.</p>
            </div>
        );
    }

    return (
        <Form {...form}>
            <div className="space-y-6">
                <PageHeader title="Graphics Department" description="Live task management for Cutting and Inking." />
                 <div className="flex gap-2 justify-end">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">Log Personnel & Maintenance</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-4xl">
                            <DialogHeader><DialogTitle>Personnel & Maintenance Log</DialogTitle></DialogHeader>
                            <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                                <Section title="Personnel" actions={<Button type="button" variant="outline" size="sm" onClick={() => appendPersonnel({ name: '', start_time: '', end_time: '', notes: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Person</Button>}>
                                  <div className="space-y-4">
                                    {personnelFields.map((field, index) => (
                                      <div key={field.id} className="p-4 border rounded-md relative grid md:grid-cols-4 gap-4 items-end">
                                        <FormField control={form.control} name={`personnel.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Employee name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`personnel.${index}.start_time`} render={({ field }) => (<FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`personnel.${index}.end_time`} render={({ field }) => (<FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`personnel.${index}.notes`} render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removePersonnel(index)}><Trash2 className="size-4" /></Button>
                                      </div>
                                    ))}
                                    {personnelFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No personnel added.</p>}
                                  </div>
                                </Section>
                               <Section title="Maintenance Tasks" actions={<Button type="button" variant="outline" size="sm" onClick={() => appendMaintenance({ description: '', duration_mins: 0, personnel_count: 1 })}><PlusCircle className="mr-2 h-4 w-4" />Add Maintenance</Button>}>
                                    <div className="space-y-4">
                                        {maintenanceFields.map((field, index) => (
                                            <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative">
                                                <FormField control={form.control} name={`maintenance_tasks.${index}.description`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name={`maintenance_tasks.${index}.duration_mins`} render={({ field }) => (<FormItem><FormLabel>Duration (mins)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name={`maintenance_tasks.${index}.personnel_count`} render={({ field }) => (<FormItem><FormLabel>Personnel</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeMaintenance(index)}><Trash2 className="size-4"/></Button>
                                            </div>
                                        ))}
                                        {maintenanceFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No maintenance tasks added.</p>}
                                    </div>
                                </Section>

                                <Section title="Daily Machine Maintenance Checks">
                                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                                        <FormField control={form.control} name="daily_maintenance.mutoh_head_area" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Mutoh – Head Area</FormLabel></FormItem>)} />
                                        <FormField control={form.control} name="daily_maintenance.mutoh_head_rest" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Mutoh – Head Rest</FormLabel></FormItem>)} />
                                        <FormField control={form.control} name="daily_maintenance.plotter_adhesive" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Plotter – Adhesive</FormLabel></FormItem>)} />
                                        <FormField control={form.control} name="daily_maintenance.vacuum_table_cleaned" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Vacuum/Table Cleaned</FormLabel></FormItem>)} />
                                         <FormField control={form.control} name="daily_maintenance.air_filters_checked" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Air Filters Checked</FormLabel></FormItem>)} />
                                    </div>
                                </Section>
                             </div>
                             <DialogFooter>
                                <DialogClose asChild><Button>Close</Button></DialogClose>
                             </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                
                {tasksError ? (
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Permission Error</AlertTitle>
                        <AlertDescription>
                            Could not load Graphics tasks. Check Firestore security rules for the 'graphics_tasks' collection.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Tabs defaultValue="cutting">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="cutting">Cutting/Masking Tasks</TabsTrigger>
                            <TabsTrigger value="inking">Inking Tasks</TabsTrigger>
                        </TabsList>
                        <TabsContent value="cutting">
                            <GraphicsKanbanBoard tasks={cuttingTasks} type="cutting" onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onAddTask={() => addNewTask('cutting')} />
                        </TabsContent>
                        <TabsContent value="inking">
                            <GraphicsKanbanBoard tasks={inkingTasks} type="inking" onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onAddTask={() => addNewTask('inking')} />
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </Form>
    )
}
