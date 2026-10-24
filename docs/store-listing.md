<!-- SPDX-License-Identifier: Apache-2.0 -->
# Chrome Web Store listing

Everything the Chrome Web Store developer dashboard asks for, tab by tab, and how to make the files
it takes. Every field to paste sits in a fenced `text` block, so it copies verbatim; keep it that
way. **Submitting is a manual dashboard action by the owner**
([developer dashboard](https://chrome.google.com/webstore/devconsole)); nothing here uploads
anything. Read the store's current policies before each submission: they change.

*[Back to README](../README.md)*

## Which version is where

| Version | Models | Visibility | Status |
| --- | --- | --- | --- |
| 0.1.0 | release T `6666477f410559ac` (early preview) | Unlisted | submitted 2026-10-23 |
| 0.2.0 | release T2 `0927859c6f18302f` (measured: [accuracy.md](accuracy.md)) | Public | prepared 2026-10-24, not yet submitted |

Update this table with each submission (date submitted, date approved, store item ID).

## Before you open the dashboard

1. **The package.** Bump `version` in `package.json` if this is an update, then
   `npm test`, `npm run build -- --store --release <release folder>` and `npm run package`. Upload
   `duelsight-<version>-store.zip` (it has `manifest.json` at its top level, as the store requires;
   the other zip is for the release page). the opening line of `release-legal/NOTICE` must name the release
   (the build refuses otherwise).
2. **The privacy page** must be live at `<cdnBase>/privacy.html`, and match PRIVACY.md. After any
   change to PRIVACY.md: `node scripts/privacy-page.mjs --out <folder outside the repository>`,
   then `cdn/dscdn.py publish --page <that folder>/privacy.html` and `verify` (owner's step:
   [cdn/README.md](../cdn/README.md)).
3. **The images** (five screenshots, two promo tiles), made as in [Store images](#store-images)
   below, outside the repository.
4. **Links resolve.** The description, the privacy page and the URL fields link to the project's
   GitHub repository; a reviewer who clicks a dead link may reject the item. If the repository is
   not public yet, leave the URL fields empty and replace those links before submitting.

## Package tab

Upload `duelsight-<version>-store.zip`.

## Store listing tab

**Title** comes from the package (`name` in `duelsight.config.json`): `DuelSight`.

**Summary** comes from the package (`description` in `duelsight.config.json`; 132 characters at
most, this is 129):

```text
Unofficial fan project, not affiliated with or endorsed by Konami. Hover a Yu-Gi-Oh! card in a YouTube or Twitch video to see it.
```

**Description** (0.2.0):

```text
DuelSight is an unofficial fan project, not affiliated with or endorsed by Konami.

Hover a card in a Yu-Gi-Oh! video on YouTube or Twitch, and a larger picture of it appears beside it, with its name, type, stats and text.

Measured before release, in a held-out test scored once (31 frames from 11 recordings, labeled without any model's help):
- Master Duel: 72 of 80 readable cards named right; 0 of 72 tooltips shown were wrong.
- Dueling Book: 41 of 42 readable cards named right; 0 of 41 tooltips shown were wrong.
- Paper videos are supported but not promised: in the test it named 45 of 106 readable cards; 1 of 46 tooltips shown were wrong. The paper footage tested was official Konami tournament broadcasts at 1080p or higher; locals, phone footage and lower-resolution streams were not tested.
Full test report: https://github.com/ryangswe/duelsight/blob/main/docs/accuracy.md

- Aimed at Master Duel, Dueling Book and paper tables with the camera above the table. Results vary by video, and it can miss a card or show a wrong one.
- Turn it on per channel with the button in the player. The toolbar switch turns it off everywhere.
- Choose the card size (70% to 130%) and whether the card's text shows beside its picture, in the toolbar popup.
- No accounts, analytics, telemetry or advertising. Video frames are analyzed inside your browser and never uploaded.
- Open source (Apache-2.0), built on the cardvision toolkit: https://github.com/ryangswe/riftsight-vision

Yu-Gi-Oh!, its card names and its card art belong to their owners. Card text and images are copyright 4K Media Inc., a subsidiary of Konami Digital Entertainment. Card data from YGOPRODeck.
```

Rules for the description: no accuracy figure unless it comes from a pre-registered, scored test
and is worded as that test's report words it; no claim that it works on every video, and no "always" or "reliable"; say plainly
that it can miss a card or show a wrong one; no keyword lists (the store rejects keyword spam).

**Category:** Entertainment (or the closest the dashboard offers). **Language:** English.

**Store icon:** `icons/icon-128.png` (128×128).

**Screenshots:** five, 1280×800, in listing order (see [Store images](#store-images)):
1. `1-hover`: a hover on a Master Duel card, with the card details beside it;
2. `2-button`: the DuelSight button at the top right of the video, Off and then On after one
   click, which turns card hovers on for that channel;
3. `3-paper`: a hover on a card on a paper table;
4. `4-card-alone`: the same hover with card details switched off: the enlarged card on its own;
5. `5-popup`: the toolbar popup (on/off, card details, card size).

**Small promo tile:** `promo-small-440x280.jpg`. **Marquee promo tile:** `promo-marquee-1400x560.jpg`.
**Video:** none.

**Homepage URL / Support URL** (once the repository is public):

```text
https://github.com/ryangswe/duelsight
```

```text
https://github.com/ryangswe/duelsight/issues
```

**Mature content:** No.

## Privacy practices tab

**Single purpose:**

```text
Shows which Yu-Gi-Oh! card is under the pointer in a YouTube or Twitch video: a larger picture of the card, with its name, type, stats and text.
```

**Permission justifications** (the store asks for one per permission; [permissions.md](permissions.md)
has the long form):

`storage`:

```text
Keeps the user's settings on their computer: the on/off switch, the card size, whether card details show, the channels the user turned card hovers on for, the last settings file fetched, and a dismissed update notice. Nothing is synced or sent anywhere.
```

Host permissions (`https://www.youtube.com/*`, `https://www.twitch.tv/*`, `https://cdn.duelsight.com/*`):

```text
YouTube and Twitch: to show the extension's on/off button in the video player and, on channels the user turned it on for, read the video picture around the pointer and recognize the card under it. Recognition runs inside the browser; frames are never saved or uploaded. cdn.duelsight.com is the extension's own server: it loads a small settings file, card pictures and a card details file from it.
```

**Remote code:** "No, I am not using remote code." The recognition models, the ONNX Runtime
WebAssembly and every script are inside the package; the CDN serves images and JSON data, nothing executable.

**Data usage:** per [PRIVACY.md](../PRIVACY.md) the extension collects no user data: frames stay in
the browser, settings stay on the computer, and the CDN requests carry no identifier (no request
logging is set up for the CDN). Tick no data type, then the three certifications (no selling or
transferring of user data, no use unrelated to the single purpose, no creditworthiness use). These
are the owner's declarations: re-check them against PRIVACY.md and the CDN's setup each time.

**Privacy policy URL:**

```text
https://cdn.duelsight.com/privacy.html
```

## Distribution tab

**Visibility:** 0.1.0 was **Unlisted** (people find it through its link, not in search), so the store's review of a new item
was done before launch. **0.2.0 is the launch release: switch Visibility to Public** with this update. **Regions:** all.
**Pricing:** free.

## Test instructions (if the dashboard asks)

```text
No account or login. Open a public Yu-Gi-Oh! video, for example https://www.youtube.com/watch?v=7l_ppqK18qM&t=23359s (paper tournament) or https://www.youtube.com/watch?v=LX4yGLhQaQ0&t=11036s (Master Duel). Click the DuelSight button in the top-right of the player to turn card hovers on for that channel, then rest the mouse pointer on a face-up card: a larger picture of the card appears beside it, with its details. The toolbar popup switches the extension off, sets the card size and turns the card details on or off.
```

## Store images

The five screenshots and the two promo tiles are made by `scripts/store-assets.mjs` from the real
extension: a dev build in Chrome for Testing hovers a card on two clips (one Master Duel, one paper
table) on a bare local page, and `scripts/store-templates.mjs` lays the captures out with the
headlines, in the store's sizes (1280×800, 440×280, 1400×560), as JPEG (the store takes JPEG, or
PNG without alpha). The headlines and their order are in `SCREENSHOTS` in store-templates.mjs;
change them there, under the description's rules above. Every image carries the
unofficial-fan-project line. The images hold card art and frames of other people's videos, so they
are **never committed**: the script writes them outside the repository, and the owner uploads them.

1. **Pick two frames** from official publisher broadcasts (for example Konami's own tournament
   streams), not from other creators' videos: one Master Duel, one paper table, each with a card
   shown clearly.
2. **Make one clip per frame, cropped to the game**: no players' faces, no other people's
   overlays. `ffmpeg` (crop is `width:height:x:y` in the frame's pixels):
   ```bash
   ffmpeg -loop 1 -i frame.png -vf "crop=1346:758:290:130" -t 12 -r 10 -c:v libvpx-vp9 -crf 18 -b:v 0 -pix_fmt yuv420p md.webm
   ```
   Use WebM: Chrome for Testing plays it, not every build plays H.264. A 16:9 Master Duel clip suits
   the button screenshot well.
3. **Find a card the model names confidently** in each, and its centre in the clip's pixels:
   `cardvision infer <the cropped frame> --release <release.json> --prefill-out boxes.jsonl`
   (a named box's `box` is x, y, width, height).
4. **Name them** in a `clips.json` outside the repository:
   ```json
   { "master-duel": { "video": "/clips/md.webm", "card": [793, 351] },
     "paper": { "video": "/clips/paper.webm", "card": [576, 493] } }
   ```
5. **Make the images** (a dev build of the release you submit; `puppeteer-core` and Chrome for
   Testing as for [the smoke check](development.md#manual-check-on-a-local-video)):
   ```bash
   npm run build -- --dev --release <release folder>
   npm install --no-save puppeteer-core
   node scripts/store-assets.mjs --chrome "<Chrome for Testing>" --clips clips.json --out <folder outside the repository>
   ```
   Each hover waits for the tooltip, then 4 seconds for its picture and details from the CDN. Look
   at every image: check the named card is the card under the pointer.

Rebuild with `--store` afterwards: the dev build is not the one you upload.
