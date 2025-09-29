
"use client"

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { GraphicsTaskCard } from './graphics-task-card';
import type { GraphicsTask as Task } from '@/lib/types';
import { setGraphicsTasks, getGraphicsTasks } from '@/lib/data-store';

interface KanbanBoardProps {
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    type: 'cutting' | 'inking';
    onAddTask: () => void;
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
}

const columns = {
    todo: { id: 'todo', title: 'To Do (Started)' },
    inProgress: { id: 'inProgress', title: 'In Progress' },
    done: { id: 'done', title: 'Completed' },
};

export function GraphicsKanbanBoard({ tasks, setTasks, type, onAddTask, onUpdateTask, onDeleteTask }: KanbanBoardProps) {

    const onDragEnd: OnDragEndResponder = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) {
            return;
        }

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }
        
        const allTasks = await getGraphicsTasks();
        const task = allTasks.find(t => t.id === draggableId);

        if (task) {
            const newStatus = destination.droppableId as 'todo' | 'inProgress' | 'done';
            const updatedTask = { ...task, status: newStatus };
            
            if (newStatus === 'done' && !task.completedAt) {
                updatedTask.completedAt = new Date().toISOString();
            }

            const newTasks = allTasks.map(t => t.id === draggableId ? updatedTask : t);
            setTasks(newTasks);
            await setGraphicsTasks(newTasks);
        }
    };
    
    return (
        <div className="p-4 rounded-lg bg-muted/30">
            <div className="mb-4 flex justify-end">
                <Button onClick={onAddTask} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                </Button>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.values(columns).map(column => (
                        <Droppable key={column.id} droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`p-4 rounded-lg bg-background transition-colors ${snapshot.isDraggingOver ? 'bg-accent' : ''}`}
                                >
                                    <h3 className="font-semibold mb-4 text-center">{column.title}</h3>
                                    <div className="space-y-3 min-h-[200px]">
                                        {tasks.filter(task => task.status === column.id).map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <GraphicsTaskCard task={task} onUpdate={onUpdateTask} onDelete={onDeleteTask} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
