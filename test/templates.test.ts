// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import { encodePath, encodeValue, expandTemplate, makePrintedId, printedId, templateProblem } from "../src/settings/templates.js";
import { CONFIG, FIXTURE_CDN, IS_DUELSIGHT, PASSCODE_RULE } from "./helpers/fork.js";

/** Whether the build's printed-number rule is the passcode rule (tests of {printedId} values). */
const PASSCODE_CONFIGURED = JSON.stringify(CONFIG.printedNumber) === JSON.stringify(PASSCODE_RULE);

describe("the build's printed-number rule", () => {
  it.runIf(IS_DUELSIGHT)("is the passcode rule in DuelSight", () => {
    expect(CONFIG.printedNumber).toEqual(PASSCODE_RULE);
  });
  it("is the one printedId applies", () => {
    expect(printedId("zz-test-id", "TOY-1")).toBe(makePrintedId(CONFIG.printedNumber)("zz-test-id", "TOY-1"));
  });
});

describe("the passcode rule", () => {
  const printedId = makePrintedId(PASSCODE_RULE);
  it.each([
    // Card ids are YGOPRODeck passcodes: digits, up to 8. One name's other artworks are one
    // identity in the release's groups; they are not a different id shape.
    ["89631139", "89631139"],
    ["46986414", "46986414"],
    ["4031928", "4031928"], // seven digits
    ["10000", "10000"],
    ["5", "5"],
    ["012345678", null], // nine digits is not a passcode
    ["", null],
    ["OP01-001", null],
    ["89631139_p1", null],
    ["8963113a", null],
    ["-89631139", null],
  ])("%s → %s", (id, printed) => expect(printedId(id)).toBe(printed));
});

describe("percent-encoding", () => {
  it("encodes everything but unreserved characters, as Python's quote does", () => {
    expect(encodeValue("a b!'()*~._-")).toBe("a%20b%21%27%28%29%2A~._-");
    expect(encodeValue("青眼")).toBe("%E9%9D%92%E7%9C%BC");
    expect(encodeValue("a/b?c#d&e")).toBe("a%2Fb%3Fc%23d%26e");
  });

  it("keeps the slashes of a path and encodes each segment", () => {
    expect(encodePath("jp/89631139_1.jpg")).toBe("jp/89631139_1.jpg");
    expect(encodePath("jp/a b/c#d.png")).toBe("jp/a%20b/c%23d.png");
  });
});

describe("expandTemplate", () => {
  const card = { id: "89631139", art: "89631139.jpg" };

  it("fills {art} segment by segment", () => {
    expect(expandTemplate(`${FIXTURE_CDN}/art/{art}`, card)).toBe(`${FIXTURE_CDN}/art/89631139.jpg`);
    expect(expandTemplate(`${FIXTURE_CDN}/art/{art}`, { id: "X-1", art: "a dir/b+c.png" })).toBe(`${FIXTURE_CDN}/art/a%20dir/b%2Bc.png`);
  });

  it("fills {file} and {cardId}", () => {
    expect(expandTemplate("https://h.example/{file}?id={cardId}", card)).toBe("https://h.example/89631139.jpg?id=89631139");
  });

  it.runIf(PASSCODE_CONFIGURED)("fills {printedId} from a passcode", () => {
    expect(expandTemplate("https://h.example/?n={printedId}", card)).toBe("https://h.example/?n=89631139");
  });

  it.runIf(PASSCODE_CONFIGURED)("is unavailable for {printedId} when the id is not a passcode", () => {
    expect(expandTemplate("https://h.example/?n={printedId}", { id: "token_1", art: null })).toBeNull();
    expect(expandTemplate("https://h.example/?n={printedId}", { id: "4031928", art: null })).toBe("https://h.example/?n=4031928");
  });

  it("is unavailable for {art} and {file} when the card has no art", () => {
    const noArt = { id: "122", art: null };
    expect(expandTemplate(`${FIXTURE_CDN}/art/{art}`, noArt)).toBeNull();
    expect(expandTemplate("https://h.example/{file}", noArt)).toBeNull();
    expect(expandTemplate("https://h.example/?q={cardId}", noArt)).toBe("https://h.example/?q=122");
  });

  it("has no {sourceFile}: a template that names it is not usable", () => {
    expect(expandTemplate("https://h.example/{sourceFile}", card)).toBeNull();
    expect(templateProblem("https://h.example/{sourceFile}")).toBe("unknown placeholder {sourceFile}");
  });

  it("refuses templates that are not usable", () => {
    expect(expandTemplate("http://h.example/{art}", card)).toBeNull();
    expect(expandTemplate("https://h.example/{nope}", card)).toBeNull();
  });
});

describe("templateProblem", () => {
  it.each([
    [`${FIXTURE_CDN}/art/{art}`, null],
    [`${FIXTURE_CDN.replace("https", "http")}/art/{art}`, "not https://"],
    [`${FIXTURE_CDN.replace("https", "HTTPS")}/art/{art}`, "not https://"],
    ["/art/{art}", "not an absolute address"],
    ["https://h.example/{Art}", "unknown placeholder {Art}"],
    ["https://h.example/{}", "unknown placeholder {}"],
    ["https://h.example/{art", "unbalanced braces"],
  ])("%s", (template, problem) => expect(templateProblem(template)).toBe(problem));
});
