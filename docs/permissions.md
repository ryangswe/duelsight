<!-- SPDX-License-Identifier: Apache-2.0 -->
# Permissions

What each Chrome permission Kenbunshoku asks for is used for. What it reads, sends and keeps is in [PRIVACY.md](../PRIVACY.md).

*[Back to README](../README.md)*

| Permission | Why |
| --- | --- |
| Read and change your data on `www.youtube.com` and `www.twitch.tv` | On supported pages, the extension shows its button in the player and reads the page's address or channel link to know the channel. It reads the video's picture only on channels you turned card hovers on for, and only around your pointer activity over the video, and shows the card beside it. The permission also covers `www.youtube.com` player frames embedded in other websites; the surrounding website is not read. |
| `cdn.kenbunshoku.com`, `optcgapi.com` | To load the settings file, card pictures and the card-feature file. |
| Storage and unlimited storage | Storage keeps the on/off switch, the channels you turned card hovers on for, the last settings file and a dismissed update notice, on your computer. Unlimited storage lets the extension keep its approximately 60 MB card-feature cache without the normal quota and eviction limits. It does not give the extension access to any other website. |

It does not request the tabs or history permissions. Its content scripts run only on the
supported YouTube and Twitch pages and player frames listed in [Where it works](using.md#where-it-works).
