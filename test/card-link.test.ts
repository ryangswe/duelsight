// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import { konamiCardLink } from "../src/tooltip/card-link.js";

const BASE = "https://www.db.yugioh-card.com/yugiohdb/card_search.action";

describe("konamiCardLink", () => {
  it("links the card page when the catalog row has a konamiId (string or number)", () => {
    expect(konamiCardLink({ name: "Blue-Eyes White Dragon", konamiId: "4007" })).toBe(`${BASE}?ope=2&cid=4007&request_locale=en`);
    expect(konamiCardLink({ name: "Blue-Eyes White Dragon", konamiId: 4007 })).toBe(`${BASE}?ope=2&cid=4007&request_locale=en`);
  });

  it("searches by name when there is no konamiId", () => {
    for (const konamiId of [undefined, null, ""]) {
      expect(konamiCardLink({ name: "Dark Magician", konamiId })).toBe(`${BASE}?ope=1&sess=1&keyword=Dark%20Magician&stype=1&request_locale=en`);
    }
    expect(konamiCardLink({ name: "Dark Magician" })).toContain("ope=1");
  });

  it("encodes the name, whatever it holds", () => {
    expect(konamiCardLink({ name: "Ash Blossom & Joyous Spring" })).toBe(`${BASE}?ope=1&sess=1&keyword=Ash%20Blossom%20%26%20Joyous%20Spring&stype=1&request_locale=en`);
    expect(konamiCardLink({ name: "D/D/D Wave High King Caesar" })).toContain("keyword=D%2FD%2FD%20Wave%20High%20King%20Caesar&");
    expect(konamiCardLink({ name: 'Q"&ope=2#<x>' })).toBe(`${BASE}?ope=1&sess=1&keyword=Q%22%26ope%3D2%23%3Cx%3E&stype=1&request_locale=en`);
  });

  it("does not trust a konamiId that is not digits: it searches by name instead", () => {
    for (const konamiId of ["4007&ope=1", "4007/../x", "abc", "-1", "1e3", "4007 ", 0, -5, 1.5, Number.NaN, 2 ** 60]) {
      expect(konamiCardLink({ name: "Dark Hole", konamiId: konamiId as never })).toBe(`${BASE}?ope=1&sess=1&keyword=Dark%20Hole&stype=1&request_locale=en`);
    }
  });

  it("is null with neither a usable id nor a name", () => {
    expect(konamiCardLink({ name: "" })).toBeNull();
    expect(konamiCardLink({ name: "   ", konamiId: "x" })).toBeNull();
    expect(konamiCardLink({ name: "", konamiId: "4007" })).toBe(`${BASE}?ope=2&cid=4007&request_locale=en`);
  });

  it("only ever builds an address on Konami's database host over https", () => {
    const url = new URL(konamiCardLink({ name: "Pot of Greed" })!);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("www.db.yugioh-card.com");
  });
});
