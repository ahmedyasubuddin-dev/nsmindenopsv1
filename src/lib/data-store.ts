'use server';
/**
 * @fileoverview This file provides the data access layer for the application,
 * interacting with Google Cloud Firestore.
 */
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { firestore } from '@/firebase/server-init';
import type { Report, FilmsReport, GantryReport, GraphicsTask, InspectionSubmission, OeJob, PreggerReport } from './types';


export async function addOeJob(job: { oeBase: string, sections: Array<{ sectionId: string, panelStart: number, panelEnd: number }> }): Promise<void> {
    const newJob = {
        oeBase: job.oeBase,
        status: 'pending',
        sections: job.sections.map(s => ({ ...s, completedPanels: [] })),
    };
    const jobsCollection = collection(firestore, 'jobs');
    await addDoc(jobsCollection, newJob);
}


export async function addFilmsReport(report: Omit<FilmsReport, 'id'>): Promise<void> {
    const newReport = {
        id: `film_rpt_${Date.now()}`,
        ...report,
    };
    const reportRef = doc(firestore, 'films', newReport.id);
    await setDoc(reportRef, newReport, { merge: true });
}

export async function setGraphicsTasks(tasks: GraphicsTask[]): Promise<void> {
    const batch = [];
    for (const task of tasks) {
        const taskRef = doc(firestore, 'graphics_tasks', task.id);
        batch.push(setDoc(taskRef, task, { merge: true }));
    }
    await Promise.all(batch);
}


export async function markPanelsAsCompleted(oeBase: string, sectionId: string, panels: string[]): Promise<void> {
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
    const submissionRef = doc(firestore, 'tapeheads_submissions', report.id);
    await setDoc(submissionRef, report, {});
}

export async function updateTapeheadsSubmission(updatedReport: Report): Promise<void> {
    const submissionRef = doc(firestore, 'tapeheads_submissions', updatedReport.id);
    await updateDoc(submissionRef, { ...updatedReport });
}

export async function deleteTapeheadsSubmission(id: string): Promise<void> {
    const submissionRef = doc(firestore, 'tapeheads_submissions', id);
    await deleteDoc(submissionRef);
}

export async function getOeJobs(): Promise<OeJob[]> {
    const snapshot = await getDocs(collection(firestore, 'jobs'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OeJob));
}

export async function getOeSection(oeBase: string, sectionId: string): Promise<OeJob['sections'][0] | null> {
    const jobs = await getOeJobs();
    const job = jobs.find(j => j.oeBase === oeBase);
    return job?.sections.find(s => s.sectionId === sectionId) || null;
}

export async function getTapeheadsSubmissions(): Promise<Report[]> {
    const snapshot = await getDocs(collection(firestore, 'tapeheads_submissions'));
    return snapshot.docs.map(doc => ({...doc.data(), date: (doc.data().date as any).toDate() } as Report));
}

export async function getFilmsData(): Promise<FilmsReport[]> {
    const snapshot = await getDocs(collection(firestore, 'films'));
    return snapshot.docs.map(doc => doc.data() as FilmsReport);
}

export async function getGantryReportsData(): Promise<GantryReport[]> {
    const snapshot = await getDocs(collection(firestore, 'gantry_reports'));
     return snapshot.docs.map(doc => ({...doc.data(), date: new Date(doc.data().date) } as GantryReport));
}

export async function getGraphicsTasks(): Promise<GraphicsTask[]> {
    const snapshot = await getDocs(collection(firestore, 'graphics_tasks'));
    return snapshot.docs.map(doc => doc.data() as GraphicsTask);
}

export async function getInspectionsData(): Promise<InspectionSubmission[]> {
    const snapshot = await getDocs(collection(firestore, 'inspections'));
    return snapshot.docs.map(doc => doc.data() as InspectionSubmission);
}

export async function getPreggerReportsData(): Promise<PreggerReport[]> {
    const snapshot = await getDocs(collection(firestore, 'pregger_reports'));
    return snapshot.docs.map(doc => doc.data() as PreggerReport);
}
