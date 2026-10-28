// SPDX-License-Identifier: Apache-2.0
// The reel sits on the owner's track as it is (paulyudin "Epic", 31.4 s, used whole, no cuts):
// 86.13 BPM, beats at 0.21 + k * 0.6966 s. Hits: 5.09 (the first card), 10.58 (the full section
// enters), 25.02 (the stop: the end card), 27.24 (the final hit). Each segment is one continuous
// take of the real extension on YouTube; its hovers happen in real time (scripts/hover-times.json).
import HT from "../scripts/hover-times.json";

export const FPS = 30;
export const s2f = (s: number) => Math.round(s * FPS);
export const BEAT = 0.6966 * FPS;

export const T = {
  click: s2f(HT.hero.click_reel_s!),
  reveal: s2f(5.09),
  db: s2f(13.45),
  paper: s2f(20.41),
  end: s2f(25.02),
  finalHit: s2f(27.24),
};
export const TOTAL = s2f(31.0);

export type Hover = { card: string; shown_reel_s: number; art_reel_s: number; hide_reel_s: number | null; box: number[]; at: number[] };
export type Segment = { id: "hero" | "seg-db" | "seg-paper"; from: number; to: number; tag: string; hovers: Hover[]; crop: number[] };

export const SEGMENTS: Segment[] = [
  { id: "hero", from: 0, to: T.db, tag: "Master Duel", hovers: HT.hero.hovers as Hover[], crop: HT.hero.crop },
  { id: "seg-db", from: T.db, to: T.paper, tag: "Dueling Book", hovers: HT["seg-db"].hovers as Hover[], crop: HT["seg-db"].crop },
  { id: "seg-paper", from: T.paper, to: T.end, tag: "Paper", hovers: HT["seg-paper"].hovers as Hover[], crop: HT["seg-paper"].crop },
];

export type Caption = { from: number; to: number; text: string; tallText?: string };

export const CAPTIONS: Caption[] = [
  { from: s2f(0.4), to: T.click - 14, text: "Can’t read that card?" },
  { from: T.click - 14, to: T.reveal - 4, text: "Click DuelSight once." },
  { from: T.reveal, to: s2f(8.6), text: "Hover a card in the video." },
  { from: s2f(8.6), to: T.db - 3, text: "See the card and its text." },
  { from: T.db + 3, to: T.paper - 3, text: "Master Duel, Dueling Book and paper tables.", tallText: "Master Duel, Dueling Book\nand paper tables." },
  { from: T.paper + 3, to: T.end - 3, text: "On YouTube and Twitch." },
];
