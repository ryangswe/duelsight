// SPDX-License-Identifier: Apache-2.0
// The card details file: each card's type, attribute, level, ATK/DEF and text, for the tooltip's
// details panel. Card text is the rights holder's, like the art: it is never in this repository
// or in the extension's package. scripts/card-details.mjs builds the file outside the
// repository; the owner publishes it on the CDN beside the art (cardvision cdn), and the settings
// file names it (`details`, cdn/SETTINGS.md). The tooltip frame fetches it once and caches it
// (cache.ts).
//
// The file (schema version 1), minified:
//
//   { "schemaVersion": 1,
//     "cards": { "<card id>": [frame, text, type, attribute, level, atk, def, scale, link, arrows] } }
//
//   frame      the card's frame: "normal", "effect", "ritual", "fusion", "synchro", "xyz", "link",
//              "spell", "trap", or a monster frame ending in "_pendulum"
//   text       the card's text (lines separated by "\n")
//   type       the type line: "Dragon / Normal" for a monster, "Quick-Play Spell" for a spell
//   attribute  "DARK", "LIGHT", ...; null for a spell or a trap
//   level      the level (the rank for an Xyz monster); null for a Link monster, a spell, a trap
//   atk, def   numbers, -1 for "?"; def is null for a Link monster
//   scale      a Pendulum monster's scale
//   link       a Link monster's rating, with its `arrows` ("Top", "Bottom-Left", ...)
//
// Trailing nulls are left out. The card's name is not in it: the tooltip shows the release
// catalog's. A row of another shape is ignored (that card shows its picture alone).
//
// A localized file (for example `details-fr-<sha8>.json`, scripts/localized-details.mjs) has the
// same rows, with the type line, attribute and text in its language where an official one exists
// and English where not, plus three fields:
//
//   lang    its language, "fr"
//   names   { "<card id>": "<the card's name in that language>" }, for the cards that have one
//   labels  the stats line's words in that language: { "level": "Niveau", "rank": "Rang",
//           "link": "Lien", "scale": "Échelle Pendule", "atk": "ATK", "def": "DEF" }
//
// The tooltip shows that name, with the catalog's English name under it, and words its stats line
// with those labels (English for a label the file leaves out). Because the words come with the
// file, a new language needs no new extension version.

export interface CardDetails {
  frame: string;
  text: string;
  type: string;
  attribute: string | null;
  level: number | null;
  atk: number | null;
  def: number | null;
  scale: number | null;
  link: number | null;
  arrows: string[];
}

/** The parsed file: rows by card id, checked one at a time when a card is shown. */
export interface DetailsTable {
  readonly rows: Readonly<Record<string, unknown>>;
  /** A localized file's language ("fr"); null for the English file. */
  readonly lang: string | null;
  /** A localized file's card names by card id, checked one at a time; null for none. */
  readonly names: Readonly<Record<string, unknown>> | null;
  /** The stats line's words; English for the English file and for any word a file leaves out. */
  readonly labels: StatLabels;
}

/** The stats line's words. */
export interface StatLabels {
  readonly level: string;
  readonly rank: string;
  readonly link: string;
  readonly scale: string;
  readonly atk: string;
  readonly def: string;
}

export const ENGLISH_LABELS: StatLabels = { level: "Level", rank: "Rank", link: "Link", scale: "Scale", atk: "ATK", def: "DEF" };

/** A file's labels over the English ones, each a short string or left English. */
function parseLabels(raw: unknown): StatLabels {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return ENGLISH_LABELS;
  const given = raw as Record<string, unknown>;
  const out: Record<string, string> = { ...ENGLISH_LABELS };
  for (const key of Object.keys(ENGLISH_LABELS)) {
    const v = Object.hasOwn(given, key) ? given[key] : undefined;
    if (typeof v === "string" && v.trim().length > 0 && v.length <= 30) out[key] = v.trim();
  }
  return out as unknown as StatLabels;
}

export const DETAILS_SCHEMA_VERSION = 1;

/** The file's rows, or null when it is not a details file of this schema version. */
export function parseDetailsFile(raw: unknown): DetailsTable | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const file = raw as Record<string, unknown>;
  if (file.schemaVersion !== DETAILS_SCHEMA_VERSION) return null;
  const rows = file.cards;
  if (typeof rows !== "object" || rows === null || Array.isArray(rows)) return null;
  const lang = typeof file.lang === "string" && /^[a-z]{2,3}$/.test(file.lang) && file.lang !== "en" ? file.lang : null;
  const names = lang !== null && typeof file.names === "object" && file.names !== null && !Array.isArray(file.names) ? (file.names as Record<string, unknown>) : null;
  const labels = lang !== null ? parseLabels(file.labels) : ENGLISH_LABELS;
  return { rows: rows as Record<string, unknown>, lang, names, labels };
}

const ARROWS: Readonly<Record<string, string>> = {
  "Top-Left": "↖",
  Top: "↑",
  "Top-Right": "↗",
  Left: "←",
  Right: "→",
  "Bottom-Left": "↙",
  Bottom: "↓",
  "Bottom-Right": "↘",
};
const ARROW_ORDER = Object.keys(ARROWS);

const MAX_TEXT = 4000;
const isShortText = (v: unknown, max = 80): v is string => typeof v === "string" && v.length > 0 && v.length <= max;
const isStat = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= -1 && (v as number) <= 100_000;
const orNull = <T>(v: unknown, ok: (x: unknown) => x is T): T | null | undefined => (v === undefined || v === null ? null : ok(v) ? v : undefined);

/** The card's name in a localized file's language, or null (the English file, or no name for it). */
export function localName(table: DetailsTable | null, cardId: string): string | null {
  if (!table?.names || !Object.hasOwn(table.names, cardId)) return null;
  const name = table.names[cardId];
  return isShortText(name, 120) ? name : null;
}

/** One card's details, or null when the file has no usable row for it. */
export function detailsFor(table: DetailsTable | null, cardId: string): CardDetails | null {
  if (!table || !Object.hasOwn(table.rows, cardId)) return null;
  const row = table.rows[cardId];
  if (!Array.isArray(row) || row.length < 3 || row.length > 10) return null;
  const [frame, text, type, attribute, level, atk, def, scale, link, arrows] = row as unknown[];
  if (!isShortText(frame, 40) || typeof text !== "string" || text.length > MAX_TEXT || !isShortText(type)) return null;
  const fields = {
    attribute: orNull(attribute, (v): v is string => isShortText(v, 20)),
    level: orNull(level, isStat),
    atk: orNull(atk, isStat),
    def: orNull(def, isStat),
    scale: orNull(scale, isStat),
    link: orNull(link, isStat),
  };
  if (Object.values(fields).some((v) => v === undefined)) return null;
  let arrowList: string[] = [];
  if (arrows !== undefined && arrows !== null) {
    if (!Array.isArray(arrows) || arrows.length > 8 || !arrows.every((a) => typeof a === "string" && Object.hasOwn(ARROWS, a))) return null;
    arrowList = [...new Set(arrows as string[])].sort((a, b) => ARROW_ORDER.indexOf(a) - ARROW_ORDER.indexOf(b));
  }
  return { frame, text: text.replace(/\r\n?/g, "\n").trim(), type, ...(fields as Omit<CardDetails, "frame" | "text" | "type" | "arrows">), arrows: arrowList };
}

/** The panel's lines below the name: the type line, then (a monster) its attribute, level or rank
 *  or link rating and scale, then ATK and DEF (or the link arrows). Null for a line it has none of. */
export interface DetailLines {
  type: string;
  stats: string | null;
  power: string | null;
  text: string;
}

const stat = (v: number | null): string => (v === null ? "?" : v < 0 ? "?" : String(v));

export function detailLines(d: CardDetails, words: StatLabels = ENGLISH_LABELS): DetailLines {
  const monster = d.frame !== "spell" && d.frame !== "trap";
  const isLink = d.link !== null || d.frame === "link";
  const isXyz = d.frame.startsWith("xyz");
  const stats: string[] = [];
  if (monster) {
    if (d.attribute) stats.push(d.attribute);
    if (isLink && d.link !== null) stats.push(`${words.link} ${d.link}`);
    else if (d.level !== null) stats.push(`${isXyz ? words.rank : words.level} ${d.level}`);
    if (d.scale !== null) stats.push(`${words.scale} ${d.scale}`);
  }
  let power: string | null = null;
  if (monster && (d.atk !== null || d.def !== null || isLink)) {
    if (isLink) {
      const arrows = d.arrows.map((a) => ARROWS[a]).join(" ");
      power = `${words.atk} ${stat(d.atk)}` + (arrows ? `  ${arrows}` : "");
    } else power = `${words.atk} ${stat(d.atk)} / ${words.def} ${stat(d.def)}`;
  }
  return { type: d.type, stats: stats.length > 0 ? stats.join(" · ") : null, power, text: d.text };
}
