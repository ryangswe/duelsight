// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import { analysisSize, CARD_PAD, clearlyBetter, fitBesideCard, fitTooltipSize, fractionIn, MIN_ART_WIDTH, pictureRect, tooltipRadius, placeTooltip, placeTooltipAvoiding, scaleTooltipSize, TOOLTIP_GAP, VIEWPORT_MARGIN } from "../src/content/geometry.js";
import { isActivePage } from "../src/content/site.js";

/** Both sites on, whatever the build's config turns on (the config's own sites: build-data.test.ts). */
const BOTH_SITES = { youtube: true, twitch: true };

describe("pictureRect", () => {
  it("letterboxes a 16:9 picture in a 4:3 box (object-fit: contain)", () => {
    expect(pictureRect({ left: 0, top: 0, width: 800, height: 600 }, { width: 1920, height: 1080 }, "contain")).toEqual({ left: 0, top: 75, width: 800, height: 450 });
  });
  it("pillarboxes a 4:3 picture in a 16:9 box", () => {
    expect(pictureRect({ left: 10, top: 20, width: 1600, height: 900 }, { width: 640, height: 480 }, "contain")).toEqual({ left: 210, top: 20, width: 1200, height: 900 });
  });
  it("fills for object-fit: fill and before the picture has a size", () => {
    expect(pictureRect({ left: 0, top: 0, width: 800, height: 600 }, { width: 1920, height: 1080 }, "fill")).toEqual({ left: 0, top: 0, width: 800, height: 600 });
    expect(pictureRect({ left: 0, top: 0, width: 800, height: 600 }, { width: 0, height: 0 }, "contain")).toEqual({ left: 0, top: 0, width: 800, height: 600 });
  });
});

describe("fractionIn", () => {
  const r = { left: 100, top: 50, width: 200, height: 100 };
  it("maps a point inside", () => expect(fractionIn(r, 150, 75)).toEqual({ x: 0.25, y: 0.25 }));
  it("is null outside, including the letterbox bars", () => {
    expect(fractionIn(r, 99, 75)).toBeNull();
    expect(fractionIn(r, 150, 151)).toBeNull();
  });
});

describe("analysisSize", () => {
  const range = { min: 720, max: 1920 };
  it("keeps a width inside the range", () => expect(analysisSize(1280, 720, range)).toEqual({ width: 1280, height: 720 }));
  it("enlarges a narrow picture", () => expect(analysisSize(640, 360, range)).toEqual({ width: 720, height: 405 }));
  it("reduces a wide one", () => expect(analysisSize(3840, 2160, range)).toEqual({ width: 1920, height: 1080 }));
});

describe("placeTooltip", () => {
  const size = { width: 280, height: 460 };
  const viewport = { width: 1400, height: 900 };
  it("goes to the right of the card when it fits", () => {
    expect(placeTooltip({ left: 100, top: 300, width: 100, height: 140 }, size, viewport)).toEqual({ left: 200 + TOOLTIP_GAP, top: 140 });
  });
  it("goes to the left when the right is too narrow", () => {
    expect(placeTooltip({ left: 1200, top: 300, width: 100, height: 140 }, size, viewport).left).toBe(1200 - TOOLTIP_GAP - 280);
  });
  it("stays inside the viewport vertically", () => {
    expect(placeTooltip({ left: 100, top: 0, width: 100, height: 40 }, size, viewport).top).toBe(VIEWPORT_MARGIN);
    expect(placeTooltip({ left: 100, top: 880, width: 100, height: 20 }, size, viewport).top).toBe(900 - VIEWPORT_MARGIN - 460);
  });
  it("hugs the edge when neither side fits", () => {
    expect(placeTooltip({ left: 100, top: 100, width: 300, height: 100 }, size, { width: 500, height: 900 }).left).toBe(500 - VIEWPORT_MARGIN - 280);
  });
});

describe("isActivePage", () => {
  it.each([
    ["https://www.youtube.com/watch?v=abc", false, true],
    ["https://www.youtube.com/embed/abc", false, true],
    ["https://www.youtube.com/live/abc", false, true],
    ["https://www.youtube.com/", false, false],
    ["https://www.youtube.com/results?search_query=one+piece", false, false],
    ["https://www.youtube.com/shorts/abc", false, false],
    ["https://www.youtube.com/@somechannel/live", false, true],
    ["https://www.youtube.com/@somechannel/live/", false, true],
    ["https://www.youtube.com/channel/UC123abc/live", false, true],
    ["https://www.youtube.com/c/SomeName/live", false, true],
    ["https://www.youtube.com/user/somename/live", false, true],
    ["https://www.youtube.com/@somechannel", false, false],
    ["https://www.youtube.com/@somechannel/videos", false, false],
    ["https://www.youtube.com/@a/b/live", false, false],
    ["https://www.youtube.com/feed/live", false, false],
    ["https://www.twitch.tv/somechannel", false, true],
    ["https://www.twitch.tv/videos/123", false, true],
    ["http://127.0.0.1:8770/", false, false],
    ["http://127.0.0.1:8770/", true, true],
    ["https://example.org/watch", true, false],
  ])("%s (dev %s) → %s", (url, dev, active) => expect(isActivePage(new URL(url), dev, BOTH_SITES)).toBe(active));
});

describe("placeTooltipAvoiding", () => {
  const size = { width: 280, height: 460 };
  const viewport = { width: 1400, height: 900 };
  it("goes to the right when nothing is there", () => {
    expect(placeTooltipAvoiding({ left: 100, top: 300, width: 100, height: 140 }, size, viewport, [])).toEqual({ left: 210, top: 140 });
  });
  it("goes to the left when the right side has cards and the left does not", () => {
    const card = { left: 600, top: 300, width: 100, height: 140 };
    const neighbors = [{ left: 710, top: 300, width: 100, height: 140 }, { left: 820, top: 300, width: 100, height: 140 }];
    expect(placeTooltipAvoiding(card, size, viewport, neighbors)).toEqual({ left: 600 - TOOLTIP_GAP - 280, top: 140 });
  });
  it("never covers the hovered card when another place exists", () => {
    const card = { left: 1200, top: 300, width: 150, height: 200 };
    const at = placeTooltipAvoiding(card, size, viewport, []);
    expect(at.left + 280).toBeLessThanOrEqual(1200);
  });
  it("stays below the player's top (a site's header)", () => {
    expect(placeTooltipAvoiding({ left: 100, top: 60, width: 100, height: 40 }, size, viewport, [], 50).top).toBeGreaterThanOrEqual(50);
    expect(placeTooltipAvoiding({ left: 100, top: 60, width: 100, height: 40 }, size, viewport, [], 120).top).toBe(120);
  });
});

describe("placeTooltipAvoiding: viewport and stickiness", () => {
  const size = { width: 280, height: 460 };
  const viewport = { width: 1400, height: 900 };
  it("stays inside the viewport when the player's top leaves no room below it", () => {
    const at = placeTooltipAvoiding({ left: 100, top: 700, width: 100, height: 140 }, size, viewport, [], 600);
    expect(at.top).toBe(900 - VIEWPORT_MARGIN - 460);
    expect(at.top + 460).toBeLessThanOrEqual(900 - VIEWPORT_MARGIN);
  });

  it("is clearly better only with a card fewer and a quarter less area", () => {
    expect(clearlyBetter({ cards: 0, area: 0 }, { cards: 1, area: 100 })).toBe(true);
    expect(clearlyBetter({ cards: 1, area: 90 }, { cards: 2, area: 100 })).toBe(false);
    expect(clearlyBetter({ cards: 1, area: 70 }, { cards: 2, area: 100 })).toBe(true);
    expect(clearlyBetter({ cards: 1, area: 10 }, { cards: 1, area: 100 })).toBe(false);
  });

  it("keeps its spot beside the card unless another covers clearly less", () => {
    const card = { left: 600, top: 300, width: 100, height: 140 };
    // Shown on the right, covering a sliver of one card; the left covers a slightly smaller
    // sliver of one card. Not a card fewer: it stays on the right.
    const others = [
      { left: 280, top: 300, width: 40, height: 20 },
      { left: 280, top: 700, width: 40, height: 20 },
      { left: 980, top: 300, width: 30, height: 30 },
    ];
    const right = { left: 600 + 100 + TOOLTIP_GAP, top: 140 };
    expect(placeTooltipAvoiding(card, size, viewport, others, 0, right)).toEqual(right);
    // A spot covering a whole card moves when a free one exists.
    const crowded = [{ left: 720, top: 300, width: 200, height: 300 }];
    expect(placeTooltipAvoiding(card, size, viewport, crowded, 0, right)).not.toEqual(right);
  });

  it("does not stay at a spot that is no longer beside the card", () => {
    const card = { left: 100, top: 300, width: 100, height: 140 };
    const far = { left: 900, top: 100 };
    expect(placeTooltipAvoiding(card, size, viewport, [], 0, far)).toEqual({ left: 210, top: 140 });
  });
});

describe("placeTooltipAvoiding with a large picture", () => {
  it("never covers the hovered card when a place beside it is free, however many other cards that place covers", () => {
    // The live deck-builder case: a grid of cards, the hovered one in its first row.
    const card = { left: 483, top: 455, width: 73, height: 93 };
    const grid = [];
    for (let r = 0; r < 3; r += 1) for (let c = -5; c < 12; c += 1) grid.push({ left: 483 + c * 73, top: 455 + r * 98, width: 70, height: 93 });
    const others = grid.filter((g) => g.left !== card.left || g.top !== card.top);
    const at = placeTooltipAvoiding(card, { width: 320, height: 448 }, { width: 1400, height: 863 }, others, 50);
    const covers = at.left < card.left + card.width && at.left + 320 > card.left && at.top < card.top + card.height && at.top + 448 > card.top;
    expect(covers).toBe(false);
  });
});

describe("placeTooltipAvoiding near the hovered card", () => {
  it("does not take a viewport-clamped spot a pixel or two from the card (it would cover the outline)", () => {
    // Near the right edge: the right-hand spot (1400 - 8 - 320 = 1072) is clamped back to
    // 1.2 px from the card's right side (1070.8).
    const card = { left: 990.8, top: 300, width: 80, height: 110 };
    const viewport = { width: 1400, height: 900 };
    const at = placeTooltipAvoiding(card, { width: 320, height: 448 }, viewport, [], 0);
    const gapRight = at.left - (card.left + card.width);
    const gapLeft = card.left - (at.left + 320);
    const gapBelow = at.top - (card.top + card.height);
    const gapAbove = card.top - (at.top + 448);
    expect(Math.max(gapRight, gapLeft, gapBelow, gapAbove)).toBeGreaterThanOrEqual(8);
    expect(CARD_PAD).toBeGreaterThanOrEqual(2);
  });
});

describe("fitBesideCard", () => {
  const size = { width: 320, height: 448 };
  const viewport = { width: 1400, height: 863 };
  it("keeps the size when one side of the card has room for it", () => {
    expect(fitBesideCard({ left: 100, top: 400, width: 70, height: 95 }, size, viewport, 50)).toEqual(size);
  });
  it("shrinks a picture that has no room on any side of the card", () => {
    // A 600 x 500 window, a card in the middle: no side has 320 x 448.
    const card = { left: 260, top: 200, width: 80, height: 110 };
    const fitted = fitBesideCard(card, size, { width: 600, height: 500 }, 0);
    expect(fitted.width).toBeLessThan(320);
    expect(fitted.width / fitted.height).toBeCloseTo(320 / 448, 2);
    const at = placeTooltipAvoiding(card, fitted, { width: 600, height: 500 }, [], 0);
    const covers = at.left < card.left + card.width && at.left + fitted.width > card.left && at.top < card.top + card.height && at.top + fitted.height > card.top;
    expect(covers).toBe(false);
  });
  it("never goes below the floor", () => {
    expect(fitBesideCard({ left: 10, top: 10, width: 1380, height: 840 }, size, viewport, 0)).toEqual({ width: MIN_ART_WIDTH, height: 280 });
  });
});

describe("fitTooltipSize", () => {
  const card = { width: 320, height: 448, shape: "card" as const };
  it("keeps a card picture's size when the page has room for it", () => {
    expect(fitTooltipSize(card, { width: 1400, height: 900 }, 60)).toEqual({ width: 320, height: 448 });
  });
  it("scales it down, keeping its shape, when the space below the player's top is short", () => {
    // 600 - 8 - 100 = 492 tall available: fits; 400 - 8 - 100 = 292: scaled to 292 / 448.
    expect(fitTooltipSize(card, { width: 1400, height: 600 }, 100)).toEqual({ width: 320, height: 448 });
    expect(fitTooltipSize(card, { width: 1400, height: 400 }, 100)).toEqual({ width: 208, height: 291 });
  });
  it("uses the viewport's top when the player starts above it (scrolled)", () => {
    expect(fitTooltipSize(card, { width: 1400, height: 400 }, -200)).toEqual({ width: 274, height: 383 });
  });
  it("scales to the width too, and never below 200 wide", () => {
    expect(fitTooltipSize(card, { width: 300, height: 900 }, 0)).toEqual({ width: 284, height: 397 });
    expect(fitTooltipSize(card, { width: 1400, height: 200 }, 0)).toEqual({ width: MIN_ART_WIDTH, height: 280 });
    expect(fitTooltipSize(card, { width: 10, height: 10 }, 0)).toEqual({ width: MIN_ART_WIDTH, height: 280 });
  });
  it("never overshoots the room by a pixel, whatever the window", () => {
    for (let h = 220; h <= 470; h += 1) {
      for (const top of [-50, 0, 8, 60, 100]) {
        const fitted = fitTooltipSize(card, { width: 1400, height: h }, top);
        const room = h - 8 - Math.max(8, top);
        if (fitted.width > MIN_ART_WIDTH) expect(fitted.height).toBeLessThanOrEqual(room);
      }
    }
  });
  it("caps landscape art the same way, and leaves a name pill as it is", () => {
    expect(fitTooltipSize({ width: 448, height: 320, shape: "card" }, { width: 1400, height: 900 }, 0)).toEqual({ width: 448, height: 320 });
    expect(fitTooltipSize({ width: 448, height: 320, shape: "card" }, { width: 400, height: 900 }, 0)).toEqual({ width: 384, height: 274 });
    expect(fitTooltipSize({ width: 140, height: 32, shape: "pill" }, { width: 100, height: 20 }, 0)).toEqual({ width: 140, height: 32 });
  });
  it("rounds a card's corners at 4.5 % of its width, and a pill's ends fully", () => {
    expect(tooltipRadius({ width: 320, height: 448 }, "card")).toBe(14);
    expect(tooltipRadius({ width: 200, height: 280 }, "card")).toBe(9);
    expect(tooltipRadius({ width: 140, height: 32 }, "pill")).toBe(16);
  });
});

describe("scaleTooltipSize (the card-size dial)", () => {
  const card = { width: 320, height: 448, shape: "card" as const };
  it("scales a card picture, keeping its shape, and leaves a pill (the name) as it is", () => {
    expect(scaleTooltipSize(card, 1.3)).toEqual({ width: 416, height: 582, shape: "card" });
    expect(scaleTooltipSize(card, 0.7)).toEqual({ width: 224, height: 314, shape: "card" });
    expect(scaleTooltipSize(card, 1)).toBe(card);
    const pill = { width: 130, height: 33, shape: "pill" as const };
    expect(scaleTooltipSize(pill, 1.3)).toBe(pill);
  });

  it("keeps the other fields of the size", () => {
    expect(scaleTooltipSize({ ...card, cardId: "a", seq: 3 }, 1.1)).toEqual({ width: 352, height: 493, shape: "card", cardId: "a", seq: 3 });
  });

  it("ignores a factor that is not a positive number", () => {
    for (const bad of [0, -1, Number.NaN]) expect(scaleTooltipSize(card, bad)).toBe(card);
  });

  it("is fitted after scaling: a larger card still stays inside the viewport", () => {
    const big = scaleTooltipSize(card, 1.3);
    expect(fitTooltipSize(big, { width: 1280, height: 720 }, 56)).toEqual({ width: 416, height: 582 });
    // 500 - 8 - 8 = 484 tall: 416 x 582 becomes 345 x 482, its shape kept.
    expect(fitTooltipSize(big, { width: 1280, height: 500 })).toEqual({ width: 345, height: 482 });
  });

  it("is fitted after scaling: a larger card still stays off the card", () => {
    const viewport = { width: 900, height: 720 };
    const hovered = { left: 400, top: 200, width: 80, height: 116 };
    const fitted = fitBesideCard(hovered, fitTooltipSize(scaleTooltipSize(card, 1.3), viewport, 56), viewport, 56);
    expect(fitted.width).toBeLessThan(416);
    expect(Math.abs(fitted.height / fitted.width - 582 / 416)).toBeLessThan(0.01);
    const at = placeTooltipAvoiding(hovered, fitted, viewport, [], 56);
    const r = { left: at.left, top: at.top, width: fitted.width, height: fitted.height };
    const apart = r.left >= hovered.left + hovered.width || r.left + r.width <= hovered.left || r.top >= hovered.top + hovered.height || r.top + r.height <= hovered.top;
    expect(apart).toBe(true);
    expect(r.left).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
    expect(r.left + r.width).toBeLessThanOrEqual(viewport.width - VIEWPORT_MARGIN);
  });

  it("a smaller card is shown smaller where the full size would fit", () => {
    const small = scaleTooltipSize(card, 0.7);
    const viewport = { width: 1000, height: 720 };
    expect(fitBesideCard({ left: 500, top: 200, width: 80, height: 116 }, fitTooltipSize(small, viewport, 56), viewport, 56)).toEqual({ width: 224, height: 314 });
  });
});
