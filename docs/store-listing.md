<!-- SPDX-License-Identifier: Apache-2.0 -->
# Store listing draft (early preview, release T; to be submitted as Unlisted)

Drafts for the Chrome Web Store. Nothing here has been through a store review. Read the store's
current policies before submitting.

## Name

DuelSight

## Short description (132 characters or fewer)

Unofficial fan project, not affiliated with or endorsed by Konami. Hover a Yu-Gi-Oh! card in a YouTube or Twitch video to see it.

## Long description

DuelSight is an unofficial fan project, not affiliated with or endorsed by Konami.

Hover a card in a Yu-Gi-Oh! video on YouTube or Twitch, and a larger picture of it appears beside
it, with its name, type, stats and text.

Early preview: card recognition is still being improved, most of all on paper tables. An update
is on its way.

- Aimed at Master Duel, Dueling Book and paper tables with the camera above the table. Results
  vary by video, and it can miss a card or show a wrong one.
- Turn it on per channel with the button in the player. The toolbar switch turns it off
  everywhere.
- Choose the card size (70% to 130%) and whether the card's text shows beside its picture, in
  the toolbar popup.
- No accounts, analytics, telemetry or advertising. Video frames are analyzed inside your
  browser and never uploaded.
- Open source (Apache-2.0), built on the cardvision toolkit: https://github.com/ryangswe/riftsight-vision

Yu-Gi-Oh!, its card names and its card art belong to their owners. Card text and images are
copyright 4K Media Inc., a subsidiary of Konami Digital Entertainment. Card data from
YGOPRODeck.

## Permission explanations

- YouTube and Twitch pages: to show the in-player button and read the picture of the video around
  your pointer, on channels you turned card hovers on for.
- DuelSight's card CDN: to load a small settings file, card pictures and a card details file.
- Storage: to keep your on/off switch, your card size, your card details choice and the channels
  you turned on, on your computer.

## Privacy practices

The extension requests one host (its CDN), without cookies or the address of the page you watch,
and keeps its settings and a copy of the card details file on your computer. See [PRIVACY.md](../PRIVACY.md).

## Screenshots

TODO: capture DuelSight's own (the button in a player, a hover, the popup). None are in this
repository.
