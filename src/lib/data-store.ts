'use server';
/**
 * @fileoverview This file provides the data access layer for the application,
 * interacting with Google Cloud Firestore.
 */
import type { Report, WorkItem } from './types';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    Firestore,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useFirestore } from '@/firebase';

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
  id?: string;
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

export async function addOeJob(job: { oeBase: string, sections: Array<{ sectionId: string, panelStart: number, panelEnd: number }> }): Promise<void> {
    const firestore = useFirestore();
    const newJob = {
        oeBase: job.oeBase,
        status: 'pending',
        sections: job.sections.map(s => ({ ...s, completedPanels: [] })),
    };
    const jobsCollection = collection(firestore, 'jobs');
    await addDoc(jobsCollection, newJob);
}


export async function addFilmsReport(report: Omit<FilmsReport, 'id'>): Promise<void> {
    const firestore = useFirestore();
    const newReport = {
        id: `film_rpt_${Date.now()}`,
        ...report,
    };
    const reportRef = doc(firestore, 'films', newReport.id);
    await setDoc(reportRef, newReport, { merge: true });
}

export async function setGraphicsTasks(tasks: GraphicsTask[]): Promise<void> {
    const firestore = useFirestore();
    // This is inefficient for individual updates, but fine for a full replacement.
    // In a real app, you'd update individual task documents.
    for (const task of tasks) {
        const taskRef = doc(firestore, 'graphics_tasks', task.id);
        await setDoc(taskRef, task, { merge: true });
    }
}


export async function markPanelsAsCompleted(oeBase: string, sectionId: string, panels: string[]): Promise<void> {
    const firestore = useFirestore();
    const jobsQuery = query(collection(firestore, 'jobs'), where('oeBase', '==', oeBase));
    const querySnapshot = await getDocs(jobsQuery);

    if (querySnapshot.empty) return;
    
    const jobDoc = querySnapshot.docs[0];
    const job = { id: jobDoc.id, ...jobDoc.data() } as OeJob;
    const jobRef = doc(firestore, 'jobs', job.id!);

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

    let newStatus = job.status;
    if (allSectionsComplete) {
        newStatus = 'completed';
    } else if (job.sections.some(s => (s.completedPanels?.length || 0) > 0)) {
        newStatus = 'in-progress';
    }

    const updatedSections = [...job.sections];
    updatedSections[sectionIndex] = section;

    await updateDoc(jobRef, { sections: updatedSections, status: newStatus });
}

export async function addTapeheadsSubmission(report: Report): Promise<void> {
    const firestore = useFirestore();
    const submissionRef = doc(firestore, 'tapeheads_submissions', report.id);
    await setDoc(submissionRef, report, {});
}

export async function updateTapeheadsSubmission(updatedReport: Report): Promise<void> {
    const firestore = useFirestore();
    const submissionRef = doc(firestore, 'tapeheads_submissions', updatedReport.id);
    await updateDoc(submissionRef, { ...updatedReport });
}

export async function deleteTapeheadsSubmission(id: string): Promise<void> {
    const firestore = useFirestore();
    const submissionRef = doc(firestore, 'tapeheads_submissions', id);
    await deleteDoc(submissionRef);
}

// Functions to get data - these are used by client components with hooks
// In a real app with server-side rendering, you might fetch this data in Server Components.

export async function getOeJobs(): Promise<OeJob[]> {
    const firestore = useFirestore();
    const snapshot = await getDocs(collection(firestore, 'jobs'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OeJob));
}

export async function getOeSection(oeBase: string, sectionId: string): Promise<OeSection | null> {
    const jobs = await getOeJobs();
    const job = jobs.find(j => j.oeBase === oeBase);
    return job?.sections.find(s => s.sectionId === sectionId) || null;
}

export async function getTapeheadsSubmissions(): Promise<Report[]> {
    const firestore = useFirestore();
    const snapshot = await getDocs(collection(firestore, 'tapeheads_submissions'));
    return snapshot.docs.map(doc => doc.data() as Report);
}

export async function getFilmsData(): Promise<FilmsReport[]> {
    const firestore = useFirestore();
    const snapshot = await getDocs(collection(firestore, 'films'));
    return snapshot.docs.map(doc => doc.data() as FilmsReport);
}

export async function getGantryReportsData(): Promise<GantryReport[]> {
    const firestore = useFirestore();
    const snapshot = await getDocs(collection(firestore, 'gantry_reports'));
    return snapshot.docs.map(doc => doc.data() as GantryReport);
}

export async function getGraphicsTasks(): Promise<GraphicsTask[]> {
    const firestore = useFirestore();
    const snapshot = await getDocs(collection(firestore, 'graphics_tasks'));
    return snapshot.docs.map(doc => doc.data() as GraphicsTask);
}

export async function getInspectionsData(): Promise<InspectionSubmission[]> {
    const firestore = useFirestore();
    const snapshot = await getDocs(collection(firestore, 'inspections'));
    return snapshot.docs.map(doc => doc.data() as InspectionSubmission);
}

export async function getPreggerReportsData(): Promise<PreggerReport[]> {
    const firestore = useFirestore();
    const snapshot = await getDocs(collection(firestore, 'pregger_reports'));
    return snapshot.docs.map(doc => doc.data() as PreggerReport);
}