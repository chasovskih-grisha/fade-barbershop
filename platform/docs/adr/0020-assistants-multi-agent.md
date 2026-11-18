# ADR 0020: Multi-agent layer — `assistants` context in monolith

- Status: proposed
- Date: 2026-09-19
- Context: `messaging`, `scheduling`, `crm`, `catalog`, `analytics`, `loyalty`, `discounts`, `feedback`
- Criteria: `docs/acceptance-criteria/24-assistants.md` (ASSIST-*)

## Context

Client path grew: booking, reschedules, price questions, reminders, loyalty. All already covered by use cases of separate contexts, but user must navigate screens themselves. Request appears for "concierge" in chat, and for founder — data assistant. Question — how to add LLM layer without breaking monolith, not duplicating domain logic and not bypassing context boundaries.

## Decision

### 1. Agents — new bounded context `assistants`, not microservices

One context in monolith (ADR 0002). It owns only its language: `Agent`, `Conversation`, `ToolInvocation`, `AgentLog`. It **has no own** Appointment, ClientProfile etc — only references their IDs.

### 2. Agent = LLM + tool-calling on existing use cases

Agent tool — not "SQL to tables", but **port to ready use case** of other context (`SchedulingBook`, `CrmClientLookup`, `AnalyticsAsk`). Domain logic (slots, conflicts, prices, discounts) remains in domain — agent doesn't duplicate and doesn't bypass it.

### 3. LLM — via ACL, provider-agnostic

Port `LlmClient` (as `AIFileGenerationGateway` in ADR 0008): in dev — fake, in prod — external provider. Prompt and tool structure independent of vendor.

### 4. Exchange between agents — events, not direct calls

Orchestrator receives input from `messaging`, chooses agent by intent (classification in domain, not in prompt), agent calls tools via ports. Between agents — events via same Redis/outbox as other contexts. Triggers — system events (`AppointmentCompleted`, `SlotCancelled`), not LLM cron-jobs.

### 5. Memory

- Short — message stack `Conversation`.
- Long — reading via ports `crm` (`ClientProfile`, history) and `scheduling` (visits). Each dialog — aggregate `AssistantConversation` in `assistants`.

### 6. Rights: agent acts on behalf of role, Human-in-the-loop on critical actions

Agent inherits user role (client / barber / admin) and doesn't extend it. Actions with money (deposit, payment, discounts, promo codes) and actions requiring explicit client will (booking confirmation) pass **client confirmation before execution** — agent shows intent, executes after explicit "Yes". Dialog log and called tools (`AgentLog`) — admin oversight.

## Consequences

- **Pros**: client path not split across screens; founder asks data in natural language; domain secure (ACL and ports); agents can be added without new services.
- **Cons/cost**: LLM calls — cost and latency; prompts and parameters — configurable, not hardcoded; dialog log — personal data (same storage mode as ADR 0008/0015).
- **Future**: channels (Telegram/Instagram) connect to `messaging`, not to agents; inventory source for ops assistant — when stock model appears (phase 27/shop), assistant only subscribes to events.

## Rejected alternatives

1. **Microservice per agent** — distribution complexity without gain; ADR 0002.
2. **"Just prompt over tables"** — agent would read/write around domain invariants (prices, slots, discounts) and break system of truth.
3. **LLM in each context** — same code twice/thrice instead of one context with ports.
4. **Agent directly writing to `scheduling`/`crm`** — bypassing use cases and losing action audit.
