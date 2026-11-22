import {
  authorizeCopilotToolCall,
  DEFAULT_COPILOT_TOOLS,
  registerCopilotTools,
} from './copilot-tools';

const at = new Date('2026-11-22T10:00:00Z');
const registry = registerCopilotTools(DEFAULT_COPILOT_TOOLS);

describe('copilot tool registry (T-5019)', () => {
  it('rejects duplicate and role-less tools', () => {
    expect(() => registerCopilotTools([DEFAULT_COPILOT_TOOLS[0]!, DEFAULT_COPILOT_TOOLS[0]!])).toThrow(
      /Duplicate copilot tool/
    );
    expect(() =>
      registerCopilotTools([
        {
          name: 'unsafe.tool',
          description: 'no roles',
          requiredRoles: [],
          mutating: false,
          requiresConfirmation: false,
          parameters: [],
        },
      ])
    ).toThrow(/must declare allowed roles/);
  });

  it('allows a read tool for a permitted role and audits it', () => {
    expect(
      authorizeCopilotToolCall(
        registry,
        { tool: 'analytics.query', role: 'manager', parameters: { metric: 'revenue', period: '2026-11' } },
        at
      )
    ).toEqual({
      allowed: true,
      audit: {
        tool: 'analytics.query',
        role: 'manager',
        mutating: false,
        outcome: 'allowed',
        at,
      },
    });
  });

  it('rejects tools outside the role and records the reason', () => {
    const decision = authorizeCopilotToolCall(
      registry,
      { tool: 'clients.export', role: 'barber', parameters: {} },
      at
    );
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe('forbidden');
      expect(decision.audit).toEqual({
        tool: 'clients.export',
        role: 'barber',
        mutating: false,
        outcome: 'rejected',
        reason: 'forbidden',
        at,
      });
    }
  });

  it('requires human confirmation for mutating tools', () => {
    const rejected = authorizeCopilotToolCall(
      registry,
      {
        tool: 'appointments.reschedule',
        role: 'receptionist',
        parameters: { appointmentId: 'a-1', start: '2026-11-23T10:00:00Z' },
      },
      at
    );
    expect(rejected.allowed).toBe(false);
    if (!rejected.allowed) expect(rejected.reason).toBe('confirmation_required');

    expect(
      authorizeCopilotToolCall(
        registry,
        {
          tool: 'appointments.reschedule',
          role: 'receptionist',
          parameters: { appointmentId: 'a-1', start: '2026-11-23T10:00:00Z' },
          confirmed: true,
        },
        at
      ).allowed
    ).toBe(true);
  });

  it('rejects unknown tools and parameter mismatches', () => {
    const unknown = authorizeCopilotToolCall(
      registry,
      { tool: 'nope', role: 'owner', parameters: {} },
      at
    );
    expect(unknown.allowed).toBe(false);
    if (!unknown.allowed) expect(unknown.reason).toBe('unknown_tool');

    const extra = authorizeCopilotToolCall(
      registry,
      { tool: 'inventory.lookup', role: 'barber', parameters: { sku: 'X', extra: 1 } },
      at
    );
    expect(extra.allowed).toBe(false);
    if (!extra.allowed) expect(extra.reason).toBe('invalid_parameters');
  });
});
