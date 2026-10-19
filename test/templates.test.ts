// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import { encodePath, encodeValue, expandTemplate, makePrintedId, printedId, templateProblem } from "../src/settings/templates.js";
import { CONFIG, IS_KENBUNSHOKU, ONE_PIECE_RULE } from "./helpers/fork.js";

/** Whether the build's printed-number rule is One Piece's (tests of {printedId} values). */
const ONE_PIECE_CONFIGURED = JSON.stringify(CONFIG.printedNumber) === JSON.stringify(ONE_PIECE_RULE);

describe("the build's printed-number rule", () => {
  it.runIf(IS_KENBUNSHOKU)("is One Piece's in Kenbunshoku", () => {
    expect(CONFIG.printedNumber).toEqual(ONE_PIECE_RULE);
  });
  it("is the one printedId applies", () => {
    expect(printedId("zz-test-id", "TOY-1")).toBe(makePrintedId(CONFIG.printedNumber)("zz-test-id", "TOY-1"));
  });
});

describe("the One Piece printed-number rule", () => {
  const printedId = makePrintedId(ONE_PIECE_RULE);
  it.each([
    // Every id shape of the One Piece release catalog (5502 ids), by count.
    ["EB01-001", "EB01-001"], // 2678 plain
    ["OP10-045_p2", "OP10-045"], // 1860 parallel printings
    ["EB01-003__promo1", "EB01-003"], // 330
    ["don_8", null], // 182 DON!! cards: no printed number
    ["P-001_pr1", "P-001"], // 160
    ["P-096", "P-096"], // 150
    ["OP15-039_p2-JP", "OP15-039"], // 113 Japanese promos
    ["P-011-JP", "P-011"], // 9
    ["P-028_p1-JP", "P-028"], // 8
    ["OP03-081_p1__set1", "OP03-081"], // 4
    ["EB03_OP05-006_p1", "OP05-006"], // 2: the set prefix is not a number
    ["EB03_OP09-034_p1", "OP09-034"],
    ["OP04-016_P1", "OP04-016"], // 1
    ["P-044__promo1", "P-044"], // 1
    // A hyphenated variant suffix is dropped first (3 ids).
    ["OP09-078-r1", "OP09-078"],
    ["OP13-008-r1", "OP13-008"],
    ["P-089-pr6", "P-089"],
    ["OP09-078-r1-JP", "OP09-078"],
    ["OP09-078-x1", null],
    ["ST27-005", "ST27-005"],
    ["EB03-055", "EB03-055"],
  ])("%s → %s", (id, printed) => expect(printedId(id)).toBe(printed));
});

describe("percent-encoding", () => {
  it("encodes everything but unreserved characters, as Python's quote does", () => {
    expect(encodeValue("a b!'()*~._-")).toBe("a%20b%21%27%28%29%2A~._-");
    expect(encodeValue("ドン")).toBe("%E3%83%89%E3%83%B3");
    expect(encodeValue("a/b?c#d&e")).toBe("a%2Fb%3Fc%23d%26e");
  });

  it("keeps the slashes of a path and encodes each segment", () => {
    expect(encodePath("jp/P-001_p1.png")).toBe("jp/P-001_p1.png");
    expect(encodePath("jp/a b/c#d.png")).toBe("jp/a%20b/c%23d.png");
  });
});

describe("expandTemplate", () => {
  const card = { id: "EB01-006_p4-JP", art: "jp/EB01-006_p4-JP.png" };
  const maps = { optcgapi: { "OP01-001": "OP01-001_cCn0Rtb.jpg", "OP02-002": "a b.jpg" } };

  it("fills {art} segment by segment", () => {
    expect(expandTemplate("https://cdn.kenbunshoku.com/art/{art}", card, "cdn")).toBe("https://cdn.kenbunshoku.com/art/jp/EB01-006_p4-JP.png");
    expect(expandTemplate("https://cdn.kenbunshoku.com/art/{art}", { id: "X-1", art: "a dir/b+c.png" }, "cdn")).toBe(
      "https://cdn.kenbunshoku.com/art/a%20dir/b%2Bc.png",
    );
  });

  it.runIf(ONE_PIECE_CONFIGURED)("fills {file}, {cardId} and {printedId}", () => {
    expect(expandTemplate("https://h.example/{file}?id={cardId}&n={printedId}", card, null)).toBe(
      "https://h.example/EB01-006_p4-JP.png?id=EB01-006_p4-JP&n=EB01-006",
    );
  });

  it.runIf(ONE_PIECE_CONFIGURED)("is unavailable for {printedId} when the card has no printed number (no card link)", () => {
    expect(expandTemplate("https://en.onepiece-cardgame.com/cardlist/?freewords={printedId}", { id: "don_8", art: "don_8.png" }, null)).toBeNull();
    expect(expandTemplate("https://en.onepiece-cardgame.com/cardlist/?freewords={printedId}", { id: "EB03_OP05-006_p1", art: null }, null)).toBe(
      "https://en.onepiece-cardgame.com/cardlist/?freewords=OP05-006",
    );
  });

  it("is unavailable for {art} and {file} when the card has no art", () => {
    const noArt = { id: "P-122", art: null };
    expect(expandTemplate("https://cdn.kenbunshoku.com/art/{art}", noArt, "cdn")).toBeNull();
    expect(expandTemplate("https://h.example/{file}", noArt, "cdn")).toBeNull();
    if (ONE_PIECE_CONFIGURED) expect(expandTemplate("https://h.example/?q={printedId}", noArt, null)).toBe("https://h.example/?q=P-122");
    expect(expandTemplate("https://h.example/?q={cardId}", noArt, null)).toBe("https://h.example/?q=P-122");
  });

  it("takes {sourceFile} from the source's own map, encoded", () => {
    const t = "https://optcgapi.com/media/static/Card_Images/{sourceFile}";
    expect(expandTemplate(t, { id: "OP01-001", art: "OP01-001.png" }, "optcgapi", maps)).toBe(
      "https://optcgapi.com/media/static/Card_Images/OP01-001_cCn0Rtb.jpg",
    );
    expect(expandTemplate(t, { id: "OP02-002", art: null }, "optcgapi", maps)).toBe("https://optcgapi.com/media/static/Card_Images/a%20b.jpg");
  });

  it("is unavailable for {sourceFile} when the card or the source has no map entry", () => {
    const t = "https://optcgapi.com/media/static/Card_Images/{sourceFile}";
    expect(expandTemplate(t, { id: "OP09-999", art: "x.png" }, "optcgapi", maps)).toBeNull();
    expect(expandTemplate(t, { id: "OP01-001", art: "x.png" }, "other", maps)).toBeNull();
    expect(expandTemplate(t, { id: "OP01-001", art: "x.png" }, null, maps)).toBeNull();
  });

  it("refuses templates that are not usable", () => {
    expect(expandTemplate("http://h.example/{art}", card, "cdn")).toBeNull();
    expect(expandTemplate("https://h.example/{nope}", card, "cdn")).toBeNull();
  });
});

describe("templateProblem", () => {
  it.each([
    ["https://cdn.kenbunshoku.com/art/{art}", null],
    ["http://cdn.kenbunshoku.com/art/{art}", "not https://"],
    ["HTTPS://cdn.kenbunshoku.com/art/{art}", "not https://"],
    ["/art/{art}", "not an absolute address"],
    ["https://h.example/{Art}", "unknown placeholder {Art}"],
    ["https://h.example/{}", "unknown placeholder {}"],
    ["https://h.example/{art", "unbalanced braces"],
  ])("%s", (template, problem) => expect(templateProblem(template)).toBe(problem));
});
