import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { summarizeShift } from '@/ai/flows/summarize-shift-flow';
import type { Report } from '@/lib/types';
import { validateCustomSession } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const session = await validateCustomSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { entries } = body;

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Entries array is required' },
        { status: 400 }
      );
    }

    // Validate entries are Report objects
    const reports: Report[] = entries.map((entry: any) => ({
      id: entry.id || '',
      operatorName: entry.operatorName || entry.operator_name || '',
      shift: entry.shift,
      thNumber: entry.thNumber || entry.th_number || '',
      date: new Date(entry.date),
      status: entry.status || 'Submitted',
      shiftStartTime: entry.shiftStartTime || entry.shift_start_time,
      shiftEndTime: entry.shiftEndTime || entry.shift_end_time,
      total_meters: entry.total_meters || 0,
      endOfShiftStatus: entry.endOfShiftStatus || entry.end_of_shift_status,
      workItems: entry.workItems || [],
    }));

    // Call the AI summarization flow
    const summary = await summarizeShift(reports);

    return NextResponse.json({ data: { summary } });
  } catch (error) {
    console.error('Summarize shift error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}











