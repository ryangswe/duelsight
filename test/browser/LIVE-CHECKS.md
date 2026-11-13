<!-- SPDX-License-Identifier: Apache-2.0 -->
# Live checks and what covers them

Before a release, the maintainer checks a test build by hand on real videos. This table lists those
steps and, for each one, the automatic check that now covers it, if any. A step with no automatic
check is still done by hand.

The hover browser test is `test/browser/hover-browser.mjs`. It runs in CI on every pull request,
with a synthetic clip on a local page, so it never sees YouTube, Twitch, real footage or the real
CDN. Its settings file names no card details file, so the details panel is not shown there. Unit
tests are the vitest files in `test/`.

The test serves only the four pictures of its clip. A card can be named by another of its
printings (another Dark Magician, say), whose picture the test does not serve, so the tooltip shows
the card's name without a picture. The checks compare names, which every printing shares. A
future check on the picture must accept any printing of the card.

| Step done by hand | Covered by | Still by hand |
| --- | --- | --- |
| The model loads when the video plays, before any hover | browser test `frames-at-play` | on YouTube and Twitch pages |
| Nothing is read from the video before the pointer comes over it | browser test `no-capture-before-pointer` | none |
| Hovering a card shows its picture at once | browser test `art-visible` (time to the picture is reported) | on real footage, at real network speed |
| The details panel (type, stats, card text) shows beside the picture, in the chosen language | unit tests in `tooltip.test.ts`, `panel-layout.test.ts`, `details.test.ts`, `localized-details.test.ts` | yes, its look and fit |
| The outline marks the hovered card | browser test `outline-shows` | tilted cards, cards near the edge |
| Moving off the video clears the tooltip | browser test `move-off-clears` | none |
| A card laid on top doesn't replace the one you point at | browser test `covered-kept` | none |
| Its outline goes while the picture stays | browser test `held-outline-hides` | none |
| With "Keep the card I'm pointing at" off, the card on top replaces it | browser test `switch-flips` | none |
| Moving across several cards shows each in turn | none | yes |
| The outline goes after about 10 s of rest on a playing video | none | yes |
| A page's own made-up pointer events do nothing | browser test `fake-pointer-ignored`; unit tests in `agent.test.ts` | none |
| Card hovers off: no frames, nothing read or fetched | browser test `off-means-off` | none |
| Card hovers on again while a video plays: it loads at once | browser test `on-while-playing-loads` | none |
| The popup's settings are grayed out while card hovers are off | unit tests in `popup.test.ts` | the look of the popup |
| Card size and the details switch in the popup | unit tests in `popup.test.ts`, `card-size.test.ts` | the look of the tooltip at 70% and 130% |
| A second tab of the same page names a card while the first tab plays on | browser test `second-tab-names-card` (one pointer move, then a resting pointer; an expected failure, until toolkit 0.14.0, when the tab's model loads more than 9 s after that move) | none |
| The page opened again uses the browser's cache | browser test `cached-reload` | none |
| After 10 idle minutes the model is unloaded, and a hover loads it again | browser test `idle-unloads`, `loop-no-reload`, `idle-reload-on-hover` (with a 6-second idle time) | the real 10 minutes |
| Turning hovers off and on after an idle unload loads at once | browser test `switch-on-after-idle-reloads` | none |
| Which YouTube and Twitch pages load at play (watch, live, channel, past broadcast, clip; not embeds, Twitch's front page, directory, popout player or moderator view) | unit tests in `agent.test.ts` ("loads when the video plays") | on the real sites |
| From Twitch's front page, clicking into the channel whose preview was playing | none | yes |
| No request leaves for any host but the settings host | browser test network scope (every Chrome process; Chrome's own sign-in and update traffic to Google's hosts, which no page or extension starts, is exempt and listed in the report) | none |
| The video plays and starts as quickly as without the extension | none | yes |
| A still card's tooltip and outline do not jitter | none | yes |
| Firefox | `web-ext lint` in CI (the build job), which does not exercise behavior | yes |

## Planned, not covered yet

These behaviors are on the list for automatic checks but are not in the browser test yet. Until
they are, unit tests cover part of them and the rest stays by hand.

- A tab in the background with a changed setting is made again once, with the latest setting,
  when it comes to the front (unit tests in `agent.test.ts`).
- Leaving a YouTube watch page while its mini player goes on stops reading the video (by hand).
- The video element replaced, the player moved for full screen, a letterboxed picture, and a
  capture still pending when the frames are removed (unit tests in `agent.test.ts`, in part).
- Replies from a compute frame that was replaced are ignored (unit tests in `agent.test.ts`).
- Keep the card I'm pointing at changed while the model loads (by hand).
- A card picked up from under a resting pointer (the clip has one; not asserted yet).
