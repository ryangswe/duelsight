// SPDX-License-Identifier: Apache-2.0
// scripts/store-assets.mjs and scripts/store-templates.mjs: the Chrome Web Store images' sizes,
// layouts and copy, and the clips file's checks. (Taking the captures needs Chrome; not part of
// npm test.)
import { describe, expect, it } from "vitest";

// @ts-expect-error plain JavaScript build scripts
import { clipsProblems, placeVideo } from "../scripts/store-assets.mjs";
// @ts-expect-error plain JavaScript build scripts
import { cropAround, DISCLAIMER, fit, MARQUEE, marquee, SCREENSHOTS, SHOT, sideShot, SMALL_TILE, smallTile } from "../scripts/store-templates.mjs";

type Rect = { x: number; y: number; width: number; height: number };
const IMG = "data:image/png;base64,AAAA";
const size = { width: 1280, height: 721 };
const tooltip: Rect = { x: 125, y: 323, width: 580, height: 426 };

describe("placeVideo", () => {
  it("shows a 16:9 clip at the full width of 1280×800", () => {
    expect(placeVideo(1920, 1080)).toEqual({ width: 1280, height: 720, scale: 1280 / 1920 });
  });

  it("shows a tall clip at the full height", () => {
    const p = placeVideo(910, 1046);
    expect(p.height).toBe(800);
    expect(p.width).toBe(Math.round(910 * (800 / 1046)));
  });
});

describe("clipsProblems", () => {
  const good = { "master-duel": { video: "/c/md.webm", card: [793, 351] }, paper: { video: "/c/paper.webm", card: [576, 493] } };

  it("accepts both clips with a card each", () => {
    expect(clipsProblems(good)).toEqual([]);
  });

  it("refuses a missing clip, a still image, a bad point and an unknown clip", () => {
    expect(clipsProblems({ paper: good.paper })[0]).toMatch(/master-duel: missing/);
    expect(clipsProblems({ ...good, paper: { ...good.paper, video: "/c/frame.png" } })[0]).toMatch(/video/);
    expect(clipsProblems({ ...good, paper: { ...good.paper, card: [1, -2] } })[0]).toMatch(/card/);
    expect(clipsProblems({ ...good, extra: good.paper })[0]).toMatch(/not a clip/);
    expect(clipsProblems([])).toHaveLength(1);
  });
});

describe("layouts", () => {
  const pages: Array<[string, string, { width: number; height: number }]> = [
    ["side", sideShot({ icon: IMG, title: "T", lead: "L", image: IMG, imageSize: size }), SHOT],
    ["small tile", smallTile({ icon: IMG, image: IMG, imageSize: size, tooltip }), SMALL_TILE],
    ["marquee", marquee({ icon: IMG, image: IMG, imageSize: size, tooltip }), MARQUEE],
  ];

  it("has the store's sizes", () => {
    expect([SHOT, SMALL_TILE, MARQUEE]).toEqual([{ width: 1280, height: 800 }, { width: 440, height: 280 }, { width: 1400, height: 560 }]);
  });

  for (const [name, html, dims] of pages) {
    it(`${name}: its size, the unofficial line, and nothing fetched from elsewhere`, () => {
      expect(html).toContain(`body { width: ${dims.width}px; height: ${dims.height}px; }`);
      expect(html).toContain(DISCLAIMER);
      expect(html).not.toMatch(/<script|<link|@import|url\(|src="(?!data:)/i);
    });
  }

  it("never breaks the game's name at its hyphens", () => {
    for (const [, html] of pages.slice(2)) expect(html).toContain('<span style="white-space:nowrap">Yu-Gi-Oh!</span>');
  });
});

describe("screenshots", () => {
  it("are four, in listing order, with the card-details-off shot and no button (there is none)", () => {
    expect(SCREENSHOTS.map((s: { name: string }) => s.name)).toEqual(["1-hover", "2-paper", "3-card-alone", "4-popup"]);
  });

  it("say what the extension does and nothing more", () => {
    for (const s of SCREENSHOTS as Array<{ title: string; lead: string }>) {
      expect(`${s.title} ${s.lead}`).not.toMatch(/\b(first|only|best|always|reliable|accurate|every card)\b|any video|%/i);
    }
  });
});

describe("fit and cropAround", () => {
  it("fits a picture inside a box, keeping its shape", () => {
    expect(fit(1280, 721, 740, 640)).toEqual({ width: 740, height: Math.round(721 * (740 / 1280)), k: 740 / 1280 });
  });

  it("crops around the tooltip at the box's shape, inside the capture", () => {
    for (const aspect of [176 / 236, 600 / 504]) {
      const c = cropAround(tooltip, size, aspect);
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.width).toBeLessThanOrEqual(size.width);
      expect(c.y + c.height).toBeLessThanOrEqual(size.height);
      expect(c.width / c.height).toBeCloseTo(aspect, 1);
      expect(tooltip.x + tooltip.width / 2).toBeGreaterThan(c.x);
      expect(tooltip.x + tooltip.width / 2).toBeLessThan(c.x + c.width);
    }
  });
});
