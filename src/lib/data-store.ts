
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
import type { Report, FilmsReport, GantryReport, GraphicsTask, InspectionSubmission, OeJob, PreggerReport, WorkItem, TapeUsage } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export async function addOeJob(job: { oeBase: string, sections: Array<{ sectionId: string, panelStart: number, panelEnd: number }> }): Promise<void> {
    const newJob = {
        oeBase: job.oeBase,
        status: 'pending',
        sections: job.sections.map(s => ({ ...s, completedPanels: [] })),
    };
    const jobsCollection = collection(firestore, 'jobs');
    
    try {
        await addDoc(jobsCollection, newJob);
    } catch (error) {
        // This is a server-side operation, so we can't use the client-side error emitter.
        // For now, we will just re-throw the original error to be caught by the client.
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
    const reportRef = doc(firestore, 'films', newReport.id);
    await setDoc(reportRef, newReport, { merge: true }).catch(error => {
        const contextualError = new FirestorePermissionError({
          operation: 'create',
          path: reportRef.path,
          requestResourceData: newReport,
        });
        errorEmitter.emit('permission-error', contextualError);
        throw contextualError;
    });
}

export async function getGraphicsTasks(): Promise<GraphicsTask[]> {
    const snapshot = await getDocs(collection(firestore, 'graphics_tasks'));
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => doc.data() as GraphicsTask);
}


export async function setGraphicsTasks(tasks: GraphicsTask[]): Promise<void> {
    const batch = tasks.map(task => {
        const taskRef = doc(firestore, 'graphics_tasks', task.id);
        return setDoc(taskRef, task, { merge: true }).catch(error => {
            const contextualError = new FirestorePermissionError({
              operation: 'write',
              path: taskRef.path,
              requestResourceData: task,
            });
            errorEmitter.emit('permission-error', contextualError);
            // We don't re-throw here to allow other tasks in the batch to proceed
        });
    });
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
    
    const updateData = { sections: updatedSections, status: newStatus };

    await updateDoc(jobRef, updateData).catch(error => {
        const contextualError = new FirestorePermissionError({
          operation: 'update',
          path: jobRef.path,
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', contextualError);
        throw contextualError;
    });
}

export async function addTapeheadsSubmission(report: Report): Promise<void> {
    const submissionRef = doc(firestore, 'tapeheads_submissions', report.id);
    await setDoc(submissionRef, report, {}).catch(error => {
        const contextualError = new FirestorePermissionError({
          operation: 'create',
          path: submissionRef.path,
          requestResourceData: report,
        });
        errorEmitter.emit('permission-error', contextualError);
        throw contextualError;
    });
}

export async function updateTapeheadsSubmission(updatedReport: Report): Promise<void> {
    const submissionRef = doc(firestore, 'tapeheads_submissions', updatedReport.id);
    await updateDoc(submissionRef, { ...updatedReport }).catch(error => {
        const contextualError = new FirestorePermissionError({
          operation: 'update',
          path: submissionRef.path,
          requestResourceData: updatedReport,
        });
        errorEmitter.emit('permission-error', contextualError);
        throw contextualError;
    });
}

export async function deleteTapeheadsSubmission(id: string): Promise<void> {
    const submissionRef = doc(firestore, 'tapeheads_submissions', id);
    await deleteDoc(submissionRef).catch(error => {
        const contextualError = new FirestorePermissionError({
          operation: 'delete',
          path: submissionRef.path
        });
        errorEmitter.emit('permission-error', contextualError);
        throw contextualError;
    });
}


export { type Report, type FilmsReport, type GantryReport, type GraphicsTask, type InspectionSubmission, type OeJob, type PreggerReport, type WorkItem, type TapeUsage };

