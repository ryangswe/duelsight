// SPDX-License-Identifier: Apache-2.0
// The card data the build writes into dist/data/ (see src/tooltip/card-data.ts):
//
//   cards.json         { "<card id>": [name, set, art path or null] } from the release's catalog
//
// Names come from our own catalog only; no third-party card source is read at build or run time.

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
