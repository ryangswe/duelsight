// SPDX-License-Identifier: Apache-2.0
// The popup's card-size dial: how large the tooltip's card picture is asked to be, from 70 % to
// 130 % of its own size in steps of 10 %, and 100 % unless the viewer moved it. It is kept in
// chrome.storage.local as a whole percentage. The content script scales the picture's size by it
// before fitting the tooltip into the page, so a larger card still stays inside the window and
// off the card it names.

import type { KeyValueStorage } from "../settings/store.js";

export const CARD_SIZE_KEY = "cardSize";
export const MIN_CARD_SIZE = 70;
export const MAX_CARD_SIZE = 130;
export const CARD_SIZE_STEP = 10;
export const DEFAULT_CARD_SIZE = 100;

/** A stored value as a percentage the dial can show: anything but a finite number is the
 *  default; a number is rounded to the nearest step and brought inside the range. */
export function clampCardSize(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_CARD_SIZE;
  const stepped = Math.round(value / CARD_SIZE_STEP) * CARD_SIZE_STEP;
  return Math.min(MAX_CARD_SIZE, Math.max(MIN_CARD_SIZE, stepped));
}

/** The stored card size, as a percentage (the default when nothing usable is stored). */
export async function readCardSize(storage: Pick<KeyValueStorage, "get">): Promise<number> {
  return clampCardSize((await storage.get(CARD_SIZE_KEY))[CARD_SIZE_KEY]);
}

/** The dial's label for a percentage, e.g. "110%". */
export function describeCardSize(percent: number): string {
  return `${clampCardSize(percent)}%`;
}
