# T-3700 · App Store Release

- **Stage**: M6 (phase 40) · **Tags**: frontend · **Complexity**: senior · **Depends on**: T-070, T-303
- **StoryPoints**: 20

## What
Release in App Store (iOS) / Play Store (Android): certificates and provisioning, App Store Connect / Play Console setup, metadata (title, description, keywords, screenshots, preview video), privacy manifest, ATT prompt, age rating, In-App Purchases configuration, testing via TestFlight/internal testing, staged rollout (1%→10%→100%), monitoring (Crashlytics/Sentry), review guidelines compliance.

## Why
Mobile app publication. First impression in stores. Store page conversion → install. Fast fix via staged rollout.

## Sources
- Apple App Store Review Guidelines
- Google Play Policy
- docs/app-store-release.md — phantom 2026-09-22: file never existed; source accepted at task start

## Dependencies
> Slices are allocated at task start; individual subtask files are created then as needed.
