# Hover deviations

Where DuelSight's hovers differ from the toolkit's hover spec (`vendor/cardvision-browser/hover-spec.json`,
from the vendored commit; the text is the toolkit's `docs/hover-spec.md`). The spec asks each
product to list them here: the clause, what DuelSight does instead, and one reason, `game` (its card
game needs it) or `temporary` (it goes away with a named change). A difference not listed is a
defect.

DuelSight runs its hovers on the toolkit's shared hover host (`host-content.js`, `host-compute.js`)
with the standard options, and keeps its settings and switches with the host's settings core
(`host-settings.js`). What stays DuelSight's own is the tooltip frame (its size, place and
contents) and the card facts channel, which the spec leaves to each product.

## Deviations

| Clause | What DuelSight does instead | Reason |
| --- | --- | --- |
| S-A3, S-W9 | No geometric stage loads, and nothing is shown in focus scope: DuelSight's releases have no geometric stage (`capabilities.geometricStage: false` in `src/shared/product.ts`; the host refuses a load request that names one). | `game`: Yu-Gi-Oh! card recognition here is the detector and the recognizer only. |

## Changed by moving onto the shared host

These are not deviations: DuelSight now does what the spec says, where its own code did something
else before. They are listed so a reader of an older DuelSight knows what changed.

- **S-A7, S-A8.** Turning hovers on in a background tab, and a video that starts playing there, now
  load when the tab comes to the front. Before, DuelSight loaded at once unless the frames had been
  removed for idleness.
- **S-A10.** When the page removes the tooltip frame while a card shows, the next trusted move makes
  it again and shows the card in it at once. Before, the card was cleared and came back only with
  the next card named.
- **S-G3.** On Twitch, `/videos/` is matched in lowercase only, the seven side pages
  (`following`, `creatorcamp`, `collections`, `payments`, `privacy`, `products`, `team`) wait for a
  hover, and a path is read as written: an empty segment (`//name`, `/name//`) or a clip slug with
  other characters than letters, digits, `_` and `-` waits for a hover. Before, DuelSight took
  `/Videos/` in any case and five of the side pages for channels, dropped empty segments and took
  any clip slug.
- **S-G4.** The main video is picked again on every trusted `playing`, not only on a load-at-play
  page. A search that found no video is kept for up to a second, as one that found a video is:
  a video that gets its size just after a move is picked up to a second later. Before, DuelSight
  searched again on every move while it had no video.
- **S-G5.** A trusted pointer on a page where hovers do not run stops following the video, and the
  first move back on an active page picks it again at once. Before, DuelSight ignored such a move
  and kept the video, checking the page only when a picture was taken.
- **The compute frame's hello.** The content script says hello right after it makes the compute
  frame, once the frame's window has left its first blank page. Before, it waited for the frame's
  `load` event.
