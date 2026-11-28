import { authorizeCopilotToolCall, DEFAULT_COPILOT_TOOLS, registerCopilotTools } from './copilot-tools';

const at = new Date('2026-11-22T10:00:00Z');
const registry = registerCopilotTools(DEFAULT_COPILOT_TOOLS);

describe('copilot tool guards (T-5019)', () => {
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
    const unknown = authorizeCopilotToolCall(registry, { tool: 'nope', role: 'owner', parameters: {} }, at);
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
