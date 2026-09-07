# Odette

A mobile-first Next.js habit-tracker prototype based on the supplied screens. All animated UI uses Framer Motion; screen navigation is immediate.

## Run

```sh
npm install
npm run dev
```

`npm run build` creates a static export in `out`. `npm run typecheck` checks TypeScript.

## Screens

Use `?screen=welcome`, `signup`, `login`, `name`, `focus`, `routine`, `ready`, `dashboard`, `today`, `progress`, `calendar`, or `rituals`. Browser back/forward navigation is supported. Add Ritual opens from the plus button on Rituals; edit progress opens from the daily overview.

## Prototype data

Habits, nickname and focus choices are saved only in this browser under `odette-local-v1`. The first direct dashboard visit uses the supplied reference data. Completing onboarding starts the selected habits at zero. Updating a habit recalculates completion. Authentication forms are a preview, not real accounts; passwords and emails are not saved or transmitted. Google sign-in explains its unavailable state and offers entry to the preview.

Calendar dates and historical statistics are reference/demo data, not a connected reporting backend. Historical date navigation is visual; persistent per-day tracking and real streak calculation are not implemented. Profile and help use compact dialogs because no additional page designs were supplied.

## Assets and typography

The 11 originals in `image/` have descriptive filenames. Trimmed web assets are in `public/images/`; regenerate with `node scripts/prepare-assets.mjs`. The welcome flower combines the supplied open lotus and supplied stem.

DM Serif Display Regular and Geist are bundled locally from Fontsource. Small copy uses the Apple system SF Pro font when available, with Helvetica/Arial fallbacks elsewhere. No redistributable SF Pro font file was supplied.

The menu uses an expanding top-right mask, staggered labels and two lines morphing into a close icon. KOTA could not load in the available browser, so exact mobile animation matching has not been verified.

Optional WebMCP tools are registered when the browser supports `document.modelContext`; unsupported browsers work normally. A supported WebMCP validation context was unavailable, so these tools have not been integration-tested.
