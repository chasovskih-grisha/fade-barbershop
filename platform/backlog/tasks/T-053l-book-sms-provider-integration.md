# T-053l · SMS provider integration book.fade.com.ua

- **Stage**: M1 (phase 4) · **Tags**: backend, integration · **Complexity**: middle · **Depends on**: T-053c, T-080
- **StoryPoints**: 5

## What

SMS provider integration для quick-booking:
- SMS provider selection (Turbosms/AlphaSMS)
- OTP code generation and sending
- SMS delivery tracking
- Rate limiting for SMS
- Failed SMS retry logic
- Integration з notifications context (T-080)
- Cost tracking

## Sources

- T-080 (notifications context)
- T-080b (SMS integration)
- notifications README

## Done

- [ ] Provider selected
- [ ] OTP generation працює
- [ ] SMS sending працює
- [ ] Delivery tracking працює
- [ ] Rate limiting працює
- [ ] Retry logic працює
- [ ] Integration працює
- [ ] Cost tracking працює

## Risks

- [ ] **Provider reliability**: SMS provider може бути недоступний
