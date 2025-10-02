
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
    endOfShiftStatus: 'Completed' | 'In Progress';
    layer: string;
    tapes: TapeUsage[];
    total_meters: number;
    total_tapes: number;
    had_spin_out: boolean;
    spin_outs: number;
    spin_out_duration_minutes: number;
    issues: { problem_reason: string; duration_minutes: number }[];
    panelsWorkedOn: string[];
    nestedPanels: string[];
}

export interface Report {
  id: string;
  operatorName: string;
  shift: Shift;
  thNumber: string;
  date: Date;
  status: 'Submitted' | 'Approved' | 'Requires Attention';
  shiftLeadName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  hoursWorked: number;
  metersPerManHour: number;
  workItems: WorkItem[];
  checklist: any;
  total_meters: number;
  leadComments?: string;
  comments?: string;
}

export interface GantryReport {
    id: string;
    date: Date;
    shift: string;
    personnel: {name: string}[];
    molds?: {
        mold_number: string;
        sails?: {
            sail_number: string;
            stage_of_process?: string;
            issues?: string;
        }[];
        images?: any[];
        downtime_caused?: boolean;
    }[];
    downtime?: {
        reason: string;
        duration: number;
    }[];
    maintenance?: {
        duration: number;
    }[];
}

export interface PreggerReport {
    id: string;
    report_date: string;
    shift: number;
    workCompleted: {
        tape_id: string;
        meters: number;
        waste_meters: number;
    }[];
    personnel: {
        name: string;
        start_time: string;
        end_time: string;
    }[];
    downtime?: {
        reason: string;
        duration_minutes: number;
    }[];
}

export interface GraphicsTask {
  id: string;
  type: 'cutting' | 'inking';
  tagId: string;
  status: 'todo' | 'inProgress' | 'done';
  content: string;
  tagType: 'Sail' | 'Decal';
  sidedness?: 'Single-Sided' | 'Double-Sided';
  sideOfWork?: 'Port' | 'Starboard';
  startedAt: string;
  completedAt?: string;
  durationMins?: number;
  personnelCount?: number;
  workTypes?: string[];
  tapeUsed?: boolean;
  isFinished?: boolean;
}

    