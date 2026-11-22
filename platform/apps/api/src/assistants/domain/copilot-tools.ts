/** AI copilot tool registry, RBAC and audit decisions (T-5019). */

export type CopilotRole = 'owner' | 'manager' | 'receptionist' | 'barber';

export interface CopilotTool {
  readonly name: string;
  readonly description: string;
  readonly requiredRoles: readonly CopilotRole[];
  /** Mutations are audited and may require explicit operator confirmation. */
  readonly mutating: boolean;
  readonly requiresConfirmation: boolean;
  /** Exact parameter names accepted by the tool. */
  readonly parameters: readonly string[];
}

export interface CopilotToolCall {
  readonly tool: string;
  readonly role: CopilotRole;
  readonly parameters: Readonly<Record<string, unknown>>;
  /** Human-in-the-loop confirmation for mutating tools. */
  readonly confirmed?: boolean;
}

export type ToolRejection =
  | 'unknown_tool'
  | 'forbidden'
  | 'invalid_parameters'
  | 'confirmation_required';

export interface CopilotAuditEntry {
  readonly tool: string;
  readonly role: CopilotRole;
  readonly mutating: boolean;
  readonly outcome: 'allowed' | 'rejected';
  readonly reason?: ToolRejection;
  readonly at: Date;
}

export type CopilotDecision =
  | { readonly allowed: true; readonly audit: CopilotAuditEntry }
  | { readonly allowed: false; readonly reason: ToolRejection; readonly audit: CopilotAuditEntry };

/** Tools shipped with the copilot; operators can extend the registry per deployment. */
export const DEFAULT_COPILOT_TOOLS: readonly CopilotTool[] = [
  {
    name: 'analytics.query',
    description: 'Read aggregated revenue, utilization and retention metrics.',
    requiredRoles: ['owner', 'manager'],
    mutating: false,
    requiresConfirmation: false,
    parameters: ['metric', 'period'],
  },
  {
    name: 'appointments.reschedule',
    description: 'Move one appointment to a new start time.',
    requiredRoles: ['owner', 'manager', 'receptionist'],
    mutating: true,
    requiresConfirmation: true,
    parameters: ['appointmentId', 'start'],
  },
  {
    name: 'inventory.lookup',
    description: 'Read stock levels for a SKU.',
    requiredRoles: ['owner', 'manager', 'receptionist', 'barber'],
    mutating: false,
    requiresConfirmation: false,
    parameters: ['sku'],
  },
  {
    name: 'clients.export',
    description: 'Export client records for the operator organisation.',
    requiredRoles: ['owner'],
    mutating: false,
    requiresConfirmation: false,
    parameters: [],
  },
];

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
    audit: { tool: call.tool, role: call.role, mutating, outcome: 'rejected', reason, at },
  });

  if (!tool) return reject('unknown_tool', false);
  if (!tool.requiredRoles.includes(call.role)) return reject('forbidden', tool.mutating);
  if (!parametersMatch(tool, call.parameters)) return reject('invalid_parameters', tool.mutating);
  if (tool.mutating && tool.requiresConfirmation && call.confirmed !== true) {
    return reject('confirmation_required', true);
  }
  return {
    allowed: true,
    audit: { tool: tool.name, role: call.role, mutating: tool.mutating, outcome: 'allowed', at },
  };
}
