<!-- SPDX-License-Identifier: Apache-2.0 -->
# Store images

The images uploaded to the store listings, kept here so that a new maintainer or a new listing
starts from the same files. How to make new ones is in
[store-listing.md, Store images](../store-listing.md#store-images).

*[Back to README](../../README.md)*

| File | Size | Used on | What it shows |
| --- | --- | --- | --- |
| `1-hover-1280x800.jpg` | 1280×800 | Chrome Web Store, addons.mozilla.org | A paused frame of Konami's Master Duel Challenger Cup broadcast: a hover on Dracotail Gulamel, with the card details beside it. |
| `2-paper-1280x800.jpg` | 1280×800 | Chrome Web Store, addons.mozilla.org | A paused frame of Konami's NAWCQ Minneapolis broadcast, a paper table seen from above: a hover on S:P Little Knight, with the card details. |
| `3-card-alone-1280x800.jpg` | 1280×800 | Chrome Web Store, addons.mozilla.org | The same hover with card details switched off: the enlarged card on its own. |
| `4-popup-1280x800.jpg` | 1280×800 | Chrome Web Store, addons.mozilla.org | The toolbar popup: on/off, card details, card size. |
| `promo-small-440x280.jpg` | 440×280 | Chrome Web Store (small promo tile) | Drawn around the S:P Little Knight card picture from the paper hover. |
| `promo-marquee-1400x560.jpg` | 1400×560 | Chrome Web Store (marquee promo tile) | Drawn around a crop of the Master Duel hover. |

The store icon is the extension's own `icons/icon-128.png`.

The README's banner, `docs/banner.webp` (1400×560), has the marquee tile's layout over a hover on
Dracotail Arthalion from the promo reel's footage. `scripts/banner.mjs` makes it; its header gives
the commands.

How they were made (2026-10-23, release T, by `scripts/store-assets.mjs`):
- **Capture.** A dev build in Chrome for Testing, on a bare local page playing a short clip made from
  one frame of each broadcast. No video site was opened.
- **Cropping.** Each frame is cropped to the game: no players' faces. Hands at the table and the
  broadcast's own overlay (score bar, news ticker) are kept.
- **Hovers.** Each card named was checked by eye against the card under the pointer.

The paper screenshots (2 and 3) show, at the top right of the clip, the small in-player button of
versions before 0.4.0. A fifth screenshot, "Click the DuelSight button", was retired with the button
in 0.4.0 and is not kept.

**Not covered by this repository's license.** These images show Yu-Gi-Oh! card art, card text and
tournament broadcasts as they appear on video. The art, the text, the footage and the people in it
belong to their owners. DuelSight is an unofficial fan project, not affiliated with or endorsed by
Konami.
