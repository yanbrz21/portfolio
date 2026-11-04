# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio site for "Manto" (Roblox / Luau developer). Static single page plus two Vercel serverless functions that proxy the Roblox public APIs. No `package.json`, no build step, no bundler, no linter, no tests.

## Commands

- **Local dev:** `node scripts/dev.mjs [port]` (default 3210). It serves `public/` and runs the `api/` handlers through a small Vercel-style `req`/`res` shim, re-importing the handler on every request. `vercel dev` also works but needs a valid `vercel login`. Opening `public/index.html` directly does not work: the page needs `/api/games` and `/api/user`.
- **Deploy:** the directory is linked to the Vercel project `devportfolio` (`.vercel/`, gitignored). `vercel` creates a preview deployment, `vercel --prod` a production one.

## Architecture

```
public/    static site served at /  (index.html, style.css, script.js, img/, videos/)
api/       Vercel serverless functions served at /api/*  (ESM default-export handlers)
scripts/   local-only tooling (dev server); not deployed
```

### API proxies (`api/`)

Both exist because the Roblox APIs can't be called from the browser (CORS). Each validates `?id=`, fans out to several Roblox endpoints, and returns a flattened JSON shape that `script.js` depends on. Both set `s-maxage` cache headers so Vercel's CDN absorbs traffic.

- `api/games.js` — `id` is one **universe ID** (not a place ID) or a comma-separated list. Returns `{ data: [{ universeId, rootPlaceId, name, description, creator, playing, visits, favorites, icon, thumbnail }] }`, where `thumbnail` is the 16:9 game thumbnail and `icon` the square icon. The image lookups are optional (failures become `null`). Roblox occasionally returns `visits: 0` for every game; the handler retries and sends `no-store` if the data still looks zeroed, so a bad response is never cached.
- `api/user.js` — `id` is a Roblox user ID. Returns `{ id, username, displayName, description, followers, friends, avatarUrl }`.

Changing either response shape requires updating the consumers in `public/script.js` (`initWork` / `createRow` / `renderTotals`, and `fetchRobloxUser`).

### Frontend (`public/script.js`)

One plain script, no modules, loaded at the end of `<body>`; it looks elements up by ID at top level, so the IDs in `index.html` (`siteHeader`, `navToggle`, `workGrid`, `statVisits`, `statFavorites`, `statPlaying`, `statGames`, `robloxAvatar`, `robloxUsername`, `year`) and the `data-roblox-link` attribute are a contract between the two files.

Content that is data-driven rather than written in the HTML:

- **Games list** — the `universeIds` array at the top of `script.js` is the single source of truth for which games appear. To add or remove a project, edit that array. All games are fetched in one `/api/games` call and **sorted by total visits descending**, so array order does not control display order. `cleanName()` strips `[UPD]`-style tags and emoji from Roblox titles before display. Rows of the ranked list (`#workGrid`, an `<ol>`) are built with DOM APIs (`el()`), not `innerHTML`, because names and studio names are third-party data.
- **Totals** — total visits, favorites, concurrent players and game count are summed from the same response in `renderTotals()` and fill the sentence above the games list. They are never hardcoded; if the fetch fails they stay as "—" and the list shows a fallback link.
- **Roblox profile** — `ROBLOX_USER_ID` fills the About avatar and username. Profile links are also hardcoded in the HTML so they work without the API.

### Showcase (player and hotbar)

The Showcase is a single player with a six-slot "hotbar" under it, styled after the weapon hotbar in the gun system HUD. Each slot is a `<button class="slot">` in the HTML whose `data-*` attributes hold the clip: `data-video="videos/<name>.mp4"` (or `data-youtube="<id>"`, still supported by `playSlot()` but unused now that every clip is local), plus `data-poster`, `data-title`, `data-text` and `data-meta` (the duration). `script.js` reads them in `selectSlot()` / `playSlot()`: clicking a slot plays it, number keys only select it (one key per slot). Adding or removing a slot means updating the `slot-key` numbers, the "Slot 1 of N" text, the hint, and the `repeat(N, …)` hotbar grid in `style.css`. A YouTube clip would become a `youtube-nocookie` iframe only when played. Without JS the player shows the first clip as a plain `<video controls>`.

Local clips live in `public/videos/<name>.mp4` with a poster in `public/img/posters/<name>.jpg`. Keep them H.264 MP4, well under GitHub's 100 MB per-file limit, with the `moov` atom at the start ("faststart") so playback begins before the whole file downloads. The recordings include the Roblox Studio window, so slot thumbnails are cropped to the game viewport with `object-view-box` (`.slot-split` crops the left window of a two-client recording). Every recording also has the Windows taskbar in its bottom 4.4%, so `.player-screen` is slightly wider than 16:9 (`aspect-ratio: 320 / 171`) and the poster and `<video>` use `object-fit: cover` anchored to the top, which cuts that strip without hiding the native controls. A YouTube iframe can't be cropped that way (its own control bar would be cut), which is why the clips are hosted locally. Durations and descriptions are written by hand: describe only what the video shows or what the owner said. `scripts/dev.mjs` serves `.mp4` with HTTP Range support so seeking works locally.

### Styling

All styling is hand-written in `public/style.css` with no framework, themed through the custom properties in `:root`: gunmetal surfaces (`--bg`, `--panel`), bone-white text, and `--red` used only for the logo slash, the active hotbar slot, the play button and selection. `--live` (green) is reserved for live player counts. The only font is Archivo from Google Fonts, loaded with its width axis: headings use `font-stretch: 125%` (expanded), body text the normal width. No monospace, no all-caps labels, no section numbers; the only numbering is the games ranking and the hotbar keys. The CSS is mobile first: base rules are the phone layout and `min-width` queries add larger layouts at 561px, 721px (desktop nav, hotbar becomes a grid with one column per slot) and 961px (two-column intro and player). Hover styles live in one `@media (hover: hover) and (pointer: fine)` block so they don't stick on touch screens; the "Press 1 to N" hint only shows there too. Keep `prefers-reduced-motion` support when adding animation.

The logo is an inline SVG in the header (`</>` with an accent slash); `public/img/mark.svg` is the same mark on a dark tile for the favicon. Keep the two in sync.

## Conventions

- Site copy is in English. The code has no comments (the repository is public); keep it that way.
- Don't mention the owner's country, city or timezone anywhere on the site or in the repository (the owner asked for this).
- Don't add claims or numbers to the copy that aren't either supplied by the owner or pulled live from the Roblox API.
