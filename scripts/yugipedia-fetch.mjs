// SPDX-License-Identifier: Apache-2.0
// Fetch the TCG cards' French names and texts from Yugipedia's API, politely, into a folder
// OUTSIDE this repository, for scripts/localized-details.mjs:
//
//   node scripts/yugipedia-fetch.mjs --lang fr --out <folder>
//
// Yugipedia's API page (https://yugipedia.com/wiki/Yugipedia:API) asks for:
//   - a User-Agent naming the tool and a contact: the project's page and its issues (from
//     duelsight.config.json);
//   - at most one request a second: this waits PAUSE_MS between requests, one at a time;
//   - results cached about 30 days: this refuses to fetch again within 30 days of the last fetch
//     into the same folder (fetch.json), and the next set's refresh uses that copy;
// It reads the cards with French text through the Semantic MediaWiki "ask" query, 500 a page,
// split by card type and attribute so no slice passes the API's offset limit: about 35 requests
// in all, never page scraping. It stops at the first answer that is not the API's JSON (an
// error, a block, a challenge page) and never retries around it.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { insideRepository } from "./card-details.mjs";
import { TERMS } from "./localized-terms.mjs";

export const API = "https://yugipedia.com/api.php";
export const PAUSE_MS = 3000;
export const PAGE_SIZE = 500;
/** The ask API's largest offset (Semantic MediaWiki's limit on this wiki). */
export const MAX_OFFSET = 5000;
export const REFETCH_DAYS = 30;

/** Slices of the card list small enough for the offset limit: spells, traps, then monsters by
 *  attribute. */
export const SLICES = [
  ["spell", "[[Card type::Spell Card]]"],
  ["trap", "[[Card type::Trap Card]]"],
  ...["DARK", "LIGHT", "EARTH", "WATER", "FIRE", "WIND", "DIVINE"].map((a) => [a.toLowerCase(), `[[Attribute::${a}]]`]),
];

/** The ask query for one slice's page. */
export function askQuery(terms, slice, offset) {
  const p = terms.yugipedia;
  return `[[Category:TCG cards]][[${p.lore}::+]]${slice}|?Password|?${p.name}|?${p.lore}|?${p.pendulum}|limit=${PAGE_SIZE}|offset=${offset}`;
}

/** The User-Agent: the tool, its page and where to reach its maintainer. */
export function userAgent(config) {
  return `${config.name}-card-details/1.0 (${config.projectUrl}; contact: ${config.maintainerContactUrl})`;
}

/** Whether a fetch made at `fetchedAt` (ISO) is too recent to fetch again at `now`. */
export function tooRecent(fetchedAt, now = new Date()) {
  const at = Date.parse(fetchedAt);
  return Number.isFinite(at) && now.getTime() - at < REFETCH_DAYS * 24 * 3600 * 1000;
}

/** Why an answer is not a usable ask-API page, or null. */
export function answerProblem(status, contentType, body) {
  if (status !== 200) return `HTTP ${status}`;
  if (!/json/.test(contentType ?? "")) return `not JSON (${contentType || "no type"}): a block or challenge page?`;
  if (body?.error) return `API error: ${JSON.stringify(body.error).slice(0, 300)}`;
  if (!body?.query) return "no query in the answer";
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { values } = parseArgs({ options: { lang: { type: "string" }, out: { type: "string" } } });
  if (!values.lang || !values.out) {
    console.error("usage: node scripts/yugipedia-fetch.mjs --lang fr --out <folder outside the repository>");
    process.exit(2);
  }
  const terms = TERMS[values.lang];
  if (!terms) {
    console.error(`--lang ${values.lang}: no terms for it in scripts/localized-terms.mjs`);
    process.exit(2);
  }
  const root = fileURLToPath(new URL("..", import.meta.url));
  const out = resolve(values.out);
  if (insideRepository(out, root)) {
    console.error(`--out ${values.out} is inside the repository: card text must never be written here.`);
    process.exit(2);
  }
  const record = join(out, "fetch.json");
  if (existsSync(record)) {
    const last = JSON.parse(readFileSync(record, "utf-8"));
    if (tooRecent(last.fetchedAt)) {
      console.error(`${out} was fetched on ${last.fetchedAt}: Yugipedia asks for results to be kept about ${REFETCH_DAYS} days. Use that copy.`);
      process.exit(2);
    }
  }
  const config = JSON.parse(readFileSync(join(root, "duelsight.config.json"), "utf-8"));
  const headers = { "User-Agent": userAgent(config) };
  let requests = 0;
  let cards = 0;
  for (const [name, slice] of SLICES) {
    const dir = join(out, name);
    mkdirSync(dir, { recursive: true });
    for (let offset = 0, page = 0; ; page += 1) {
      if (requests > 0) await sleep(PAUSE_MS);
      const url = `${API}?${new URLSearchParams({ action: "ask", format: "json", query: askQuery(terms, slice, offset) })}`;
      requests += 1;
      const response = await fetch(url, { headers });
      const type = response.headers.get("content-type");
      const text = await response.text();
      let body = null;
      try {
        body = JSON.parse(text);
      } catch {
        // Not JSON: answerProblem says so.
      }
      const problem = answerProblem(response.status, type, body);
      if (problem) {
        console.error(`Stopped at ${name}, offset ${offset}: ${problem}. Nothing is retried; the pages so far are kept.`);
        process.exit(1);
      }
      writeFileSync(join(dir, `page-${String(page).padStart(3, "0")}.json`), text);
      const n = Object.keys(body.query.results ?? {}).length;
      cards += n;
      console.log(`${name} page ${page}: ${n} cards`);
      const next = body["query-continue-offset"];
      if (!next || next <= offset) break;
      if (next > MAX_OFFSET) {
        console.error(`Stopped: ${name} has more cards than one slice can page through (offset ${next}). Split SLICES further.`);
        process.exit(1);
      }
      offset = next;
    }
  }
  writeFileSync(record, `${JSON.stringify({ fetchedAt: new Date().toISOString(), lang: values.lang, requests, cards }, null, 2)}\n`);
  console.log(`${cards} cards in ${requests} requests, into ${out}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
