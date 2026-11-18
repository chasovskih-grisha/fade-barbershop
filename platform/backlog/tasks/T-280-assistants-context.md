# T-280 · Assistants Context: Orchestrator, ACL LLM, Dialog Memory

- **Stage**: M7 (phase 28) · **Tags**: backend, experimental · **Complexity**: senior · **Depends on**: T-010, T-040, T-060, T-081, T-110 (channels and data)
- **StoryPoints**: 17

## What

Scaffold of multi-agent layer (ADR 0020): `assistants` context in monolith — orchestrator (intent classification in domain), `LlmClient` port via ACL (fake in dev, provider-agnostic), tool mechanism = ports on **existing use cases** of other contexts, `AssistantConversation` aggregate and `AgentLog` journal. Inter-agent communication — events via Redis/outbox. Without full-fledged agents — only infrastructure and one reference tool for wiring verification.

## Sources

- ADR 0020, AC `24-assistants.md` (ASSIST-001…006), engineering-principles.md (ports, fake/real)

## Done

- [ ] `assistants` context created in monolith
- [ ] Orchestrator (intent classification in domain) works
- [ ] `LlmClient` port via ACL Implemented (fake in dev, provider-agnostic)
- [ ] Tool mechanism = ports on existing use cases of other contexts works
- [ ] `AssistantConversation` aggregate created
- [ ] `AgentLog` journal works
- [ ] Inter-agent communication via events (Redis/outbox) works
- [ ] `AssistantConversation` and `AgentLog` on events work
- [ ] Role inheritance and confirmation of critical actions (ASSIST-005/006) work
- [ ] End-to-end test: message from `messaging` → orchestrator → tool → slot booking use case
- [ ] Unit Tests for orchestrator and intent classification
- [ ] Integration Tests with LlmClient port (fake/real)
- [ ] Infrastructure and one reference tool for wiring verification work

## Risks

- [ ] **LLM Provider**: Unknown LLM provider may have quality or stability issues
- [ ] **Token Budget**: Token expenses can be significant and hard to predict
- [ ] **Tools on use cases**: Risk of improper use of ports on existing use cases
- [ ] **Role inheritance**: Risk of unauthorized agent actions without confirmation
- [ ] **Multi-task dependency**: Depends on T-010, T-040, T-060, T-081, T-110 — blocked by any delay
- [ ] **ADR 0020**: Multi-agent layer implementation might be more complex than expected
- [ ] **ACL isolation**: Replacing fake LlmClient with real one may require significant changes
- [ ] **AgentLog supervision**: Admin interface needed for monitoring agent actions

## Breakdown (slices, M7 — non-critical path of v1)

Senior task for a principled reason: ADR 0020 multi-agent layer is a new architectural surface, nothing here to split for junior. However, slices allow onboarding middle gradually (17 SP = 4+4+5+4):

1. **Assistants Core** *(middle, T-280a)* — domain abstractions of dialog (`AgentMessage`, `ConversationState`, `AgentTurn`): roles, form constraints, processing idempotency. Stable domain API for slices 3–4.
2. **Context + Aggregate + Journal** *(middle, T-280b)* — scaffold `assistants` in monolith, `AssistantConversation`, `AgentLog`. Structure following other contexts pattern — mechanics for middle.
3. **Orchestrator + Intent Classification** *(senior, T-280c)* — intent recognized in domain (not in LLM), role inheritance and confirmation of critical actions (ASSIST-005/006). Architectural decisions are here.
4. **ACL LlmClient + Tools** *(senior, T-280d)* — port with fake in dev, tool mechanism = ports on existing use cases; end-to-end test "message → orchestrator → tool → use case". Key protection against bypassing domain logic (ADR 0020).

Task deliberately sits in M7: all dependencies (T-010, T-040, T-060, T-081, T-110) are ready — does not block v1. If phase 28 starts — orchestrator (Slice 2) should not start without founder's review of ADR 0020.