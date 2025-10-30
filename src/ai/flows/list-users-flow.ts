
'use server';
/**
 * @fileOverview A flow for listing all users from Firebase Authentication and Firestore.
 *
 * - listUsers - A function that fetches all user records.
 * - ListUsersOutput - The return type for the listUsers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
    // MOCK IMPLEMENTATION: This is a placeholder.
    // In a real application, this would use the Firebase Admin SDK to list users.
    console.log("[Mock] Listing users from mock data source.");
    
    // Return a mock list of users for UI development.
    const mockUsers: ListUsersOutput = [
      {
        id: 'mock_uid_1',
        email: 'superuser@northsails.com',
        displayName: 'Super User',
        role: 'Superuser',
        disabled: false,
      },
      {
        id: 'mock_uid_2',
        email: 'tapelead@northsails.com',
        displayName: 'Tape Lead',
        role: 'Tapehead Lead',
        disabled: false,
      },
      {
        id: 'mock_uid_3',
        email: 'operator@northsails.com',
        displayName: 'Tape Operator',
        role: 'Tapehead Operator',
        disabled: true,
      }
    ];

    return mockUsers;
  }
);
