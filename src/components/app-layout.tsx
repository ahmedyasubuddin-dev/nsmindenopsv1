
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Home,
  FileText,
  Users,
  Building2,
  GanttChartSquare,
  Film,
  Paintbrush,
  ChevronDown,
  ClipboardList,
  AreaChart,
  Waypoints,
  ClipboardCheck,
  FilePlus,
  ShieldCheck,
  PackageSearch,
  LogOut,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import { Logo } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAppTitle } from "./app-title-context";
import { hasPermission, UserRole } from "@/lib/roles";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";

const departments = [
  { name: 'Pregger', href: '/report/pregger', icon: Building2, permission: 'nav:report:pregger' },
  { name: 'Tapeheads', href: '/report/tapeheads', icon: Users, permission: 'nav:report:tapeheads' },
  { name: 'Gantry', href: '/report/gantry', icon: GanttChartSquare, permission: 'nav:report:gantry' },
  { name: 'Films', href: '/report/films', icon: Film, permission: 'nav:report:films' },
  { name: 'Graphics', href: '/report/graphics', icon: Paintbrush, permission: 'nav:report:graphics' },
] as const;

const analyticsDepartments = [
  { name: 'Pregger', href: '/analytics/pregger', icon: Building2, permission: 'nav:analytics:pregger' },
  { name: 'Tapeheads', href: '/analytics/tapeheads', icon: Users, permission: 'nav:analytics:tapeheads' },
  { name: 'Gantry', href: '/analytics/gantry', icon: GanttChartSquare, permission: 'nav:analytics:gantry' },
  { name: 'Films', href: '/analytics/films', icon: Film, permission: 'nav:analytics:films' },
  { name: 'Graphics', href: '/analytics/graphics', icon: Paintbrush, permission: 'nav:analytics:graphics' },
] as const;


function useTheme() {
  const [theme, setThemeState] = React.useState('light');

  React.useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setThemeState(isDarkMode ? 'dark' : 'light');
  }, []);

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      setThemeState(systemTheme);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      setThemeState(theme);
    }
  };

  return { theme, setTheme };
}


function UserNav() {
  const { user, role } = useUser();
  const firebaseAuth = useAuth();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
      await signOut(firebaseAuth);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://placehold.co/40x40" alt="@shadcn" />
            <AvatarFallback>SL</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{role || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="ml-2">Toggle theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MainSidebar() {
  const pathname = usePathname();
  const { title } = useAppTitle();
  const { user, role } = useUser();

  const [isReportsOpen, setReportsOpen] = React.useState(pathname.startsWith('/report'));
  const [isLeadFuncsOpen, setLeadFuncsOpen] = React.useState(
      pathname.startsWith("/analytics") || pathname.startsWith('/review') || pathname.startsWith('/file-processing') || pathname.startsWith('/qc') || pathname.startsWith('/status')
  );
  const [isDeptAnalyticsOpen, setDeptAnalyticsOpen] = React.useState(pathname.startsWith('/analytics'));

  const can = (permission: any) => hasPermission(role, permission);
  
  const visibleReportDepts = departments.filter(dept => can(dept.permission));
  const visibleAnalyticsDepts = analyticsDepartments.filter(dept => can(dept.permission));

  const canSeeAnyReports = visibleReportDepts.length > 0;
  const canSeeLeadFunctions = can('nav:file-processing') || can('nav:status') || can('nav:review:tapeheads') || can('nav:qc') || visibleAnalyticsDepts.length > 0;
  const canSeeAnyAnalytics = visibleAnalyticsDepts.length > 0;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="size-8 text-sidebar-primary" />
          <span className="text-lg font-semibold font-headline text-sidebar-primary-foreground">
            {title}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {can('nav:dashboard') && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Dashboard">
                <Link href="/dashboard"><Home /><span>Dashboard</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {canSeeAnyReports && (
             <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setReportsOpen(!isReportsOpen)} isActive={pathname.startsWith("/report")}>
                  <FileText />
                  <span>Report Entry</span>
                  <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-200", isReportsOpen && "rotate-180")} />
                </SidebarMenuButton>
                {isReportsOpen && (
                  <SidebarMenuSub>
                    {visibleReportDepts.map((dept) => (
                      <SidebarMenuSubItem key={dept.name}>
                        <SidebarMenuSubButton asChild isActive={pathname === dept.href}>
                          <Link href={dept.href}><dept.icon /><span>{dept.name}</span></Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
          )}

           {canSeeLeadFunctions && (
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setLeadFuncsOpen(!isLeadFuncsOpen)} isActive={isLeadFuncsOpen}>
                  <AreaChart />
                  <span>Lead Functions</span>
                  <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-200", isLeadFuncsOpen && "rotate-180")}/>
                </SidebarMenuButton>
                {isLeadFuncsOpen && (
                  <SidebarMenuSub>
                    {can('nav:file-processing') && (<SidebarMenuSubItem><SidebarMenuSubButton asChild isActive={pathname === '/file-processing'}><Link href="/file-processing"><FilePlus /><span>File Processing</span></Link></SidebarMenuSubButton></SidebarMenuSubItem>)}
                    {can('nav:status') && (<SidebarMenuSubItem><SidebarMenuSubButton asChild isActive={pathname.startsWith('/status')}><Link href="/status/tapeheads"><ClipboardCheck/><span>Sail Status</span></Link></SidebarMenuSubButton></SidebarMenuSubItem>)}
                    {can('nav:review:tapeheads') && (<SidebarMenuSubItem><SidebarMenuSubButton asChild isActive={pathname === '/review/tapeheads'}><Link href="/review/tapeheads"><Users /><span>Tapeheads Review</span></Link></SidebarMenuSubButton></SidebarMenuSubItem>)}
                    {can('nav:qc') && (<SidebarMenuSubItem><SidebarMenuSubButton asChild isActive={pathname === '/qc/inspection'}><Link href="/qc/inspection"><ShieldCheck /><span>QC Inspection</span></Link></SidebarMenuSubButton></SidebarMenuSubItem>)}
                    
                    {canSeeAnyAnalytics && (
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton onClick={() => setDeptAnalyticsOpen(!isDeptAnalyticsOpen)} isActive={pathname.startsWith('/analytics')}>
                                <AreaChart/><span>Department Analytics</span>
                                <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-200", isDeptAnalyticsOpen && "rotate-180" )}/>
                            </SidebarMenuSubButton>
                            {isDeptAnalyticsOpen && (
                                <SidebarMenuSub>
                                    {visibleAnalyticsDepts.map((dept) => (
                                        <SidebarMenuSubItem key={dept.name}>
                                            <SidebarMenuSubButton asChild isActive={pathname === dept.href}><Link href={dept.href}><dept.icon /><span>{dept.name}</span></Link></SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            )}
                        </SidebarMenuSubItem>
                    )}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
           )}
            {can('nav:admin') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Admin Console">
                  <Link href="/admin"><Shield /><span>Admin Console</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-3 p-2 border-t border-sidebar-border">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://placehold.co/40x40" alt="@shadcn" />
            <AvatarFallback>SL</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">{role || 'User'}</span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <div className="hidden md:block">
            {/* Can add breadcrumbs here */}
          </div>
          <UserNav />
        </header>
        <main className="p-4 lg:p-6 flex-1">{children}</main>
         <footer className="p-4 text-center text-xs text-muted-foreground border-t">
            Developed by North Sails Engineering Team Minden NV &trade;
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
