<!-- SPDX-License-Identifier: Apache-2.0 -->
# How it works

The extension's parts and the settings file that controls where card pictures come from. For building and changing it, see [development.md](development.md).

*[Back to README](../README.md)*

## Overview

The extension is built on an open-source card recognition runtime,
`cardvision-browser` (Apache-2.0; see [Built on cardvision](../README.md#built-on-cardvision)), and a
Yu-Gi-Oh! release of its models: a detector that finds cards in the picture and a
recognizer that matches each card against a bank of known cards, with an accept rule that shows
nothing when the match is not clear.

- The **content script** (`src/content/`) runs in YouTube and Twitch pages. It follows the
  page's main video and the pointer over it, and captures a picture when asked.
- A hidden **compute frame** (`src/compute/`), an extension page inside the video page, hosts
  the runtime's worker. It decides when to analyze a picture (around pointer activity,
  with the runtime's scheduler), and which card a tooltip shows at the pointer (the runtime's
  hover rule). Pictures go from the content script to this frame and nowhere else.
- The **tooltip frame** (`src/tooltip/`), an extension page placed beside the card, shows its
  picture alone (320 px wide, scaled down to fit the window but not below 200 px), or its name
  when there is no picture. It takes no pointer events.
- The **background** (`src/background/`) fetches the settings file.
- There is **no geometric stage** in this build (the runtime's extra-accuracy check with OpenCV.js
  and a large card-feature index). It is not configured, not copied into the package and not
  requested: the compute frame sends the runtime a plain load request. The vendored runtime's own
  code still contains the stage, dormant, since changing it is a toolkit matter.

## Architecture

```mermaid
flowchart TD
    subgraph PAGE["YouTube or Twitch page"]
        VID["Video element"]
        CS["Content script:<br/>pointer, capture"]
        OUT["Outline host"]
        subgraph CF["Compute iframe, extension origin"]
            HS["Host session:<br/>when to analyze, hover rule"]
            W["Worker: cardvision-browser<br/>ONNX Runtime Web,<br/>WebGPU or WASM"]
        end
        TT["Tooltip iframe,<br/>extension origin"]
    end
    PKG["Bundled in the extension:<br/>release, models, bank"]
    REL["A newer release on the CDN<br/>(when the settings name one)"]
    POP["Popup"]
    BG["Background"]
    CDN["DuelSight card CDN"]

    POP -- "on or off,<br/>everywhere" --> CS
    VID -- "drawn to a canvas<br/>at analysis size" --> CS
    CS -- "pointer, seeks;<br/>frame as ImageBitmap" --> HS
    HS -- "capture request;<br/>card id, name, box" --> CS
    HS <-- "frame out,<br/>boxes and names back" --> W
    PKG -- "release.json<br/>at load" --> W
    REL -. "checked files,<br/>when hovers start" .-> W
    CS -- "card id and name" --> TT
    TT -- "its size" --> CS
    CS -- "the named box" --> OUT
    TT -- "refresh request" --> BG
    POP -- "refresh request" --> BG
    BG -- "config.json: install, update,<br/>browser start, then at most hourly" --> CDN
    TT -- "card picture,<br/>when not loaded yet" --> CDN
    TT -- "card details file,<br/>once, then cached" --> CDN
```

**How to read it.** An arrow into the card CDN is a request, with its contents and its timing as
in [PRIVACY.md](../PRIVACY.md). Nothing else leaves the browser.

- **The content script** is on for all supported videos (the popup's switch is the sole
  control), but makes no frame and loads no model before the pointer comes over the
  video's picture, so a video nobody points at costs nothing. From then on it reports the
  pointer and seeks to the compute frame,
  and, when asked and the pointer is active over the player, draws the video to a canvas at
  analysis size and transfers it as an `ImageBitmap`.
- **The compute frame** decides when to analyze and runs the hover rule; its worker runs the
  vendored runtime on the release bundled in the extension, or on a newer release the settings
  file names (the vendored `remote-release.js`): the frame downloads that release's files once,
  checks each against its SHA-256, reuses the bundled files that are the same, and falls back to
  the bundled release on any problem. Frames, pictures and results never go to the network. With a newer release, the
  frame also sends each shown card's name to the tooltip frame over a channel the page cannot reach.
- **The tooltip frame** gets a card id and name, loads the card's picture (from the CDN, or none with `namesOnly`), and reports its size back. The
  content script places it, and draws the **outline** around the same box.
- **The details panel:** with card details on, the tooltip frame also loads the card details file
  the settings file names (`src/details/`), once, and keeps it in the extension's Cache Storage.
  For a card it lists, the frame fills a text panel (as plain text, never markup), measures it at a
  few widths and sends those heights with the picture's size. The content script sizes the frame
  for both (`fitWithPanel` in `src/content/geometry.ts`): side by side, or stacked in a narrow
  window, the picture made smaller where the text needs room, the text never. The frame lays both
  out from its own size (`src/shared/panel-layout.ts`) and ends text that does not fit in an
  ellipsis. The popup's card-size dial scales the picture before this fitting.
- **The background** fetches the settings file. The popup and the tooltip frame ask it for a
  refresh, which it makes at most once an hour.

## The settings file

Where pictures come from is decided by a small settings file at
`<cdnBase>/config.json` (schema version 1; `cdnBase` is the one value in `duelsight.config.json` that names the CDN host, `https://cdn.duelsight.com`), so that images can be switched to
another source, or off, without a new extension release:

- `namesOnly: true` shows no pictures at all: the card's name alone.
- `primary` is the project's own image server; `fallbacks` are tried in order when it fails
  (an error, a body that is not a picture, or no picture within 5 seconds); with none left, the
  tooltip shows the card's name.
- Card ids are Yu-Gi-Oh! passcodes (digits, up to 8). One card name with several artworks is one
  identity in the release's groups.
- `details` names the card details file (a path on the same host and its SHA-256); without it,
  the tooltip shows pictures alone. `detailsFr` names the French one, which a browser whose top
  preferred language is French loads instead (`src/details/language.ts`). See
  [cdn/SETTINGS.md](../cdn/SETTINGS.md).
- `release` names a newer card-recognition release on the same host (its id, path and SHA-256, and
  the lowest extension version that may load it), so that new cards reach installs without a store
  update. See "The release pointer" in [cdn/SETTINGS.md](../cdn/SETTINGS.md).
- `cardLink` and `geometric` are retired fields: a file may still carry them; they are ignored.
- The tooltip's link to Konami's official card database is built by `src/tooltip/card-link.ts` as
  an address (a card page when the catalog row has a `konamiId`, else a name search). It is
  never fetched.

The file is checked strictly. A file that cannot be used leaves the last good copy in effect, or
the copy built into the extension. An image source on a host the extension has no permission
for is ignored (adding a host needs a new release). The extension also reads an optional
`update: { "latest": "x.y.z", "url": "https://…" }` field: when the running version is lower,
the popup shows one dismissible "New version available" line. The address must be on the
project's releases page; others are ignored.
