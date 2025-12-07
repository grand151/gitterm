import z from "zod";
import { protectedProcedure, router } from "../../index";
import { githubAppService } from "../../service/github";
import { TRPCError } from "@trpc/server";
import { db, eq, and } from "@gitpad/db";
import { workspaceGitConfig, gitIntegration } from "@gitpad/db/schema/integrations";

export const githubRouter = router({
  /**
   * Get GitHub App installation status for the current user
   */
  getInstallationStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      const [gitIntegrationRecord] = await db.select().from(gitIntegration).where(and(eq(gitIntegration.userId, userId), eq(gitIntegration.provider, "github")));
      
      if (!gitIntegrationRecord) {
        return {
          connected: false,
          installation: null,
        };
      }

      const installation = await githubAppService.getUserInstallation(userId, gitIntegrationRecord.providerInstallationId);

      if (!installation) {
        return {
          connected: false,
          installation: null,
        };
      }

      return {
        connected: true,
        installation: {
          id: installation.id,
          accountLogin: installation.accountLogin,
          accountType: installation.accountType,
          repositorySelection: installation.repositorySelection,
          installedAt: installation.installedAt,
          suspended: installation.suspended,
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get installation status",
        cause: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  /**
   * Handle GitHub App installation callback
   * Called after user installs the GitHub App
   */
  handleInstallation: protectedProcedure
    .input(
      z.object({
        installationId: z.string(),
        setupAction: z.enum(["install", "update"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      try {
        console.log("[handleInstallation] Starting for user:", userId, "installation:", input.installationId);
        
        // Get installation details from GitHub using SDK
        console.log("[handleInstallation] Fetching installation details from GitHub...");
        const installationData = await githubAppService.getInstallationDetails(
          input.installationId
        );
        console.log("[handleInstallation] Installation details:", {
          id: installationData.id,
          accountLogin: installationData.account.login,
          accountType: installationData.account.type,
          repositorySelection: installationData.repositorySelection,
        });

        // Store installation in database
        console.log("[handleInstallation] Storing installation in database...");
        const installation = await githubAppService.storeInstallation({
          userId,
          installationId: input.installationId,
          accountId: installationData.account.id.toString(),
          accountLogin: installationData.account.login,
          accountType: installationData.account.type,
          repositorySelection: installationData.repositorySelection,
        });
        console.log("[handleInstallation] Installation stored successfully:", installation.id);

        return {
          success: true,
          message: "GitHub App connected successfully",
          installation: {
            accountLogin: installation.accountLogin,
            repositorySelection: installation.repositorySelection,
          },
        };
      } catch (error) {
        console.error("[handleInstallation] ERROR:", error);
        if (error instanceof Error) {
          console.error("[handleInstallation] Error message:", error.message);
          console.error("[handleInstallation] Error stack:", error.stack);
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect GitHub App",
          cause: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),

  /**
   * Disconnect GitHub App
   */
  disconnectApp: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      const [gitIntegrationRecord] = await db.select().from(gitIntegration).where(and(eq(gitIntegration.userId, userId), eq(gitIntegration.provider, "github")));
      
      if (!gitIntegrationRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "GitHub App not connected",
        });
      }

      const installation = await githubAppService.getUserInstallation(userId, gitIntegrationRecord.providerInstallationId);

      if (!installation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "GitHub App not connected",
        });
      }

      await githubAppService.removeInstallation(
        userId,
        installation.installationId
      );

      return {
        success: true,
        message: "GitHub App disconnected successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to disconnect GitHub App",
        cause: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  /**
   * Get workspace git configuration
   */
  getWorkspaceGitConfig: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      try {
        const [config] = await db
          .select()
          .from(workspaceGitConfig)
          .where(eq(workspaceGitConfig.workspaceId, input.workspaceId));

        if (!config || config.userId !== userId) {
          return {
            hasGitConfig: false,
            config: null,
          };
        }

        return {
          hasGitConfig: true,
          config: {
            provider: config.provider,
            repositoryOwner: config.repositoryOwner,
            repositoryName: config.repositoryName,
            isFork: config.isFork,
            originalOwner: config.originalOwner,
            originalRepo: config.originalRepo,
            defaultBranch: config.defaultBranch,
            currentBranch: config.currentBranch,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get workspace git configuration",
          cause: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),
});
