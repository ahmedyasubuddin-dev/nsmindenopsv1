import { createClient } from '../server';

export async function getTapeheadsSubmissions(filters?: {
  date?: string;
  shift?: number;
  status?: string;
}) {
  const supabase = await createClient();
  
  let query = supabase
    .from('tapeheads_submissions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.date) {
    query = query.eq('date', filters.date);
  }
  if (filters?.shift) {
    query = query.eq('shift', filters.shift);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch tapeheads submissions: ${error.message}`);
  }

  return data || [];
}

export async function getTapeheadsSubmissionById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('tapeheads_submissions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch submission: ${error.message}`);
  }

  return data;
}













