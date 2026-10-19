<!-- SPDX-License-Identifier: Apache-2.0 -->
# Using Kenbunshoku

How card hovers work once the extension is installed, what to expect, and how to update or remove it. To install it, see the [README](../README.md#install).

*[Back to README](../README.md)*

## Where it works

- Runs on supported YouTube and Twitch pages: YouTube watch pages, live pages and embedded
  players served from `www.youtube.com` (including those frames on other websites, without
  reading the surrounding website), and Twitch live channels and past broadcasts on
  `www.twitch.tv`. Other embedding addresses, such as `youtube-nocookie.com` or
  `player.twitch.tv`, are not supported.
- No streamer setup is needed. It recognizes supported cards from the video picture, in your
  browser.
- Hover only: it shows a card when you point at one, and stays out of the way otherwise. It can
  leave uncertain matches blank. It can also miss cards or show an incorrect match.

## Turning card hovers on

Open a One Piece Card Game video on YouTube or Twitch and move the pointer over the video. A
small round Kenbunshoku button appears in the player's top-right corner: click it to turn card
hovers on for that channel (on YouTube, for that video when no channel is shown, as in an embedded
player). Kenbunshoku remembers the channels you turned on. Video analysis and the card-feature
download start only after you turn card hovers on. The extension separately checks its settings
file when it is installed or updated and when Chrome starts, and at most once an hour while you
use it. Click the button again to turn card hovers off for that channel; that forgets it.

## Hovering a card

Then rest the pointer on a face-up card. After a moment a thin outline marks the card it recognized,
and its picture appears beside it, placed off the cards around it where it can (smaller when the
window is short). Move to another card to see that one, even one under the picture shown: the
pointer passes through it, and nothing on it can be clicked. When there is no picture, the
card's name shows instead. Pausing works too, on recorded videos and on live streams.

## The toolbar popup

Kenbunshoku's toolbar popup is one switch, the main on/off: turned off, it shows no button in
the player and analyzes no video, on any page, until you turn it back on. It does not stop the
settings check above. Below it are two links, to the project page and to the open-source toolkit
it is built on.

## When recognition runs

The first time you point at a video with card hovers on in a tab, the recognition model starts, which takes a
moment. Recognition runs only while the pointer is over the video, and stops by itself 10 seconds after
you stop moving it, unless a card is showing under the resting pointer. It stops at once when
the pointer leaves the video or the tab goes to the background.

## Extra accuracy (WebGPU)

On a computer whose Chrome has WebGPU, Kenbunshoku is designed to
also check each card against the card art's shapes, which tells close-looking cards apart
better. The check runs only when it loads successfully and stays on: it turns itself off when it
fails or is too slow. For it, Kenbunshoku downloads a card-feature file of about 60 MB from
`cdn.kenbunshoku.com` on first use (the first video you turn card hovers on for) and caches it in
Chrome's storage; it is downloaded again if that storage is cleared or the file changes. Without
WebGPU it works without the extra check. Each tab
in which you have hovered a video holds its own copy of the card features in memory, about
60–70 MB, until the tab is closed or navigates away.

## Known limitations

- A card face down, a card mostly covered, or a picture too small or too blurred may show
  nothing: Kenbunshoku leaves uncertain matches blank. It can also miss cards or show an
  incorrect match.
- On a Twitch channel that shows a Twitch Extension over the video, that extension's frame
  takes the pointer, and Kenbunshoku sees no pointer there.
- A scene cut without a seek is caught at the next analysis, not at once, so a card can stay up
  to a second or two after the picture under it changes.

How often it is right, and what it does not recognize, is in [accuracy.md](accuracy.md).

## Updating and removing

**Chrome Web Store installs update themselves.** Chrome installs new versions on its own, and
your settings stay. The rest of this section is about installs from a release zip.

Switching from a zip install to the Web Store: the two are separate extensions to Chrome, so
turn card hovers on again for your channels after you install from the store, then remove the
zip install.

Every install from a release zip has the same extension ID (`igfdjmpikcbplijnlpkligaafepgoaaa`).
That alone does not keep settings: they are kept only when you update in place, as below.

**To update and keep your settings**, download the new zip and unzip it, replace the contents of
your existing Kenbunshoku folder with the contents of the new one, then click the circular
**Reload** arrow on Kenbunshoku's card in `chrome://extensions`. When a newer version is out,
Kenbunshoku's popup says "New version available" with a link.

**To remove it**, click **Remove** on its card in `chrome://extensions`. Removing the extension
deletes its saved settings (the on/off switch and the channels you turned card hovers on for);
installing it again starts fresh.
