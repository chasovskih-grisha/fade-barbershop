# T-280d · ACL LlmClient + tools (Slice 4/4)

- **Stage**: M7 (phase 28) · **Tags**: backend, experimental · **Complexity**: senior · **Depends on**: T-280c
- **StoryPoints**: 4

## What

Slices 3–4 of parent T-280 (combined): `LlmClient` port behind ACL (fake in dev, provider-agnostic), tool mechanism = ports to existing use cases of other contexts, inter-agent exchange via events (Redis/outbox — copying pattern T-042). End-to-end test: message from `messaging` → orchestrator → tool → slot request use case; one reference tool to verify connection.

## Why

Key protection against domain logic bypass (ADR 0020): tool = port, critical actions require confirmation.

## Sources

- ADR 0020 (ACL, tools = ports)
- engineering-principles.md (ports, fake/real)

## Done

- [ ] `LlmClient` port behind ACL implemented (fake in dev)
- [ ] Tool mechanism = ports to existing use cases working
- [ ] Inter-agent exchange via events (Redis/outbox) working
- [ ] End-to-end test "message → orchestrator → tool → use case" green
- [ ] Integration tests with LlmClient port (fake/real)

## Risks

- [ ] **ACL isolation**: replacing fake with real provider must not touch the domain

## dependencies

- T-281 (ConciergeAgent — first real agent atop connection)
