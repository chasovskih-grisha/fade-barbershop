# Changelog

All notable changes to this project will be documented in this file.

## Recent Commits

- 573346de T-5012: Implement dynamic staff scheduling & shift bidding marketplace
- 9773ff70 Implement T-5011: Dynamic Surge Pricing & Peak-Hour Revenue Optimization
- a4bdd2c4 T-5008: Implement Gamified Tiered Membership & Subscription Pass System
- 68430b75 T-4450: Implement Loyalty Program Configuration
- e3ad2229 T-4449: Web Push для кабінету — Push subscription and module integration
- 63c037bd T-4448: Data Export (CLT-01) & Pre-launch Backup Verification — CSV export and scheduling module integration
- e55a1f6f T-4447: Barber leave — integrate day-off infrastructure
- f08e8d17 T-4446: Add calendar export ICS endpoint for bookings
- 78de33e6 T-4445: Add recommended services admin settings
- 3073530b T-4444: Add deposit policy version acceptance tracking to booking data
- 94b750e6 waitlist: strip foreign eslint-disable headers from service/controller/dto/domain (parallel refactor cleanup)
- 4735c2cc refactor(scheduling): remove redundant code and tighten error handling (T-4619a, T-4560, T-095)
- ab6bd5f4 feat(web): share a barber profile by copy or share sheet (T-4862a)
- 07f6d08c feat(scheduling): create, capture and sweep deposit holds (T-4619a)
- ec0be096 feat(scheduling): hold the chair for 15 minutes while a deposit is unpaid (T-4619a)
- 1007c4e5 feat(scheduling): persist the cancellation reason journal in the database (T-4560)
- 0c3041cc fix(billing): make the fiscal and payment adapters compile under exact optional types
- 2f74603e feat(scheduling): add cancellation and no-show reasons with reporting (T-4560)
- 8885222a fix(scheduling): escalate no-shows with an explicit retain or refund resolution (T-095)
- 955bb203 feat(scheduling): refund the deposit when an admin removes a no-show (T-160)
- db96ec30 fix(payment): repair the waitlist deposit flow (T-197)
- 2cfc9a51 feat(payment): implement the T-094 refund mechanics
- 19cf16d2 feat(payment): implement the T-093 on-site payment
- 3bb08601 feat(payment): close the T-092 Checkbox receipt chain
- a058ec13 feat(payment): rebuild the T-091 deposit flow on the booking snapshot
- 6a04ac04 fix(feedback-surfaces): persist review processing and repair the review adapters
- a114c2d4 feat(portfolio): implement the gallery consent and moderation cycle
- 534102c6 docs(profile): specify the unsaved-edit prompt on both profiles (T-4733a)
- ca1e95be chore(api): add pdfkit for the waitlist analytics PDF export
- 342513c4 feat(scheduling): implement the waitlist client, admin and no-show slices
- c6f35a51 feat(scheduling): add the waitlist queue port with an in-memory adapter
- da68b10d fix(notifications): make the waitlist offer channels optional and typed
- c5942e80 fix(payment): report one payment lifecycle and skip deposits on free visits
- b3976470 fix(scheduling): raise the module with a calendar and a real reference-photo token
- 83a71c35 fix(scheduling): persist staged no-show records and broaden the status label
- 2e95c8ce fix(scheduling): wire attendance types and the no-show escalation ports
- 10f5b302 feat(scheduling): apply discounts and the configured deposit policy on booking
- b89ae783 feat(notifications,discounts): waitlist SMS sender, journal adapter and risk types
- 36dc201d feat(scheduling): implement the waitlist-admin domain and complete domain contracts
- 1cf93f07 fix(prisma): restore the truncated schema and regenerate the client
- 4fcce6d0 docs(memory): record T-2300f mobile blog run notes
- ee6767b9 feat(content): add blog feed and article screens to mobile app
- 919ffa38 docs(memory): record T-2300e web-slice run notes
- 9a23828f feat(content): add blog search field and tag archive pages
- 8c3c7a3d fix(api): repair duplicated import specifiers and broken module paths
- 56848f27 fix(api): restore newlines corrupted to literal \n in source files
- d827080e docs(memory): record T-2300e API-slice run notes
- 13c10234 feat(content): search, tag filter and cursor for the public blog feed
- 5c623f9b docs(memory): record T-4732a run notes
- 6c273b15 docs(profile): specify the profile doors on web and app
