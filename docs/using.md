<!-- SPDX-License-Identifier: Apache-2.0 -->
# Using DuelSight

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
- It is aimed at Master Duel, Dueling Book and paper tables with the camera above the table.
  Other footage may work less well.
- Hover is how it works: it shows a card when you point at one, and stays out of the way
  otherwise. It can leave uncertain matches blank. It can also miss cards or show an incorrect
  match.

## Turning card hovers on and off

Card hovers are on for all supported videos: open a Yu-Gi-Oh! video on YouTube or Twitch and
point at a card. When a video starts playing, DuelSight loads its card recognition and its
tooltip in the background (a short burst of work, then some memory), so the card you point at is
named and shown sooner. It does this on YouTube watch and live pages and on Twitch channel,
video and clip pages. For a YouTube player embedded in another website, and other Twitch pages (the
front page and directory, whose previews play on their own, the popout player and the moderator
view), it waits until you point at the video.
After 10 minutes without pointing at the video it frees that memory, and loads again when you
point at the video. A card left showing under a resting pointer keeps it loaded until the
pointer moves. Nothing is analyzed before the pointer comes over the
video. To turn card hovers off everywhere, use the switch in DuelSight's toolbar
popup; there is no per-channel switch. Turned on again, it loads at once in the tab in front when
its video plays on one of the pages above that load at play; a tab in the background whose card
recognition was freed does the same when you bring it to the front. The extension separately checks its settings file when it
is installed or updated and when the browser starts, and at most once an hour while you use it.

## Hovering a card

Rest the pointer on a face-up card. After a moment a thin outline marks the card it recognized,
and its picture appears beside it, placed off the cards around it where it can (smaller when the
window is short). Move to another card to see that one, even one under the picture shown: the
pointer passes through it, and nothing on it can be clicked. When there is no picture, the
card's name shows instead.

The card stays while the pointer stays where you found it, so you can finish reading it even
after a player moves the card away. The outline goes when the card is no longer there; the
picture stays until you move the pointer off that spot or off the video. To have the picture follow
whatever card is at the pointer instead, turn off **Keep the card I'm pointing at** in the popup
(below).

With **Card details** on (the default), the picture comes with a panel of the card's name, type,
attribute, level, rank or link rating, ATK and DEF, and its text: beside the picture where there is
room, under it in a narrow window. The text keeps a readable size; when a small player has no room
for all of a long text, it ends in "…". The panel shows at once, beside a dark card with the card's
name, and the picture takes that card's place as soon as it has loaded. On a new install, the
details take a moment to load, and pictures show alone until then. Pausing works too, on recorded
videos and on live streams.

The details can be in English, French, German, Italian, Spanish or Portuguese: choose one with
**Card language** in the popup (below). In a language other than English, the panel shows the
card's official name in that language (with the English name under it), type line and text; a
card with no official text in that language yet shows its English text.

**Automatic**, the default, follows your browser's languages: the panel uses the earliest one in
your browser's list that DuelSight has, and English when it has none of them. With Japanese then
French, for example, it shows French.

## The toolbar popup

DuelSight's toolbar popup has the main on/off switch: turned off, it shows no button in the
player and analyzes no video, on any page, until you turn it back on. It does not stop the
settings check above.

**Card details** shows the card's type, stats and text beside its picture (on unless you turn it
off). Off, the tooltip is the picture alone.

**Keep the card I'm pointing at** (on unless you turn it off) keeps the card you found while the
pointer stays on that spot, as above: a card a player lays on top of it, or slides under the
pointer, won't replace it until you move. Off, the picture follows the card at the pointer, and goes
shortly after that card is no longer there. A change applies at once in the tab you're watching:
where DuelSight has already loaded, card recognition loads again, which takes a moment. Other tabs
change when you next switch to them.

**Card language** chooses the language of the card details: Automatic (your browser's language,
as above), or a language from the list. It changes the card's name, type line, stats line and
text; the picture stays the same. The rest of DuelSight is in English. A language added later
shows in the list without an update of the extension.

**Card size** sets how large the card's picture is shown, from 70% to 130% of its usual size
(100% unless you change it). A card on show changes size at once. The picture still stays inside
the window and beside the card, so in a small window it can be smaller than the size you set.

While the main switch is off, **Card details**, **Keep the card I'm pointing at**, **Card
language** and **Card size** are grayed out and can't be changed. **Card language** is grayed out too while **Card details** is off. Your
choices for them are kept, and they come back as they were when you turn the switches on again.

Below them are two links, to the project page and to the open-source toolkit it is built on.

## When recognition runs

Once per tab, when you point at a video with card hovers on, the recognition model starts,
which takes a moment. Recognition runs while the pointer is over the video, and stops by itself
10 seconds after you stop moving it, unless a card is showing under the resting pointer; even
then, it stops 60 seconds after the pointer last moved. Move the pointer to start it again. It
stops at once when the pointer leaves the video, the tab goes to the background or the video
changes.

## Known limitations

- A card face down, a card mostly covered, or a picture too small or too blurred may show
  nothing: DuelSight leaves uncertain matches blank. It can also miss cards or show an
  incorrect match.
- Cards that share an archetype's look can be confused. One card name with several artworks
  counts as one card.
- On a Twitch channel that shows a Twitch Extension over the video, that extension's frame
  takes the pointer, and DuelSight sees no pointer there.
- A scene cut without a seek is caught at the next analysis, not at once, so a card can stay up
  to a second or two after the picture under it changes.

What it does and does not recognize is in [accuracy.md](accuracy.md).

## Updating and removing

**Store installs update themselves:** Chrome and Firefox install new versions from their stores on
their own, and your settings stay.

**To remove it:**

- **Chrome:** click **Remove** on DuelSight's card in `chrome://extensions`.
- **Firefox:** open `about:addons`, choose **Extensions**, click the **⋯** menu on DuelSight's
  card and choose **Remove**.

Removing the extension deletes its saved settings (the on/off switch, the card size, the card
details choice, the card language and its copy of the card details file); installing it again starts fresh.

### Chrome installs from a release zip

Every install from a release zip has the same extension ID (`ddhnolhobdfnfofeloiimlelijgjihfp`).
That alone does not keep settings: they are kept when you update in place, as below.

**To update and keep your settings**, download the new zip and unzip it, replace the contents of
your existing DuelSight folder with the contents of the new one, then click the circular
**Reload** arrow on DuelSight's card in `chrome://extensions`. When a newer version is out,
DuelSight's popup says "New version available" with a link. To remove it, click **Remove** on
its card, as above.
