# Provenance of the Yu-Gi-Oh! models (release T2)

| | |
| --- | --- |
| Release | T2, release document id `0927859c6f18302f`, game `yugioh`, 14,636 entries in the bank, 14,639 in the catalog |
| Status | Measured on a held-out test before release (docs/accuracy.md). Replaces the early preview release T (`6666477f410559ac`). |
| License | Apache-2.0 (LICENSE beside this file); NOTICE says what it does not cover |
| Trained by | the DuelSight project, with the open-source cardvision toolkit 0.2.0rc4 (https://github.com/ryangswe/riftsight-vision) |
| Published at | inside this extension package |

## Detector (`detector.onnx`)

- Starts from the detector of the Kenbunshoku One Piece Card Game release B2.1
  (https://huggingface.co/JuicyKaraageNo1/kenbunshoku-onepiece), itself fine-tuned from
  YOLOX-Nano pretrained on COCO by Megvii (Apache-2.0 repository).
- Two classes, card face and card back. Fine-tuned in two rounds on frames of public Yu-Gi-Oh! videos (Master
  Duel, Dueling Book and paper tables) labeled by the project, synthetic composites made from
  official card art, and card-free table scans as negatives.

## Recognizer (`recognizer.onnx`)

- Starts from the Kenbunshoku release B2.1 recognizer (MobileNetV3-Small, from torchvision's
  ImageNet-1k weights), with a 128-value projection.
- Trained in three rounds on crops of official card art, synthetic composites and labeled frames of
  public videos.

## Bank (`bank.json`, `identity-groups.json`) and catalog (`catalog.json`)

- The bank holds one vector per entry: numerical embeddings computed by the recognizer from card
  pictures, not the picture files. The pictures are the card images listed by YGOPRODeck; for 86
  Master Duel alternate artworks (82 cards), the vectors were computed from a card picture with
  the alternate artwork from Yugipedia placed over the card's own art.
- `identity-groups.json` says which catalog entries count as one card: a card and its other
  printings and artworks (the entries whose `printingOf` names it) are one identity.
- The catalog lists card ids, names, kinds and set facts, and the file name of each card's
  picture. It holds no card text.

## Not included

No card art, no video frames, no labels. The card art and the videos belong to their owners.
