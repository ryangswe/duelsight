<!-- SPDX-License-Identifier: Apache-2.0 -->
# Security

## Reporting a problem

Do not open a public issue for a security problem. Use the "Report a vulnerability" button on
this repository's [Security tab](https://github.com/ryangswe/duelsight/security) (GitHub's
private vulnerability reporting).

Say what you found, how to reproduce it, and which version of the extension (or which commit)
you used. One person maintains DuelSight, so a fix can take a while; you will get an answer
first.

## What counts

- The extension reading or sending more than [PRIVACY.md](PRIVACY.md) says, or reading pages
  other than the ones [docs/permissions.md](docs/permissions.md) lists.
- A page, a video or a file from the CDN being able to make the extension run code, or show
  something other than a card.
- The extension accepting recognition data (a release from the CDN) that does not match the
  SHA-256 its release document pins.
- A secret committed to this repository.

## Supported versions

The current version on the Chrome Web Store and Firefox Add-ons, and `main`.
