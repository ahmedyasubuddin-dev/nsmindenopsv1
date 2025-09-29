
'use server';

import fs from 'fs/promises';
import path from 'path';

// Define paths to the JSON data files
const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');
const filePaths = {
    // This file is now obsolete but kept for reference during migration
};

type DataType = keyof typeof filePaths;

// Helper to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Generic function to read data from a JSON file
export async function readData<T>(dataType: DataType): Promise<T> {
    // This function is being phased out in favor of Firestore.
    // Returning an empty array to prevent errors during transition.
    console.warn(`[Deprecation] readData called for ${dataType}. This should be migrated to Firestore.`);
    return [] as T;
}


// Generic function to write data to a JSON file
export async function writeData(dataType: DataType, data: any): Promise<void> {
    // This function is being phased out in favor of Firestore.
     console.warn(`[Deprecation] writeData called for ${dataType}. This should be migrated to Firestore.`);
}
