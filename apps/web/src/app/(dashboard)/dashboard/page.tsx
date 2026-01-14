import { Suspense } from "react";
import { DashboardHeader, DashboardShell } from "@/components/dashboard/shell";
import { InstanceList } from "@/components/dashboard/instance-list";
import { CreateInstanceDialog } from "@/components/dashboard/create-instance/create-instance-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

function InstanceListSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-lg border border-border/50 bg-card/50 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Workspaces"
        text="Create and manage your remote development environments."
      >
        <CreateInstanceDialog />
      </DashboardHeader>
      <div className="grid gap-8 pt-8">
        <Suspense fallback={<InstanceListSkeleton />}>
          <InstanceList />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
