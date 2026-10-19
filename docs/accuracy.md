<!-- SPDX-License-Identifier: Apache-2.0 -->
# How well it works

How accurate the card recognition is, how it was measured, and its limits.

*[Back to README](../README.md)*

The models were measured once, before release, on 25 frames of 13 public videos from 9
recording groups that were not used in training (2 on a digital client, 7 of physical play).
"Named right" is the share of readable card faces under the pointer for which the right card
was shown; "wrong of shown" is the share of the cards shown that were wrong, counting a card
shown over a card back or an empty part of the table as wrong. Unknown or unreadable evaluation
points are excluded from these rates, and so is a name shown just off a face of that same card;
see the model card for the counts. In brackets, 95% intervals over recording groups.

These are held-out Python evaluation results for B2, not a held-out test of the shipping browser
extension. B2.1, the release the extension ships, has the same models and vector bank, with one
catalog entry corrected and the identity grouping that follows from it.

| | Named right | Wrong of shown |
| --- | --- | --- |
| B2 models only — Python evaluation | 221/297 = 74.4% (50.3–83.8) | 9/230 = 3.9% (1.6–11.8) |
| B2 + geometric stage — Python evaluation | 249/297 = 83.8% (62.5–91.8) | 7/256 = 2.7% (0.6–10.3) |

The browser uses the models-only pipeline when geometry is unavailable or disabled, and adds the
geometric check when it loads and remains active. The table measures those pipelines in Python,
not their browser accuracy.

The held-out geometric-stage results above were measured in Python. The browser implementation
of the check was compared with Python on development data only, not on the held-out set. On
generated development scenes, named-right rates were 74.76% in both implementations;
wrong-of-shown was 3.07% in Python and 2.94% in the browser. On the faces whose input was
byte-identical on both sides, all 622 final hover answers agreed. However, the stricter
pre-registered intermediate-parity check did not pass: vote-count and match agreement were
78.04% and 91.17%, below the 95% requirement. The maintainer chose to enable the browser check
on WebGPU despite that failed check. These development results do not establish the browser
extension's held-out accuracy. A diagnostic of the recorded evidence found the vote and match
differences only on faces whose ORB descriptors differ between the native OpenCV build and
OpenCV.js; on 12 faces examined in detail, the cause was ORB's keypoint angle, which the two
builds round differently by under 0.01 degrees. That cause is shown for those 12 faces and is
the working explanation for the rest.

Speed: in the development check's browser run (Chrome with WebGPU on an Apple M3 Max, the 23
real development frames at their native size), whole-frame analysis with the check took
1073.3 ms at the 95th percentile. That was measured after the models and the card-feature file
had loaded, so it leaves out startup and the download; the first frame analyzed is included. It
is one machine and a small sample, not a promise of delay on other computers. The check turns
itself off where it is too slow.

## Limits

- **A small test.** 25 frames from 9 recording groups, so the intervals are wide.
- **Physical play is well below digital.** With the models only, 68/124 physical faces were
  named right against 153/173 digital ones; with the geometric stage, 84/124 and 165/173 (both
  Python evaluation). Webcam and phone footage is the hardest.
- **SAMPLE-stamped art and DON!! cards.** Most official images of set and starter cards, which
  the models compare against, carry a "SAMPLE" overprint that physical cards do not, and the
  many DON!! art variants count as one card.
- **Missing cards.** Some cards and promotional printings are missing: 13 promotional cards in
  the list have no official art and no other printing, so they are not recognized, and coverage
  of promotional cards is incomplete.
- **Different printings.** A match names the card; the picture shown may be a different printing
  of it.
- **Incorrect matches remain possible**, especially on difficult physical footage.
- **New sets.** What an installed Kenbunshoku recognizes is the card list in its release.
  This release covers Bandai's official English card list up to OP-17 and EB-04, with the starter
  decks up to ST-36 and the premium boosters PRB-01 and PRB-02. New sets require an extension
  update and are not supported until included in a release; publishing an official list does not
  update an installed extension. Future updates are not guaranteed (an EB-05 update is planned;
  there is no fixed update schedule). Cards from sets not yet supported (for example pre-release
  reveals in deck builders and simulators) usually show nothing, but can be mistaken for a
  different supported card of similar colors and layout.

## The model card

The model card has every figure, the comparisons written down before the test (frozen in the
maintainers' private records before any held-out frame was scored; not a public
pre-registration), and the caveats: https://huggingface.co/JuicyKaraageNo1/kenbunshoku-onepiece.
