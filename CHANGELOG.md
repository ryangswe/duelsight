<!-- SPDX-License-Identifier: Apache-2.0 -->
# Changelog

What changes for viewers in each version of DuelSight, and why. Store dates are in
[docs/store-listing.md](docs/store-listing.md). Clause ids such as S-A7 name the hover behavior they
follow in the cardvision toolkit's hover spec (`vendor/cardvision-browser/hover-spec.json`, and
`docs/hover-spec.md` in the toolkit's repository).

## [Unreleased]

### Fixed

- **When the card pictures from the first source keep failing**, the pictures downloaded ahead of
  the pointer come from the next source, as the tooltip's do after three failures in a row.
  Before, the downloads ahead kept asking the failing source for pictures the tooltip would not
  show, until the settings were read again.

### For maintainers

- The recognition runtime moves to cardvision 0.15.0, the final release of 0.15.0rc1. The vendored
  files are byte for byte rc1's, and the built extension does not change.
- The CDN publishing tool moves to cardvision 0.15.0 (`cdn/requirements.txt`), and
  `cdn/cdn.config.json` lists a set of smaller tooltip pictures, 640 px wide in WebP.
  `cdn/README.md` says how to publish the set and then point the settings at it. The published
  settings point at it since 2026-11-17, with the full art as the fallback, and so does
  `cdn/config.json`, the settings built into the extension.

## [0.9.0] - unreleased

Card hovers run on the cardvision toolkit's shared hover host (experimental, cardvision 0.15.0rc1),
the same code Kenbunshoku runs. DuelSight keeps its own tooltip and card details.
`HOVER-DEVIATIONS.md` lists where DuelSight still differs from the hover spec. A card's picture is
downloaded ahead of the pointer. Same bundled cards (`862aec0f937da326`).

### Added

- **A card's picture shows as soon as you point at it** once card recognition has named the card
  on the video: while the pointer is over the video, DuelSight downloads the pictures of the cards
  it names, each once (at most 60 each time card recognition loads in a tab). Before, a card's
  picture was downloaded only when its tooltip opened. PRIVACY.md says so.

### Changed

- **A background tab loads card recognition when it comes to the front**, also when hovers are
  turned on there or its video starts playing (S-A7, S-A8). Before, it loaded at once.
- **When a page removes the card picture while it shows**, the next move over the video brings it
  back with the same card (S-A10). Before, it came back with the next card named.
- **On Twitch, `/collections`, `/payments`, `/privacy`, `/products` and `/team`** wait for a hover
  before loading, as `/following` and `/creatorcamp` do, and so do addresses with an empty part
  (`//name`) or an unusual clip name (S-G3); `/videos/` is matched in lowercase only. Before, the
  five were taken for channels.
- **Moving the pointer on a page where hovers do not run** (a miniplayer over a search page) stops
  following the video, and the first move back on a video page picks it again at once (S-G5).

### For maintainers

- `npm run build` and `npm run package` run the toolkit's realm check
  (`vendor/cardvision-browser/node/realm-check.mjs`, through `scripts/realm.mjs`) on the built
  extension and fail when a file holds a toolkit module twice. The Firefox source archive's
  `build-firefox.sh` also compares the host files and the realm check with the toolkit's own build.

## [0.8.2] - 2026-11-16

The recognition runtime moves to cardvision 0.14.1, a final release, and card hovers start on when
their switch cannot be read. Same bundled cards (`862aec0f937da326`).

### Fixed

- **Card hovers start on when the extension's storage cannot be read as a page opens**, as the
  popup and the hover spec have it (S-H1: a missing or unreadable switch reads as on). Before, a
  failed read left hovers off on that page until the switch was turned off and on again.
- **A change in the popup made just as a page opens is kept.** If the switch or the card size was
  changed while the page was still reading it, the page could put back the value from before the
  change, or (with a read that failed) switch hovers back on.
- **A card under a resting pointer is named when card recognition starts late**, as in a new tab
  whose model loads slowly. If no card recognition was running when the pointer came to rest, the
  one that starts during that rest is told so and reads its one picture when ready, within
  60 seconds of the pointer's last move (S-B13). One that is made again during the same rest reads
  none.

### Changed

- **When card recognition becomes ready inside the 10 seconds** in which a resting pointer is read,
  its capture, if retried, may land a little after them. It is one picture, within 60 seconds of
  the pointer's last move, and if it shows no card nothing more is read after those 10 seconds
  until the pointer moves. PRIVACY.md says so.

## [0.8.1] - 2026-11-13

The recognition runtime moves to cardvision 0.14.0rc2, and two places where DuelSight's own code
differed from the hover spec now follow it. Same bundled cards (`862aec0f937da326`).

### Changed

- **A card stays named while you point at a moving video.** Card checks are timed so that an
  answer stays on screen for as long as it holds, instead of by the measured pace alone; on a
  slower computer, a card could go unnamed until the next check. The checks you wait for (when
  the pointer comes onto a card, and when recognition finishes loading) are no longer held back
  by the pace. The background checks that keep a resting card fresh still are.
- **With "Keep the card I'm pointing at" off, a still card keeps showing between checks.** On a
  slower computer the card could disappear briefly before each check while the pointer rested.
- **After a check that got no answer, the next one waits until its retry is due**, so a slow
  computer is not given more work while it is behind. Moving the pointer onto a different card is
  the exception: it starts a check without waiting for the retry, still one at a time and at least
  250 ms apart.
- **Turning card hovers on in a tab in the background**, after its card recognition was unloaded
  for being idle, now waits until you bring the tab to the front (S-A7), as a change of "Keep the
  card I'm pointing at" already did. The tab in front loads at once, as before, and so does a
  background tab whose card recognition was not unloaded, when its video plays.

### Added

- **One picture when card recognition finishes loading late.** If it finishes after the
  10 seconds in which a resting pointer is read, while the pointer still rests over the video, one
  picture is read then (within 60 seconds of the pointer's last move). If it shows no card, nothing
  more is read until the pointer moves (S-B13). PRIVACY.md says so.

### Fixed

- **A web page's own imitation of a video starting to play** no longer loads card recognition;
  the browser's own signal is needed (S-A1), as with pointer movements already.
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
