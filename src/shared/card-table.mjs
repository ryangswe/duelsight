// SPDX-License-Identifier: Apache-2.0
// The tooltip's card table, from a release catalog: one rule, used in two places.
//
//   - The build writes it into dist/data/cards.json from the bundled release's catalog
//     (scripts/build.mjs): the table for bundled and fallback pages.
//   - The compute frame builds it from the catalog of a remote release it is about to load
//     (src/compute/remote-load.ts), so that a card new in that release shows its facts.
//
//   { "<card id>": [name, set, art path or null] } (with `printed`, the card's printed number as a
//   fourth value: the "catalog" printed-number rule)
//
// Plain JavaScript so that the build (Node, no compile step) and the bundles share this one file;
// card-table.d.mts gives it types. Names come from our own catalog only; no third-party card
// source is read at build or run time.

/** The card table for a catalog. A catalog that is not an object with a list of cards gives {}. */
export function buildCardTable(catalog, { printed = false } = {}) {
  const table = Object.create(null);
  const cards = catalog && Array.isArray(catalog.cards) ? catalog.cards : [];
  for (const card of cards) {
    if (!card || typeof card.id !== "string" || typeof card.name !== "string") continue;
    const set = card.facets && typeof card.facets.set === "string" ? card.facets.set : null;
    const row = [card.name, set, typeof card.art === "string" ? card.art : null];
    if (printed) row.push(typeof card.printed === "string" && card.printed ? card.printed : null);
    table[card.id] = row;
  }
  return table;
}
