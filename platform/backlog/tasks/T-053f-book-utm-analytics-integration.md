# T-053f · UTM analytics integration book.fade.com.ua

- **Stage**: M1 (phase 4) · **Tags**: frontend, analytics · **Complexity**: middle · **Depends on**: T-053c, T-110
- **StoryPoints**: 5

## What

UTM analytics integration для quick-booking:
- Parse UTM parameters from URL
- Store utm_source, utm_medium, utm_content
- Default to utm_content=direct, utm_source=direct, utm_medium=none
- Attach UTM to booking record
- Cross-domain analytics with main site
- GA4 event tracking
- Attribution reporting

## Sources

- T-053 (quick-booking context)
- T-110 (analytics context)
- T-4598 (GA4 key events)

## Done

- [ ] UTM parsing працює
- [ ] Storage працює
- [ ] Defaults працюють
- [ ] Attachment to booking працює
- [ ] Cross-domain tracking працює
- [ ] GA4 events працюють
- [ ] Attribution працює

## Risks

- [ ] **Data accuracy**: cross-domain tracking може бути неточним
