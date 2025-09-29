

'use server';
/**
 * @fileoverview This file serves as the single, centralized file-based data store for the application.
 * Data is persisted to JSON files in the `src/lib/data` directory.
 */
import type { Report, WorkItem } from './types';
import { 
    readData,
    writeData
} from './data-store-server';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, Firestore, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

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

export async function getOeJobs(firestore: Firestore): Promise<OeJob[]> {
    const jobsCollection = collection(firestore, 'jobs');
    const snapshot = await getDocs(jobsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OeJob));
}

export async function getFilmsData(): Promise<FilmsReport[]> { return readData<FilmsReport[]>('filmsData'); }
export async function getGantryReportsData(): Promise<GantryReport[]> { return readData<GantryReport[]>('gantryReports'); }
export async function getGraphicsTasks(): Promise<GraphicsTask[]> { return readData<GraphicsTask[]>('graphicsTasks'); }
export async function getPreggerReportsData(): Promise<PreggerReport[]> { return readData<PreggerReport[]>('preggerReports'); }
export async function getInspectionsData(): Promise<InspectionSubmission[]> { return readData<InspectionSubmission[]>('inspections'); }
export async function getTapeheadsSubmissions(): Promise<Report[]> { return readData<Report[]>('tapeheadsSubmissions'); }

export async function setGraphicsTasks(tasks: GraphicsTask[]) {
    await writeData('graphicsTasks', tasks);
}

export async function setTapeheadsSubmissions(reports: Report[]) {
    await writeData('tapeheadsSubmissions', reports);
}

export function addOeJob(firestore: Firestore, job: { oeBase: string, sections: Array<{ sectionId: string, panelStart: number, panelEnd: number }> }): void {
    const newJob = {
        oeBase: job.oeBase,
        status: 'pending',
        sections: job.sections.map(s => ({ ...s, completedPanels: [] })),
    };
    const jobsCollection = collection(firestore, 'jobs');
    addDocumentNonBlocking(jobsCollection, newJob);
}


export function addFilmsReport(firestore: Firestore, report: Omit<FilmsReport, 'id'>): void {
    const newReport = { ...report };
    const filmsCollection = collection(firestore, 'films');
    addDocumentNonBlocking(filmsCollection, newReport);
}

export async function getOeSection(oeBase?: string, sectionId?: string): Promise<(OeSection & { jobStatus: OeJob['status']}) | undefined> {
    if (!oeBase || !sectionId) return undefined;
    // This function now needs a firestore instance, but it is called from client components
    // without one. This part of the logic will be moved into the components themselves.
    // For now, it will return undefined.
    return undefined;
}

export async function markPanelsAsCompleted(firestore: Firestore, oeBase: string, sectionId: string, panels: string[]): Promise<void> {
    const jobsRef = collection(firestore, 'jobs');
    const q = query(jobsRef, where("oeBase", "==", oeBase));
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;

    const jobDoc = querySnapshot.docs[0];
    const job = { id: jobDoc.id, ...jobDoc.data() } as OeJob;

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
    
    const jobDocRef = doc(firestore, 'jobs', job.id);
    updateDocumentNonBlocking(jobDocRef, {
        sections: job.sections,
        status: job.status
    });
}

export function addTapeheadsSubmission(firestore: Firestore, report: Report): void {
    const docRef = doc(firestore, 'tapeheads-submissions', report.id);
    setDocumentNonBlocking(docRef, report, { merge: true });
}

export function updateTapeheadsSubmission(firestore: Firestore, updatedReport: Report): void {
    const docRef = doc(firestore, 'tapeheads-submissions', updatedReport.id);
    updateDocumentNonBlocking(docRef, updatedReport);
}

export function deleteTapeheadsSubmission(firestore: Firestore, id: string): void {
    const docRef = doc(firestore, 'tapeheads-submissions', id);
    deleteDocumentNonBlocking(docRef);
}

