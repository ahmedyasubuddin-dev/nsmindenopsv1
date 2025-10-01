
'use server';
/**
 * @fileoverview This file provides the data access layer for the application,
 * interacting with Google Cloud Firestore.
 */
import { firestore } from '@/firebase/server-init';
import type { Report, FilmsReport, GantryReport, GraphicsTask, InspectionSubmission, OeJob, PreggerReport, WorkItem, TapeUsage } from './types';


export async function addOeJob(job: { oeBase: string, sections: Array<{ sectionId: string, panelStart: number, panelEnd: number }> }): Promise<void> {
    const newJob = {
        oeBase: job.oeBase,
        status: 'pending',
        sections: job.sections.map(s => ({ ...s, completedPanels: [] })),
    };
    const jobsCollection = firestore.collection('jobs');
    
    try {
        await jobsCollection.add(newJob);
    } catch (error) {
        // This is a server-side operation.
        // A more robust solution would involve a dedicated server-side logging mechanism.
        console.error("Error in addOeJob:", error);
        throw error;
    }
}

export async function addFilmsReport(report: Omit<FilmsReport, 'id'>): Promise<void> {
    const newReport = {
        id: `film_rpt_${Date.now()}`,
        ...report,
    };
    const reportRef = firestore.collection('films').doc(newReport.id);
    await reportRef.set(newReport, { merge: true });
}

export async function getGraphicsTasks(): Promise<GraphicsTask[]> {
    const snapshot = await firestore.collection('graphics_tasks').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => doc.data() as GraphicsTask);
}


export async function setGraphicsTasks(tasks: GraphicsTask[]): Promise<void> {
    const batch = firestore.batch();
    tasks.forEach(task => {
        const taskRef = firestore.collection('graphics_tasks').doc(task.id);
        batch.set(taskRef, task, { merge: true });
    });
    await batch.commit();
}


export async function markPanelsAsCompleted(oeBase: string, sectionId: string, panels: string[]): Promise<void> {
    const jobsQuery = firestore.collection('jobs').where('oeBase', '==', oeBase);
    const querySnapshot = await jobsQuery.get();

    if (querySnapshot.empty) return;
    
    const jobDoc = querySnapshot.docs[0];
    const job = { id: jobDoc.id, ...jobDoc.data() } as OeJob;
    const jobRef = firestore.collection('jobs').doc(job.id!);

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
    
    const updateData = { sections: updatedSections, status: newStatus };

    await jobRef.update(updateData);
}

export async function addTapeheadsSubmission(report: Report): Promise<void> {
    const submissionRef = firestore.collection('tapeheads_submissions').doc(report.id);
    await submissionRef.set(report, {});
}

export async function updateTapeheadsSubmission(updatedReport: Report): Promise<void> {
    const submissionRef = firestore.collection('tapeheads_submissions').doc(updatedReport.id);
    await submissionRef.update({ ...updatedReport });
}

export async function deleteTapeheadsSubmission(id: string): Promise<void> {
    const submissionRef = firestore.collection('tapeheads_submissions').doc(id);
    await submissionRef.delete();
}


export { type Report, type FilmsReport, type GantryReport, type GraphicsTask, type InspectionSubmission, type OeJob, type PreggerReport, type WorkItem, type TapeUsage };
