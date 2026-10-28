<!-- SPDX-License-Identifier: Apache-2.0 -->
# DuelSight launch reel: storyboard

16:9 1920x1080 (`Reel`) and a 9:16 1080x1920 cutdown (`Cutdown`) on one timeline; 30 fps; 31.0 s (930 frames), on
the owner's track used whole: 86.13 BPM, beats at 0.21 + k x 0.6966 s; hits at 5.09 s, 10.58 s (the full section
enters), 25.02 s (the stop) and 27.24 s (the final hit).

**Footage:** real YouTube playback captured live on 2026-10-24 between 17:47 and 17:49 UTC, under the rules in
`scripts/live-capture.mjs` (its log of every page load: `captures/live/loads.jsonl`). Three continuous takes, each with 2-3 hovers in
real time (owner, 10-24: show several hovers per platform, as the RiftSight 0.12.0 reel does). Nothing is retimed:
the hovers came about 4 beats apart, so after the first card is put on its hit the rest land on the music too.

| Reel time | Take | What happens (art lands at) | Caption |
|---|---|---|---|
| 0–13.45 s | Master Duel: Konami Challenger Cup broadcast, full frame | the real click on the DuelSight button (3.2 s); Dracotail Gulamel (5.09, the hit), Dracotail Arthalion (7.86), Dracotail Mululu (10.59, the full section) | "Can't read that card?" / "Click DuelSight once." / "Hover a card in the video." / "See the card and its text." |
| 13.45–20.41 s | Dueling Book (DBGrinder), framed window | Granguignol the Dusk Dragon (14.14), The Fallen & The Virtuous (16.81), Incredible Ecclesia, the Virtuous (19.47) | "Master Duel, Dueling Book and paper tables." |
| 20.41–25.02 s | Paper: Konami NAWCQ broadcast, framed window | Futsu no Mitama no Mitsurugi (21.11), S:P Little Knight (23.79) | "On YouTube and Twitch." |
| 25.02–31.0 s | End card, on the stop | DuelSight; "Free and open source · Chrome extension"; github.com/ryangswe/duelsight; "Unofficial fan project, not affiliated with or endorsed by Konami."; the track's own decay, fade out | |

The 9:16 cutdown pans across each take to keep the active tooltip in view (`focusX` in `src/Reel.tsx`).

Every hover named the card under the pointer (checked by eye; one, The Fallen & The Virtuous, sits in a zone that
held Super Polymerization in the training frame the shot was planned from).

## Claims and style

- No "any", "every", "all", "first", "only", "best", "preview", accuracy numbers or other tools
  named. "On YouTube and Twitch" is what the extension supports; the footage is real YouTube
  playback. Paper is shown (real hovers, named right) but not promised in type.
- Dark violet-black, the outline's violet as the only accent (`#3b2a78` edge,
  `rgb(139,109,230)` glow). No Yu-Gi-Oh! or Konami logos drawn by us; card art appears only inside
  the extension's tooltip and on the captured boards (and the broadcast's own overlay).
- The reel was posted on 2026-10-24 with card art inside the tooltips and on the captured boards.

## Privacy

Every shot is cropped and masked by `scripts/build-footage.py` (from `scripts/gen-shots.py`)
before it reaches the Remotion project: no webcams, no player or channel names, no chat or
usernames; masks never touch a shown tooltip (one sits under the tooltip only until it lands). The
hero keeps the official broadcast's own overlay (event branding, life points) with player names
and webcams blurred.
