# Release validation

Validation is automated in [Quality and Pages](../.github/workflows/ci-pages.yml). The workflow run for a source revision is the authoritative CI record. Deployment depends on its quality job and publishes its exact artifact.

Local acceptance on Windows, 2026-10-25:

- Strict TypeScript and ESLint passed.
- 43 Vitest tests passed, including 160 starting boards across all 20 levels and 60 complete seeded campaign replays. Action replay, identity uniqueness, stable boards, special combinations, jelly/frosting, booster quotas, win/loss, remaining-move bonuses, and save recovery are covered.
- Chromium and iPhone-sized WebKit production journeys passed. Coverage includes tap and swipe moves, keyboard controls, invalid swaps, hints/boosters, stars/unlocks, reload persistence, offline reload/play, installation assets, and responsive layout from 320 to 1365 CSS pixels.
- Axe WCAG A/AA scans passed for the main game surface in both browser engines. This supplements manual review; it is not a complete accessibility certification.
- The complete browser suite also passed against the `/candycrush/` production build. CI repeats installation/offline/layout smoke tests against the exact repository-path deployment artifact.
- The npm audit reported zero known dependency vulnerabilities at validation time.
- Original app icons and candy/scenery vectors were inspected. Font and runtime license notices ship in the precache.

Independent review identified and resolved: accepted moves persisting only after animation, restored boards above the unlocked level, missed service-worker installation events, overlapping star markers, safe-area padding, text contrast, and missing distribution notices.

Physical iPhone installation, hardware-specific safe areas, and device audio have not been verified by this Windows session. Follow [IPHONE.md](IPHONE.md) on the intended devices. Each device keeps separate progress; no cloud synchronization is provided.
