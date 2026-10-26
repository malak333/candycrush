# Architecture and delivery

Sugar Spell is a static React and TypeScript app built by Vite. A pure deterministic engine owns gameplay. React owns gestures, animation, sound, and dialogs. Versioned, validated browser storage owns saves. No server is needed during play.

## Offline builds

`npm run build` checks types, runs Vite, then `scripts/build-sw.mjs` hashes paths and contents of the built files. It injects an exact precache list and build version into `dist/sw.js` from the `public/sw.js` template. The worker and source maps are excluded. Fonts are bundled and precached; no runtime CDN is required.

Installation completes only after the full cache is written. Known assets and navigations use one coherent cached build. New workers wait until the UI sends `{type:'SKIP_WAITING'}` after the player chooses to update. Activation cleans only Sugar Spell caches for the same scope. Every deployment path has its own cache namespace.

Manifest paths are relative. Vite's base URL locates bundles and the worker. Deployment under `/candycrush/` or `/sugar-spell/` keeps requests in that path.

## GitHub Pages

Enable Actions and choose **GitHub Actions** as the Pages source. Push to `main` and watch **Quality and Pages**. Deployment requires the quality job to succeed. Open the deployed URL and run actual-device checks in [IPHONE.md](IPHONE.md).

Quality jobs have read-only repository permissions. Only the deployment job receives `pages:write` and `id-token:write`. Pull requests have no deployment privileges. Official actions use full commit pins; checkout doesn't retain credentials. Dependabot proposes reviewed dependency updates.

Pages builds use `VITE_BASE_PATH=/<repository-name>/`. For a root custom domain, build with `/`. Upload all of `dist/` to an HTTPS static host. Opening through `file://` is unsupported.

## Reproduce a repository-path build

```powershell
$env:VITE_BASE_PATH = '/candycrush/'
npm run build
Remove-Item Env:VITE_BASE_PATH
npm run preview
```

Visit the preview URL plus `/candycrush/`. Check icons, manifest, fonts, and worker. Build again without the variable before running the root-based browser suite.

## Maintenance

Revert a faulty source change and let the same workflow validate and redeploy to roll back. Existing app windows may keep their cached version until the update is accepted or all clients close. Browser storage isn't a backup. There are no accounts, telemetry, payments, or synchronization.

Action pin provenance: [checkout v4.2.2](https://github.com/actions/checkout/releases/tag/v4.2.2), [setup-node v4.4.0](https://github.com/actions/setup-node/releases/tag/v4.4.0), [upload-artifact v4.6.2](https://github.com/actions/upload-artifact/releases/tag/v4.6.2), [upload-pages-artifact v3.0.1](https://github.com/actions/upload-pages-artifact/releases/tag/v3.0.1), [deploy-pages v4.0.5](https://github.com/actions/deploy-pages/releases/tag/v4.0.5).
