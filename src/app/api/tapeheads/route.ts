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
    const status = searchParams.get('status');

    // Use service client to bypass RLS
    const supabase = createServiceClient();

    let query = supabase
      .from('tapeheads_submissions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }
    if (shift) {
      query = query.eq('shift', parseInt(shift));
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tapeheads submissions:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Tapeheads GET error:', error);
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

    // Convert date string to date if needed
    const submissionData = {
      ...body,
      date: typeof body.date === 'string' ? body.date : body.date,
      created_by: session.userId, // Use userId from custom session
    };

    // Use service client to bypass RLS
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('tapeheads_submissions')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating tapeheads submission:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Tapeheads POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}











