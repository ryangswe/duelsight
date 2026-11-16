// SPDX-License-Identifier: Apache-2.0
// The popup's "Keep the card I'm pointing at" switch: whether a shown card stays while the pointer
// stays where the card was seen, even after a player moves it or lays another card on top (the
// toolkit's reading hold, which the shared hover host's compute frame picks from it). On unless switched off (owner, 2026-11-12: "Yes, in
// 0.8.0 now"). Off, the shown card follows what is at the pointer, held only through short gaps
// (the toolkit's SHOWN_HOLD), as before 0.8.0.

import type { KeyValueStorage } from "../settings/store.js";

export const KEEP_CARD_KEY = "keepCard";

export async function readKeepCardOn(storage: Pick<KeyValueStorage, "get">): Promise<boolean> {
  return (await storage.get(KEEP_CARD_KEY))[KEEP_CARD_KEY] !== false;
}

