// SPDX-License-Identifier: Apache-2.0
// Which card details file the tooltip uses: the one in the language chosen in the popup
// (shared/card-language.ts) when the settings file names one (`detailsFr`, `detailsDe`, ...);
// on "Automatic", the browser's. A new language needs only its file and its settings entry.
//
// Automatic: the browser's preferred languages in order, base subtag only ("fr-CA" → "fr"); the
// first that is English or has a file wins, and English when none does. So ["ja", "fr"] gives
// French, and ["en-US", "fr"] English. Chrome and Firefox give the same list (navigator.languages).
// A chosen language the settings no longer offer is treated as Automatic.

import type { DetailsSource, Settings } from "../settings/schema.js";
import { AUTOMATIC } from "../shared/card-language.js";

/** A language tag's base subtag, lowercase ("fr-CA" → "fr"). */
const baseOf = (tag: string): string => (tag.split(/[-_]/)[0] ?? "").toLowerCase();

/** The language Automatic picks: the first of the browser's languages that is English or offered,
 *  else English. */
export function automaticLanguage(languages: readonly string[], offered: Readonly<Record<string, unknown>>): string {
  for (const tag of languages) {
    if (typeof tag !== "string" || tag.length === 0) continue;
    const base = baseOf(tag);
    if (base === "en" || (base.length > 0 && Object.hasOwn(offered, base))) return base;
  }
  return "en";
}

/** The language the details show in: the choice when it is English or offered, else Automatic's. */
export function detailsLanguage(settings: Pick<Settings, "localDetails">, languages: readonly string[], choice: string = AUTOMATIC): string {
  if (choice === "en" || (choice !== AUTOMATIC && Object.hasOwn(settings.localDetails, choice))) return choice;
  return automaticLanguage(languages, settings.localDetails);
}

/** The details file to load, and its language; null when the settings name no details file. The
 *  English file must be named too: without it the maintainer has taken the details down. */
export function chooseDetails(settings: Pick<Settings, "details" | "localDetails">, languages: readonly string[], choice: string = AUTOMATIC): { source: DetailsSource; lang: string } | null {
  if (!settings.details) return null;
  const lang = detailsLanguage(settings, languages, choice);
  const local = lang !== "en" && Object.hasOwn(settings.localDetails, lang) ? settings.localDetails[lang] : undefined;
  return local ? { source: local, lang } : { source: settings.details, lang: "en" };
}
