// SPDX-License-Identifier: Apache-2.0
// The popup's "Card language": which language the card details show in. "auto" (the default)
// follows the browser's languages; a language code ("en", "fr", ...) picks that language when the
// settings file offers it (src/details/language.ts). It is kept in chrome.storage.local. A choice
// the settings stop offering is kept, and the details follow the browser until it is offered again.

import type { KeyValueStorage } from "../settings/store.js";

export const CARD_LANGUAGE_KEY = "cardLanguage";
export const AUTOMATIC = "auto";

/** A language code as the settings file's `details<Lang>` keys give it, lowercase. */
const CODE = /^[a-z]{2,3}$/;

/** A stored value as a choice: a language code, or "auto" for anything else. */
export function parseCardLanguage(value: unknown): string {
  return typeof value === "string" && CODE.test(value) ? value : AUTOMATIC;
}

/** The stored choice ("auto" when nothing usable is stored). */
export async function readCardLanguage(storage: Pick<KeyValueStorage, "get">): Promise<string> {
  return parseCardLanguage((await storage.get(CARD_LANGUAGE_KEY))[CARD_LANGUAGE_KEY]);
}
