
export type UserRole =
  | 'superuser'
  | 'b2_supervisor'
  | 'b1_supervisor'
  | 'quality_manager'
  | 'management'
  | 'pregger_lead'
  | 'tapehead_operator'
  | 'tapehead_lead'
  | 'gantry_lead'
  | 'films_lead'
  | 'graphics_lead'
  | null;

export type Permission = 
  // Navigation Links
  | 'nav:dashboard'
  | 'nav:report:pregger'
  | 'nav:report:tapeheads'
  | 'nav:report:gantry'
  | 'nav:report:films'
  | 'nav:report:graphics'
  | 'nav:review:tapeheads'
  | 'nav:analytics' // A parent permission to see the main menu
  | 'nav:analytics:pregger'
  | 'nav:analytics:tapeheads'
  | 'nav:analytics:gantry'
  | 'nav:analytics:films'
  | 'nav:analytics:graphics'
  | 'nav:qc'
  | 'nav:status'
  | 'nav:file-processing'
  | 'nav:admin';

const allAnalytics: Permission[] = [
    'nav:analytics',
    'nav:analytics:pregger',
    'nav_analytics_tapeheads',
    'nav:analytics:gantry',
    'nav:analytics:films',
    'nav:analytics:graphics',
];

const roles: Record<Exclude<UserRole, null>, Permission[]> = {
    'superuser': [
        'nav:dashboard',
        'nav:report:pregger', 'nav:report:tapeheads', 'nav:report:gantry', 'nav:report:films', 'nav:report:graphics',
        'nav:review:tapeheads',
        'nav:analytics', 'nav:analytics:pregger', 'nav:analytics:tapeheads', 'nav:analytics:gantry', 'nav:analytics:films', 'nav-analytics:graphics',
        'nav:qc',
        'nav:status',
        'nav:file-processing',
        'nav:admin',
    ],
    'b2_supervisor': [
        'nav:dashboard',
        'nav:report:pregger', 
        'nav:report:tapeheads',
        'nav:review:tapeheads',
        'nav:analytics', 'nav:analytics:pregger', 'nav:analytics:tapeheads',
        'nav:status',
    ],
    'b1_supervisor': [
        'nav:dashboard',
        'nav:report:gantry', 
        'nav:report:films', 
        'nav:report:graphics',
        'nav:analytics', 'nav:analytics:gantry', 'nav:analytics:films', 'nav:analytics:graphics',
        'nav:status',
    ],
    'quality_manager': [
        'nav:dashboard',
        'nav:qc',
        'nav:status',
        'nav:analytics',
    ],
    'management': [
        'nav:dashboard',
        'nav:status',
        'nav:analytics',
    ],
    'pregger_lead': ['nav:dashboard', 'nav:report:pregger', 'nav:status'],
    'tapehead_operator': ['nav:dashboard', 'nav:report:tapeheads'],
    'tapehead_lead': ['nav:dashboard', 'nav:report:tapeheads', 'nav:review:tapeheads', 'nav:status'],
    'gantry_lead': ['nav:dashboard', 'nav:report:gantry', 'nav:status'],
    'films_lead': ['nav:dashboard', 'nav:report:films', 'nav:status'],
    'graphics_lead': ['nav:dashboard', 'nav:report:graphics', 'nav:status'],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
    if (!role) return false;
    // Superuser has all permissions
    if (role === 'superuser') return true;
    
    // Check for parent analytics permission
    if (permission.startsWith('nav:analytics:') && roles[role]?.includes('nav:analytics')) {
        return true;
    }

    return roles[role]?.includes(permission) || false;
}

// This function is now deprecated in favor of custom claims, but kept for reference.
export function getRoleFromEmail(email?: string | null): UserRole {
    return null;
}
