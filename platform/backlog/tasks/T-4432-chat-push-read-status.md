# T-4432 · Chat: new message push + "read" status

- **Stage**: M2 (phase 5) · **Tags**: backend, mobile, messaging · **Complexity**: middle · **Depends on**: T-081, T-080
- **StoryPoints**: 5

## What

Chat (T-081) receives realtime delivery: "new message" push via prime channels (T-4431/T-080), message-level `delivered`/`read` statuses, read synchronization on read models for the unread badge; for the barber — a separate counter in the app.

## Why

Chat without push lives only in the app; the client expects to reply quickly — without a call center, this is a push focus (the client will be disappointed by the wait).

## Sources

- messaging README; client-screens.md; barber-screens.md; T-081

## Done

- [ ] Push channel for new chat messages (with routing to dialog)
- [ ] Delivered/read statuses are read in both apps; counter badge is synchronized
- [ ] Push deduplication during rapid messaging

## Risks

- [ ] **Edition dedup**: realtime + push duplicate delivery — formula "push only for inactive screens" in test