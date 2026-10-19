<!-- SPDX-License-Identifier: Apache-2.0 -->
# How well it works

*[Back to README](../README.md)*

**No accuracy figures are published yet.** DuelSight's models have not been measured on a
held-out set, and the figures of the One Piece extension this project began from do not
apply to Yu-Gi-Oh!. When they are measured, this page will give the figures, the test they come
from and its limits.

## What to expect meanwhile

- It is aimed at Master Duel, Dueling Book and paper tables with the camera above the table.
  Other footage, such as unofficial clients or steep camera angles, may work less well.
- It can leave uncertain matches blank, miss cards, or show an incorrect match.
- Cards that share an archetype's look can be confused with each other.
- One card name with several artworks counts as one card: a match names the card, and the picture
  shown may be a different artwork of it.
- What an installed copy recognizes is the card list in its release. New cards need a release
  that includes them; publishing an official list does not update an installed extension.
- Speed depends on your computer. Pointing at a card should feel immediate on a recent one, but
  that is not a promise.

## Measuring it

How a release is measured is described by the cardvision toolkit
(https://github.com/ryangswe/riftsight-vision). A DuelSight figure will be added here with
its test, and a release that was not measured says so.
