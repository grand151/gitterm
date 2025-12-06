"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/loader";
import { trpc } from "@/utils/trpc";
import { CheckCircle2, XCircle, GitBranch, AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Route } from "next";
import { toast } from "sonner";

const GITHUB_APP_NAME = process.env.NEXT_PUBLIC_GITHUB_APP_NAME || "gitterm-dev";
const GITHUB_APP_INSTALL_URL = `https://github.com/apps/${GITHUB_APP_NAME}/installations/new?redirect_uri=${process.env.NEXT_PUBLIC_WEB_URL}/api/github/callback`;

export function GitHubConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { data: installationData, isLoading, refetch } = useQuery(trpc.github.getInstallationStatus.queryOptions());
  const disconnectMutation = useMutation(trpc.github.disconnectApp.mutationOptions());

  // Refetch installation status on mount (in case we just came back from GitHub)
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleConnect = () => {
    setIsConnecting(true);
    // Redirect to GitHub App installation
    window.location.href = GITHUB_APP_INSTALL_URL;
  };

  const handleDisconnect = async () => {
    if (confirm("Are you sure you want to disconnect your GitHub App? This will disable git operations in your workspaces.")) {
      try {
        await disconnectMutation.mutateAsync();
        // Refetch to update UI
        await refetch();
        toast.success("GitHub App disconnected successfully");
      } catch (error) {
        console.error("Failed to disconnect GitHub App:", error);
        toast.error("Failed to disconnect GitHub App");
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to enable git operations in workspaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Loader />
        </CardContent>
      </Card>
    );
  }

  const isConnected = installationData?.connected ?? false;
  const installation = installationData?.installation;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          GitHub Integration
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to enable git operations (clone, commit, push, fork) in your workspaces
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected && installation ? (
          <>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Connected as @{installation.accountLogin}</p>
                  <p className="text-sm text-muted-foreground">
                    {installation.accountType} • {installation.repositorySelection === "all" ? "All repositories" : "Selected repositories"}
                  </p>
                </div>
              </div>
              {installation.suspended ? (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Suspended
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-500">
                  Active
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(`https://github.com/settings/installations`, "_blank")}
              >
                Manage on GitHub
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              <XCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Not Connected</p>
                <p className="text-sm text-muted-foreground">
                  Connect your GitHub account to enable git operations
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                When you connect your GitHub account, you'll be able to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Clone private repositories in workspaces</li>
                <li>Commit and push changes from workspaces</li>
                <li>Fork repositories directly from the dashboard</li>
                <li>Authenticate git operations securely without tokens</li>
              </ul>
            </div>

            <Button
              className="w-full"
              asChild
            >
              {isConnecting ? (
                <>
                  <Loader className="mr-2" />
                  Redirecting to GitHub...
                </>
              ) : (
                <a href={`https://github.com/apps/${GITHUB_APP_NAME}/installations/new?redirect_uri=${process.env.NEXT_PUBLIC_WEB_URL}/api/github/callback`}>
                  Connect GitHub App
                </a>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              This will redirect you to GitHub to install the GitTerm app. You can choose which repositories to grant access to.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
