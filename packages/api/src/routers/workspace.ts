import z from "zod";
import { protectedProcedure, router } from "../index";
import { db, eq, and } from "@gitpad/db";
import {
  agentWorkspaceConfig,
  workspaceEnvironmentVariables,
  workspace,
} from "@gitpad/db/schema/workspace";
import { agentType, image, cloudProvider } from "@gitpad/db/schema/cloud";
import { TRPCError } from "@trpc/server";
import { validateAgentConfig } from "@gitpad/schema";

export const workspaceRouter = router({
  // List all agent types
  listAgentTypes: protectedProcedure.query(async () => {
    try {
      const types = await db.select().from(agentType);
      return {
        success: true,
        agentTypes: types,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch agent types",
        cause: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  // List images for a specific agent type
  listImages: protectedProcedure
    .input(z.object({ agentTypeId: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        const images = await db
          .select()
          .from(image)
          .where(eq(image.agentTypeId, input.agentTypeId));
        return {
          success: true,
          images,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch images",
          cause: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),

  // List cloud providers
  listCloudProviders: protectedProcedure.query(async () => {
    try {
      const providers = await db.select().from(cloudProvider);
      return {
        success: true,
        cloudProviders: providers,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch cloud providers",
        cause: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  // List all workspaces for the authenticated user
  listWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    try {
      const workspaces = await db
        .select()
        .from(workspace)
        .where(eq(workspace.userId, userId));

      return {
        success: true,
        workspaces,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch workspaces",
        cause: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  // Create or update workspace configuration
  createConfig: protectedProcedure
    .input(
      z.object({
        agentTypeId: z.string().min(1, "Agent type ID is required"),
        config: z.record(z.string(), z.any()).refine(
          (obj) => Object.keys(obj).length > 0,
          { message: "Config cannot be empty" }
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        // Validate config against the agent-specific schema
        const validationResult = validateAgentConfig(
          input.agentTypeId,
          input.config
        );

        if (!validationResult.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid configuration format",
            cause: validationResult.error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join("; "),
          });
        }

        // Check if config already exists for this user and agent type
        const existingConfigs = await db
          .select()
          .from(agentWorkspaceConfig)
          .where(
            and(
              eq(agentWorkspaceConfig.userId, userId),
              eq(agentWorkspaceConfig.agentTypeId, input.agentTypeId)
            )
          );

        if (existingConfigs.length > 0) {
          // Update existing config
          const [updatedConfig] = await db
            .update(agentWorkspaceConfig)
            .set({
              config: validationResult.data,
              updatedAt: new Date(),
            })
            .where(eq(agentWorkspaceConfig.id, existingConfigs[0]!.id))
            .returning();

          return {
            success: true,
            message: "Configuration updated successfully",
            config: updatedConfig,
          };
        } else {
          // Create new config
          const [newConfig] = await db
            .insert(agentWorkspaceConfig)
            .values({
              userId,
              agentTypeId: input.agentTypeId,
              config: validationResult.data,
            })
            .returning();

          return {
            success: true,
            message: "Configuration created successfully",
            config: newConfig,
          };
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create or update configuration",
          cause: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),

  // Get workspace configuration for a specific agent type
  getConfig: protectedProcedure
    .input(
      z.object({
        agentTypeId: z.string().min(1, "Agent type ID is required"),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const configs = await db
          .select()
          .from(agentWorkspaceConfig)
          .where(
            and(
              eq(agentWorkspaceConfig.userId, userId),
              eq(agentWorkspaceConfig.agentTypeId, input.agentTypeId)
            )
          );

        if (configs.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Configuration not found for this agent type",
          });
        }

        return {
          success: true,
          config: configs[0]!,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch configuration",
          cause: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),

  // List all configurations for the authenticated user
  listConfigs: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    try {
      const configs = await db
        .select()
        .from(agentWorkspaceConfig)
        .where(eq(agentWorkspaceConfig.userId, userId));

      return {
        success: true,
        configs,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch configurations",
        cause: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  // Delete workspace configuration
  deleteConfig: protectedProcedure
    .input(
      z.object({
        agentTypeId: z.string().min(1, "Agent type ID is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const configs = await db
          .select()
          .from(agentWorkspaceConfig)
          .where(
            and(
              eq(agentWorkspaceConfig.userId, userId),
              eq(agentWorkspaceConfig.agentTypeId, input.agentTypeId)
            )
          );

        if (configs.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Configuration not found",
          });
        }

        await db
          .delete(agentWorkspaceConfig)
          .where(eq(agentWorkspaceConfig.id, configs[0]!.id));

        return {
          success: true,
          message: "Configuration deleted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete configuration",
          cause: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),

  // Create or update environment variables for a workspace
  createEnvironmentVariables: protectedProcedure
    .input(
      z.object({
        agentTypeId: z.string().min(1, "Agent type ID is required"),
        environmentVariables: z
          .record(z.string(), z.string())
          .refine(
            (obj) => Object.keys(obj).length > 0,
            { message: "Environment variables cannot be empty" }
          ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        // Check if environment variables already exist
        const existingVars = await db
          .select()
          .from(workspaceEnvironmentVariables)
          .where(
            and(
              eq(workspaceEnvironmentVariables.userId, userId),
              eq(workspaceEnvironmentVariables.agentTypeId, input.agentTypeId)
            )
          );

        if (existingVars.length > 0) {
          // Update existing environment variables
          const [updatedVars] = await db
            .update(workspaceEnvironmentVariables)
            .set({
              environmentVariables: input.environmentVariables,
              updatedAt: new Date(),
            })
            .where(
              eq(workspaceEnvironmentVariables.id, existingVars[0]!.id)
            )
            .returning();

          return {
            success: true,
            message: "Environment variables updated successfully",
            environmentVariables: updatedVars,
          };
        } else {
          // Create new environment variables
          const [newVars] = await db
            .insert(workspaceEnvironmentVariables)
            .values({
              userId,
              agentTypeId: input.agentTypeId,
              environmentVariables: input.environmentVariables,
            })
            .returning();

          return {
            success: true,
            message: "Environment variables created successfully",
            environmentVariables: newVars,
          };
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create or update environment variables",
          cause: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),

  // Get environment variables for a specific agent type
  getEnvironmentVariables: protectedProcedure
    .input(
      z.object({
        agentTypeId: z.string().min(1, "Agent type ID is required"),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const vars = await db
          .select()
          .from(workspaceEnvironmentVariables)
          .where(
            and(
              eq(workspaceEnvironmentVariables.userId, userId),
              eq(workspaceEnvironmentVariables.agentTypeId, input.agentTypeId)
            )
          );

        if (vars.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Environment variables not found for this agent type",
          });
        }

        return {
          success: true,
          environmentVariables: vars[0]!,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch environment variables",
          cause: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),

  // List all environment variables for the authenticated user
  listEnvironmentVariables: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    try {
      const vars = await db
        .select()
        .from(workspaceEnvironmentVariables)
        .where(eq(workspaceEnvironmentVariables.userId, userId));

      return {
        success: true,
        environmentVariables: vars,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch environment variables",
        cause: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  // Delete environment variables
  deleteEnvironmentVariables: protectedProcedure
    .input(
      z.object({
        agentTypeId: z.string().min(1, "Agent type ID is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const vars = await db
          .select()
          .from(workspaceEnvironmentVariables)
          .where(
            and(
              eq(workspaceEnvironmentVariables.userId, userId),
              eq(workspaceEnvironmentVariables.agentTypeId, input.agentTypeId)
            )
          );

        if (vars.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Environment variables not found",
          });
        }

        await db
          .delete(workspaceEnvironmentVariables)
          .where(
            eq(workspaceEnvironmentVariables.id, vars[0]!.id)
          );

        return {
          success: true,
          message: "Environment variables deleted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete environment variables",
          cause: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),

  // Update a specific environment variable
  updateEnvironmentVariable: protectedProcedure
    .input(
      z.object({
        agentTypeId: z.string().min(1, "Agent type ID is required"),
        key: z.string().min(1, "Key is required"),
        value: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const vars = await db
          .select()
          .from(workspaceEnvironmentVariables)
          .where(
            and(
              eq(workspaceEnvironmentVariables.userId, userId),
              eq(workspaceEnvironmentVariables.agentTypeId, input.agentTypeId)
            )
          );

        if (vars.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Environment variables not found for this agent type",
          });
        }

        const updatedEnvVars = {
          ...(vars[0]!.environmentVariables as Record<string, string>),
          [input.key]: input.value,
        };

        const [updated] = await db
          .update(workspaceEnvironmentVariables)
          .set({
            environmentVariables: updatedEnvVars,
            updatedAt: new Date(),
          })
          .where(eq(workspaceEnvironmentVariables.id, vars[0]!.id))
          .returning();

        return {
          success: true,
          message: "Environment variable updated successfully",
          environmentVariables: updated,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update environment variable",
          cause: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),
});

