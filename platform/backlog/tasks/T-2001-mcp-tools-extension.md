# T-2001 · MCP Server Tools Extension

- **Stage**: M7 (phase 28) · **Tags**: backend, integration, experimental · **Complexity**: middle · **Depends on**: T-2000
- **StoryPoints**: 15

## What

Second wave of MCP server tools (T-2000): clients (`getCustomer`, `listCustomers` — within role limits), barbers (`getBarber`, `listBarbers`), loyalty (`getLoyalty` — read-only; counter modification — **forbidden**, only via domain events), services (`getServiceByCategory`), bookings (`cancelBooking`, `updateBooking` — with ASSIST-006 confirmation). Each tool is a port to an existing use case, with authentication and `AgentLog` — same as in T-2000.

## Why

Full (yet controlled) access to CRUD operations via MCP. Unified interface for external AI agents without expanding the attack surface directly.

## Sources

- ADR 0020 (multi-agent layer: tool = port, critical actions with confirmation)
- ADR 0009 (loyalty counter changes exclusively via events — not tools)
- README `assistants`, `crm`, `scheduling`; AC 24 (ASSIST-*)

## dependencies

- T-2000 (MCP server: SDK, authentication, `AgentLog` — foundation)
- T-060 (CRM profiles — source of client read use cases)
- T-140 (loyalty — progress read use cases)

## Done

- [ ] Client/barber tools return only fields permitted by the role (role-based scoping — T-2400 when available)
- [ ] `getLoyalty` is read-only; attempts to modify the counter via tool are blocked by tests
- [ ] `cancelBooking`/`updateBooking` require explicit dialogue confirmation (ASSIST-006) and write `AgentLog`
- [ ] Integration tests for each tool (port fakes); security review before merge
- [ ] Documentation updated in README `assistants`

## Risks

- [ ] **PII via MCP**: tool responses may carry personal data — filter fields by role, log access (relation to T-3601/T-3604)
- [ ] **Surface creep**: every tool requires separate review; 'use case first, then tool' rule
- [ ] **Write tool idempotency**: repeated `cancelBooking` calls must not duplicate effects (idempotency key — ADR 0021/T-4207)
