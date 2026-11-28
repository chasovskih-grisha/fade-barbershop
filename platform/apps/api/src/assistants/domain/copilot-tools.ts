/** AI copilot tool registry, RBAC and audit decisions (T-5019).
 *
 * Публічний шлях модуля: типи — copilot.types.ts, типовий каталог —
 * copilot-default-tools.ts, реєстр і авторизація — тут.
 */
import type {
  CopilotAuditEntry,
  CopilotDecision,
  CopilotTool,
  CopilotToolCall,
  ToolRejection,
} from './copilot.types';

export { DEFAULT_COPILOT_TOOLS } from './copilot-default-tools';
export type {
  CopilotAuditEntry,
  CopilotDecision,
  CopilotRole,
  CopilotTool,
  CopilotToolCall,
  ToolRejection,
} from './copilot.types';

export function registerCopilotTools(
  tools: readonly CopilotTool[]
): ReadonlyMap<string, CopilotTool> {
  const registry = new Map<string, CopilotTool>();
  for (const tool of tools) {
    if (!tool.name.trim()) throw new Error('Copilot tool name is required');
    if (registry.has(tool.name)) throw new Error(`Duplicate copilot tool: ${tool.name}`);
    if (tool.requiredRoles.length === 0) {
      throw new Error(`Copilot tool ${tool.name} must declare allowed roles`);
    }
    registry.set(tool.name, tool);
  }
  return registry;
}

function parametersMatch(tool: CopilotTool, parameters: Readonly<Record<string, unknown>>): boolean {
  const keys = Object.keys(parameters).sort();
  const expected = [...tool.parameters].sort();
  return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
}

interface AuditInput {
  readonly call: CopilotToolCall;
  readonly mutating: boolean;
  readonly outcome: 'allowed' | 'rejected';
  readonly at: Date;
  readonly reason?: ToolRejection;
}

function auditOf(input: AuditInput): CopilotAuditEntry {
  const base = {
    tool: input.call.tool,
    role: input.call.role,
    mutating: input.mutating,
    outcome: input.outcome,
    at: input.at,
  };
  return input.reason ? { ...base, reason: input.reason } : base;
}

/**
 * Authorizes one copilot tool call. Every call — allowed or rejected — returns
 * an audit entry so AI-initiated actions stay traceable.
 */
export function authorizeCopilotToolCall(
  registry: ReadonlyMap<string, CopilotTool>,
  call: CopilotToolCall,
  at: Date = new Date()
): CopilotDecision {
  const tool = registry.get(call.tool);
  const reject = (reason: ToolRejection, mutating: boolean): CopilotDecision => ({
    allowed: false,
    reason,
    audit: auditOf({ call, mutating, outcome: 'rejected', at, reason }),
  });

  if (!tool) return reject('unknown_tool', false);
  if (!tool.requiredRoles.includes(call.role)) return reject('forbidden', tool.mutating);
  if (!parametersMatch(tool, call.parameters)) return reject('invalid_parameters', tool.mutating);
  if (tool.mutating && tool.requiresConfirmation && call.confirmed !== true) {
    return reject('confirmation_required', true);
  }
  return { allowed: true, audit: auditOf({ call, mutating: tool.mutating, outcome: 'allowed', at }) };
}
