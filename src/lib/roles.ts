
export type UserRole = 
  | 'Superuser'
  | 'B2 Supervisor'
  | 'B1 Supervisor'
  | 'Quality Manager'
  | 'Management'
  | 'Pregger Lead'
  | 'Tapehead Operator'
  | 'Tapehead Lead'
  | 'Gantry Lead'
  | 'Films Lead'
  | 'Graphics Lead';

export type Permission = 
  // Navigation Links
  | 'nav:dashboard'
  | 'nav:report:pregger'
  | 'nav:report:tapeheads'
  | 'nav:report:gantry'
  | 'nav:report:films'
  | 'nav:report:graphics'
  | 'nav:review:tapeheads'
  | 'nav:analytics'
  | 'nav:analytics:pregger'
  | 'nav:analytics:tapeheads'
  | 'nav:analytics:gantry'
  | 'nav:analytics:films'
  | 'nav:analytics:graphics'
  | 'nav:qc'
  | 'nav:status'
  | 'nav:file-processing';

const roles: Record<UserRole, Permission[]> = {
    'Superuser': [
        'nav:dashboard',
        'nav:report:pregger', 'nav:report:tapeheads', 'nav:report:gantry', 'nav:report:films', 'nav:report:graphics',
        'nav:review:tapeheads',
        'nav:analytics', 'nav:analytics:pregger', 'nav:analytics:tapeheads', 'nav:analytics:gantry', 'nav:analytics:films', 'nav:analytics:graphics',
        'nav:qc',
        'nav:status',
        'nav:file-processing',
    ],
    'B2 Supervisor': [
        'nav:dashboard',
        'nav:report:pregger', 'nav:report:tapeheads',
        'nav:review:tapeheads',
        'nav:analytics', 'nav:analytics:pregger', 'nav:analytics:tapeheads', 'nav:analytics:gantry', 'nav:analytics:films', 'nav:analytics:graphics',
        'nav:status',
    ],
    'B1 Supervisor': [
        'nav:dashboard',
        'nav:report:gantry', 'nav:report:films', 'nav:report:graphics',
        'nav:analytics', 'nav:analytics:pregger', 'nav:analytics:tapeheads', 'nav:analytics:gantry', 'nav:analytics:films', 'nav:analytics:graphics',
        'nav:status',
    ],
    'Quality Manager': [
        'nav:dashboard',
        'nav:qc',
        'nav:status',
        'nav:analytics', 'nav:analytics:pregger', 'nav:analytics:tapeheads', 'nav:analytics:gantry', 'nav:analytics:films', 'nav:analytics:graphics',
    ],
    'Management': [
        'nav:dashboard',
        'nav:status',
        'nav:analytics', 'nav:analytics:pregger', 'nav:analytics:tapeheads', 'nav:analytics:gantry', 'nav:analytics:films', 'nav:analytics:graphics',
    ],
    'Pregger Lead': ['nav:dashboard', 'nav:report:pregger', 'nav:status'],
    'Tapehead Operator': ['nav:dashboard', 'nav:report:tapeheads'],
    'Tapehead Lead': ['nav:dashboard', 'nav:report:tapeheads', 'nav:status', 'nav:review:tapeheads'],
    'Gantry Lead': ['nav:dashboard', 'nav:report:gantry', 'nav:status'],
    'Films Lead': ['nav:dashboard', 'nav:report:films', 'nav:status'],
    'Graphics Lead': ['nav:dashboard', 'nav:report:graphics', 'nav:status'],
};

export function hasPermission(role: UserRole | null, permission: Permission): boolean {
    if (!role) return false;
    // Superuser has all permissions
    if (role === 'Superuser') return true;
    return roles[role]?.includes(permission) || false;
}

export const emailToRoleMap: Record<string, UserRole> = {
    'superuser@ns.com': 'Superuser',
    'b2_supervisor@ns.com': 'B2 Supervisor',
    'b1_supervisor@ns.com': 'B1 Supervisor',
    'quality_manager@ns.com': 'Quality Manager',
    'management@ns.com': 'Management',
    'pregger_lead@ns.com': 'Pregger Lead',
    'tapehead_operator@ns.com': 'Tapehead Operator',
    'tapehead_lead@ns.com': 'Tapehead Lead',
    'gantry_lead@ns.com': 'Gantry Lead',
    'films_lead@ns.com': 'Films Lead',
    'graphics_lead@ns.com': 'Graphics Lead',
};

export function getRoleFromEmail(email: string | null): UserRole | null {
    if (!email) return null;
    return emailToRoleMap[email] || null;
}
