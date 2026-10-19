// SPDX-License-Identifier: Apache-2.0
// Write data/source-files.json, the committed `{sourceFile}` map: card ids and file names on
// optcgapi.com, nothing else (no images, no addresses). Rules in scripts/card-data.mjs.
//
//   node scripts/source-map.mjs --catalog <release catalog.json> --images-index <images.jsonl>
//
// The build uses this committed copy, so a build without the private index keeps the fallback.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { buildSourceFileMaps, sortedMaps } from "./card-data.mjs";

const { values } = parseArgs({ options: { catalog: { type: "string" }, "images-index": { type: "string" } } });
if (!values.catalog || !values["images-index"]) {
  console.error("usage: node scripts/source-map.mjs --catalog <catalog.json> --images-index <images.jsonl>");
  process.exit(2);
}
const root = fileURLToPath(new URL("..", import.meta.url));
const catalog = JSON.parse(readFileSync(resolve(values.catalog), "utf-8"));
const index = readFileSync(resolve(values["images-index"]), "utf-8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
const { maps, unmapped } = buildSourceFileMaps(catalog, index);
mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(join(root, "data", "source-files.json"), `${JSON.stringify(sortedMaps(maps), null, 1)}\n`);
console.log(`data/source-files.json: optcgapi ${Object.keys(maps.optcgapi).length} of ${catalog.cards.length} cards (${unmapped} without a file there)`);
