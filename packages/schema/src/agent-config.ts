import z from "zod";

// OpenCode Config Validator using SDK type
export async function validateOpenCodeConfig(config: unknown) {
  // Resolve path relative to this file's location
  const configPath = new URL("./opencode-config.json", import.meta.url);
  const openCodeConfigJson = Bun.file(configPath);
  
  if (!(await openCodeConfigJson.exists())) {
    throw new Error("OpenCode config file not found");
  }

  const openCodeConfigSchema = z.fromJSONSchema(JSON.parse(await openCodeConfigJson.text()));

  return openCodeConfigSchema.safeParse(config);
}

// Validator registry for dynamic access
export const agentValidators = {
  opencode: validateOpenCodeConfig,
  "opencode web": validateOpenCodeConfig,
  "opencode cli": validateOpenCodeConfig,
  "opencode server": validateOpenCodeConfig,
  "shuvcode": validateOpenCodeConfig,
  "shuvcode server": validateOpenCodeConfig,
  // Add more agent validators here:
  // "claude-code": validateClaudeCodeConfig,
  // "codex": validateCodexConfig,
} as const;

/**
 * Validate config for an agent type
 * Routes to the appropriate validator based on agent type
 * @param agentTypeName - The agent type identifier
 * @param config - The configuration object to validate
 * @returns Validation result with type information preserved
 */
export function validateAgentConfig(
  agentTypeName: string,
  config: unknown
): ReturnType<typeof validateOpenCodeConfig> {
  const validatorKey = agentTypeName.toLowerCase() as keyof typeof agentValidators;
  const validator = agentValidators[validatorKey] || validateOpenCodeConfig;
  return validator(config);
}

