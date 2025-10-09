
import { PageHeader } from "@/components/page-header";
import { UserManagement } from "@/components/admin/user-management";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Console"
        description="Manage users, roles, and application settings."
      />
      <UserManagement />
    </div>
  );
}
