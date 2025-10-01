
'use client';
import {
    collection,
    addDoc,
    Firestore,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Query,
    CollectionReference,
    DocumentData,
    arrayUnion
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import type { Report, FilmsReport, GantryReport, GraphicsTask, InspectionSubmission, OeJob, PreggerReport, WorkItem, TapeUsage } from './types';

export async function getGraphicsTasks(db: Firestore): Promise<GraphicsTask[]> {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, 'graphics_tasks'));
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => doc.data() as GraphicsTask);
}

export async function setGraphicsTasks(db: Firestore, tasks: GraphicsTask[]): Promise<void> {
    if (!db) return;
    for (const task of tasks) {
        const taskRef = doc(db, 'graphics_tasks', task.id);
        await updateDoc(taskRef, { ...task }, { merge: true });
    }
}

export function addFilmsReport(db: Firestore, report: any): void {
  const filmsCollection = collection(db, 'films');
  addDoc(filmsCollection, report).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: filmsCollection.path,
        operation: 'create',
        requestResourceData: report,
      })
    );
  });
}


export async function markPanelsAsCompleted(db: Firestore, oeBase: string, sectionId: string, panels: string[]): Promise<void> {
    if (!db) {
        console.error("Firestore instance is not available.");
        return;
    }
    const jobsQuery = query(collection(db, 'jobs'), where('oeBase', '==', oeBase));
    const querySnapshot = await getDocs(jobsQuery);

    if (querySnapshot.empty) return;
    
    const jobDoc = querySnapshot.docs[0];
    const job = { id: jobDoc.id, ...jobDoc.data() } as OeJob;
    const jobRef = doc(db, 'jobs', job.id!);

    const sectionIndex = job.sections.findIndex(s => s.sectionId === sectionId);
    if (sectionIndex === -1) return;
    
    const updateData: any = {};
    // Atomically add new elements to the completedPanels array
    updateData[`sections.${sectionIndex}.completedPanels`] = arrayUnion(...panels);

    // After calculating new status, update it
    const updatedSections = [...job.sections];
    const currentCompleted = updatedSections[sectionIndex].completedPanels || [];
    updatedSections[sectionIndex].completedPanels = [...new Set([...currentCompleted, ...panels])];

    const allSectionsComplete = updatedSections.every(s => {
        const totalPanels = s.panelEnd - s.panelStart + 1;
        return (s.completedPanels?.length || 0) >= totalPanels;
    });

    if (allSectionsComplete) {
        updateData['status'] = 'completed';
    } else if (updatedSections.some(s => (s.completedPanels?.length || 0) > 0)) {
        updateData['status'] = 'in-progress';
    }

    await updateDoc(jobRef, updateData);
}

export async function addTapeheadsSubmission(db: Firestore, report: Report): Promise<void> {
    await addDoc(collection(db, 'tapeheads_submissions'), report);
}

export async function updateTapeheadsSubmission(db: Firestore, updatedReport: Report): Promise<void> {
    const submissionRef = doc(db, 'tapeheads_submissions', updatedReport.id);
    await updateDoc(submissionRef, { ...updatedReport });
}

export async function deleteTapeheadsSubmission(db: Firestore, id: string): Promise<void> {
    const submissionRef = doc(db, 'tapeheads_submissions', id);
    await deleteDoc(submissionRef);
}


export { type Report, type FilmsReport, type GantryReport, type GraphicsTask, type InspectionSubmission, type OeJob, type PreggerReport, type WorkItem, type TapeUsage };
