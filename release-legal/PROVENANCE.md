# Provenance of the Yu-Gi-Oh! models (release T2)

| | |
| --- | --- |
| Release | T2 + cards to 2026-11-10, release document id `862aec0f937da326`: release `f3ed25290dde66e9` (T2 with the card updates to 2026-11-10, below) converted with `cardvision convert-release` (toolkit 0.11.0) to a binary bank and a compact catalog. The models, the vectors and the catalog's values are unchanged, so it scores exactly as `f3ed25290dde66e9`. Game `yugioh`, 14,636 entries in the bank, 14,639 in the catalog |
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

## Bank (`bank.bin`, `identity-groups.json`) and catalog (`catalog.json`)

- The bank (`bank.bin`, the binary form of the JSON bank: a JSON header, then the fp16 vectors) holds one vector per entry: numerical embeddings computed by the recognizer from card
  pictures, not the picture files. The pictures are the card images listed by YGOPRODeck; for 86
  Master Duel alternate artworks (82 cards), the vectors were computed from a card picture with
  the alternate artwork from Yugipedia placed over the card's own art.
- `identity-groups.json` says which catalog entries count as one card: a card and its other
  printings and artworks (the entries whose `printingOf` names it) are one identity.
- The catalog lists card ids, names, kinds and set facts, and the file name of each card's
  picture. It holds no card text.

## Not included

No card art, no video frames, no labels. The card art and the videos belong to their owners.

## 2026-11-10 (release f3ed25290dde66e9)

Cards added: 0. Card names updated: 15, to the official English names in YGOPRODeck's card list pulled on 2026-11-10 (11 announced for the TCG, 4 released in Master Duel). Detector, recognizer, accept rule and every bank row are unchanged.
