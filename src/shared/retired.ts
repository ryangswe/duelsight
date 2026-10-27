// SPDX-License-Identifier: Apache-2.0
// Stored entries of features that are gone, removed when the extension is installed or updated.
//
//   channel:<key>       the channels card hovers were turned on for, and
//   button.introSeen    whether the in-player button's first-view label was seen:
//                       both went with the in-player button (owner, 2026-10-27). Card hovers
//                       are on for every video; the popup's switch is the only control.

/** The part of chrome.storage.local used here. */
export interface RetiredStorage {
  get(keys: null): Promise<Record<string, unknown>>;
  remove(keys: string[]): Promise<void>;
}

export const RETIRED_PREFIXES: readonly string[] = ["channel:"];
export const RETIRED_KEYS: readonly string[] = ["button.introSeen"];

export function isRetired(key: string): boolean {
  return RETIRED_KEYS.includes(key) || RETIRED_PREFIXES.some((p) => key.startsWith(p));
}

/** Remove every retired entry; returns how many there were. */
export async function removeRetired(storage: RetiredStorage): Promise<number> {
  const keys = Object.keys(await storage.get(null)).filter(isRetired);
  if (keys.length > 0) await storage.remove(keys);
  return keys.length;
}
