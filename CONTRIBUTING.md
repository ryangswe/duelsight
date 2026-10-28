<!-- SPDX-License-Identifier: Apache-2.0 -->
# Contributing

Thank you for wanting to help. DuelSight is an unofficial fan project, not affiliated with or
endorsed by Konami, and one person maintains it. This page says what is welcome, how to check a
change, and the two statements every contribution carries: the sign-off and the provenance
clause.

## What is welcome

- Fixes, with a test that fails without the fix.
- Tests.
- Corrections to the documentation.
- Reports of a wrong card (use the "Wrong card" issue form; no screenshots, a video id and a time
  are enough).

## Before you open a pull request

Node 22 or later.

```
npm ci
npm test
```

`npm test` runs the type check, then the tests; nothing outside the repository is needed.
[docs/development.md](docs/development.md) says how to build the extension; a build needs a model
release folder, which is not in this repository.

Every new file starts with the license line (`SPDX-License-Identifier: Apache-2.0`, as a comment
of that kind of file). JSON files are the exception.

For text that users read (the README, the docs, the store listings): American spelling; say that
DuelSight is an unofficial fan project, not affiliated with or endorsed by Konami, where it is
introduced; name no other tools; and make no claims of being first, only or best, or of naming
every card or working on any video.

## What is not taken into this repository

- **Clean room.** No code under the AGPL, and nothing copied from other card-recognition
  projects.
- **Card art, card text, video frames and screenshots of someone's video**, in files, issues or
  pull requests. The exceptions are the store images in `docs/store/`, the README banner
  `docs/banner.webp`, the promo reel in `docs/reel/` and its footage in
  `tools/promo-video/public/footage/`, which the maintainer keeps.
- **Model files and release data.** Release files and card text are served from the CDN, never
  committed.
- A check refuses model files and archives anywhere, and images and videos outside the folders
  that hold them (`.github/workflows/binaries.yml`).

## Sign-off (DCO)

Every commit carries a `Signed-off-by` line. A check blocks a pull request that has a commit
without one.

By signing off you certify the Developer Certificate of Origin, version 1.1. Its text is at
<https://developercertificate.org/> and is used as it stands. In short, you certify that you
wrote the contribution or otherwise have the right to submit it under the repository's license
(Apache-2.0). Read the text itself before you sign.

```
git commit -s -m "your message"
```

adds the line from your git name and email:

```
Signed-off-by: Your Name <you@example.com>
```

- A persistent handle is accepted in place of a legal name, as long as the email works.
- Each person signs their own commits.
- You may use AI coding tools. A tool cannot sign; by signing you take responsibility for
  everything in the commit.
- To add a missing sign-off: `git commit --amend --signoff` for the last commit, or
  `git rebase --signoff <base>` for all of them, then push with `--force-with-lease`.

## Provenance clause

The pull-request form asks you to tick each line. By opening a pull request you confirm that your
contribution contains:

1. nothing copied or adapted from projects licensed under the GPL or the AGPL, including other
   card-recognition tools;
2. nothing held under a confidentiality or non-disclosure agreement;
3. no card art, no video frames and no model files.

Being informed by another project's public write-up is fine. Copying or adapting its code,
weights or data is not.

## Security

Do not open an issue for a security problem. See [SECURITY.md](SECURITY.md).
