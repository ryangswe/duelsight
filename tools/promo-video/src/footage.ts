// SPDX-License-Identifier: Apache-2.0
// Shot metadata written by scripts/build-footage.py (crop size, per-frame pointer in crop pixels).
import hero from "../public/footage/hero.json";
import db from "../public/footage/seg-db.json";
import paper from "../public/footage/seg-paper.json";

export type ShotMeta = { id: string; w: number; h: number; frames: number; land: number; tag?: string | null; card?: string | null; pointer: number[][] };

export const SHOT_META: Record<string, ShotMeta> = Object.fromEntries([hero, db, paper].map((m) => [m.id, m as ShotMeta]));
