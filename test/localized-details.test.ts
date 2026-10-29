// SPDX-License-Identifier: Apache-2.0
// scripts/localized-details.mjs and scripts/yugipedia-fetch.mjs: the French details file from the
// English one, Yugipedia's answers and YGOPRODeck's French list (made-up cards and invented French;
// no real card's text is in this repository), and the fetcher's polite rules.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// @ts-expect-error plain JavaScript build scripts
import { buildLocalized, cardsFromAsk, localizedBytes, localType, wikiToText } from "../scripts/localized-details.mjs";
// @ts-expect-error plain JavaScript build scripts
import { TERMS } from "../scripts/localized-terms.mjs";
// @ts-expect-error plain JavaScript build scripts
import { answerProblem, askQuery, SLICES, tooRecent, userAgent } from "../scripts/yugipedia-fetch.mjs";
import { detailLines, detailsFor, localName, parseDetailsFile } from "../src/details/details.js";

const fr = TERMS.fr;

/** A made-up English details file. */
const ENGLISH = {
  schemaVersion: 1,
  cards: {
    "30000001": ["effect", "Invented English line.", "Spellcaster / Fusion / Effect", "WATER", 7, 2800, 2300],
    "30000002": ["effect_pendulum", "[ Pendulum Effect ]\nInvented scale line.\n\n[ Monster Effect ]\nInvented monster line.", "Dragon / Pendulum / Effect", "DARK", 7, 2500, 2000, 4],
    "30000003": ["spell", "Invented quick spell.", "Quick-Play Spell"],
    "30000004": ["effect", "Only in English, no French anywhere.", "Creator God / Effect", "DIVINE", 12, -1, -1],
    "30000005": ["trap", "Invented counter trap.", "Counter Trap"],
    "30000006": ["effect", "Invented printing's English.", "Warrior / Effect", "LIGHT", 4, 1000, 1000],
  },
};

/** A made-up ask-API answer, as Yugipedia returns it (wiki markup in the text). */
const ASK = {
  query: {
    results: {
      "Fixture One": { printouts: { Password: ["30000001"], "French name": ["Un de Test"], "French lore": ["Ligne [[Fusion Summon|Invoquée par Fusion]] ''inventée''.<br />Seconde ligne.<br />● Point&nbsp;un."], "French Pendulum Effect": [] } },
      "Fixture One (video game)": { printouts: { Password: ["30000001"], "French name": ["Mauvais"], "French lore": ["Pas celle-ci."], "French Pendulum Effect": [] } },
      "Fixture Two": { printouts: { Password: ["30000002"], "French name": ["Deux de Test"], "French lore": ["Ligne de monstre inventée."], "French Pendulum Effect": ["Ligne d'échelle inventée."] } },
      "Fixture Six": { printouts: { Password: ["30000006"], "French name": ["Six de Test"], "French lore": ["{{Unknown template}}"], "French Pendulum Effect": [] } },
      "Bad password": { printouts: { Password: ["not-a-number"], "French name": ["X"], "French lore": ["Y"] } },
    },
  },
};

/** A made-up YGOPRODeck French list: one usable row, one with English mixed in. */
const YGOPRODECK = {
  data: [
    { id: 30000003, name: "Magie de Test", desc: "Magie inventée, jouée rapidement.", card_images: [{ id: 30000003 }] },
    { id: 30000005, name: "Piège de Test", desc: "You can negate this card's invented effect.", card_images: [{ id: 30000005 }] },
    { id: 30000006, name: "Six (YGOPRODeck)", desc: "''Texte inventé de la seconde source.''", card_images: [{ id: 30000006 }, { id: 30000016 }] },
  ],
};

const build = () => buildLocalized({ lang: "fr", english: ENGLISH, yugipedia: cardsFromAsk(ASK, fr), ygoprodeck: YGOPRODECK, catalog: { cards: [] } });

describe("wikiToText", () => {
  it("keeps a link's label, drops italics, turns <br /> into lines and prints bullets as Konami does", () => {
    expect(wikiToText("Ligne [[Fusion Summon|Invoquée par Fusion]] ''inventée''.<br />Seconde ligne.<br />● Point&nbsp;un.")).toBe(
      "Ligne Invoquée par Fusion inventée.\nSeconde ligne.\n●Point un.",
    );
    expect(wikiToText("[[Monstre]] seul")).toBe("Monstre seul");
  });

  it("gives null for markup it cannot read, and for nothing", () => {
    expect(wikiToText("{{Unknown template}}")).toBeNull();
    expect(wikiToText("<span>x</span>")).toBeNull();
    expect(wikiToText("  ")).toBeNull();
    expect(wikiToText(undefined)).toBeNull();
  });
});

describe("localType", () => {
  it("words a monster's type line part by part, and a spell's or trap's whole", () => {
    expect(localType(["effect", "", "Spellcaster / Fusion / Effect"], fr)).toBe("Magicien / Fusion / Effet");
    expect(localType(["spell", "", "Quick-Play Spell"], fr)).toBe("Magie Jeu-Rapide");
    expect(localType(["trap", "", "Counter Trap"], fr)).toBe("Contre-Piège");
  });

  it("gives null when a part is not in the table: that type line stays English", () => {
    expect(localType(["effect", "", "Creator God / Effect"], fr)).toBeNull();
  });
});

describe("buildLocalized (French)", () => {
  it("takes Yugipedia's text and name first, cleaned, from the first page for a card number", () => {
    const { file } = build();
    expect(file.cards["30000001"]).toEqual(["effect", "Ligne Invoquée par Fusion inventée.\nSeconde ligne.\n●Point un.", "Magicien / Fusion / Effet", "EAU", 7, 2800, 2300]);
    expect(file.names["30000001"]).toBe("Un de Test");
  });

  it("sets a Pendulum card's two texts under the French headings", () => {
    const { file } = build();
    expect(file.cards["30000002"][1]).toBe("[ Effet Pendule ]\nLigne d'échelle inventée.\n\n[ Effet de Monstre ]\nLigne de monstre inventée.");
    expect(file.cards["30000002"].slice(2)).toEqual(["Dragon / Pendule / Effet", "TÉNÈBRES", 7, 2500, 2000, 4]);
  });

  it("falls back to YGOPRODeck's French, then to English, never using a row with English in it", () => {
    const { file, report } = build();
    expect(file.cards["30000003"][1]).toBe("Magie inventée, jouée rapidement.");
    expect(file.names["30000003"]).toBe("Magie de Test");
    expect(file.cards["30000005"][1]).toBe("Invented counter trap.");
    expect(file.cards["30000005"][2]).toBe("Contre-Piège");
    // Yugipedia's text was unreadable: YGOPRODeck's text, Yugipedia's name.
    expect(file.cards["30000006"][1]).toBe("Texte inventé de la seconde source.");
    expect(file.names["30000006"]).toBe("Six de Test");
    expect(report.text).toEqual({ yugipedia: 2, ygoprodeck: 2, english: 2 });
    expect(report.englishText).toEqual(["30000004", "30000005"]);
  });

  it("keeps a card with no French at all in English, with no name and its unknown type part reported", () => {
    const { file, report } = build();
    expect(file.cards["30000004"]).toEqual(["effect", "Only in English, no French anywhere.", "Creator God / Effect", "DIVIN", 12, -1, -1]);
    expect(file.names).not.toHaveProperty("30000004");
    expect([...report.unknownParts]).toEqual(["Creator God"]);
  });

  it("finds a printing's French under its base card", () => {
    const english = { schemaVersion: 1, cards: { "30000016": ENGLISH.cards["30000006"] } };
    const { file } = buildLocalized({ lang: "fr", english, yugipedia: new Map(), ygoprodeck: YGOPRODECK, catalog: { cards: [{ id: "30000016", printingOf: "30000006" }] } });
    expect(file.cards["30000016"][1]).toBe("Texte inventé de la seconde source.");
  });

  it("is a file the tooltip reads, credited and named by language", () => {
    const { file } = build();
    expect(file.attribution).toMatch(/Yugipedia.*CC BY-SA 4\.0/);
    const table = parseDetailsFile(JSON.parse(JSON.stringify(file)))!;
    expect(table.lang).toBe("fr");
    expect(localName(table, "30000002")).toBe("Deux de Test");
    expect(detailLines(detailsFor(table, "30000002")!, table.labels).stats).toBe("TÉNÈBRES · Niveau 7 · Échelle Pendule 4");
    expect(localizedBytes(file).path).toMatch(/^data\/details-fr-[0-9a-f]{8}\.json$/);
  });
});

describe("the terms tables", () => {
  it("give every language the same terms as French, and the stats line's words", () => {
    for (const lang of ["de", "it", "es", "pt"]) {
      const t = TERMS[lang];
      expect(Object.keys(t.monsterParts).sort(), lang).toEqual(Object.keys(fr.monsterParts).sort());
      expect(Object.keys(t.spellTrap).sort(), lang).toEqual(Object.keys(fr.spellTrap).sort());
      expect(Object.keys(t.attributes).sort(), lang).toEqual(Object.keys(fr.attributes).sort());
      expect(Object.keys(t.labels).sort(), lang).toEqual(["atk", "def", "level", "link", "rank", "scale"]);
      expect(Object.values(t.monsterParts).every((w) => typeof w === "string" && w.length > 0), lang).toBe(true);
    }
  });

  it("mark a language usable only once checked against Konami's database", () => {
    expect(fr.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(TERMS.de.yugipedia).toEqual({ name: "German name", lore: "German lore", pendulum: "German Pendulum Effect" });
  });

  it("put the language's labels in its file, which the tooltip reads", () => {
    const { file } = buildLocalized({ lang: "de", english: ENGLISH, yugipedia: new Map(), ygoprodeck: [], catalog: { cards: [] } });
    expect(file.lang).toBe("de");
    expect(file.attribution).toMatch(/^German card names and texts: Yugipedia.*CC BY-SA 4\.0/);
    const table = parseDetailsFile(JSON.parse(JSON.stringify(file)))!;
    expect(detailLines(detailsFor(table, "30000002")!, table.labels).stats).toBe("FINSTERNIS · Stufe 7 · Pendelbereich 4");
    expect(detailsFor(table, "30000002")!.type).toBe("Drache / Pendel / Effekt");
    // No source had German for any card: every text stays English.
    expect(detailsFor(table, "30000001")!.text).toBe("Invented English line.");
  });
});

describe("yugipedia-fetch's polite rules", () => {
  it("asks for the TCG cards with French text, by slice, 500 at a time", () => {
    expect(askQuery(fr, "[[Card type::Spell Card]]", 1000)).toBe(
      "[[Category:TCG cards]][[French lore::+]][[Card type::Spell Card]]|?Password|?French name|?French lore|?French Pendulum Effect|limit=500|offset=1000",
    );
    expect(SLICES.map(([name]: [string]) => name)).toEqual(["spell", "trap", "dark", "light", "earth", "water", "fire", "wind", "divine"]);
  });

  it("names the tool and a contact", () => {
    expect(userAgent({ name: "DuelSight", projectUrl: "https://example.org/p", maintainerContactUrl: "https://example.org/p/issues" })).toBe(
      "DuelSight-card-details/1.0 (https://example.org/p; contact: https://example.org/p/issues)",
    );
  });

  it("keeps a fetch for 30 days", () => {
    const now = new Date("2026-11-20T00:00:00Z");
    expect(tooRecent("2026-10-29T00:00:00Z", now)).toBe(true);
    expect(tooRecent("2026-10-20T00:00:00Z", now)).toBe(false);
    expect(tooRecent("not a date", now)).toBe(false);
  });

  it("stops at anything but the API's JSON", () => {
    expect(answerProblem(200, "application/json; charset=utf-8", { query: {} })).toBeNull();
    expect(answerProblem(429, "text/html", null)).toBe("HTTP 429");
    expect(answerProblem(200, "text/html", null)).toMatch(/not JSON/);
    expect(answerProblem(200, "application/json", { error: { code: "x" } })).toMatch(/API error/);
  });
});

describe("the refusal to write inside the repository", () => {
  it("is shared with card-details.mjs (an outside folder is fine)", async () => {
    // @ts-expect-error plain JavaScript build scripts
    const { insideRepository } = await import("../scripts/card-details.mjs");
    const outside = mkdtempSync(join(tmpdir(), "localized-"));
    try {
      expect(insideRepository(outside, process.cwd())).toBe(false);
      expect(insideRepository(join(process.cwd(), "out"), process.cwd())).toBe(true);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });
});
