import { DepartmentReportForm } from "@/components/department-report-form";
import { PageHeader } from "@/components/page-header";
import { TapeheadsWorkDashboard } from "@/components/tapeheads-work-dashboard";
import type { Department } from "@/lib/types";
import { notFound } from "next/navigation";

const validDepartments: Department[] = ['Pregger', 'Tapeheads', 'Gantry', 'Films', 'Graphics'];

function isValidDepartment(department: string): department is Department {
  return (validDepartments as string[]).includes(department);
}


export default async function ReportPage({ params }: { params: Promise<{ department: string }> }) {
  const { department } = await params;
  const departmentName = department.charAt(0).toUpperCase() + department.slice(1) as Department;
  
  if (!isValidDepartment(departmentName)) {
    notFound();
  }
  
  if (departmentName === 'Graphics') {
    return <DepartmentReportForm department={departmentName} />;
  }

  if (departmentName === 'Tapeheads') {
    return <TapeheadsWorkDashboard />;
  }
  
  return (
    <div>
      <PageHeader
        title="Shift Report Entry"
        description={`Submit your daily report for the ${departmentName} department.`}
      />
      <DepartmentReportForm department={departmentName} />
    </div>
  );
}

export function generateStaticParams() {
  return validDepartments.map((department) => ({
    department: department.toLowerCase(),
  }))
}
