import { createClient } from '../server';

export async function getDepartmentAnalytics(
  department: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();
  
  // Use the database function we created
  const { data, error } = await supabase.rpc('get_department_analytics', {
    dept_name: department,
    start_date: startDate,
    end_date: endDate,
  });

  if (error) {
    console.error('Analytics function error:', error);
    // Fallback to manual aggregation if function doesn't work
    return getManualAnalytics(department, startDate, endDate);
  }

  return data;
}

async function getManualAnalytics(
  department: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();

  switch (department) {
    case 'Tapeheads': {
      const { data, error } = await supabase
        .from('tapeheads_submissions')
        .select('shift, total_meters')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const byShift = data.reduce((acc: any, item: any) => {
        const shift = item.shift;
        if (!acc[shift]) {
          acc[shift] = { shift, total_meters: 0, count: 0 };
        }
        acc[shift].total_meters += item.total_meters || 0;
        acc[shift].count += 1;
        return acc;
      }, {});

      return {
        total_meters: data.reduce((sum: number, item: any) => sum + (item.total_meters || 0), 0),
        total_submissions: data.length,
        by_shift: Object.values(byShift),
      };
    }
    default:
      return {};
  }
}













