// SPDX-License-Identifier: Apache-2.0
// The popup's "Card details" switch: whether the tooltip shows the card's details panel (its
// type, stats and text) beside its picture. On unless switched off. Off, the tooltip is the
// picture alone and the details file is not fetched.

import type { KeyValueStorage } from "../settings/store.js";

export const DETAILS_KEY = "details";

export async function readDetailsOn(storage: Pick<KeyValueStorage, "get">): Promise<boolean> {
  return (await storage.get(DETAILS_KEY))[DETAILS_KEY] !== false;
}
