import { DashboardHeader, DashboardShell } from "@/components/dashboard/shell";
import { InstanceList } from "@/components/dashboard/instance-list";
import { CreateInstanceDialog } from "@/components/dashboard/create-instance-dialog";

export default function DashboardPage() {
	return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Manage your development workspaces.">
        <CreateInstanceDialog />
      </DashboardHeader>
      <div className="grid gap-8">
        <InstanceList />
		</div>
    </DashboardShell>
	);
}
