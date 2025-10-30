
import type { Report } from '@/lib/types';

// MOCK DATA - Replace with your actual backend call (e.g., Supabase)
const mockSubmissions: Report[] = [
  {
    id: "mock_1", operatorName: "John Doe", shift: 1, thNumber: "TH-1", date: new Date(), status: "Submitted", total_meters: 1250,
    workItems: [{ oeNumber: "OAUS32160", section: "001", endOfShiftStatus: 'Completed', panelsWorkedOn: ["P1", "P2"], total_meters: 1250, total_tapes: 1, had_spin_out: false, tapes: [] }],
    checklist: { smoothFuseFull: true, bladesGlasses: true, paperworkUpToDate: true, debriefNewOperator: true, electricScissor: true, tubesAtEndOfTable: true, sprayTracksOnBridge: true, sharpiePens: true, broom: true, cleanedWorkStation: true, meterStickTwoIrons: true, thIsleTrashEmpty: true }
  },
  {
    id: "mock_2", operatorName: "Jane Smith", shift: 1, thNumber: "TH-2", date: new Date(), status: "Submitted", total_meters: 980,
    workItems: [{ oeNumber: "OAUS32160", section: "002", endOfShiftStatus: 'In Progress', layer: "8 of 15", panelsWorkedOn: ["P10"], total_meters: 980, total_tapes: 1, had_spin_out: true, spin_outs: 1, spin_out_duration_minutes: 15, tapes: [] }],
    checklist: { smoothFuseFull: true, bladesGlasses: true, paperworkUpToDate: false, debriefNewOperator: false, electricScissor: true, tubesAtEndOfTable: true, sprayTracksOnBridge: true, sharpiePens: true, broom: true, cleanedWorkStation: false, meterStickTwoIrons: true, thIsleTrashEmpty: true }
  },
   {
    id: "mock_3", operatorName: "Mike Ross", shift: 2, thNumber: "TH-4", date: new Date(), status: "Submitted", total_meters: 1500,
    workItems: [{ oeNumber: "OAUS32161", section: "001", endOfShiftStatus: 'Completed', panelsWorkedOn: ["P1", "P2", "P3"], total_meters: 1500, total_tapes: 1, had_spin_out: false, tapes: [] }],
    checklist: { smoothFuseFull: true, bladesGlasses: true, paperworkUpToDate: true, debriefNewOperator: true, electricScissor: true, tubesAtEndOfTable: true, sprayTracksOnBridge: true, sharpiePens: true, broom: true, cleanedWorkStation: true, meterStickTwoIrons: true, thIsleTrashEmpty: true }
  }
];


/**
 * Fetches all Tapeheads submissions.
 * This is a mock implementation. Replace with your Supabase client call.
 */
export async function getTapeheadsSubmissions(): Promise<Report[]> {
    console.log("Fetching mock Tapeheads submissions...");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real Supabase implementation, you would do:
    // const { data, error } = await supabase.from('tapeheads_submissions').select('*');
    // if (error) throw error;
    // return data;

    return mockSubmissions;
}

/**
 * Adds or updates a Tapeheads submission.
 * This is a mock implementation.
 */
export async function saveTapeheadsSubmission(report: Report): Promise<Report> {
    console.log("Saving mock Tapeheads submission:", report);
    await new Promise(resolve => setTimeout(resolve, 300));
    return report;
}

/**
 * Deletes a Tapeheads submission.
 * This is a mock implementation.
 */
export async function deleteTapeheadsSubmission(reportId: string): Promise<void> {
    console.log("Deleting mock Tapeheads submission:", reportId);
    await new Promise(resolve => setTimeout(resolve, 300));
    return;
}

    