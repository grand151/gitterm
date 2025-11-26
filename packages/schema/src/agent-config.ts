import z from "zod";

// Keybinds Schema
const keybindsSchema = z
  .object({
    leader: z.string().default("ctrl+x"),
    app_exit: z.string().default("ctrl+c,ctrl+d,<leader>q"),
    editor_open: z.string().default("<leader>e"),
    theme_list: z.string().default("<leader>t"),
    sidebar_toggle: z.string().default("<leader>b"),
    status_view: z.string().default("<leader>s"),
    session_export: z.string().default("<leader>x"),
    session_new: z.string().default("<leader>n"),
    session_list: z.string().default("<leader>l"),
    session_timeline: z.string().default("<leader>g"),
    session_share: z.string().default("none"),
    session_unshare: z.string().default("none"),
    session_interrupt: z.string().default("escape"),
    session_compact: z.string().default("<leader>c"),
    messages_page_up: z.string().default("pageup"),
    messages_page_down: z.string().default("pagedown"),
    messages_half_page_up: z.string().default("ctrl+alt+u"),
    messages_half_page_down: z.string().default("ctrl+alt+d"),
    messages_first: z.string().default("ctrl+g,home"),
    messages_last: z.string().default("ctrl+alt+g,end"),
    messages_copy: z.string().default("<leader>y"),
    messages_undo: z.string().default("<leader>u"),
    messages_redo: z.string().default("<leader>r"),
    messages_toggle_conceal: z.string().default("<leader>h"),
    model_list: z.string().default("<leader>m"),
    model_cycle_recent: z.string().default("f2"),
    model_cycle_recent_reverse: z.string().default("shift+f2"),
    command_list: z.string().default("ctrl+p"),
    agent_list: z.string().default("<leader>a"),
    agent_cycle: z.string().default("tab"),
    agent_cycle_reverse: z.string().default("shift+tab"),
    input_clear: z.string().default("ctrl+c"),
    input_forward_delete: z.string().default("ctrl+d"),
    input_paste: z.string().default("ctrl+v"),
    input_submit: z.string().default("return"),
    input_newline: z.string().default("shift+return,ctrl+j"),
    history_previous: z.string().optional(),
    history_next: z.string().optional(),
    history_search: z.string().optional(),
  })
  .partial()
  .strict();

// Formatter Config Schema
const formatterConfigItemSchema = z
  .object({
    disabled: z.boolean().optional(),
    command: z.array(z.string()),
    environment: z.record(z.string(), z.string()).optional(),
    extensions: z.array(z.string()).optional(),
  })
  .strict();

const formatterSchema = z.union([
  z.literal(false),
  z.record(z.string(), formatterConfigItemSchema),
]);

// LSP Config Schema
const lspConfigItemSchema = z.union([
  z
    .object({
      disabled: z.literal(true),
    })
    .strict(),
  z
    .object({
      command: z.array(z.string()),
      extensions: z.array(z.string()).optional(),
      disabled: z.boolean().optional(),
      env: z.record(z.string(), z.string()).optional(),
      initialization: z.record(z.string(), z.any()).optional(),
    })
    .strict(),
]);

const lspSchema = z.union([
  z.literal(false),
  z.record(z.string(), lspConfigItemSchema),
]);

// MCP Server Config Schema
const mcpStdioConfigSchema = z
  .object({
    type: z.literal("stdio"),
    command: z.array(z.string()),
    args: z.array(z.string()).optional(),
    environment: z.record(z.string(), z.string()).optional(),
    enabled: z.boolean().optional(),
  })
  .strict();

const mcpSseConfigSchema = z
  .object({
    type: z.literal("sse"),
    url: z.string().url(),
    enabled: z.boolean().optional(),
  })
  .strict();

const mcpRemoteConfigSchema = z
  .object({
    type: z.literal("remote"),
    url: z.string().url(),
    enabled: z.boolean().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    timeout: z.number().int().positive().optional(),
  })
  .strict();

const mcpConfigSchema = z.record(
  z.string(),
  z.union([mcpStdioConfigSchema, mcpSseConfigSchema, mcpRemoteConfigSchema])
);

// Permission Schema
const permissionSchema = z
  .object({
    edit: z.enum(["ask", "allow", "deny"]).optional(),
    bash: z
      .union([
        z.enum(["ask", "allow", "deny"]),
        z.record(z.string(), z.enum(["ask", "allow", "deny"])),
      ])
      .optional(),
    webfetch: z.enum(["ask", "allow", "deny"]).optional(),
    doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
    external_directory: z.enum(["ask", "allow", "deny"]).optional(),
  })
  .strict();

// Hook Config Schema
const hookCommandConfigSchema = z
  .object({
    command: z.array(z.string()),
    environment: z.record(z.string(), z.string()).optional(),
  })
  .strict();

const hookSchema = z
  .object({
    file_edited: z
      .record(z.string(), z.array(hookCommandConfigSchema))
      .optional(),
    session_completed: z.array(hookCommandConfigSchema).optional(),
  })
  .strict();

// Experimental Config Schema
const experimentalSchema = z
  .object({
    hook: hookSchema.optional(),
    chatMaxRetries: z.number().int().nonnegative().optional(),
    disable_paste_summary: z.boolean().optional(),
    batch_tool: z.boolean().optional(),
  })
  .strict();

// Main OpenCode Config Schema
export const openCodeConfigSchema = z
  .object({
    theme: z.string().optional(),
    keybinds: keybindsSchema.optional(),
    formatter: formatterSchema.optional(),
    lsp: lspSchema.optional(),
    mcp: mcpConfigSchema.optional(),
    instructions: z.array(z.string()).optional(),
    permission: permissionSchema.optional(),
    tools: z.record(z.string(), z.boolean()).optional(),
    enterprise: z
      .object({
        url: z.string().url(),
      })
      .strict()
      .optional(),
    experimental: experimentalSchema.optional(),
  })
  .strict();

// Export types
export type OpenCodeConfig = z.infer<typeof openCodeConfigSchema>;
export type Keybinds = z.infer<typeof keybindsSchema>;
export type FormatterConfig = z.infer<typeof formatterSchema>;
export type LSPConfig = z.infer<typeof lspSchema>;
export type MCPConfig = z.infer<typeof mcpConfigSchema>;
export type PermissionConfig = z.infer<typeof permissionSchema>;
export type ExperimentalConfig = z.infer<typeof experimentalSchema>;

// OpenCode Config Validator
export function validateOpenCodeConfig(config: unknown) {
  return openCodeConfigSchema.safeParse(config);
}

// Add more validators here as needed
// export function validateClaudeCodeConfig(config: unknown) {
//   return claudeCodeConfigSchema.safeParse(config);
// }
//
// export function validateCodexConfig(config: unknown) {
//   return codexConfigSchema.safeParse(config);
// }

// Validator registry for dynamic access
export const agentValidators = {
  opencode: validateOpenCodeConfig,
  // Add more agent validators here:
  // "claude-code": validateClaudeCodeConfig,
  // "codex": validateCodexConfig,
} as const;

/**
 * Validate config for an agent type
 * Routes to the appropriate validator based on agent type
 * @param agentTypeId - The agent type identifier
 * @param config - The configuration object to validate
 * @returns Validation result with type information preserved
 */
export function validateAgentConfig(
  agentTypeId: string,
  config: unknown
): ReturnType<typeof validateOpenCodeConfig> {
  const validatorKey = agentTypeId.toLowerCase() as keyof typeof agentValidators;
  const validator = agentValidators[validatorKey] || validateOpenCodeConfig;
  return validator(config);
}

