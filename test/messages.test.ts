// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";

import { allowedParentOrigin, MAX_FRAME_SIDE, parseComputeIn, parseComputeOut, parseTooltipIn, parseTooltipOut, tag } from "../src/shared/messages.js";

/** Both sites on, whatever the build's config turns on (the config's own sites: build-data.test.ts). */
const BOTH_SITES = { youtube: true, twitch: true };

describe("message checks", () => {
  it("round-trips every compute message the content script sends (bitmap aside)", () => {
    for (const m of [
      { kind: "pointer", x: 0.1, y: 1, mediaTime: 3.2, touch: false },
      { kind: "leave" },
      { kind: "presented", mediaTime: 0 },
      { kind: "discontinuity", newSource: true },
      { kind: "capture-failed", requestId: 3, reason: "no picture", retry: true },
      { kind: "capture-failed", requestId: 3, reason: "no pointer over the player", retry: false },
    ] as const) {
      expect(parseComputeIn(tag(m))).toEqual(m);
    }
  });

  it("refuses untagged, malformed or out-of-range messages", () => {
    expect(parseComputeIn({ kind: "leave" })).toBeNull();
    expect(parseComputeIn(tag({ kind: "pointer", x: 1.2, y: 0, mediaTime: 0, touch: false }))).toBeNull();
    expect(parseComputeIn(tag({ kind: "pointer", x: 0.5, y: 0.5, mediaTime: Number.NaN, touch: false }))).toBeNull();
    expect(parseComputeIn(tag({ kind: "frame", requestId: 1, bitmap: {}, mediaTime: 0 }))).toBeNull();
    expect(parseComputeIn(tag({ kind: "capture-failed", requestId: 0, reason: "x" }))).toBeNull();
    expect(parseComputeIn(tag({ kind: "eval" }))).toBeNull();
    expect(parseComputeIn("leave")).toBeNull();
  });

  it("checks the compute frame's replies", () => {
    const shown = { kind: "shown", card: { cardId: "OP01-001", name: "Luffy", box: { x: 0.1, y: 0.2, width: 0.2, height: 0.3 } } };
    expect(parseComputeOut(tag(shown))).toEqual({ kind: "shown", card: { ...shown.card, others: [] } });
    const withOthers = { kind: "shown", card: { ...shown.card, others: [{ x: 0.5, y: 0.5, width: 0.1, height: 0.1 }, { x: 0, y: 0, width: 0, height: 1 }] } };
    expect(parseComputeOut(tag(withOthers))).toEqual({ kind: "shown", card: { ...shown.card, others: [{ x: 0.5, y: 0.5, width: 0.1, height: 0.1 }] } });
    expect(parseComputeOut(tag({ kind: "shown", card: null }))).toEqual({ kind: "shown", card: null });
    expect(parseComputeOut(tag({ kind: "shown", card: { cardId: "", name: "x", box: shown.card.box } }))).toBeNull();
    expect(parseComputeOut(tag({ kind: "shown", card: { ...shown.card, box: { x: 0, y: 0, width: 0, height: 1 } } }))).toBeNull();
    expect(parseComputeOut(tag({ kind: "capture", requestId: 2, analysisWidth: { min: 720, max: 1920 } }))).toEqual({
      kind: "capture",
      requestId: 2,
      analysisWidth: { min: 720, max: 1920 },
    });
    expect(parseComputeOut(tag({ kind: "capture", requestId: 2, analysisWidth: { min: 900, max: 720 } }))).toBeNull();
    expect(parseComputeOut(tag({ kind: "status", state: "failed", error: "x", backend: null }))).toEqual({ kind: "status", state: "failed", error: "x", backend: null });
    expect(parseComputeOut(tag({ kind: "status", state: "weird", error: null, backend: null }))).toBeNull();
  });

  it("checks the tooltip messages", () => {
    expect(parseTooltipIn(tag({ kind: "card", cardId: "OP01-001", name: "Luffy" }))).toEqual({ kind: "card", cardId: "OP01-001", name: "Luffy" });
    expect(parseTooltipIn(tag({ kind: "card", cardId: "x".repeat(500), name: "Luffy" }))).toBeNull();
    expect(parseTooltipIn(tag({ kind: "clear" }))).toEqual({ kind: "clear" });
    expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448, shape: "card" }))).toEqual({ kind: "size", width: 320, height: 448, shape: "card" });
    expect(parseTooltipOut(tag({ kind: "size", width: 120, height: 32, shape: "pill" }))).toEqual({ kind: "size", width: 120, height: 32, shape: "pill" });
    expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448 }))).toBeNull();
    expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448, shape: "panel" }))).toBeNull();
    expect(parseTooltipOut(tag({ kind: "size", width: 280, height: 1e6, shape: "card" }))).toBeNull();
    expect(parseTooltipIn(tag({ kind: "card", cardId: "OP01-001", name: "x", seq: 7 }))).toEqual({ kind: "card", cardId: "OP01-001", name: "x", seq: 7 });
    expect(parseTooltipIn(tag({ kind: "card", cardId: "OP01-001", name: "x", seq: -1 }))).toBeNull();
    expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448, shape: "card", cardId: "A", seq: 3 }))).toEqual({ kind: "size", width: 320, height: 448, shape: "card", cardId: "A", seq: 3 });
    expect(parseTooltipOut(tag({ kind: "size", width: 320, height: 448, shape: "card", seq: 1.5 }))).toBeNull();
    // The tooltip has no link any more: such a message is not one of its messages.
    expect(parseTooltipOut(tag({ kind: "link", href: "https://en.onepiece-cardgame.com/cardlist/?freewords=OP01-001" }))).toBeNull();
  });

  it("accepts the video sites as parents, and the local test page only in a dev build", () => {
    expect(allowedParentOrigin("https://www.youtube.com", false, BOTH_SITES)).toBe(true);
    expect(allowedParentOrigin("https://www.twitch.tv", false, BOTH_SITES)).toBe(true);
    expect(allowedParentOrigin("https://evil.example", false, BOTH_SITES)).toBe(false);
    expect(allowedParentOrigin("http://www.youtube.com", false, BOTH_SITES)).toBe(false);
    expect(allowedParentOrigin("http://127.0.0.1:8770", false, BOTH_SITES)).toBe(false);
    expect(allowedParentOrigin("http://127.0.0.1:8770", true, BOTH_SITES)).toBe(true);
    expect(allowedParentOrigin("http://127.0.0.1.evil.example", true, BOTH_SITES)).toBe(false);
  });

  it("accepts only the sites turned on", () => {
    expect(allowedParentOrigin("https://www.youtube.com", false, { youtube: true, twitch: false })).toBe(true);
    expect(allowedParentOrigin("https://www.twitch.tv", false, { youtube: true, twitch: false })).toBe(false);
    expect(allowedParentOrigin("https://www.youtube.com", false, { youtube: false, twitch: true })).toBe(false);
    expect(allowedParentOrigin("https://www.twitch.tv", false, { youtube: false, twitch: true })).toBe(true);
  });
});

describe("frame size cap", () => {
  class FakeBitmap {
    constructor(
      readonly width: number,
      readonly height: number,
    ) {}
    close() {}
  }
  afterEach(() => vi.unstubAllGlobals());

  it("takes a picture up to the cap, and refuses a larger or empty one", () => {
    vi.stubGlobal("ImageBitmap", FakeBitmap);
    const frame = (w: number, h: number) => parseComputeIn(tag({ kind: "frame", requestId: 1, bitmap: new FakeBitmap(w, h), mediaTime: 0 }));
    expect(frame(1920, 1080)?.kind).toBe("frame");
    expect(frame(MAX_FRAME_SIDE, MAX_FRAME_SIDE)?.kind).toBe("frame");
    expect(frame(MAX_FRAME_SIDE + 1, 100)).toBeNull();
    expect(frame(100, MAX_FRAME_SIDE + 1)).toBeNull();
    expect(frame(0, 100)).toBeNull();
  });
});
