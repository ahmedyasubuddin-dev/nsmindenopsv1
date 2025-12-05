import { createClient } from '../server';

export async function getReportsByDepartment(
  department: 'pregger' | 'gantry' | 'films',
  filters?: {
    date?: string;
    shift?: string | number;
  }
) {
  const supabase = await createClient();
  
  const tableName = `${department}_reports` as 'pregger_reports' | 'gantry_reports' | 'films_reports';
  
  let query = supabase
    .from(tableName)
    .select('*')
    .order('report_date', { ascending: false });

  if (filters?.date) {
    if (department === 'gantry') {
      query = query.eq('date', filters.date);
    } else {
      query = query.eq('report_date::date', filters.date);
    }
  }
  if (filters?.shift) {
    query = query.eq('shift', filters.shift);
  }

  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch ${department} reports: ${error.message}`);
  }

  return data || [];
}













