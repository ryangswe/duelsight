// SPDX-License-Identifier: Apache-2.0
// scripts/card-details.mjs: the card details file from a card list and a catalog (made-up cards;
// no real card's text is in this repository), its versioned name, and its refusal to write
// inside the repository.
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// @ts-expect-error plain JavaScript build scripts
import { buildDetails, detailsBytes, detailsRow, insideRepository } from "../scripts/card-details.mjs";
import { detailLines, detailsFor, parseDetailsFile } from "../src/details/details.js";

/** A made-up card list in the shape of the source's. */
const CARD_LIST = {
  data: [
    {
      id: 20000001, name: "Fixture Golem", type: "Effect Monster", humanReadableCardType: "Effect Monster", frameType: "effect",
      desc: "Invented line one.\r\nInvented line two. ", race: "Rock", typeline: ["Rock", "Effect"], attribute: "EARTH", level: 4, atk: 1500, def: -1,
      card_images: [{ id: 20000001 }, { id: 20000011 }],
    },
    {
      id: 20000002, name: "Fixture Link", type: "Link Monster", humanReadableCardType: "Link Effect Monster", frameType: "link",
      desc: "2 invented monsters", race: "Cyberse", typeline: ["Cyberse", "Link", "Effect"], attribute: "DARK", level: null, atk: 1800, def: null,
      linkval: 2, linkmarkers: ["Left", "Right"], card_images: [{ id: 20000002 }],
    },
    {
      id: 20000003, name: "Fixture Field", type: "Spell Card", humanReadableCardType: "Field Spell", frameType: "spell", race: "Field",
      desc: "An invented field.", card_images: [{ id: 20000003 }],
    },
    { id: 20000004, name: "No Text", type: "Spell Card", frameType: "spell", card_images: [] },
  ],
};
const CATALOG = {
  cards: [
    { id: "20000001", name: "Fixture Golem", art: "full/20000001.jpg" },
    { id: "20000011", name: "Fixture Golem", art: "full/20000011.jpg" },
    { id: "20000002", name: "Fixture Link", art: "full/20000002.jpg" },
    { id: "20000003", name: "Fixture Field", art: "full/20000003.jpg" },
    { id: "20000004", name: "No Text", art: null },
    { id: "29999999", name: "Not In The List", art: null },
  ],
};

describe("card-details.mjs", () => {
  it("makes one row per catalog card, matched by id or by artwork id", () => {
    const { file, missing } = buildDetails(CARD_LIST, CATALOG);
    expect(file.schemaVersion).toBe(1);
    expect(Object.keys(file.cards).sort()).toEqual(["20000001", "20000002", "20000003", "20000011"]);
    expect(file.cards["20000011"]).toEqual(file.cards["20000001"]);
    expect(missing).toEqual(["20000004", "29999999"]);
    expect(() => buildDetails({}, CATALOG)).toThrow();
    expect(() => buildDetails(CARD_LIST, {})).toThrow();
    // The bare list works as well as { data }.
    expect(buildDetails(CARD_LIST.data, CATALOG).file).toEqual(file);
  });

  it("writes rows the extension reads back", () => {
    const { file } = buildDetails(CARD_LIST, CATALOG);
    expect(file.cards["20000001"]).toEqual(["effect", "Invented line one.\nInvented line two.", "Rock / Effect", "EARTH", 4, 1500, -1]);
    expect(file.cards["20000002"]).toEqual(["link", "2 invented monsters", "Cyberse / Link / Effect", "DARK", null, 1800, null, null, 2, ["Left", "Right"]]);
    expect(file.cards["20000003"]).toEqual(["spell", "An invented field.", "Field Spell"]);
    const table = parseDetailsFile(JSON.parse(JSON.stringify(file)));
    expect(detailLines(detailsFor(table, "20000001")!)).toEqual({ type: "Rock / Effect", stats: "EARTH · Level 4", power: "ATK 1500 / DEF ?", text: "Invented line one.\nInvented line two." });
    expect(detailLines(detailsFor(table, "20000002")!).power).toBe("ATK 1800  ← →");
  });

  it("leaves out a card with no text or frame", () => {
    expect(detailsRow({ frameType: "spell", type: "Spell Card" })).toBeNull();
    expect(detailsRow({ desc: "x", type: "Spell Card" })).toBeNull();
  });

  it("names the file after the start of its SHA-256, minified", () => {
    const { file } = buildDetails(CARD_LIST, CATALOG);
    const { bytes, sha256, path } = detailsBytes(file);
    expect(sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
    expect(path).toBe(`data/details-${sha256.slice(0, 8)}.json`);
    expect(bytes.toString("utf-8")).toBe(JSON.stringify(file));
    expect(bytes.toString("utf-8")).not.toContain("\n  ");
  });

  it("refuses to write inside the repository", () => {
    const root = process.cwd();
    expect(insideRepository(root, root)).toBe(true);
    expect(insideRepository(join(root, "dist"), root)).toBe(true);
    expect(insideRepository(join(root, "not-yet", "deeper"), root)).toBe(true);
    expect(insideRepository(join(root, "..", "elsewhere"), root)).toBe(false);
    const outside = mkdtempSync(join(tmpdir(), "details-"));
    try {
      expect(insideRepository(outside, root)).toBe(false);
      expect(insideRepository(join(outside, "out"), root)).toBe(false);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });
});
