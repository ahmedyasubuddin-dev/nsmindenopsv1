
"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, PackageCheck, Send } from "lucide-react";
import { format, isSameDay } from 'date-fns';
import type { GraphicsTask } from '@/lib/data-store';
import { Button } from '../ui/button';
import { sendShippingNotification } from '@/ai/flows/send-notification-flow';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

export function GraphicsAnalytics() {
    const { firestore } = useFirebase();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const tasksQuery = useMemoFirebase(() => query(collection(firestore, 'graphics_tasks')), [firestore]);
    const { data: allTasks, isLoading: loading } = useCollection<GraphicsTask>(tasksQuery);
    
    const [notifiedTags, setNotifiedTags] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    const dailyData = useMemo(() => {
        if (!date || !allTasks) {
            return {
                startedTasks: [],
                completedTasks: [],
            };
        }

        const tasksToday = allTasks.filter(task => {
            const taskDate = task.completedAt || task.startedAt;
            return taskDate && isSameDay(new Date(taskDate), date);
        });

        const startedTasks = tasksToday; 
        const completedTasks = tasksToday.filter(task => task.status === 'done');
        
        return {
            startedTasks,
            completedTasks,
        };
    }, [date, allTasks]);
    
    const readyForShippingTags = useMemo(() => {
        if (!allTasks) return [];
        const finishedTagIds = new Set<string>();
        const tagTaskMap: Record<string, GraphicsTask[]> = {};

        allTasks.forEach(task => {
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
        return Array.from(finishedTagIds);
    }, [allTasks]);

    const summaryStats = useMemo(() => {
        const totalCompleted = dailyData.completedTasks.length;
        const totalDuration = dailyData.completedTasks.reduce((acc, task) => acc + (task.durationMins || 0), 0);
        const uniquePersonnel = new Set(dailyData.completedTasks.map(t => t.personnelCount || 1).flat()).size;

        return {
            totalCompleted,
            totalDuration,
            uniquePersonnel,
            avgDuration: totalCompleted > 0 ? (totalDuration / totalCompleted).toFixed(1) : 0,
        };
    }, [dailyData.completedTasks]);

    const handleSendNotification = async (tagId: string) => {
        if (notifiedTags.has(tagId)) {
            toast({ title: 'Already Notified', description: `A notification for ${tagId} has already been sent.` });
            return;
        }

        try {
            const result = await sendShippingNotification(tagId);
            if (result.success) {
                toast({
                    title: "Shipping Notification Sent!",
                    description: `The shipping department has been notified that Tag ID ${tagId} is ready for pickup.`
                });
                setNotifiedTags(prev => new Set(prev).add(tagId));
            } else {
                 toast({ title: "Notification Failed", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to send notification:", error);
            toast({ title: "Error", description: "An error occurred while sending the shipping notification.", variant: "destructive" });
        }
    };
    
    if (loading) {
        return <p>Loading analytics...</p>;
    }


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Select Date</CardTitle>
                    <CardDescription>Pick a date to view the activity summary for the Graphics department.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DatePicker value={date} onChange={setDate} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tasks Completed</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{summaryStats.totalCompleted}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Work Time</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{summaryStats.totalDuration} <span className="text-xs text-muted-foreground">mins</span></div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg. Task Time</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{summaryStats.avgDuration} <span className="text-xs text-muted-foreground">mins</span></div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ready for Shipping</CardTitle><PackageCheck className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{readyForShippingTags.length}</div></CardContent>
                </Card>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Tasks Completed on {date ? format(date, 'PPP') : ''}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tag ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Content</TableHead>
                                <TableHead>Duration (min)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {dailyData.completedTasks.length > 0 ? dailyData.completedTasks.map(task => (
                                <TableRow key={task.id}>
                                    <TableCell><Badge variant="secondary">{task.tagId}</Badge></TableCell>
                                    <TableCell className="capitalize">{task.type}</TableCell>
                                    <TableCell>{task.content}</TableCell>
                                    <TableCell>{task.durationMins}</TableCell>
                                </TableRow>
                            )) : (
                               <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No tasks completed on this day.</TableCell></TableRow>
                           )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Card>
                    <CardHeader><CardTitle>Ready for Shipping</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                           {readyForShippingTags.length > 0 ? readyForShippingTags.map(tagId => (
                                <li key={tagId} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                   <div className="flex items-center gap-2">
                                     <PackageCheck className="h-5 w-5 text-green-600"/>
                                     <span className="font-mono">{tagId}</span>
                                   </div>
                                   <Button size="sm" variant="outline" onClick={() => handleSendNotification(tagId)} disabled={notifiedTags.has(tagId)}>
                                       <Send className="mr-2 h-4 w-4"/>
                                       {notifiedTags.has(tagId) ? 'Notified' : 'Notify'}
                                   </Button>
                                </li>
                           )) : (
                                <p className="text-sm text-muted-foreground">No tags are currently marked as ready for shipping.</p>
                           )}
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Tasks Started on {date ? format(date, 'PPP') : ''}</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                           {dailyData.startedTasks.length > 0 ? dailyData.startedTasks.map(task => (
                                <li key={task.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                    <span className="font-mono text-xs"><Badge variant="outline">{task.tagId}</Badge></span>
                                    <span className="text-sm truncate">{task.content}</span>
                                </li>
                           )) : (
                               <p className="text-sm text-muted-foreground">No tasks were started on this day.</p>
                           )}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    