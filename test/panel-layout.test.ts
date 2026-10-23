// SPDX-License-Identifier: Apache-2.0
// The details panel's layout: the frame's arrangement from its size, and the size the content
// script gives a tooltip with its panel (side by side when there is room, stacked in a narrow
// window, the text never scaled).
import { describe, expect, it } from "vitest";

import { fitsBesideCard, fitWithPanel, VIEWPORT_MARGIN } from "../src/content/geometry.js";
import { arrange, DETAILS_MIN_ART_WIDTH, PANEL_MIN_WIDTH, PANEL_WIDTHS, panelHeightAt } from "../src/shared/panel-layout.js";

const ART = { width: 320, height: 466 };
/** Text whose area is `area` px² below a 70 px heading, measured at every panel width. */
const heights = (area: number): Array<[number, number]> => PANEL_WIDTHS.map((w) => [w, Math.ceil(70 + area / (w - 24))]);
const SHORT = heights(40_000);
const LONG = heights(150_000);
const HUGE = heights(400_000);

describe("panelHeightAt", () => {
  it("is the measured height at a measured width", () => {
    expect(panelHeightAt([[220, 500], [260, 420]], 260)).toBe(420);
  });
  it("between two widths, the narrower one's: never less than the real height", () => {
    expect(panelHeightAt([[220, 500], [260, 420]], 240)).toBe(500);
  });
  it("wider than all, the widest one's; narrower than all, scaled up from the narrowest", () => {
    expect(panelHeightAt([[220, 500]], 440)).toBe(500);
    expect(panelHeightAt([[220, 500]], 110)).toBe(1000);
    expect(panelHeightAt([], 300)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("arrange", () => {
  it("is the picture alone in the picture's own shape (any scale, rounding allowed)", () => {
    expect(arrange({ width: 320, height: 466 }, ART)).toEqual({ kind: "art", art: { left: 0, top: 0, width: 320, height: 466 }, panel: null });
    expect(arrange({ width: 245, height: 358 }, ART).kind).toBe("art");
  });
  it("is side by side in a wider frame: the picture as tall as the frame, the panel beside it", () => {
    expect(arrange({ width: 620, height: 466 }, ART)).toEqual({
      kind: "side",
      art: { left: 0, top: 0, width: 320, height: 466 },
      panel: { left: 320, top: 0, width: 300, height: 466 },
    });
  });
  it("is stacked in a taller frame: the picture as wide as the frame, the panel under it", () => {
    expect(arrange({ width: 300, height: 700 }, ART)).toEqual({
      kind: "stacked",
      art: { left: 0, top: 0, width: 300, height: 437 },
      panel: { left: 0, top: 437, width: 300, height: 263 },
    });
  });
  it("works for a landscape picture too", () => {
    expect(arrange({ width: 448 + 260, height: 314 }, { width: 448, height: 314 }).kind).toBe("side");
  });
});

/** Where the frame would lay out a fitted size: the same kind, a panel at least as wide as the
 *  narrowest, a picture at least DETAILS_MIN_ART_WIDTH wide. */
function laidOut(fit: { width: number; height: number; kind: string }, art = ART) {
  const plan = arrange(fit, art);
  expect(plan.kind).toBe(fit.kind);
  expect(plan.art.width).toBeGreaterThanOrEqual(DETAILS_MIN_ART_WIDTH);
  expect(plan.panel!.width).toBeGreaterThanOrEqual(PANEL_MIN_WIDTH);
  return plan;
}

describe("fitWithPanel", () => {
  const wide = { width: 1280, height: 720 };
  const card = { left: 300, top: 300, width: 80, height: 116 };

  it("puts short text side by side with the whole picture, all of it shown, beside the card", () => {
    const fit = fitWithPanel(card, ART, SHORT, wide, 56)!;
    expect(fit).toMatchObject({ kind: "side", full: true, height: 466 });
    const plan = laidOut(fit);
    expect(plan.art.width).toBe(320);
    expect(fitsBesideCard(card, fit, wide, 56)).toBe(true);
  });

  it("widens the panel for long text before cutting it", () => {
    const short = laidOut(fitWithPanel(card, ART, SHORT, wide, 56)!);
    const long = laidOut(fitWithPanel(card, ART, LONG, wide, 56)!);
    expect(long.panel!.width).toBeGreaterThan(short.panel!.width);
    expect(fitWithPanel(card, ART, LONG, wide, 56)!.full).toBe(true);
  });

  it("scales the picture, not the text, at the viewer's larger card size", () => {
    const big = fitWithPanel(card, { width: 416, height: 606 }, SHORT, wide, 56)!;
    const plan = laidOut(big, { width: 416, height: 606 });
    expect(plan.art.width).toBeGreaterThan(320);
    expect(big.height).toBeLessThanOrEqual(720 - 8 - 56);
  });

  it("stacks the text under the picture in a narrow window", () => {
    const narrow = { width: 360, height: 900 };
    const fit = fitWithPanel({ left: 140, top: 40, width: 60, height: 88 }, ART, SHORT, narrow, 0)!;
    expect(fit.kind).toBe("stacked");
    expect(fit.width).toBeLessThanOrEqual(narrow.width - 2 * VIEWPORT_MARGIN);
    laidOut(fit);
  });

  it("in a small embedded player, keeps the picture and the text inside it, cutting text that does not fit", () => {
    const player = { width: 640, height: 360 };
    const fit = fitWithPanel({ left: 288, top: 133, width: 64, height: 93 }, ART, HUGE, player, 0)!;
    expect(fit.width).toBeLessThanOrEqual(640 - 2 * VIEWPORT_MARGIN);
    expect(fit.height).toBeLessThanOrEqual(360 - 2 * VIEWPORT_MARGIN);
    expect(fit.full).toBe(false);
    laidOut(fit);
  });

  it("keeps all the text when it fits anywhere, even with a smaller picture", () => {
    const player = { width: 640, height: 360 };
    const fit = fitWithPanel({ left: 20, top: 133, width: 64, height: 93 }, ART, SHORT, player, 0)!;
    expect(fit.full).toBe(true);
    expect(fitsBesideCard({ left: 20, top: 133, width: 64, height: 93 }, fit, player, 0)).toBe(true);
  });

  it("is null when even the whole window has no room for a panel (the picture alone then)", () => {
    expect(fitWithPanel(card, ART, SHORT, { width: 300, height: 200 }, 0)).toBeNull();
  });
});
