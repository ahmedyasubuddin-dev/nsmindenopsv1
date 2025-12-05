import type { Report } from '@/lib/types';

/**
 * Fetches all Tapeheads submissions from the API.
 */
export async function getTapeheadsSubmissions(): Promise<Report[]> {
    try {
        const response = await fetch('/api/tapeheads');
        if (!response.ok) {
            throw new Error('Failed to fetch tapeheads submissions');
        }
        const result = await response.json();
        return (result.data || []).map((item: any) => ({
            ...item,
            date: new Date(item.date),
        })) as Report[];
    } catch (error) {
        console.error('Error fetching tapeheads submissions:', error);
        throw error;
    }
}

/**
 * Adds or updates a Tapeheads submission.
 */
export async function saveTapeheadsSubmission(report: Report): Promise<Report> {
    try {
        const url = report.id ? `/api/tapeheads/${report.id}` : '/api/tapeheads';
        const method = report.id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...report,
                date: report.date instanceof Date ? report.date.toISOString() : report.date,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save submission');
        }

        const result = await response.json();
        return {
            ...result.data,
            date: new Date(result.data.date),
        } as Report;
    } catch (error) {
        console.error('Error saving tapeheads submission:', error);
        throw error;
    }
}

/**
 * Deletes a Tapeheads submission.
 */
export async function deleteTapeheadsSubmission(reportId: string): Promise<void> {
    try {
        const response = await fetch(`/api/tapeheads/${reportId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete submission');
        }
    } catch (error) {
        console.error('Error deleting tapeheads submission:', error);
        throw error;
    }
}

    