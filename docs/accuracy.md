<!-- SPDX-License-Identifier: Apache-2.0 -->
# How well it works

*[Back to README](../README.md)*

DuelSight 0.2.0 ships the models of release T2 (`0927859c6f18302f`). They were measured once, on a
held-out test whose rules were written down before any test label existed, and shipped because
they passed it.

## The test, in short

| Source | Readable cards named right | Tooltips shown that were wrong | Status |
| --- | --- | --- | --- |
| Master Duel | 72 of 80 | 0 of 72 | promised |
| Dueling Book | 41 of 42 | 0 of 41 | promised |
| Paper (official tournament broadcasts) | 45 of 106 | 1 of 46 | supported, not promised |
| All three | 158 of 228 | 1 of 159 | |

In a held-out test on 31 frames from 11 recordings (official Konami paper broadcasts, Master Duel
and Dueling Book), labeled without any model's help and scored once, DuelSight named 69.29 % of the
readable cards (158 of 228); 1 of the 159 tooltips it showed was wrong (one-sided 95 % upper bound
2.95 %).

- The bound assumes independent events and is not a guarantee for every video. Resampling whole
  recordings gives 0.00 % to 2.38 % wrong (11 recording groups; with this few groups such an
  interval tends to run narrow).
- **Master Duel:** 72 of 80 readable cards named right; 0 of 72 tooltips shown were wrong.
- **Dueling Book:** 41 of 42 readable cards named right; 0 of 41 tooltips shown were wrong.
- **Paper videos are supported but not promised:** in the test it named 45 of 106 readable cards;
  1 of 46 tooltips shown were wrong. Expect it to leave many paper cards blank.
- The paper footage in the test was official Konami tournament broadcasts (YCS, WCQ and Worlds) at
  1080p or higher. Locals, phone footage and streams under 1080p were not tested, and DuelSight
  makes no promise on them.

Small samples: the Master Duel figures come from 3 recordings and the Dueling Book figures from 2,
so they describe those videos more than every Master Duel or Dueling Book video.

## How the test was run

- The test frames were drawn by a rule fixed in advance, from recordings no model trained on. A
  person marked every readable card and a fixed set of other points on each frame, without any
  model's suggestions. Frames with no duel on screen (deck builders, menus) were removed before
  labeling, as the rule says.
- The pass mark was written down before any test label existed: a source fails if it shows at least
  2 wrong tooltips and more than 5 % wrong, and over all sources together the wrong tooltips must
  stay at most 5 % at the one-sided 95 % bound. A source is promised when it has enough cards in
  the test and at least 75 % of its readable cards are named right; paper fell short of 75 %, so it
  is listed, not promised.
- The confidence rule and the model's settings were chosen on frames the models did not train on:
  the earlier test's 16 frames and 12 development frames of paper broadcasts.
- Master Duel alternate artworks are among the reference images: every artwork a public list gave,
  not chosen cards. They were added in round 1 after a missing one was noticed on a
  round-1 test frame. A match on an alternate artwork shows the card's usual picture.
- Frames and labels stay private (they are frames of other people's videos). The scoring used the
  open-source cardvision toolkit 0.2.0rc4 (`cardvision evaluate hover`).

## The earlier test

This is DuelSight's second held-out test. The earlier one (October 2026, 16 frames from 8 channels) named
102 of 131 readable cards, 1 of 103 tooltips wrong, paper 21 of 44; the owner did not ship on it
beyond an unlisted, unannounced preview (0.1.0). The second test is a new sample from different
recordings; the earlier set was not reused.

Compared with the earlier release on the same test frames, named right changed by +0.00 points
(-5.14 to +4.62 points) and wrong tooltips by -2.44 points (-4.23 to +0.00 points); 11 recording
groups, so these intervals tend to run narrow. On these frames the earlier release would not have
passed: 5 of its 163 tooltips were wrong.

## What to expect

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
(https://github.com/ryangswe/riftsight-vision). Each DuelSight release that changes the models is
measured on a fresh held-out set before it ships, or says here that it was not.
