/** Типи реєстру інструментів AI-копілота (T-5019). */

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
  | {
      readonly allowed: false;
      readonly reason: ToolRejection;
      readonly audit: CopilotAuditEntry;
    };
