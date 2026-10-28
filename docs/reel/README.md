<!-- SPDX-License-Identifier: Apache-2.0 -->
# Promo reel

The launch reel, as posted on 2026-10-24. To re-render it from its committed footage, or make a
new one, see [tools/promo-video/](../../tools/promo-video/README.md).

*[Back to README](../../README.md)*

| File | Size | What |
| --- | --- | --- |
| `reel-16x9.mp4` | 1920×1080, 31 s | The reel, with music (for X, YouTube, Discord). |
| `reel-9x16.mp4` | 1080×1920, 31 s | The same timeline, panning to follow each tooltip (Shorts, Reels, TikTok). |
| `poster.png`, `poster-9x16.png` | 1920×1080, 1080×1920 | Thumbnails: frame 175 (5.8 s), the first card's art on screen. |

What it shows: extension 0.2.0 (release T2) on real YouTube playback, three continuous takes with
the hovers in real time:
- **Master Duel**, Konami's Challenger Cup broadcast: the click on the DuelSight button, then
  Dracotail Gulamel, Dracotail Arthalion and Dracotail Mululu.
- **Dueling Book**, DBGrinder's video: Granguignol the Dusk Dragon, The Fallen & The Virtuous and
  Incredible Ecclesia, the Virtuous.
- **Paper**, Konami's NAWCQ Minneapolis broadcast: Futsu no Mitama no Mitsurugi and S:P Little
  Knight.
- **End card:** DuelSight, "Free and open source · Chrome extension", the repository's address and
  the unofficial line.

Each tooltip was checked by eye against the card under the pointer. Player webcams, player names,
chat and usernames are blurred or cropped out.

From 0.4.0 the in-player button is gone (hovers are on with no click), and DuelSight is also a
Firefox add-on, so the opening click and the end card's "Chrome extension" describe 0.2.0.

**Music:** "Epic" by paulyudin, supplied as royalty-free (the file name points to Pixabay, track
573969), trimmed to 31 s with a fade. Its license check is in
[LICENSE-MUSIC.md](../../tools/promo-video/LICENSE-MUSIC.md).

**Not covered by this repository's license.** The reel shows Yu-Gi-Oh! card art, card text and
other people's videos as they appear on YouTube, and carries a licensed music track. The art, the
text, the footage, the people in it and the music belong to their owners. DuelSight is an
unofficial fan project, not affiliated with or endorsed by Konami.
