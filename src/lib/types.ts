
export type Department = 'Pregger' | 'Tapeheads' | 'Gantry' | 'Films' | 'Graphics';

export type Shift = 1 | 2 | 3;

export interface ShiftData {
  name: string;
  total: number;
}

export interface DepartmentData {
  label: Department;
  data: ShiftData[];
}

export interface TapeUsage {
    tapeId: string;
    metersProduced: number;
    metersWasted: number;
}

export interface WorkItem {
    oeNumber: string;
    section: string;
    materialType: 'individual' | 'nested';
    endOfShiftStatus: 'Completed' | 'In Progress';
    layer?: string;
    tapes: TapeUsage[];
    total_meters: number;
    total_tapes: number;
    had_spin_out: boolean;
    spin_outs?: number;
    spin_out_duration_minutes?: number;
    issues?: { problem_reason: string; duration_minutes?: number }[];
    panelsWorkedOn: string[];
    nestedPanels?: string[];
}

export interface Report {
  id: string;
  operatorName: string;
  shift: Shift;
  thNumber: string;
  date: Date;
  status: 'Submitted' | 'Approved' | 'Requires Attention';
  comments?: string;
  leadComments?: string;
  shiftLeadName?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  hoursWorked?: number;
  workItems?: WorkItem[];
  // Deprecated fields - will be removed later
  endOfShiftStatus?: 'Completed' | 'In Progress';
  layer?: string;
  total_meters: number;
  order_entry?: string; // For backwards compatibility with old data
  // Department-specific fields
  [key: string]: any;
}
