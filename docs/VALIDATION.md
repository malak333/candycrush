# Release validation

Validation is automated in [Quality and Pages](../.github/workflows/ci-pages.yml). The workflow run for a source revision is the authoritative CI record. Deployment depends on its quality job and publishes its exact artifact.

Local acceptance on Windows, 2026-10-25:

- Strict TypeScript and ESLint passed.
- 54 Vitest tests passed. Every one of the 10,000 definitions and starting boards is validated, with 108 complete seeded games across curated levels, generated modes, difficulty boundaries, and levels 9,999/10,000. Tests cover action replay, stable boards, specials, jelly/frosting, quotas, win/loss, bonuses, and complete campaign save recovery. These checks do not prove that every random deal is winnable within its move limit.
- Chromium and iPhone-sized WebKit production journeys passed. Coverage includes tap and swipe moves, keyboard controls, invalid swaps, hints/boosters, stars/unlocks, reload persistence, offline reload/play, installation assets, and responsive layout from 320 to 1365 CSS pixels.
- Axe WCAG A/AA scans passed for the main game surface in both browser engines. This supplements manual review; it is not a complete accessibility certification.
- The complete browser suite also passed against the `/candycrush/` production build. CI repeats installation/offline/layout smoke tests against the exact repository-path deployment artifact.
- The npm audit reported zero known dependency vulnerabilities at validation time.
- Original app icons and candy/scenery vectors were inspected. Font and runtime license notices ship in the precache.

Independent review identified and resolved: accepted moves persisting only after animation, restored boards above the unlocked level, missed service-worker installation events, overlapping star markers, safe-area padding, text contrast, and missing distribution notices.

Physical iPhone installation, hardware-specific safe areas, and device audio have not been verified by this Windows session. Follow [IPHONE.md](IPHONE.md) on the intended devices. Each device keeps separate progress; no cloud synchronization is provided.
