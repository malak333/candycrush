# Sugar Spell

An original, candy-themed match-three game for iPhone Home Screens and desktop browsers. 10,000 levels, striped and wrapped sweets, rainbow truffles, jelly, frosting, boosters, stars, sound, and device-local saves. No account, ads, purchases, lives, or timer.

[Play Sugar Spell](https://malak333.github.io/candycrush/) · [Source](https://github.com/malak333/candycrush) · [iPhone installation](docs/IPHONE.md)

## Add it to an iPhone

1. Open the [game](https://malak333.github.io/candycrush/) in Safari while online.
2. Wait for **Ready for offline play**.
3. Tap **Share → Add to Home Screen → Add**. Enable **Open as Web App** if offered.
4. Open the new Sugar Spell icon. Repeat on each iPhone.

The first visit needs a connection. Thereafter the installed app can play offline. Each device keeps its own progress. Clearing website data removes that device's saves. No Apple developer account, signing, or TestFlight is required. See [Apple's instructions](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).

## Play

Tap two neighboring candies, swipe one onto a neighbor, or use arrow keys and Enter. Match three to clear them. Invalid swaps cost no moves. Match four for a striped sweet, five in a straight line for a rainbow truffle, and an L or T for a wrapped sweet. Special sweets combine for larger effects. Finish the score and board goals within the move limit. Hints are free; boosters replenish for each level.

The first 20 levels are hand-designed; levels 21–10,000 use reproducible generated layouts with capped difficulty, themed regions, jelly, and frosting. The journey renders only 50 levels at a time and supports direct level lookup. Earn up to 30,000 stars.

## Develop and verify

Use Node.js 22.12 or later and npm. The committed lockfile records exact dependency versions.

```sh
npm ci
npm run dev
```

```sh
npm run check
npm run build
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

The browser suite tests the production build. `npm run preview` serves it locally. Development mode avoids installing an offline worker; use the production preview to test offline behavior. iPhones need an HTTPS deployment for offline installation.

## Delivery

[Quality and Pages](.github/workflows/ci-pages.yml) checks every pull request and push to `main`: types, lint, unit tests, production build, desktop Chromium, and iPhone-sized WebKit. A successful `main` run builds for the repository path and deploys to GitHub Pages. Browser reports and the built app are retained as workflow artifacts.

For another repository, enable **Settings → Pages → Build and deployment → Source: GitHub Actions**. The workflow derives the base path from the repository name. See [architecture and deployment](docs/ARCHITECTURE.md).

## Project boundaries

This is an independent game with original branding, illustrations, interface, and sound. It implements familiar match-three mechanics and is not affiliated with King or Candy Crush. It has no backend, cloud synchronization, multiplayer, or App Store binary. WebKit automation covers browser behavior; physical device installation should also be checked using the [acceptance steps](docs/IPHONE.md).

Code and original artwork use the [MIT License](LICENSE). Bundled Lilita One and Nunito fonts retain their upstream SIL Open Font License notices. See [third-party notices](docs/THIRD_PARTY.md).
