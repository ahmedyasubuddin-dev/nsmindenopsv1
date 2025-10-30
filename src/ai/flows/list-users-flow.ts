
'use server';
/**
 * @fileOverview A flow for listing all users from Firebase Authentication and Firestore.
 *
 * - listUsers - A function that fetches all user records.
 * - ListUsersOutput - The return type for the listUsers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  role: z.string().optional(),
  disabled: z.boolean().optional(),
});

const ListUsersOutputSchema = z.array(UserProfileSchema);
export type ListUsersOutput = z.infer<typeof ListUsersOutputSchema>;

export async function listUsers(): Promise<ListUsersOutput> {
  return listUsersFlow();
}

const listUsersFlow = ai.defineFlow(
  {
    name: 'listUsersFlow',
    inputSchema: z.void(),
    outputSchema: ListUsersOutputSchema,
  },
  async () => {
    await initFirebaseAdmin();
    const auth = getAuth();
    const firestore = getFirestore();

    // 1. Get all users from Firebase Auth
    const listUsersResult = await auth.listUsers(1000);
    const authUsers = listUsersResult.users;

    // 2. Get all user profiles from Firestore
    const usersCollection = await firestore.collection('users').get();
    const firestoreUsers = new Map(
        usersCollection.docs.map(doc => [doc.id, doc.data()])
    );

    // 3. Combine Auth and Firestore data
    const combinedUsers = authUsers.map(userRecord => {
      const firestoreProfile = firestoreUsers.get(userRecord.uid);
      return {
        id: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        disabled: userRecord.disabled,
        // Prioritize role from custom claims, fall back to Firestore
        role: (userRecord.customClaims?.role as string) || firestoreProfile?.role || 'N/A',
      };
    });

    return combinedUsers;
  }
);
