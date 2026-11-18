# 24. Assistants: multi-agent layer

> Feature: LLM layer on top of ready contexts — orchestrator and agents call **existing use cases** via ports (ADR 0020). Client gets "concierge" in chat, founder — data assistant, barber/admin — ops assistant. This is layer on top of core, introduces no new domain logic — so outside v1, after M4/M5, when there's data and channels.

> Contexts: **`assistants`** (new) — orchestrator, agents, dialog memory; ports read/call `scheduling`, `crm`, `catalog`, `analytics`, `loyalty`, `discounts`, `feedback`; input channel — `messaging`. Mechanics — **ADR 0020**.

## Rule (common)

- [ ] **ASSIST-001.** `assistants` context: orchestrator chooses agent by intent (classification in domain, not in prompt); agents don't know others' Entities — only IDs and ports to other contexts' use cases. No agent calls SQL/repositories of other contexts directly.
- [ ] **ASSIST-002.** Agent tool = port to ready use case (`SchedulingBook`, `CrmClientLookup`, `AnalyticsAsk`, …). Domain logic (slots, conflicts, prices, discounts) remains in domain; agent only forms valid intent.
- [ ] **ASSIST-003.** LLM provider — via ACL (port `LlmClient`): in dev — fake, in prod — external; prompts and parameters configured by admin, not hardcoded.
- [ ] **ASSIST-004.** Between agents — events (same Redis/outbox). Triggers — system events (`AppointmentCompleted`, `SlotCancelled`), not LLM cron-heartbeat.
- [ ] **ASSIST-005.** Dialog = `AssistantConversation` aggregate, all tool calls protocolled in `AgentLog` (who, when, which tool, which result) — admin oversight.
- [ ] **ASSIST-006.** Agent inherits user role and doesn't extend it. Money actions (deposit, payment, discounts, promo codes) and actions requiring client will (booking confirmation) **executed only after explicit confirmation** in dialog; agent shows intent before action.

## Client (ConciergeAgent, web and mobile)

- [ ] **ASSIST-WEB-01.** Chat with assistant from cabinet/site: booking request → assistant shows free slots (same availability as booking flow) → client chooses → **booking confirmation** → `Appointment` created via standard use case (deposit/discounts — as in regular booking).
- [ ] **ASSIST-WEB-02.** Reschedule/cancel visit via dialog: only own future visits, with same policy (deposit cancellation window — PAY-ADM-09), confirmation before action.
- [ ] **ASSIST-MOB-01.** Same assistant in mobile chat (`messaging`, phase 7): booking, reschedule, cancel, questions about prices/services/schedule.
- [ ] **ASSIST-MOB-02.** Proactive hints from assistant context: visit reminder, completed loyalty (7th visit), review invitation — same source as phase 7 push.

## Founder (OwnerAnalystAgent, admin)

- [ ] **ASSIST-ADM-01.** Founder's natural-language data questions: chair occupancy, revenue, no-show, conversion — read-only via `analytics` (OHS read-model, ANL-*); agent never changes data.
- [ ] **ASSIST-ADM-02.** Periodic reports (daily/weekly) on events — delivered by same channel as notifications; frequency and format — admin setting.
- [ ] **ASSIST-ADM-03.** Admin: assistants enable/disable, daily limits, `AgentLog` journal, dialog review; direct execution of money actions by agent impossible (manual confirmation in dialog or prohibition).

## Barber (OpsAgent)

- [ ] **ASSIST-BAR-01.** Day summary and routine barber hints (day calendar, next-up, reminder about haircut reference on future visits) — read-only, without schedule changes.
- [ ] **ASSIST-BAR-02.** Ops assistant doesn't auto-change barber schedule/visits; reschedule — via standard use cases with barber role and confirmation.

## Open questions

1. **LLM provider** (same as `haircut-ai` or separate, and token budget) — default: separate port, provider chosen by admin.
2. **Channels** (Telegram/Instagram connect via `messaging`, not via assistants) — default: v1 assistants only native channels (web cabinet, mobile).
3. **Inventory source for OpsAgent** (stock reminders) — source appears with stock model (phase 27); before that OpsAgent works without stock hints.
