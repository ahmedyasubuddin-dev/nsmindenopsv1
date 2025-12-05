
'use server';
/**
 * @fileoverview This file serves as the centralized data store for the application.
 * Data operations now use Supabase via API routes.
 */
import type { Report, WorkItem } from './types';

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//
// Type Definitions
//
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
export interface OeSection {
  sectionId: string;
  panelStart: number;
  panelEnd: number;
  completedPanels?: string[];
}

export interface OeJob {
  id: string;
  oeBase: string;
  status: 'pending' | 'in-progress' | 'completed';
  sections: OeSection[];
}

export interface FilmsReport {
    id: string;
    report_date: string;
    gantry_number: string;
    sails_started: Array<{ sail_number: string; comments?: string }>;
    sails_finished: Array<{ sail_number: string; comments?: string }>;
}

export interface GantryReport {
    id: string;
    report_date: string;
    date: string;
    shift: string;
    zone_assignment?: string;
    zoneLeads?: Array<{
        zone_number: string;
        lead_name: string;
    }>;
    personnel?: Array<{
        name: string;
        start_time?: string;
        end_time?: string;
    }>;
    molds?: Array<{
        mold_number: string;
        sails?: Array<{
            sail_number: string;
            stage_of_process?: string;
            issues?: string;
        }>;
        images?: any[];
        downtime_caused?: boolean;
    }>;
    downtime?: Array<{
        reason: string;
        duration: number;
    }>;
    maintenance?: Array<{
        description: string;
        duration: number;
    }>;
}

export interface GraphicsTask {
    id: string;
    type: 'cutting' | 'inking';
    status: 'todo' | 'inProgress' | 'done';
    tagId: string;
    content: string;
    tagType?: 'Sail' | 'Decal';
    sidedness?: 'Single-Sided' | 'Double-Sided';
    sideOfWork?: 'Port' | 'Starboard';
    workTypes?: string[];
    durationMins?: number;
    personnelCount?: number;
    tapeUsed?: boolean;
    isFinished?: boolean;
    startedAt?: string;
    completedAt?: string;
}

export interface PreggerReport {
    id: string;
    report_date: string;
    shift: string;
    workCompleted: Array<{
        tape_id: string;
        meters: number;
        waste_meters: number;
        material_description: string;
    }>;
    personnel: Array<{
        name: string;
        start_time: string;
        end_time: string;
    }>;
    downtime?: Array<{
        reason: string;
        duration_minutes: number;
    }>;
    briefing_items?: string;
    current_work?: string;
    operational_problems?: string;
    personnel_notes?: string;
    bonding_complete?: boolean;
    epa_report?: boolean;
    end_of_shift_checklist?: boolean;
    images?: any;
}


export interface InspectionSubmission {
    id: string;
    inspectionDate: string;
    oeNumber: string;
    inspectorName: string;
    totalScore: number;
    status: 'Pass' | 'Reinspection Required' | 'Fail';
    reinspection?: {
        finalOutcome: string;
        comments: string;
    };
}

export async function getOeJobs(): Promise<OeJob[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/jobs`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch jobs');
    }
    
    const { data } = await response.json();
    return data || [];
}

export async function addGraphicsTask(task: Omit<GraphicsTask, 'id'>): Promise<string> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/graphics`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create graphics task');
    }
    
    const { data } = await response.json();
    return data.id;
}


export async function updateGraphicsTask(task: GraphicsTask): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/graphics/${task.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update graphics task');
    }
}

export async function deleteGraphicsTask(taskId: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/graphics/${taskId}`, {
        method: 'DELETE',
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete graphics task');
    }
}

export async function addOeJob(job: { oeBase: string, sections: Array<{ sectionId: string, panelStart: number, panelEnd: number }> }): Promise<void> {
    const newJob = {
        oeBase: job.oeBase,
        status: 'pending',
        sections: job.sections.map(s => ({ ...s, completedPanels: [] })),
    };
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/jobs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJob),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create job');
    }
}


export async function addFilmsReport(report: Omit<FilmsReport, 'id'>): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/films`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create films report');
    }
}

export async function addGantryReport(report: Omit<GantryReport, 'id'>): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/gantry`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create gantry report');
    }
}

export async function addPreggerReport(report: Omit<PreggerReport, 'id'>): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/pregger`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create pregger report');
    }
}

export async function addInspection(inspection: Omit<InspectionSubmission, 'id'>): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/qc`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(inspection),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create inspection');
    }
}

export async function getOeSection(oeBase?: string, sectionId?: string): Promise<(OeSection & { jobStatus: OeJob['status']}) | undefined> {
    if (!oeBase || !sectionId) return undefined;
    
    const jobs = await getOeJobs();
    const job = jobs.find(j => j.oeBase === oeBase);
    
    if (!job) return undefined;

    const section = job.sections.find(s => s.sectionId === sectionId);
    if (!section) return undefined;

    return { ...section, jobStatus: job.status };
}

export async function markPanelsAsCompleted(oeBase: string, sectionId: string, panels: string[]): Promise<void> {
    const jobs = await getOeJobs();
    const job = jobs.find(j => j.oeBase === oeBase);
    
    if (!job) return;

    const sectionIndex = job.sections.findIndex(s => s.sectionId === sectionId);
    if (sectionIndex === -1) return;

    const section = job.sections[sectionIndex];
    if (!section.completedPanels) {
        section.completedPanels = [];
    }
    
    const newPanels = panels.filter(p => !section.completedPanels!.includes(p));
    section.completedPanels.push(...newPanels);

    const allSectionsComplete = job.sections.every(s => {
        const totalPanels = s.panelEnd - s.panelStart + 1;
        return (s.completedPanels?.length || 0) >= totalPanels;
    });

    if (allSectionsComplete) {
        job.status = 'completed';
    } else if (job.sections.some(s => (s.completedPanels?.length || 0) > 0)) {
        job.status = 'in-progress';
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sections: job.sections,
            status: job.status
        }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update job');
    }
}

export async function addTapeheadsSubmission(report: Report): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tapeheads`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tapeheads submission');
    }
}

export async function updateTapeheadsSubmission(updatedReport: Report): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tapeheads/${updatedReport.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedReport),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update tapeheads submission');
    }
}

export async function deleteTapeheadsSubmission(id: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tapeheads/${id}`, {
        method: 'DELETE',
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tapeheads submission');
    }
}
