// SPDX-License-Identifier: Apache-2.0
// Build the card details file for the tooltip's details panel (src/details/details.ts has its
// format) from two inputs, into a folder OUTSIDE this repository:
//
//   node scripts/card-details.mjs --cards <YGOPRODeck cardinfo JSON> --catalog <release catalog.json> --out <folder>
//
// --cards    The card list as YGOPRODeck's cardinfo endpoint returned it ({ "data": [card, ...] }
//            or the list itself): id, type, frameType, desc, race, attribute, level, atk, def,
//            scale, linkval, linkmarkers, typeline and card_images (one id per artwork).
// --catalog  The catalog the extension ships: the release's catalog.json ({ "cards": [...] },
//            ids are passcodes or artwork ids).
// --out      Where to write: <out>/data/details-<first 8 hex digits of its SHA-256>.json.
//
// Card text and stats are the rights holder's, like the art: the file is never written inside
// this repository (the script refuses), committed or put in the extension's package. The owner
// publishes it on the CDN beside the art (cardvision cdn publish --data-file), and the settings file
// names it (`details`, cdn/SETTINGS.md); the script prints that entry.
//
// Each catalog card is matched to the card list by its id, or by an artwork id of a card (the
// catalog's extra artworks and printings). A catalog card with no match is left out: it shows its
// picture alone.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { gzipSync } from "node:zlib";

export const DETAILS_SCHEMA_VERSION = 1;

const SPELL_TRAP = new Set(["spell", "trap"]);
const num = (v) => (Number.isSafeInteger(v) ? v : null);

/** One card's row: [frame, text, type, attribute, level, atk, def, scale, link, arrows], trailing
 *  nulls left out. */
export function detailsRow(card) {
  const frame = typeof card.frameType === "string" && card.frameType ? card.frameType : null;
  const text = typeof card.desc === "string" ? card.desc.replace(/\r\n?/g, "\n").trim() : null;
  if (!frame || text === null) return null;
  const monster = !SPELL_TRAP.has(frame);
  let type;
  if (monster && Array.isArray(card.typeline) && card.typeline.length > 0 && card.typeline.every((t) => typeof t === "string" && t)) type = card.typeline.join(" / ");
  else type = typeof card.humanReadableCardType === "string" && card.humanReadableCardType ? card.humanReadableCardType : typeof card.type === "string" ? card.type : null;
  if (!type) return null;
  const isLink = monster && num(card.linkval) !== null;
  const row = [
    frame,
    text,
    type,
    monster && typeof card.attribute === "string" && card.attribute ? card.attribute : null,
    monster && !isLink ? num(card.level) : null,
    monster ? num(card.atk) : null,
    monster && !isLink ? num(card.def) : null,
    monster ? num(card.scale) : null,
    isLink ? num(card.linkval) : null,
    isLink && Array.isArray(card.linkmarkers) && card.linkmarkers.length > 0 ? card.linkmarkers.filter((m) => typeof m === "string") : null,
  ];
  while (row.length > 3 && row.at(-1) === null) row.pop();
  return row;
}

/** The details file for a catalog: { schemaVersion, cards: { id: row } } (keys in JSON's own
 *  order for an object: numeric ids ascending, so the same inputs give the same bytes). */
export function buildDetails(cardList, catalog) {
  const list = Array.isArray(cardList) ? cardList : cardList && Array.isArray(cardList.data) ? cardList.data : null;
  if (!list) throw new Error("--cards: expected { data: [...] } or a list of cards");
  if (!catalog || !Array.isArray(catalog.cards)) throw new Error("--catalog: expected { cards: [...] }");
  const byId = new Map();
  const byArtwork = new Map();
  for (const card of list) {
    if (!card || (typeof card.id !== "number" && typeof card.id !== "string")) continue;
    byId.set(String(card.id), card);
    for (const image of Array.isArray(card.card_images) ? card.card_images : []) {
      if (image && image.id !== undefined && !byArtwork.has(String(image.id))) byArtwork.set(String(image.id), card);
    }
  }
  const cards = {};
  const missing = [];
  for (const entry of catalog.cards) {
    const id = String(entry.id);
    const card = byId.get(id) ?? byArtwork.get(id);
    const row = card ? detailsRow(card) : null;
    if (row) cards[id] = row;
    else missing.push(id);
  }
  return { file: { schemaVersion: DETAILS_SCHEMA_VERSION, cards }, missing };
}

/** The file's bytes, its SHA-256 and its versioned path under the output folder. */
export function detailsBytes(file) {
  const bytes = Buffer.from(JSON.stringify(file), "utf-8");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return { bytes, sha256, path: `data/details-${sha256.slice(0, 8)}.json` };
}

/** Whether `out` is inside the repository at `root` (the script refuses to write there). */
export function insideRepository(out, root) {
  const real = (p) => {
    // The nearest existing ancestor, resolved (a folder that does not exist yet has none).
    let at = resolve(p);
    const rest = [];
    while (!existsSync(at)) {
      rest.unshift(at.slice(dirname(at).length + 1));
      const up = dirname(at);
      if (up === at) break;
      at = up;
    }
    return join(realpathSync(at), ...rest);
  };
  const rel = relative(real(root), real(out));
  return !(rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel));
}

async function main() {
  const { values } = parseArgs({ options: { cards: { type: "string" }, catalog: { type: "string" }, out: { type: "string" } } });
  if (!values.cards || !values.catalog || !values.out) {
    console.error("usage: node scripts/card-details.mjs --cards <cardinfo JSON> --catalog <release catalog.json> --out <folder outside the repository>");
    process.exit(2);
  }
  const root = fileURLToPath(new URL("..", import.meta.url));
  if (insideRepository(values.out, root)) {
    console.error(`--out ${values.out} is inside the repository: card text must never be written here. Choose a folder outside it.`);
    process.exit(2);
  }
  const { file, missing } = buildDetails(JSON.parse(readFileSync(values.cards, "utf-8")), JSON.parse(readFileSync(values.catalog, "utf-8")));
  const { bytes, sha256, path } = detailsBytes(file);
  const target = join(resolve(values.out), path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
  const count = Object.keys(file.cards).length;
  const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
  console.log(`${target}`);
  console.log(`  ${count} cards with details, ${missing.length} catalog cards without (shown with their picture alone)${missing.length ? `: ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? ", ..." : ""}` : ""}`);
  console.log(`  ${bytes.length} bytes (${kb(bytes.length)}), ${gzipSync(bytes, { level: 9 }).length} bytes gzipped (${kb(gzipSync(bytes, { level: 9 }).length)})`);
  console.log(`  sha256 ${sha256}`);
  console.log("The settings file's entry (cdn/config.json), once the file is published:");
  console.log(`  "details": ${JSON.stringify({ path, sha256 })}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
