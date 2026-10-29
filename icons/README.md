<!-- SPDX-License-Identifier: Apache-2.0 -->
# Icons

DuelSight's mark, "Ancient eye": an eye with a swept brow, an extended outer corner and a lower
curl. It is built from new geometric paths, not traced from any card or franchise artwork
(AI-assisted vector design, adopted 2026-10-29).

| File | What it is |
| --- | --- |
| `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png` | The extension's icons (toolbar, extensions page, store icon): the gold eye on a dark rounded tile. The build copies these four. |
| `source/duelsight-tile.svg` | The tile as a vector. |
| `source/duelsight-light.svg` | The eye alone in burnt amber `#A6530A`, for light surfaces. |
| `source/duelsight-dark.svg` | The eye alone in gold `#F4BA55`, for dark surfaces. |

The SVGs are paths only (no fonts, no embedded pictures). The 128 px icon is the designer's own
render; 16, 32 and 48 are the 512 px render scaled down.

Why the tile in the toolbar: Chrome shows one icon whatever the browser's theme. The bare amber eye
fades on a dark toolbar and the bare gold eye on a light one; the tile reads on both.

The mark identifies DuelSight. A copy made with [make-it-yours](../docs/make-it-yours.md) puts its
own icons here (`node scripts/icons.mjs <folder>` draws a plain placeholder).
