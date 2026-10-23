<!-- SPDX-License-Identifier: Apache-2.0 -->
# Permissions

What each Chrome permission DuelSight asks for is used for. What it reads, sends and keeps is in [PRIVACY.md](../PRIVACY.md).

*[Back to README](../README.md)*

| Permission | Why |
| --- | --- |
| Read and change your data on `www.youtube.com` and `www.twitch.tv` | On supported pages, the extension shows its button in the player and reads the page's address or channel link to know the channel. It reads the video's picture on channels you turned card hovers on for, around your pointer activity over the video, and shows the card beside it. The permission also covers `www.youtube.com` player frames embedded in other websites; the surrounding website is not read. |
| DuelSight's card CDN (`cdn.duelsight.com`) | To load the settings file, card pictures and the card details file. It is the host in `cdnBase` of `duelsight.config.json`. |
| Storage | Keeps the on/off switch, the card size, the card details choice, the channels you turned card hovers on for, the last settings file and a dismissed update notice, on your computer. It does not give the extension access to any other website. |

It does not request the tabs or history permissions. Its content scripts run on the
supported YouTube and Twitch pages and player frames listed in [Where it works](using.md#where-it-works).
