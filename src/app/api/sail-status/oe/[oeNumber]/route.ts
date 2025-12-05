import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { validateCustomSession } from '@/lib/auth-helpers';

// Get comprehensive sail status for an OE number across all departments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ oeNumber: string }> }
) {
  try {
    const session = await validateCustomSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { oeNumber } = await params;

    // Use service client to bypass RLS
    const supabase = createServiceClient();

    // Fetch data from all relevant tables
    const [
      tapeheadsResult,
      filmsResult,
      gantryResult,
      qcResult,
      jobsResult,
    ] = await Promise.all([
      // Tapeheads submissions
      supabase
        .from('tapeheads_submissions')
        .select('*')
        .order('date', { ascending: false }),

      // Films reports
      supabase
        .from('films_reports')
        .select('*')
        .order('report_date', { ascending: false }),

      // Gantry reports
      supabase
        .from('gantry_reports')
        .select('*')
        .order('date', { ascending: false }),

      // QC inspections
      supabase
        .from('qc_inspections')
        .select('*')
        .eq('oe_number', oeNumber)
        .order('inspection_date', { ascending: false }),

      // Jobs (OE definitions)
      supabase
        .from('jobs')
        .select('*')
        .eq('oe_base', oeNumber),
    ]);

    // Process and combine data
    const tapeheadsSubmissions = tapeheadsResult.data || [];
    const filmsReports = filmsResult.data || [];
    const gantryReports = gantryResult.data || [];
    const qcInspections = qcResult.data || [];
    const oeJobs = jobsResult.data || [];

    // Filter tapeheads submissions for this OE
    const relevantTapeheads = tapeheadsSubmissions.filter((submission: any) => {
      const workItems = submission.work_items || [];
      return workItems.some((item: any) => item.oeNumber === oeNumber);
    });

    // Extract sail numbers (OE-Section format) from tapeheads
    const sailNumbers = new Set<string>();
    relevantTapeheads.forEach((submission: any) => {
      (submission.work_items || []).forEach((item: any) => {
        if (item.oeNumber === oeNumber) {
          sailNumbers.add(`${item.oeNumber}-${item.section}`);
        }
      });
    });

    // Build comprehensive status for each sail
    const sailStatuses = Array.from(sailNumbers).map(sailNumber => {
      // Find tapeheads data
      const tapeheadsData = relevantTapeheads
        .flatMap((s: any) => (s.work_items || []).filter((wi: any) => `${wi.oeNumber}-${wi.section}` === sailNumber))
        .map((wi: any) => ({
          ...wi,
          submission: relevantTapeheads.find((s: any) =>
            (s.work_items || []).some((item: any) => `${item.oeNumber}-${item.section}` === sailNumber)
          ),
        }));

      // Find films data
      const filmsData = filmsReports
        .flatMap((fr: any) => [
          ...(fr.sails_finished || []).map((s: any) => ({ ...s, type: 'finished', report: fr })),
          ...(fr.sails_started || []).map((s: any) => ({ ...s, type: 'started', report: fr })),
        ])
        .filter((s: any) => s.sail_number === sailNumber);

      // Find gantry data
      const gantryData = gantryReports
        .flatMap((gr: any) =>
          (gr.molds || []).flatMap((m: any) =>
            (m.sails || []).map((s: any) => ({ ...s, mold: m, report: gr }))
          )
        )
        .filter((s: any) => s.sail_number === sailNumber);

      // Find QC data
      const qcData = qcInspections.filter((qc: any) =>
        qc.oe_number === oeNumber && sailNumber.includes(qc.oe_number)
      );

      // Find job/section info
      const section = sailNumber.split('-')[1];
      const job = oeJobs.find((j: any) => j.oe_base === oeNumber);
      const sectionInfo = job?.sections?.find((s: any) => s.sectionId === section);

      return {
        sailNumber,
        oeNumber,
        section,
        tapeheads: tapeheadsData,
        films: filmsData,
        gantry: gantryData,
        qc: qcData,
        jobInfo: {
          oeBase: job?.oe_base,
          status: job?.status,
          section: sectionInfo,
        },
      };
    });

    return NextResponse.json({
      data: {
        oeNumber,
        sails: sailStatuses,
        summary: {
          totalSails: sailStatuses.length,
          tapeheadsEntries: relevantTapeheads.length,
          filmsEntries: filmsReports.length,
          gantryEntries: gantryReports.length,
          qcEntries: qcInspections.length,
        },
      },
    });
  } catch (error) {
    console.error('Sail status GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}











