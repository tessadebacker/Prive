# Aim — Habits & Goals

A mobile-first habit and goal tracker, installable straight to your phone's home
screen as an app (Progressive Web App — no app store needed).

## What it does

- **Habits** — short-term routines (exercise, drink water, read) you repeat on a
  schedule: every day, a number of times per week, or specific weekdays. Check
  them off each day and build a streak.
- **Goals** — long-term achievements (like getting a boat licence) with optional
  milestones/steps and a target date. Mark them achieved when you get there.
- **Points** — every habit check-off and every goal you achieve earns points,
  which add up to levels.
- **Rewards** — set small gifts for yourself (a coffee, a movie night) tied to a
  point cost, and claim them once you've earned enough.

All data is stored locally on your device (browser storage) — there's no
account or server, so it works offline once installed.

## Running it locally

```bash
npm install
npm run dev
```

Then open the printed local URL. For a production build:

```bash
npm run build
npm run preview
```

## Installing it on your phone

1. Deploy the built `dist/` folder to any static host (e.g. Vercel, Netlify,
   GitHub Pages, Cloudflare Pages), or run it on your own network and open that
   URL on your phone.
2. **iOS (Safari):** open the site, tap the Share icon, then "Add to Home
   Screen".
3. **Android (Chrome):** open the site, tap the menu (⋮), then "Add to Home
   screen" / "Install app".

It'll then launch full-screen like a native app, with its own icon.

## Regenerating icons

App icons are generated (no image-editing tools required) via:

```bash
node scripts/generate-icons.mjs
```
