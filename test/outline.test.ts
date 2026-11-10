// @vitest-environment happy-dom
// SPDX-License-Identifier: Apache-2.0
// The hovered card's outline: the box mapped onto the picture on screen, and an element that
// never takes the pointer.
import { describe, expect, it, vi } from "vitest";

import { pictureRect, type Rect } from "../src/content/geometry.js";
import { CardOutline, MIN_OUTLINE_SIDE, OUTLINE_WIDTH, outlineEdgeStyle, outlinePlacement, outlineRect } from "../src/content/outline.js";
import { OUTLINE_COLOR, OUTLINE_GLOW_COLOR } from "../src/constants.js";

/** Equal to a hundredth of a pixel (fractions do not add up exactly in floating point). */
function expectRect(actual: Rect | null, expected: Rect): void {
  expect(actual).not.toBeNull();
  for (const k of ["left", "top", "width", "height"] as const) expect(actual![k]).toBeCloseTo(expected[k], 2);
}

const box = { x: 0.25, y: 0.5, width: 0.1, height: 0.2 };

describe("outlineRect", () => {
  it("maps the box onto the picture", () => {
    expectRect(outlineRect({ left: 10, top: 20, width: 1000, height: 500 }, box), { left: 260, top: 270, width: 100, height: 100 });
  });

  it("follows letterboxing: a 16:9 picture in a taller element (contain)", () => {
    const picture = pictureRect({ left: 0, top: 0, width: 800, height: 600 }, { width: 1920, height: 1080 }, "contain");
    expect(picture).toEqual({ left: 0, top: 75, width: 800, height: 450 });
    expectRect(outlineRect(picture, box), { left: 200, top: 300, width: 80, height: 90 });
  });

  it("follows pillarboxing (full screen on a wide display) and a resized player", () => {
    const wide = pictureRect({ left: 0, top: 0, width: 2560, height: 1080 }, { width: 1920, height: 1080 }, "contain");
    expectRect(outlineRect(wide, { x: 0, y: 0, width: 0.5, height: 0.5 }), { left: 320, top: 0, width: 960, height: 540 });
    const small = pictureRect({ left: 100, top: 50, width: 480, height: 270 }, { width: 1920, height: 1080 }, "contain");
    expectRect(outlineRect(small, { x: 0, y: 0, width: 0.5, height: 0.5 }), { left: 100, top: 50, width: 240, height: 135 });
  });

  it("clips a box that reaches a little past the picture's edge", () => {
    expectRect(outlineRect({ left: 0, top: 0, width: 1000, height: 1000 }, { x: 0.95, y: 0.1, width: 0.1, height: 0.1 }), { left: 950, top: 100, width: 50, height: 100 });
  });

  it("draws nothing for a box mostly or wholly off the picture", () => {
    const picture = { left: 0, top: 0, width: 1000, height: 1000 };
    expect(outlineRect(picture, { x: 0.95, y: 0.1, width: 0.2, height: 0.1 })).toBeNull();
    expect(outlineRect(picture, { x: 1.2, y: 0.1, width: 0.1, height: 0.1 })).toBeNull();
    expect(outlineRect(picture, { x: -0.5, y: -0.5, width: 0.2, height: 0.2 })).toBeNull();
  });

  it("draws nothing when the picture's geometry is unknown or degenerate", () => {
    expect(outlineRect({ left: 0, top: 0, width: 1000, height: 500 }, box, false)).toBeNull();
    expect(outlineRect({ left: 0, top: 0, width: 0, height: 500 }, box)).toBeNull();
    expect(outlineRect({ left: Number.NaN, top: 0, width: 1000, height: 500 }, box)).toBeNull();
    expect(outlineRect({ left: 0, top: 0, width: 1000, height: 500 }, { ...box, width: 0 })).toBeNull();
    expect(outlineRect({ left: 0, top: 0, width: 1000, height: 500 }, { ...box, height: Number.POSITIVE_INFINITY })).toBeNull();
  });

  it("draws nothing for a box too small to see", () => {
    expect(outlineRect({ left: 0, top: 0, width: 100, height: 100 }, { x: 0.5, y: 0.5, width: (MIN_OUTLINE_SIDE - 1) / 100, height: 0.2 })).toBeNull();
  });
});

describe("outlinePlacement: a turned card", () => {
  const picture = { left: 10, top: 20, width: 1000, height: 500 };

  it("is outlineRect, unturned, for an upright card", () => {
    expect(outlinePlacement(picture, { box })).toEqual({ ...outlineRect(picture, box)!, rotation: 0 });
    // Never rotation 0 from the toolkit, but drawn upright if it came.
    expect(outlinePlacement(picture, { box, rotation: 0, localWidth: 0.05, localHeight: 0.1 })).toEqual({ ...outlineRect(picture, box)!, rotation: 0 });
  });

  it("is the card's own sides about the center of its box, turned (computeCardQuad, as CSS draws it)", () => {
    // Box center: (10 + 0.3 * 1000, 20 + 0.6 * 500) = (310, 320); sides 80 x 90 px.
    const p = outlinePlacement(picture, { box, rotation: 12.5, localWidth: 0.08, localHeight: 0.18 })!;
    expectRect(p, { left: 270, top: 275, width: 80, height: 90 });
    expect(p.rotation).toBe(12.5);
  });

  it("draws nothing where the box draws nothing, and falls back to the box for an unusable outline", () => {
    expect(outlinePlacement(picture, { box: { x: 1.2, y: 0.1, width: 0.1, height: 0.1 }, rotation: 10, localWidth: 0.05, localHeight: 0.1 })).toBeNull();
    expect(outlinePlacement(picture, { box, rotation: 10, localWidth: 0.05, localHeight: 0.1 }, false)).toBeNull();
    const upright = { ...outlineRect(picture, box)!, rotation: 0 };
    expect(outlinePlacement(picture, { box, rotation: 10, localWidth: 0.001, localHeight: 0.1 })).toEqual(upright);
    expect(outlinePlacement(picture, { box, rotation: Number.NaN, localWidth: 0.05, localHeight: 0.1 })).toEqual(upright);
    expect(outlinePlacement(picture, { box, rotation: 10, localWidth: 0.05 })).toEqual(upright);
  });
});

describe("CardOutline", () => {
  it("never takes the pointer, is hidden from assistive tech, and has nothing focusable", () => {
    document.body.innerHTML = "";
    const outline = new CardOutline(document.body, { reducedMotion: () => true });
    const el = outline.element;
    expect(el.style.pointerEvents).toBe("none");
    expect(el.style.position).toBe("fixed");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.tabIndex).toBe(-1);
    expect(el.hasAttribute("tabindex")).toBe(false);
    expect(el.style.display).toBe("none");
    outline.show({ left: 10, top: 20, width: 30, height: 40 });
    expect([el.style.display, el.style.left, el.style.top, el.style.width, el.style.height]).toEqual(["block", "10px", "20px", "30px", "40px"]);
    expect(el.style.transform).toBe("none");
    // Turned about its center, and upright again.
    outline.show({ left: 10, top: 20, width: 30, height: 40, rotation: -8 });
    expect(el.style.transform).toBe("rotate(-8deg)");
    outline.show({ left: 10, top: 20, width: 30, height: 40, rotation: 0 });
    expect(el.style.transform).toBe("none");
    outline.show(null);
    expect(el.style.display).toBe("none");
    outline.remove();
    expect(el.isConnected).toBe(false);
  });

  it("fades in once when it appears, and not at all for reduced motion", () => {
    const animate = vi.fn();
    const original = (HTMLElement.prototype as { animate?: unknown }).animate;
    (HTMLElement.prototype as { animate?: unknown }).animate = animate;
    try {
      const outline = new CardOutline(document.body, { reducedMotion: () => false });
      outline.show({ left: 0, top: 0, width: 30, height: 40 });
      outline.show({ left: 5, top: 0, width: 30, height: 40 });
      expect(animate).toHaveBeenCalledTimes(1);
      outline.hide();
      outline.show({ left: 5, top: 0, width: 30, height: 40 });
      expect(animate).toHaveBeenCalledTimes(2);
      const still = new CardOutline(document.body, { reducedMotion: () => true });
      still.show({ left: 0, top: 0, width: 30, height: 40 });
      expect(animate).toHaveBeenCalledTimes(2);
    } finally {
      (HTMLElement.prototype as { animate?: unknown }).animate = original;
    }
  });
});

describe("the outline's look", () => {
  it("is a solid edge in the configured color, fading into a glow, with a light hairline inside", () => {
    const style = outlineEdgeStyle();
    expect(style.border).toBe(`${OUTLINE_WIDTH}px solid ${OUTLINE_COLOR}`);
    expect(style.boxShadow).toBe(`0 0 10px 3px ${OUTLINE_GLOW_COLOR}, inset 0 0 0 1px rgba(255, 255, 255, 0.35)`);
    expect(style.inset).toBe(`-${OUTLINE_WIDTH}px`);
    expect(style.pointerEvents).toBe("none");
    expect(outlineEdgeStyle("#000", "red").border).toBe(`${OUTLINE_WIDTH}px solid #000`);
  });
});
