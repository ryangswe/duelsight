// SPDX-License-Identifier: Apache-2.0
// Templates of the settings file (SETTINGS.md, "Templates"): an absolute https:// URL with
// placeholders, substituted per card.
//
//   {art}         the catalog entry's art path, each `/`-separated segment percent-encoded
//   {file}        the last segment of {art}, percent-encoded
//   {cardId}      the catalog card id, percent-encoded
//   {printedId}   the number printed on the card (`printedId`, by the config's printedNumber
//                 rule), percent-encoded; unavailable for a card whose id the rule does not match,
//                 so a template that needs it is skipped
//
// A placeholder the card cannot fill (no art; no printed number) makes the source
// unusable for that card: `expandTemplate` returns null and the caller tries the next source.

import { CONFIG, type PrintedNumberRule } from "../config.js";

export const PLACEHOLDERS = ["art", "file", "cardId", "printedId"] as const;
export type Placeholder = (typeof PLACEHOLDERS)[number];

/** What a card offers the templates. */
export interface CardRef {
  id: string;
  /** The catalog's art path, e.g. `89631139.jpg`; null for a card without art. */
  art: string | null;
  /** The catalog's `printed` number, when the config's rule is "catalog". */
  printed?: string | null;
}

/** Percent-encode one value: everything but unreserved characters (A-Z a-z 0-9 - . _ ~). */
export function encodeValue(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** Percent-encode a path, segment by segment, keeping its slashes. */
export function encodePath(path: string): string {
  return path.split("/").map(encodeValue).join("/");
}

/**
 * The rule that finds the number printed on a card (duelsight.config.json `printedNumber`):
 *   { regex }   the first capture group of the regex, matched on the card id (no match: none);
 *   "catalog"   the catalog card's own `printed` field (absent: none);
 *   "none"      no card has one.
 * DuelSight's regex is the passcode rule: card ids are YGOPRODeck passcodes, 1 to 8 digits, and
 * the whole id is the number (`89631139` → `89631139`, `token_1` → none). One name's other
 * artworks are one identity in the release's groups, not another id shape.
 */
export function makePrintedId(rule: PrintedNumberRule): (cardId: string, printed?: string | null) => string | null {
  if (rule === "none") return () => null;
  if (rule === "catalog") return (_id, printed) => (typeof printed === "string" && printed.length > 0 ? printed : null);
  const re = new RegExp(rule.regex);
  return (cardId) => re.exec(cardId)?.[1] ?? null;
}

/** The number printed on a card under the build's rule, or null for a card with none. */
export const printedId = makePrintedId(CONFIG.printedNumber);

/** Why a template cannot be used at all, or null. */
export function templateProblem(template: string): string | null {
  let url: URL;
  try {
    url = new URL(template.replace(/\{[A-Za-z]+\}/g, "x"));
  } catch {
    return "not an absolute address";
  }
  if (url.protocol !== "https:" || !template.startsWith("https://")) return "not https://";
  const names = [...template.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1] ?? "");
  const unknown = names.find((name) => !(PLACEHOLDERS as readonly string[]).includes(name));
  if (unknown !== undefined) return `unknown placeholder {${unknown}}`;
  const rest = template.replace(/\{[^{}]*\}/g, "");
  if (rest.includes("{") || rest.includes("}")) return "unbalanced braces";
  return null;
}

/** The value of each placeholder for a card and a source; a missing key is unavailable. */
export function placeholderValues(card: CardRef): Partial<Record<Placeholder, string>> {
  const values: Partial<Record<Placeholder, string>> = { cardId: encodeValue(card.id) };
  const printed = printedId(card.id, card.printed);
  if (printed !== null) values.printedId = encodeValue(printed);
  if (card.art) {
    values.art = encodePath(card.art);
    values.file = encodeValue(card.art.split("/").pop() ?? card.art);
  }
  return values;
}

/**
 * Fill in a template for a card. Null when the template needs a placeholder the card cannot fill
 * for this source, or when the template is not usable at all.
 */
export function expandTemplate(template: string, card: CardRef): string | null {
  if (templateProblem(template)) return null;
  const values = placeholderValues(card);
  let missing = false;
  const url = template.replace(/\{([A-Za-z]+)\}/g, (_, name: string) => {
    const value = values[name as Placeholder];
    if (value === undefined) missing = true;
    return value ?? "";
  });
  return missing ? null : url;
}
