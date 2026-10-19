# Provenance of the One Piece Card Game models (release B2.1)

| | |
| --- | --- |
| Release | B2.1, release document id `f80d5b56cd907f03`, game `one-piece-tcg`, 5489 cards in the bank, 5502 in the catalog |
| Changes | It differs from the evaluated release B2 (26a98a0f49a74545) in one catalog entry, OP09-051_p2 (its name, printing and facets corrected from an upstream metadata error), and so in `bank.identity-groups.json`, where that entry moves from the OP05-067 identity to the OP09-051 identity. The models, the bank vectors and the accept rule are byte-identical. |
| License | Apache-2.0 (LICENSE beside this file); NOTICE says what it does not cover |
| Trained by | the open-source cardvision project (toolkit release coming; see https://github.com/ryangswe/kenbunshoku#built-on-cardvision), with its own tools |
| Published at | https://huggingface.co/JuicyKaraageNo1/kenbunshoku-onepiece |

## Detector (`detector.onnx`)

- Starts from YOLOX-Nano pretrained on COCO by Megvii (`yolox_nano.pth`, YOLOX release
  0.1.1rc0; Apache-2.0 repository).
- Its class layers were replaced by two classes, card face and card back, and it was fine-tuned
  on frames of public One Piece Card Game videos labeled by the project, with synthetic
  composites made from official card art.

## Recognizer (`recognizer.onnx`)

- Starts from torchvision's MobileNetV3-Small ImageNet-1k weights.
- The classifier was replaced by a 128-value projection and the network trained on crops of
  official card art, synthetic composites and labeled frames of public videos.

## Bank (`bank.json`, `bank.identity-groups.json`) and catalog (`catalog.json`)

- The bank holds one vector per card: numerical embeddings computed by the recognizer from card
  art, not the source image files.
- `bank.identity-groups.json` says which catalog entries count as one card: a card and its other
  printings (the entries whose `printingOf` names it) are one identity; cards that only share a
  name are different cards. All DON!! card variants are one identity.
- The catalog lists card ids, names and set facts, and the file name of each card's art.

## Not included

No card art, no video frames, no labels. The card art and the videos belong to their owners.
