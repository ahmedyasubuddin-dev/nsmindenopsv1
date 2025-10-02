
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
        updateDoc(taskRef, { ...task }, { merge: true }).catch(error => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: taskRef.path,
                    operation: 'update',
                    requestResourceData: task,
                })
            )
        });
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


export function addOeJob(db: Firestore, job: Omit<OeJob, 'id'>): void {
    const newJob = {
      oeBase: job.oeBase,
      status: 'pending',
      sections: job.sections.map(s => ({ ...s, completedPanels: [] })),
    };
    const jobsCollection = collection(db, 'jobs');
    addDoc(jobsCollection, newJob).catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: jobsCollection.path,
            operation: 'create',
            requestResourceData: newJob,
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
    
    try {
        const querySnapshot = await getDocs(jobsQuery);

        if (querySnapshot.empty) return;
        
        const jobDoc = querySnapshot.docs[0];
        const job = { id: jobDoc.id, ...jobDoc.data() } as OeJob;
        const jobRef = doc(db, 'jobs', job.id!);

        const sectionIndex = job.sections.findIndex(s => s.sectionId === sectionId);
        if (sectionIndex === -1) return;
        
        const updateData: any = {};
        updateData[`sections.${sectionIndex}.completedPanels`] = arrayUnion(...panels);

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

        updateDoc(jobRef, updateData).catch(error => {
             errorEmitter.emit(
              'permission-error',
              new FirestorePermissionError({
                path: jobRef.path,
                operation: 'update',
                requestResourceData: updateData,
              })
            );
        });
    } catch (error) {
         errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: `jobs`,
            operation: 'list',
          })
        );
    }
}

export function addTapeheadsSubmission(db: Firestore, report: Report): void {
    const submissionsCollection = collection(db, 'tapeheads_submissions');
    addDoc(submissionsCollection, report).catch(error => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: submissionsCollection.path,
                operation: 'create',
                requestResourceData: report,
            })
        );
    });
}

export function updateTapeheadsSubmission(db: Firestore, updatedReport: Report): void {
    const submissionRef = doc(db, 'tapeheads_submissions', updatedReport.id);
    updateDoc(submissionRef, { ...updatedReport }).catch(error => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: submissionRef.path,
                operation: 'update',
                requestResourceData: updatedReport,
            })
        );
    });
}

export function deleteTapeheadsSubmission(db: Firestore, id: string): void {
    const submissionRef = doc(db, 'tapeheads_submissions', id);
    deleteDoc(submissionRef).catch(error => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: submissionRef.path,
                operation: 'delete',
            })
        );
    });
}


export { type Report, type FilmsReport, type GantryReport, type GraphicsTask, type InspectionSubmission, type OeJob, type PreggerReport, type WorkItem, type TapeUsage };
