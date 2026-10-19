// SPDX-License-Identifier: Apache-2.0
// The card data the build writes into dist/data/ (see src/tooltip/card-data.ts):
//
//   cards.json         { "<card id>": [name, set, art path or null] } from the release's catalog
//   source-files.json  { "optcgapi": { "<card id>": "<file name on optcgapi.com>" } }
//
// The `{sourceFile}` map is built from the card mirror's image index. A card is mapped only
// when the mirror holds the very picture the catalog names (`file` equals the catalog's `art`),
// that picture is not a placeholder, and it was fetched from optcgapi's card image folder: its
// file name there is the last segment of that address. Nothing else is guessed; a card that
// is not mapped skips that fallback.

export const OPTCGAPI_PREFIX = "https://optcgapi.com/media/static/Card_Images/";

/** The tooltip's card table. With `printed`, each card's `printed` field (the "catalog"
 *  printed-number rule) comes along as a fourth value. */
export function buildCardTable(catalog, { printed = false } = {}) {
  const table = {};
  for (const card of catalog.cards) {
    const set = card.facets && typeof card.facets.set === "string" ? card.facets.set : null;
    const row = [card.name, set, card.art ?? null];
    if (printed) row.push(typeof card.printed === "string" && card.printed ? card.printed : null);
    table[card.id] = row;
  }
  return table;
}

export function buildSourceFileMaps(catalog, index) {
  const byFile = new Map();
  for (const entry of index) if (typeof entry.file === "string") byFile.set(entry.file, entry);
  const optcgapi = {};
  let unmapped = 0;
  for (const card of catalog.cards) {
    const entry = card.art ? byFile.get(card.art) : undefined;
    const url = entry && typeof entry.url === "string" ? entry.url : "";
    const usable = entry && entry.is_placeholder !== true && entry.actual_format !== "SVG" && url.startsWith(OPTCGAPI_PREFIX);
    const tail = usable ? url.slice(OPTCGAPI_PREFIX.length).split(/[?#]/)[0] : "";
    if (!tail || tail.includes("/")) {
      unmapped += 1;
      continue;
    }
    optcgapi[card.id] = decodeURIComponent(tail);
  }
  return { maps: { optcgapi }, unmapped };
}

/** The maps with their keys sorted, so a regenerated file differs only where the data does. */
export function sortedMaps(maps) {
  const out = {};
  for (const source of Object.keys(maps).sort()) {
    out[source] = {};
    for (const id of Object.keys(maps[source]).sort()) out[source][id] = maps[source][id];
  }
  return out;
}
