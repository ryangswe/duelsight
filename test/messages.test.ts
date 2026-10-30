// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";

import { allowedParentOrigin, parseFactsRequest, parseTooltipIn, parseTooltipOut, tag, TAG } from "../src/shared/messages.js";
import { computeProtocol } from "../vendor/cardvision-browser/page-capture.js";

/** Both sites on, whatever the build's config turns on (the config's own sites: build-data.test.ts). */
const BOTH_SITES = { youtube: true, twitch: true };

describe("message checks", () => {
  it("tags messages as the toolkit's contract does under DuelSight's tag", () => {
    const protocol = computeProtocol(TAG);
    const shown = { kind: "shown" as const, card: null };
    expect(protocol.tag(shown)).toEqual(tag(shown));
    expect(protocol.parseComputeOut(tag(shown))).toEqual(shown);
    expect(protocol.parseComputeIn(tag({ kind: "leave" }))).toEqual({ kind: "leave" });
    expect(computeProtocol("cardvision").parseComputeIn(tag({ kind: "leave" }))).toBeNull();
  });

  it("checks the tooltip messages", () => {
    expect(parseTooltipIn(tag({ kind: "card", cardId: "89631139", name: "Dark Magician" }))).toEqual({ kind: "card", cardId: "89631139", name: "Dark Magician" });
    expect(parseTooltipIn(tag({ kind: "card", cardId: "x".repeat(500), name: "Dark Magician" }))).toBeNull();
    expect(parseTooltipIn(tag({ kind: "clear" }))).toEqual({ kind: "clear" });
    expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448, shape: "card" }))).toEqual({ kind: "size", width: 320, height: 448, shape: "card" });
    expect(parseTooltipOut(tag({ kind: "size", width: 120, height: 32, shape: "pill" }))).toEqual({ kind: "size", width: 120, height: 32, shape: "pill" });
    expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448 }))).toBeNull();
    expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448, shape: "panel" }))).toBeNull();
    expect(parseTooltipOut(tag({ kind: "size", width: 280, height: 1e6, shape: "card" }))).toBeNull();
    expect(parseTooltipIn(tag({ kind: "card", cardId: "89631139", name: "x", seq: 7 }))).toEqual({ kind: "card", cardId: "89631139", name: "x", seq: 7 });
    expect(parseTooltipIn(tag({ kind: "card", cardId: "89631139", name: "x", seq: -1 }))).toBeNull();
    expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448, shape: "card", cardId: "A", seq: 3 }))).toEqual({ kind: "size", width: 320, height: 448, shape: "card", cardId: "A", seq: 3 });
    expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448, shape: "card", seq: 1.5 }))).toBeNull();
    // A card picture may carry its details panel's measured heights.
    const panel = [[220, 400], [260, 330]];
    expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448, shape: "card", cardId: "A", panel }))).toEqual({ kind: "size", width: 320, height: 448, shape: "card", cardId: "A", panel });
    for (const bad of [[], "x", [[220]], [[220, 0]], [[0, 100]], [[220, Number.NaN]], [[220, 5000]], [["220", 100]], Array(13).fill([220, 100])]) {
      expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448, shape: "card", panel: bad }))).toBeNull();
    }
    expect(parseTooltipOut(tag({ kind: "size", width: 120, height: 32, shape: "pill", panel }))).toBeNull();
    // The tooltip has no link any more: such a message is not one of its messages.
    expect(parseTooltipOut(tag({ kind: "link", href: "https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4007" }))).toBeNull();
  });

  it("accepts the video sites as parents, and the local test page only in a dev build", () => {
    expect(allowedParentOrigin("https://www.youtube.com", false, BOTH_SITES)).toBe(true);
    expect(allowedParentOrigin("https://www.twitch.tv", false, BOTH_SITES)).toBe(true);
    expect(allowedParentOrigin("https://evil.example", false, BOTH_SITES)).toBe(false);
    expect(allowedParentOrigin("http://www.youtube.com", false, BOTH_SITES)).toBe(false);
    expect(allowedParentOrigin("http://127.0.0.1:8770", false, BOTH_SITES)).toBe(false);
    expect(allowedParentOrigin("http://127.0.0.1:8770", true, BOTH_SITES)).toBe(true);
    expect(allowedParentOrigin("http://127.0.0.1.evil.example", true, BOTH_SITES)).toBe(false);
    // localhost: a second local site for the smoke check, dev builds only.
    expect(allowedParentOrigin("http://localhost:8770", false, BOTH_SITES)).toBe(false);
    expect(allowedParentOrigin("http://localhost:8770", true, BOTH_SITES)).toBe(true);
    expect(allowedParentOrigin("http://localhost.evil.example", true, BOTH_SITES)).toBe(false);
  });

  it("accepts only the sites turned on", () => {
    expect(allowedParentOrigin("https://www.youtube.com", false, { youtube: true, twitch: false })).toBe(true);
    expect(allowedParentOrigin("https://www.twitch.tv", false, { youtube: true, twitch: false })).toBe(false);
    expect(allowedParentOrigin("https://www.youtube.com", false, { youtube: false, twitch: true })).toBe(false);
    expect(allowedParentOrigin("https://www.twitch.tv", false, { youtube: false, twitch: true })).toBe(true);
  });
});

describe("facts requests on the channel", () => {
  it("accepts {want: true, releaseId, cardId} and nothing else", () => {
    const ok = { want: true, releaseId: "0123456789abcdef", cardId: "999" };
    expect(parseFactsRequest(ok)).toEqual(ok);
    for (const bad of [{ ...ok, want: 1 }, { ...ok, releaseId: "x" }, { ...ok, cardId: "" }, null, "want"]) expect(parseFactsRequest(bad)).toBeNull();
  });
});
