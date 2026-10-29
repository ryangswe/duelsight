// SPDX-License-Identifier: Apache-2.0
// Which card details file the tooltip uses: the one in the browser's language when the settings
// file names one, else the English one. There is no setting; the browser's language decides.
//
// The rule, shared with Kenbunshoku: the first of the browser's preferred languages, its base
// subtag only ("fr-CA" → "fr"). A language DuelSight has no file for shows English. Chrome and
// Firefox give the same list (navigator.languages).

import type { DetailsSource, Settings } from "../settings/schema.js";

/** The browser's display language: the base subtag of its first preferred language, lowercase. */
export function browserLanguage(languages: readonly string[]): string {
  const first = languages.find((l) => typeof l === "string" && l.length > 0) ?? "";
  return (first.split(/[-_]/)[0] ?? "").toLowerCase();
}

/** The details file to load, and its language; null when the settings name no details file. The
 *  English file must be named too: without it the maintainer has taken the details down. */
export function chooseDetails(settings: Pick<Settings, "details" | "detailsFr">, languages: readonly string[]): { source: DetailsSource; lang: string } | null {
  if (!settings.details) return null;
  if (browserLanguage(languages) === "fr" && settings.detailsFr) return { source: settings.detailsFr, lang: "fr" };
  return { source: settings.details, lang: "en" };
}
