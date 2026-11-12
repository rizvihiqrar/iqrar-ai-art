# Technical Guide

[← Back to overview](README.md)

How the art site is built, tested and published.

- [How It Is Put Together](#how-it-is-put-together)
- [Run It](#run-it)
- [Add a Piece](#add-a-piece)
- [Checks](#checks)
- [Publishing](#publishing)

## How It Is Put Together

| Part | What it is |
|---|---|
| `lost-tones/index.html` | The piece itself: one hand-made page, served exactly as written |
| `lost-ringtones/index.html` | The old address, kept as a redirect to Lost Tones |
| `pieces/01-lost-tones.md` | The piece's page on the site: what it is, how to play, how it was made |
| `docs/about.md` | The About text, shown on the home page |
| `site/site.json` | The site's name, header buttons, the card for each piece, and `copy`, the folders served as they are |
| `site/build.mjs`, `components.mjs`, `stage.css` | The engine shared with the product and training portfolios |
| `site/copy-pieces.mjs` | Copies each `copy` folder next to the built pages |
| `docs/assets/previews/` | A screenshot of each piece, made by `npm run screenshots` |

The engine is the same three files in the product, training and art repositories. `site/engine.sha256` pins them, and the daily Engine sync workflow compares the pins of all three.

## Run It

```bash
cd site
npm ci
npm test            # builds into a temporary folder and checks the pages
npm run build       # writes _site/ (the engine, then copy-pieces.mjs)
npm run phone       # opens every page at 360 and 390 pixels wide in Chromium and Firefox
npm run screenshots # remakes the picture of each piece (needs: npx playwright install chromium)
```

## Add a Piece

1. Put the finished piece in its own folder, `my-piece/index.html`.
2. Add `pieces/02-my-piece.md` (a short page in the same shape as `01-lost-tones.md`) and link it from the front README.
3. Add its card to `site/site.json` and its folder to `copy`, then run `npm run screenshots` after adding it to `site/screenshots.mjs`.
4. Update `build.test.mjs`, which lists the pieces on the site on purpose: a new piece needs a deliberate change there.

## Checks

| Check | What it catches |
|---|---|
| `npm test` | A page missing, a broken link, a piece not copied exactly, the old address no longer redirecting, contact details repeated on About, credit or copyright lost, a second piece added by accident |
| `engine-sync.test.mjs` and Engine sync | The engine changed here but not in the other two repositories |
| `phone.test.mjs` and `npm run phone` | A page that scrolls sideways on a phone, or a button under 40 pixels |
| README check | A README link that does not exist, a piece the README does not link, a heading not in title case |

## Publishing

The Site workflow builds and tests on every pull request and publishes `_site/` to GitHub Pages from main. The repository's Pages source must be set to GitHub Actions (Settings, Pages, Build and deployment, Source).
