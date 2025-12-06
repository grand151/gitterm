import z from "zod";
import { protectedProcedure, router } from "../../index";
import { db, eq, and } from "@gitpad/db";
import { workspace, agentWorkspaceConfig, workspaceEnvironmentVariables, volume } from "@gitpad/db/schema/workspace";
import { image, region } from "@gitpad/db/schema/cloud";
import { user } from "@gitpad/db/schema/auth";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { hasRemainingQuota, createUsageSession, closeUsageSession } from "../../utils/metering";
import { RailwayProvider } from "../../providers/railway";
import { githubAppService } from "../../service/github";
import { workspaceJWT } from "../../service/workspace-jwt";

const PROJECT_ID = process.env.RAILWAY_PROJECT_ID;
const ENVIRONMENT_ID = process.env.RAILWAY_ENVIRONMENT_ID;

if (!PROJECT_ID) {
  throw new Error("RAILWAY_PROJECT_ID is not set");
}

if (!ENVIRONMENT_ID) {
  throw new Error("RAILWAY_ENVIRONMENT_ID is not set");
}

const railwayProvider = new RailwayProvider();

export const railwayRouter = router({
  // Create a new service from a GitHub repo
  createWorkspace: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        repo: z.string(), // e.g. "railwayapp-templates/django",
        agentTypeId: z.string(),
        cloudProviderId: z.string(),
        regionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log("createService input:", input);
      const userId = ctx.session.user.id;
      const workspaceId = randomUUID();
      const subdomain = `ws-${workspaceId}`;

      try {
        // Check if user has remaining quota
        const hasQuota = await hasRemainingQuota(userId);
        if (!hasQuota) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Daily free tier limit reached. Please try again tomorrow.",
          });
        }

        // Fetch image details
        const [imageRecord] = await db
          .select()
          .from(image)
          .where(eq(image.agentTypeId, input.agentTypeId));

        if (!imageRecord) {
           throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image ID" });
        }

        // Fetch user's agent configuration
        const [agentConfig] = await db
          .select()
          .from(agentWorkspaceConfig)
          .where(
            and(
              eq(agentWorkspaceConfig.userId, userId),
              eq(agentWorkspaceConfig.agentTypeId, input.agentTypeId)
            )
          );

        // Fetch user's workspace environment variables
        const [userWorkspaceEnvironmentVariables] = await db
          .select()
          .from(workspaceEnvironmentVariables)
          .where(
            and(
              eq(workspaceEnvironmentVariables.userId, userId),
              eq(workspaceEnvironmentVariables.agentTypeId, input.agentTypeId)
            )
          );

        const [preferredRegion] = await db.select().from(region).where(eq(region.id, input.regionId));

        if (!preferredRegion) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid region ID" });
        }

        // Get GitHub username from user.name (set during OAuth)
        const [userRecord] = await db
          .select()
          .from(user)
          .where(eq(user.id, userId));

        const githubUsername = userRecord?.name;

        // Get GitHub App installation and generate token
        let githubAppToken: string | undefined;
        let githubAppTokenExpiry: string | undefined;
        
        const installation = await githubAppService.getUserInstallation(userId);
        if (installation && !installation.suspended) {
          try {
            const tokenData = await githubAppService.getUserToServerToken(installation.installationId);
            githubAppToken = tokenData.token;
            githubAppTokenExpiry = tokenData.expiresAt;
          } catch (error) {
            console.error("Failed to generate GitHub App token:", error);
            // Continue without token - user can still use workspace without git operations
          }
        }

        // Parse repo URL to get owner/name
        const repoInfo = input.repo ? githubAppService.parseRepoUrl(input.repo) : null;

        // Generate workspace-scoped JWT token (replaces shared INTERNAL_API_KEY)
        const workspaceAuthToken = workspaceJWT.generateToken(
          workspaceId,
          userId,
          ['git:*', 'git:fork', 'git:refresh'] // All git scopes
        );

        // API endpoint for workspace operations
        const WORKSPACE_API_URL = process.env.WORKSPACE_API_URL || process.env.INTERNAL_API_URL || "https://api.gitterm.dev/trpc";

        const DEFAULT_DOCKER_ENV_VARS = {
          "REPO_URL": input.repo,
          "OPENCODE_CONFIG_BASE64": agentConfig ? Buffer.from(JSON.stringify(agentConfig.config)).toString("base64") : undefined,
          "USER_GITHUB_USERNAME": githubUsername,
          "GITHUB_APP_TOKEN": githubAppToken,
          "GITHUB_APP_TOKEN_EXPIRY": githubAppTokenExpiry,
          "REPO_OWNER": repoInfo?.owner,
          "REPO_NAME": repoInfo?.repo,
          "WORKSPACE_ID": workspaceId,
          "WORKSPACE_AUTH_TOKEN": workspaceAuthToken, // JWT instead of shared key
          "WORKSPACE_API_URL": WORKSPACE_API_URL,
          ...(userWorkspaceEnvironmentVariables ? userWorkspaceEnvironmentVariables.environmentVariables as any : {}),
        }


        const workspaceInfo = await railwayProvider.createWorkspace({
          workspaceId: workspaceId,
          userId: userId,
          imageId: imageRecord.id,
          subdomain: subdomain,
          repositoryUrl: input.repo,
          regionIdentifier: preferredRegion.externalRegionIdentifier,
          environmentVariables: DEFAULT_DOCKER_ENV_VARS,
        });

        const [newWorkspace] = await db.insert(workspace).values({
          id: workspaceId,
          userId,
          externalInstanceId: workspaceInfo.externalServiceId,
          imageId: imageRecord.id,
          cloudProviderId: input.cloudProviderId,
          regionId: preferredRegion.id,
          repositoryUrl: input.repo,
          subdomain: subdomain,
          backendUrl: workspaceInfo.backendUrl,
          domain: `${subdomain}.gitterm.dev`, // This domain will be handled by the wildcard proxy
          status: "pending",
          startedAt: new Date(workspaceInfo.serviceCreatedAt),
          lastActiveAt: new Date(workspaceInfo.serviceCreatedAt),
          updatedAt: new Date(workspaceInfo.serviceCreatedAt),
        }).returning();

        const [newVolume] = await db.insert(volume).values({
          workspaceId: workspaceId,
          userId: userId,
          cloudProviderId: input.cloudProviderId,
          regionId: preferredRegion.id,
          externalVolumeId: workspaceInfo.externalVolumeId,
          mountPath: "/workspace",
          createdAt: new Date(workspaceInfo.volumeCreatedAt || new Date()),
          updatedAt: new Date(workspaceInfo.volumeCreatedAt || new Date()),
        }).returning();

        // Create usage session for billing
        await createUsageSession(workspaceId, userId);

        return {
          workspace: newWorkspace,
          volume: newVolume,
        };
      } catch (error) {
        console.error("createService failed:", error);
        // Throw a user-friendly error to the client
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create workspace. Please try again later.",
          cause: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),

    stopWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      
      const fetchedWorkspace = await db.query.workspace.findFirst({
        where: and(eq(workspace.id, input.workspaceId), eq(workspace.userId, userId)),
        with: {
          volume: true,
          region: true,
        }
      })
      
      
    if (!fetchedWorkspace) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
    }

    if (!fetchedWorkspace.externalRunningDeploymentId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Workspace is not running" });
    }

    await railwayProvider.stopWorkspace(fetchedWorkspace.externalInstanceId, fetchedWorkspace.region.externalRegionIdentifier, fetchedWorkspace.externalRunningDeploymentId);

    const [updatedWorkspace] = await db.update(workspace).set({ status: "stopped", stoppedAt: new Date(), updatedAt: new Date() }).where(eq(workspace.id, input.workspaceId)).returning();

    return {
      workspace: updatedWorkspace,
    };
  }),

  // Delete a service
  deleteWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const fetchedWorkspace = await db.query.workspace.findFirst({
        where: and(eq(workspace.id, input.workspaceId), eq(workspace.userId, userId)),
        with: {
          volume: true,
        }
      })

      if (!fetchedWorkspace) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }

      // Close usage session if workspace was running
      if (fetchedWorkspace.status === "running" || fetchedWorkspace.status === "pending") {
        await closeUsageSession(input.workspaceId, "manual");
      }


      await railwayProvider.terminateWorkspace(fetchedWorkspace.externalInstanceId, fetchedWorkspace.volume.externalVolumeId);

     const [updatedWorkspace] = await db.update(workspace).set({ status: "terminated", stoppedAt: new Date(), terminatedAt: new Date(), updatedAt: new Date() }).where(eq(workspace.id, input.workspaceId)).returning();
      await db.delete(volume).where(eq(volume.id, fetchedWorkspace.volume.id));
      return {
        workspace: updatedWorkspace,
        success: true,
      };
    }),

  // Redeploy a deployment
  restartWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const fetchedWorkspace = await db.query.workspace.findFirst({
        where: and(eq(workspace.id, input.workspaceId), eq(workspace.userId, userId)),
        with: {
          volume: true,
          region: true,
        }
      })

      if (!fetchedWorkspace) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }

      if (!fetchedWorkspace.externalRunningDeploymentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Workspace is not running" });
      }

      await railwayProvider.restartWorkspace(fetchedWorkspace.externalInstanceId, fetchedWorkspace.region.externalRegionIdentifier, fetchedWorkspace.externalRunningDeploymentId);

      const [updatedWorkspace] = await db.update(workspace).set({ status: "pending", stoppedAt: null, updatedAt: new Date() }).where(eq(workspace.id, input.workspaceId)).returning();

      return {
        workspace: updatedWorkspace,
      };
    }),
});
