"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardHeader, DashboardShell } from "@/components/dashboard/shell";
import { GitHubConnection } from "@/components/dashboard/github-connection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle success/error messages from GitHub callback
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "github_connected") {
      toast.success("GitHub App connected successfully!");
      // Clear the query parameter
      window.history.replaceState({}, "", "/dashboard/integrations");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_installation_id: "GitHub callback missing installation ID",
        invalid_setup_action: "Invalid setup action from GitHub",
        installation_failed: "Failed to save GitHub installation",
        callback_failed: "GitHub callback failed",
      };
      toast.error(errorMessages[error] || "Failed to connect GitHub App");
      // Clear the query parameter
      window.history.replaceState({}, "", "/dashboard/integrations");
    }
  }, [searchParams]);

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Integrations"
        text="Connect external services to enhance your workspace capabilities."
      />
      <div className="grid gap-6">
        <GitHubConnection />
        
        {/* Placeholder for future integrations */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              GitLab Integration
              <span className="text-xs font-normal text-muted-foreground">(Coming Soon)</span>
            </CardTitle>
            <CardDescription>
              Connect your GitLab account for git operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                GitLab integration will be available in a future update
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Bitbucket Integration
              <span className="text-xs font-normal text-muted-foreground">(Coming Soon)</span>
            </CardTitle>
            <CardDescription>
              Connect your Bitbucket account for git operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Bitbucket integration will be available in a future update
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
