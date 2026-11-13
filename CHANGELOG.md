<!-- SPDX-License-Identifier: Apache-2.0 -->
# Changelog

What changes for viewers in each version of DuelSight, and why. Store dates are in
[docs/store-listing.md](docs/store-listing.md). Clause ids such as S-A7 name the hover behavior they
follow in the cardvision toolkit's hover spec (`vendor/cardvision-browser/hover-spec.json`, and
`docs/hover-spec.md` in the toolkit's repository).

## [0.8.1] - unreleased

The recognition runtime moves to cardvision 0.14.0rc1, and two places where DuelSight's own code
differed from the hover spec now follow it. Same bundled cards (`862aec0f937da326`).

### Changed

- **A card stays named while you point at a moving video.** Card checks are timed so that an
  answer stays on screen for as long as it holds, instead of by the measured pace alone; on a
  slower computer, a card could go unnamed until the next check. The checks you wait for (when
  the pointer comes onto a card, and when recognition finishes loading) are no longer held back
  by the pace. The background checks that keep a resting card fresh still are.
- **With "Keep the card I'm pointing at" off, a still card keeps showing between checks.** On a
  slower computer the card could disappear briefly before each check while the pointer rested.
- **After a check that got no answer, nothing starts until its retry is due**, on every path, so a
  slow computer is not given more work while it is behind.
- **Turning card hovers on in a tab in the background**, after its card recognition was unloaded
  for being idle, now waits until you bring the tab to the front (S-A7), as a change of "Keep the
  card I'm pointing at" already did. The tab in front loads at once, as before. One flip of the
  switch no longer reloads every open tab together.

### Added

- **One picture when card recognition finishes loading late.** If it finishes after the
  10 seconds in which a resting pointer is read, while the pointer still rests over the video, one
  picture is read then (within 60 seconds of the pointer's last move). If it shows no card, nothing
  more is read until the pointer moves (S-B13). PRIVACY.md says so.

### Fixed

- **A web page's own imitation of a video starting to play** no longer loads card recognition;
  only the browser's own signal does (S-A1), as with pointer movements already.
- **The tooltip's picture after a card's picture was fetched again** gets its own address instead
  of the old one, which had been released. No path in this version reaches it; the fix keeps it
  so.

### For maintainers

- `vendor/cardvision-browser/` is written by the toolkit's vendor tool, with its manifest
  `cardvision-vendor.json` in place of `VENDOR.json`; `npm run vendor-check` runs the toolkit's
  stand-alone checker, and CI runs it on every pull request. `scripts/vendor-runtime.mjs` is gone.
- The unused card-database link module (`src/tooltip/card-link.ts`) is removed.

## [0.8.0] - 2026-11-13

Live on the Chrome Web Store on 2026-11-13 and on addons.mozilla.org on 2026-11-12. Runtime
cardvision 0.13.0; bundled cards `862aec0f937da326` (the 2026-11-10 card update, converted to a
binary bank).

- A card lying at an angle is outlined along its own edges, and the pointer finds it anywhere on
  the card.
- A card stays while the pointer rests on it, even after a player moves it. The popup's new switch,
  "Keep the card I'm pointing at" (on by default), turns this off.
- Card recognition and the tooltip load when a video starts playing (YouTube watch and live pages;
  Twitch channel, video and clip pages). Embedded YouTube players and other Twitch pages wait for
  the first hover.
- Card recognition is unloaded after 10 minutes without pointing at the video.
- A still card's tooltip and outline no longer jitter.
- A slower computer spaces its card checks, so less of it stays busy.
- 15 cards from the November update carry their official English names.

Earlier versions are listed in [docs/store-listing.md](docs/store-listing.md).
