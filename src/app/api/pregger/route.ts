import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { validateCustomSession } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await validateCustomSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const shift = searchParams.get('shift');

    // Use service client to bypass RLS
    const supabase = createServiceClient();

    let query = supabase
      .from('pregger_reports')
      .select('*')
      .order('report_date', { ascending: false });

    if (date) {
      query = query.eq('report_date::date', date);
    }
    if (shift) {
      query = query.eq('shift', shift);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pregger reports:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Pregger GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const reportData = {
      ...body,
      created_by: session.userId, // Use userId from custom session
    };

    // Use service client to bypass RLS
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('pregger_reports')
      .insert(reportData)
      .select()
      .single();

    if (error) {
      console.error('Error creating pregger report:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Pregger POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}











