<!-- SPDX-License-Identifier: Apache-2.0 -->
# DuelSight promo reel (Remotion)

The 31 s launch reel, 16:9 (`Reel`, 1920×1080) and a 9:16 cutdown (`Cutdown`, 1080×1920), on one
timeline at 30 fps. The posted files are in [docs/reel/](../../docs/reel/README.md). The story, the
shots, the claims rules and the privacy rules are in [STORYBOARD.md](STORYBOARD.md).

It is made the way RiftSight makes its promo reel (`tools/promo-video/` in that repository): a
standalone Remotion package; every card hover a capture of the real extension, never redrawn; the
footage, captures, music and renders kept out of git. The code started from Kenbunshoku's reel (the
pointer, captions, end card and music scripts).

**What is in git:** the compositions (`src/`), the scripts, the shot lists, tooltip boxes and
hover timings that made the posted reel (`scripts/*.json`), and its footage (`public/footage/`:
each take cropped, with the privacy blurs already burned in, plus its pointer track). **What is not**
(git-ignored): `captures/` (the raw recorded frames, the frozen extension build, the browser
profile), `public/audio/` (the music: its license covers it inside the video, not as a separate
file) and `out/`.

Remotion has its own license: free for individuals and small teams, a company license for larger
companies (https://www.remotion.dev/license). It is not a dependency of the extension.

## Re-render the posted reel

From this folder, with Node.js 22 or later and `ffmpeg`:

```sh
npm ci
npx remotion render Reel out/reel-16x9-video.mp4 --muted
npx remotion render Cutdown out/reel-9x16-video.mp4 --muted
```

Those are the posted picture, without sound. For the sound, download the track (see
[LICENSE-MUSIC.md](LICENSE-MUSIC.md)) to `public/audio/paulyudin-epic-epic-music-573969.mp3` and run
`npm run render` instead: it also writes the posters. `npm run studio` previews it.

## What you need for a new reel

- Node.js 22 or later, `ffmpeg`, and Python 3 with `numpy` and `Pillow`.
- Chrome for Testing (branded Chrome does not load an unpacked extension from the command line).
- A dev build of the extension: `npm run build -- --dev --release <release folder>` at the
  repository's root, as in [docs/development.md](../../docs/development.md).
- A music track you may use in a posted video, and its license.

## Make a new reel

Run everything from this folder (`tools/promo-video/`).

1. **Install:** `npm ci`.
2. **Freeze the build you film.** Copy the dev build and name the browser:
   ```sh
   mkdir -p captures && rm -rf captures/ext && cp -R ../../dist captures/ext
   echo "<path to the Chrome for Testing binary>" > captures/chrome-path.txt
   ```
3. **Update the scripts for the current extension.** The posted reel was filmed on 0.2.0, which had
   an in-player button that turned hovers on. Since 0.4.0 hovers are on with no click, so:
   - `scripts/live-capture.mjs`: delete the block that finds and clicks the DuelSight button (after
     the comment "Turn card hovers on for this channel"), or the script stops with "the DuelSight
     button did not show".
   - `src/timeline.ts` and `src/Reel.tsx`: remove `T.click`, the "Click DuelSight once." caption, the
     click ring and the 9:16 pan to the button.
   - `src/components/EndCard.tsx`: the end card says "Chrome extension"; DuelSight is also a Firefox
     add-on now.
4. **Pick the takes** in `scripts/shots-live.json`: for each, the video id, the start time `t` in
   seconds, where the pointer starts, and the cards to hover with their centers in 1920×1080 player
   pixels. Prefer official publisher broadcasts and quality creators. Find card centers on a still
   with `cardvision infer <frame> --release <release.json> --prefill-out boxes.jsonl`.
5. **Capture**, in a short window you set aside, one take at a time:
   ```sh
   node scripts/live-capture.mjs --dry          # lists the takes and cards, opens nothing
   node scripts/live-capture.mjs --only hero    # or no --only for every take
   ```
   It opens each watch page in a fresh, signed-out profile with a timestamped URL, hides the page
   around the player, records at most 28 s of playback, and stops for good at any sign that the site
   is blocking it (`captures/live/BLOCK.json`). Each take writes `captures/live-<id>/`: the frames,
   the pointer track and `log.json`, where every hover has the card aimed at, the name the tooltip
   showed and `ok`. Look at the frames: the tooltip must name the card under the pointer.
6. **Set each tooltip's box** in `scripts/tooltip-boxes.json`: `[x0, y0, x1, y1]` in capture pixels
   for every hover used, read off a frame where the tooltip is shown and checked by eye.
7. **Lay out the segments** in `scripts/gen-shots-live.py` (`SEGMENTS`): the capture, the crop, the
   privacy masks, the reel seconds it fills, and the reel second the first card's art lands (a hit in
   the music). Mask every webcam, player and channel name, chat and username. A mask a tooltip
   covers lists that hover in `covered_by`, so it is lifted only while that tooltip shows; the script
   stops if any other mask touches a tooltip. Then:
   ```sh
   python3 scripts/gen-shots-live.py      # scripts/shots.json and scripts/hover-times.json
   python3 scripts/build-footage.py       # public/footage/<id>.mp4 and <id>.json
   ```
8. **The music.** Put the track in `public/audio/` and name it in `scripts/make-audio.mjs` (with the
   reel's length). To find its tempo and hits, convert it and analyze it:
   ```sh
   mkdir -p out && ffmpeg -i public/audio/<track>.mp3 -ac 1 -ar 22050 -f f32le out/track.f32
   python3 scripts/analyze-music.py out/track.f32
   ```
   Put the beat grid and hits in `src/timeline.ts`, and the license check in
   [LICENSE-MUSIC.md](LICENSE-MUSIC.md).
9. **Write the captions** in `src/timeline.ts` under the claims rules in STORYBOARD.md, and preview:
   `npm run studio`.
10. **Render:** `npm run render`. It cuts the audio (`public/audio/reel.wav`), renders both
    compositions silent, then adds the audio without re-encoding the picture and writes the posters:
    `out/reel-16x9.mp4`, `out/reel-9x16.mp4`, `out/poster.png`, `out/poster-9x16.png`.
11. **Check before posting:** watch both renders through. Every tooltip names the card under the
    pointer; no face, name, chat or username shows outside a mask; the captions follow the claims
    rules. Then copy the posted files into `docs/reel/` and update its README.

`scripts/capture.mjs` (with `scripts/shots-capture.json` and `scripts/gen-shots.py`) is the other
way to film: no video site, each shot one still frame played as a clip on the extension's manual test
page (`test/manual/`, clips in `captures/clips/<frame>.webm`). The first draft of the reel was made
that way. `scripts/debug-hover.mjs` prints what the compute frame reports while the pointer rests on
a card.
