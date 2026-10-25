<!-- SPDX-License-Identifier: Apache-2.0 -->
# Privacy

DuelSight is a browser extension that names Yu-Gi-Oh! cards in YouTube and Twitch videos. It is an
unofficial fan project, not affiliated with or endorsed by Konami. This page says what it reads,
what it sends, and what it keeps.

## In short

- No accounts, no analytics, no telemetry, no advertising.
- Video frames are processed temporarily in memory, inside your browser. They are not saved to
  storage and never uploaded.
- The extension makes requests to one host, DuelSight's card CDN (`cdn.duelsight.com`), for a
  settings file, card pictures, a card details file and, when new cards are published, updated
  card-recognition data.

## What it reads

- **On supported `www.youtube.com` and `www.twitch.tv` pages**, including `www.youtube.com`
  player frames embedded in other websites: it reads the video and channel information needed
  for card hovers. That is where the pointer is over the page's main video (to show its on/off
  button), the page's channel (its address or channel link), and, on channels you turned card
  hovers on for, the picture of the video. It reads the picture around your pointer activity
  over the video: for 10 seconds after the pointer last moved there, and after that while a card
  is showing under the resting pointer (until 5 seconds after it stops showing). It stops when
  the pointer leaves the video or the tab goes to the background.
- It does not access Chrome's saved browsing history, and does not read comments, chat messages
  or account information. It does not read the website around an embedded player. The picture it
  analyzes is the whole video frame, so anything drawn into the video itself (such as an overlay
  showing chat) is part of that picture; the extension looks for cards in it and does not read
  text or identify people.
- Nothing on other sites.

With the toolbar switch off, the extension shows no button and reads no video on any page. The
settings check (below) continues.

## What happens to the picture

A picture is drawn at analysis size and handed to the extension's own frame inside the page,
where the recognition model runs on your computer. The result is a card name, a card number and
a box. The picture is held in memory while it is analyzed, then discarded. It is not saved to
storage, uploaded or shared.

## What it sends, and to whom

| Request | To | When | What the host learns |
| --- | --- | --- | --- |
| The settings file (`config.json`) | DuelSight's card CDN | When the extension is installed or updated and when Chrome starts, then at most once an hour while you use it (when you open the popup, or when card hovers start in a tab) | Your IP address and that the extension asked for its settings |
| A card's picture | DuelSight's card CDN | When a card is shown and its picture is not already loaded | Your IP address and which card picture was asked for |
| The card details file (the type, stats and text of the catalog's cards, in one file) | DuelSight's card CDN | When card hovers start in a tab with card details switched on and no copy of the file is kept yet: in practice once, and again when the settings file names a new version of it | Your IP address and that the extension asked for the details file (not which card you looked at: it is the same file whatever card you hover) |
| Updated card-recognition data (a release: its card list, card fingerprints and, after a model update, the recognition models; data files, never code) | DuelSight's card CDN | When card hovers start in a tab and the settings file names a release other than the one built into your version of the extension: a newer one, or an earlier one after a rollback (otherwise never). About 4.4 MB once per release when cards are added, about 19 MB when the models themselves are updated; afterwards it is read from your browser's cache. Your browser may keep a separate copy for each website, so watching on both YouTube and Twitch can download it twice. Nothing is downloaded at install or with card hovers off | Your IP address, the time, your browser's user agent and language, that this browser downloaded that release, and the extension's own id (sent as the request's origin) |

These requests carry no cookies, no account ID or per-user tracking identifier, and not the
address of the page you watch. Settings, picture, details and release requests carry no `Referer` at all. Like any
web request, they show the host your IP address, which file was asked for, and the headers your
browser adds to every request. The extension sends nothing else to anyone, and it does not send
the channels you turned on.

The CDN is run by the maintainer on Cloudflare (R2 storage). No request logging is set up for it:
the maintainer can see Cloudflare's aggregate traffic statistics, not a record of individual
requests or IP addresses. Cloudflare handles the requests under its own
[privacy policy](https://www.cloudflare.com/privacypolicy/).

The settings file can turn card pictures off (`namesOnly`); the extension then requests no
pictures at all. The maintainer can also point every install back to the recognition data built into
it, or to an earlier release, within about an hour, with no action from you and no store review. It can also stop naming a card details file; the extension then requests none and
deletes the copy it kept. With card details switched off in the popup, the details file is not
requested.

## What it keeps on your computer

Stored locally by the extension, without Chrome Sync, and never sent anywhere:

- **In `chrome.storage.local`** (settings):
  - whether it is switched on;
  - the card size you set in the popup (70% to 130%);
  - whether card details are switched on in the popup;
  - the channels you turned card hovers on for (their YouTube handle or id, Twitch name, or
    video id), each with the time you turned it on, and that you have seen the button's
    intro label;
  - the last settings file it fetched, and when;
  - if updated recognition data failed its checks, that release's id and why, so that it is not
    downloaded again for a day (after 24 hours it is ignored, and deleted the next time it is read);
  - the version of a "New version available" notice you dismissed.
- **In the extension's own Cache Storage:** one copy of the card details file from the CDN (the
  same file for everyone; it says nothing about you or what you watched). A newer version
  replaces it.

Card pictures are kept in memory while the tab is open, and in your browser's ordinary cache, as
are the files of updated recognition data.

To clear the channel list: click the player button again on a channel to forget that one, or
remove the extension, which deletes all of its storage.

## Questions

Open an issue on the project page, https://github.com/ryangswe/duelsight.
