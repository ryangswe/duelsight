// SPDX-License-Identifier: Apache-2.0
// Build the card details file in another language (French) for the tooltip's details panel, from
// the English details file, into a folder OUTSIDE this repository:
//
//   node scripts/localized-details.mjs --lang fr --details <English details-<sha8>.json> \
//     --yugipedia <folder from scripts/yugipedia-fetch.mjs> --ygoprodeck <cardinfo JSON, language=fr> \
//     --catalog <release catalog.json> --out <folder>
//
// It writes <out>/data/details-fr-<first 8 hex digits of its SHA-256>.json: the English file's
// rows (same cards, same frame and stats) with, for each card:
//   - the type line and attribute in Konami's French words (scripts/localized-terms.mjs); a part
//     the table lacks leaves that card's type line in English;
//   - the text: Yugipedia's French (official printed text), else YGOPRODeck's French when it has
//     no English in it, else the English text;
//   - the name, in `names`: Yugipedia's French name, else YGOPRODeck's, else none (the tooltip
//     shows the English name).
// Only official texts are used: both sources record printed (or Konami database) text, and a card
// with no official French has none in either, so it stays English. Never a fan translation.
//
// Yugipedia's text is CC BY-SA 4.0: the file says so in `attribution` and is offered under that
// license; the credit is also in README.md and the privacy page. Card names and texts are the
// rights holder's, like the art: the file is never written inside this repository (the script
// refuses), committed or put in the extension's package.

import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { gzipSync } from "node:zlib";

import { insideRepository } from "./card-details.mjs";
import { TERMS } from "./localized-terms.mjs";

/** The panel accepts at most this much text (src/details/details.ts MAX_TEXT). */
const MAX_TEXT = 4000;

export const ATTRIBUTION = {
  fr: "French card names and texts: Yugipedia (https://yugipedia.com), CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/), with wiki markup removed; a few from YGOPRODeck (https://ygoprodeck.com). Type lines and attributes worded with Konami's terms. This file is offered under CC BY-SA 4.0. Yu-Gi-Oh! card names and texts belong to Konami.",
};

/** Phrases that only English card text has: a "French" row with one of them is not French. */
const ENGLISH = /\b(You can|your opponent|this card|Special Summon|Monster Effect|Pendulum Effect|from your|to your hand|cannot be)\b/;

const ENTITIES = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };

/** Yugipedia's wiki markup to plain text: links to their label, no italics or bold, line breaks
 *  as new lines, "●" bullets as Konami prints them. Null when markup is left that it cannot read. */
export function wikiToText(value) {
  if (typeof value !== "string") return null;
  let s = value
    .replace(/\[\[(?:[^\]|]*\|)?([^\]|]*)\]\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, e) => ENTITIES[e])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/●[ \t]+/g, "●");
  if (/\[\[|\]\]|\{\{|\}\}|<\/?[a-z][^>]*>/i.test(s)) return null;
  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s.length > 0 ? s : null;
}

/** One card's type line in the language's words, or null when a part is not in the table. */
export function localType(row, terms) {
  const [frame, , type] = row;
  if (frame === "spell" || frame === "trap") return terms.spellTrap[type] ?? null;
  const parts = type.split(" / ").map((p) => terms.monsterParts[p]);
  return parts.every((p) => typeof p === "string") ? parts.join(" / ") : null;
}

/** Yugipedia's cards from the fetched pages: password → { name, lore, pendulum } (raw markup). */
export function readYugipedia(folder, terms) {
  const cards = new Map();
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/^page-\d+\.json$/.test(name)) files.push(path);
    }
  };
  walk(folder);
  for (const file of files) cardsFromAsk(JSON.parse(readFileSync(file, "utf-8")), terms, cards);
  return { cards, pages: files.length };
}

/** Add one ask-API answer's cards to `cards` (the first page for a password wins). */
export function cardsFromAsk(answer, terms, cards = new Map()) {
  const results = answer?.query?.results;
  if (!results || typeof results !== "object" || Array.isArray(results)) return cards;
  const p = terms.yugipedia;
  for (const value of Object.values(results)) {
    const out = value?.printouts ?? {};
    for (const password of out.Password ?? []) {
      if (typeof password !== "string" || !/^\d{1,9}$/.test(password)) continue;
      const id = String(Number(password));
      if (!cards.has(id)) cards.set(id, { name: out[p.name]?.[0] ?? null, lore: out[p.lore]?.[0] ?? null, pendulum: out[p.pendulum]?.[0] ?? null });
    }
  }
  return cards;
}

/** A Pendulum card's two texts under the language's headings, as the English file sets them. */
function pendulumText(pendulum, monster, terms) {
  return `[ ${terms.headings.pendulum} ]\n${pendulum}\n\n[ ${terms.headings.monster} ]\n${monster}`;
}

/** The card's text from Yugipedia, or null. */
function yugipediaText(entry, englishText, terms) {
  const lore = wikiToText(entry?.lore);
  if (!lore) return null;
  const pendulum = wikiToText(entry.pendulum);
  if (/\[ Pendulum Effect \]/.test(englishText)) return pendulum ? pendulumText(pendulum, lore, terms) : null;
  return pendulum ? pendulumText(pendulum, lore, terms) : lore;
}

/** The card's text from YGOPRODeck's French list, or null when it has English in it. */
function ygoprodeckText(card, terms) {
  if (!card || typeof card.desc !== "string") return null;
  const text = card.desc
    .replace(/\r\n?/g, "\n")
    .replace(/\[ Pendulum Effect \]/g, `[ ${terms.headings.pendulum} ]`)
    .replace(/\[ Monster Effect \]/g, `[ ${terms.headings.monster} ]`)
    .replace(/'{2,}/g, "")
    .trim();
  return text && !ENGLISH.test(text) ? text : null;
}

/** The localized file and a report of where each part came from. */
export function buildLocalized({ lang, english, yugipedia, ygoprodeck, catalog }) {
  const terms = TERMS[lang];
  if (!terms) throw new Error(`no terms for language ${lang}`);
  if (!english || english.schemaVersion !== 1 || typeof english.cards !== "object") throw new Error("--details: expected an English details file (schemaVersion 1)");
  const list = Array.isArray(ygoprodeck) ? ygoprodeck : Array.isArray(ygoprodeck?.data) ? ygoprodeck.data : [];
  const ygo = new Map();
  for (const card of list) {
    if (!card || card.id === undefined) continue;
    if (!ygo.has(String(card.id))) ygo.set(String(card.id), card);
    for (const image of Array.isArray(card.card_images) ? card.card_images : []) if (image?.id !== undefined && !ygo.has(String(image.id))) ygo.set(String(image.id), card);
  }
  const base = new Map();
  for (const entry of catalog?.cards ?? []) if (entry?.printingOf) base.set(String(entry.id), String(entry.printingOf));
  const report = { text: { yugipedia: 0, ygoprodeck: 0, english: 0 }, name: { yugipedia: 0, ygoprodeck: 0, none: 0 }, type: { local: 0, english: 0 }, unknownParts: new Set(), englishText: [] };
  const cards = {};
  const names = {};
  for (const [id, row] of Object.entries(english.cards)) {
    if (!Array.isArray(row) || row.length < 3) continue;
    const ids = [id, base.get(id)].filter(Boolean);
    const yp = ids.map((i) => yugipedia.get(i)).find(Boolean) ?? null;
    const yg = ids.map((i) => ygo.get(i)).find(Boolean) ?? null;
    const out = [...row];
    const type = localType(row, terms);
    if (type) {
      out[2] = type;
      report.type.local += 1;
    } else {
      report.type.english += 1;
      if (row[0] !== "spell" && row[0] !== "trap") for (const part of String(row[2]).split(" / ")) if (!terms.monsterParts[part]) report.unknownParts.add(part);
    }
    if (typeof row[3] === "string" && terms.attributes[row[3]]) out[3] = terms.attributes[row[3]];
    let text = yugipediaText(yp, row[1], terms);
    let from = "yugipedia";
    if (!text || text.length > MAX_TEXT) {
      text = ygoprodeckText(yg, terms);
      from = "ygoprodeck";
    }
    if (!text || text.length > MAX_TEXT) {
      text = row[1];
      from = "english";
      report.englishText.push(id);
    }
    out[1] = text;
    report.text[from] += 1;
    const ypName = wikiToText(yp?.name);
    const ygName = typeof yg?.name === "string" && yg.name.trim() ? yg.name.trim() : null;
    const name = ypName && ypName.length <= 120 ? ypName : ygName && ygName.length <= 120 ? ygName : null;
    if (name) names[id] = name;
    report.name[ypName && ypName.length <= 120 ? "yugipedia" : ygName ? "ygoprodeck" : "none"] += 1;
    cards[id] = out;
  }
  return { file: { schemaVersion: 1, lang, attribution: ATTRIBUTION[lang], names, cards }, report };
}

/** The file's bytes, its SHA-256 and its versioned path under the output folder. */
export function localizedBytes(file) {
  const bytes = Buffer.from(JSON.stringify(file), "utf-8");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return { bytes, sha256, path: `data/details-${file.lang}-${sha256.slice(0, 8)}.json` };
}

async function main() {
  const { values } = parseArgs({
    options: { lang: { type: "string" }, details: { type: "string" }, yugipedia: { type: "string" }, ygoprodeck: { type: "string" }, catalog: { type: "string" }, out: { type: "string" } },
  });
  if (!values.lang || !values.details || !values.yugipedia || !values.ygoprodeck || !values.catalog || !values.out) {
    console.error("usage: node scripts/localized-details.mjs --lang fr --details <English details file> --yugipedia <fetched folder> --ygoprodeck <cardinfo JSON for that language> --catalog <release catalog.json> --out <folder outside the repository>");
    process.exit(2);
  }
  const root = fileURLToPath(new URL("..", import.meta.url));
  if (insideRepository(values.out, root)) {
    console.error(`--out ${values.out} is inside the repository: card text must never be written here. Choose a folder outside it.`);
    process.exit(2);
  }
  const terms = TERMS[values.lang];
  if (!terms) {
    console.error(`--lang ${values.lang}: no terms for it in scripts/localized-terms.mjs`);
    process.exit(2);
  }
  const { cards: yugipedia, pages } = readYugipedia(values.yugipedia, terms);
  const read = (p) => JSON.parse(readFileSync(p, "utf-8"));
  const { file, report } = buildLocalized({ lang: values.lang, english: read(values.details), yugipedia, ygoprodeck: read(values.ygoprodeck), catalog: read(values.catalog) });
  const { bytes, sha256, path } = localizedBytes(file);
  const target = join(resolve(values.out), path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
  const total = Object.keys(file.cards).length;
  const pct = (n) => `${n} (${((100 * n) / total).toFixed(1)} %)`;
  const gz = gzipSync(bytes, { level: 9 }).length;
  console.log(target);
  console.log(`  ${total} cards; Yugipedia: ${yugipedia.size} cards from ${pages} pages`);
  console.log(`  text: Yugipedia ${pct(report.text.yugipedia)}, YGOPRODeck ${pct(report.text.ygoprodeck)}, English ${pct(report.text.english)}`);
  console.log(`  name: Yugipedia ${pct(report.name.yugipedia)}, YGOPRODeck ${pct(report.name.ygoprodeck)}, English ${pct(report.name.none)}`);
  console.log(`  type line in ${values.lang}: ${pct(report.type.local)}${report.unknownParts.size ? `; parts not in the table: ${[...report.unknownParts].join(", ")}` : ""}`);
  console.log(`  ${bytes.length} bytes (${(bytes.length / 1024).toFixed(0)} KB), ${gz} bytes gzipped (${(gz / 1024).toFixed(0)} KB)`);
  console.log(`  sha256 ${sha256}`);
  const key = `details${values.lang[0].toUpperCase()}${values.lang.slice(1)}`;
  console.log("The settings file's entry (cdn/config.json), once the file is published:");
  console.log(`  "${key}": ${JSON.stringify({ path, sha256 })}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
