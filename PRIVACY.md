<!-- SPDX-License-Identifier: Apache-2.0 -->
# Privacy

Kenbunshoku is a browser extension that names One Piece Card Game cards in YouTube and Twitch
videos. This page says what it reads, what it sends, and what it keeps.

## In short

- No accounts, no analytics, no telemetry, no advertising.
- Video frames are processed temporarily in memory, inside your browser. They are not saved to
  storage and never uploaded.
- The extension makes requests to two hosts, `cdn.kenbunshoku.com` and `optcgapi.com`, for a
  settings file, card pictures and, where Chrome has WebGPU, a card-feature file of about 60 MB
  downloaded on first use (the first video you turn card hovers on for) and cached.

## What it reads

- **On supported `www.youtube.com` and `www.twitch.tv` pages**, including `www.youtube.com`
  player frames embedded in other websites: it reads the video and channel information needed
  for card hovers. That is where the pointer is over the page's main video (to show its on/off
  button), the page's channel (its address or channel link), and, only on channels you turned
  card hovers on for, the picture of the video. It reads the picture only around your pointer
  activity over the video: for 10 seconds after the pointer last moved there, and after that
  only while a card is showing under the resting pointer (until 5 seconds after it stops
  showing). It stops when the pointer leaves the video or the tab goes to the background.
- It does not access Chrome's saved browsing history, and does not read comments, chat messages
  or account information. It does not read the website around an embedded player. The picture it analyzes is the whole
  video frame, so anything drawn into the video itself (such as an overlay showing chat) is part
  of that picture; the extension looks only for cards in it and does not read text or identify
  people.
- Nothing on any other site.

With the toolbar switch off, the extension shows no button and reads no video on any page. The
settings check (below) continues.

## What happens to the picture

A picture is drawn at analysis size and handed to the extension's own frame inside the page,
where the recognition model runs (on your graphics card through WebGPU, or on your processor).
With WebGPU, each recognized card is also compared with the card-feature file (below), on your
computer.
The result is a card name, a card number and a box. The picture is held in memory only while it
is analyzed, then discarded. It is not saved to storage, uploaded or shared.

## What it sends, and to whom

| Request | To | When | What the host learns |
| --- | --- | --- | --- |
| The settings file (`config.json`) | `cdn.kenbunshoku.com` | When the extension is installed or updated and when Chrome starts, then at most once an hour while you use it (when you open the popup, or when card hovers start in a tab) | Your IP address and that the extension asked for its settings |
| A card's picture | `cdn.kenbunshoku.com`, or `optcgapi.com` when the first fails | When a card is shown and its picture is not already loaded | Your IP address and which card picture was asked for |
| The card-feature file (a manifest and eight parts, about 60 MB in all) | `cdn.kenbunshoku.com` | On first use: the first video you turn card hovers on for, in a Chrome that has WebGPU; never at install. Again only if Chrome cleared its storage or the file changes | Your IP address and that the file was downloaded |

These requests carry no cookies, no account ID or per-user tracking identifier, and not the
address of the page you watch. Settings and picture requests carry no `Referer` at all. Like any
web request, they show the host your IP address, which file was asked for, and the headers your
browser adds to every request. The extension sends nothing else to anyone, and it does not send
the channels you turned on.

`cdn.kenbunshoku.com` is run by the maintainer on Cloudflare (R2 storage). No request logging is
set up for it: the maintainer can see only Cloudflare's aggregate traffic statistics, not a
record of individual requests or IP addresses. Cloudflare handles the requests under its own
[privacy policy](https://www.cloudflare.com/privacypolicy/). `optcgapi.com` is run by a third
party; it publishes no privacy policy that we could find (checked on 2026-10-16).

The settings file can turn card pictures off (`namesOnly`); the extension then requests no
pictures at all.

## What it keeps on your computer

Stored locally by the extension, without Chrome Sync, and never sent anywhere:

- **In `chrome.storage.local`** (settings):
  - whether it is switched on;
  - the channels you turned card hovers on for (their YouTube handle or id, Twitch name, or
    video id), each with the time you turned it on, and that you have seen the button's
    first-view label;
  - the last settings file it fetched, and when;
  - the version of a "New version available" notice you dismissed.
- **In Cache Storage** (the extension's own cache): the card-feature file. The extension asks
  Chrome to keep it.

The "unlimited storage" permission lets the extension keep its approximately 60 MB card-feature
cache without the normal quota and eviction limits. It does not give the extension access to any
other website.

Card pictures are kept in memory while the tab is open, and in your browser's ordinary cache.

To clear the channel list: click the player button again on a channel to forget that one, or
remove the extension, which deletes all of its storage.

## Questions

Open an issue on the project page, https://github.com/ryangswe/kenbunshoku.
