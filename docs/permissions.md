<!-- SPDX-License-Identifier: Apache-2.0 -->
# Permissions

What each Chrome permission DuelSight asks for is used for. What it reads, sends and keeps is in [PRIVACY.md](../PRIVACY.md).

*[Back to README](../README.md)*

| Permission | Why |
| --- | --- |
| Read and change your data on `www.youtube.com` and `www.twitch.tv` | On supported pages, the extension reads the video's picture around your pointer activity over the video (nothing before the pointer comes over it), and shows the card beside it. The permission also covers `www.youtube.com` player frames embedded in other websites; the surrounding website is not read. |
| DuelSight's card CDN (`cdn.duelsight.com`) | To load the settings file, card pictures, the card details file and, when new cards are published, updated card-recognition data (data files, never code: the extension's code never comes from the CDN). It is the host in `cdnBase` of `duelsight.config.json`. No other host is needed for any of them. |
| Storage | Keeps the on/off switch, the card size, the card details choice, the last settings file, a dismissed update notice and the id of updated recognition data that failed its checks (ignored after 24 hours), on your computer. It does not give the extension access to any other website. |

It does not request the tabs or history permissions. Its content scripts run on the
supported YouTube and Twitch pages and player frames listed in [Where it works](using.md#where-it-works).
