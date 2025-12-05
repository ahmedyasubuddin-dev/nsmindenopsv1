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
    const oeNumber = searchParams.get('oe_number');
    const status = searchParams.get('status');

    // Use service client to bypass RLS
    const supabase = createServiceClient();

    let query = supabase
      .from('qc_inspections')
      .select('*')
      .order('inspection_date', { ascending: false });

    if (date) {
      query = query.eq('inspection_date::date', date);
    }
    if (oeNumber) {
      query = query.eq('oe_number', oeNumber);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching QC inspections:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('QC GET error:', error);
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
    const inspectionData = {
      ...body,
      created_by: session.userId, // Use userId from custom session
    };

    // Use service client to bypass RLS
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('qc_inspections')
      .insert(inspectionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating QC inspection:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('QC POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}














