
'use server';
/**
 * @fileOverview A flow for creating new users and storing their profiles in Firestore.
 *
 * - createUser - A function that handles user creation in Firebase Auth and Firestore.
 * - CreateUserInput - The input type for the createUser function.
 * - CreateUserOutput - The return type for the createUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const CreateUserOutputSchema = z.object({
  uid: z.string(),
  email: z.string(),
  role: z.string(),
});
export type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;

export async function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
  return createUserFlow(input);
}

const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async ({ email, password, role }) => {
    await initFirebaseAdmin();
    const auth = getAuth();
    const firestore = getFirestore();

    // 1. Create the user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // 2. Set the custom claim for the user's role
    await auth.setCustomUserClaims(userRecord.uid, { role });

    // 3. Create the user profile in Firestore
    const userProfile = {
      email,
      role,
      disabled: false,
      createdAt: new Date().toISOString(),
    };

    await firestore.collection('users').doc(userRecord.uid).set(userProfile);

    return {
      uid: userRecord.uid,
      email: userRecord.email!,
      role,
    };
  }
);
