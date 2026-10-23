// SPDX-License-Identifier: Apache-2.0
// scripts/store-screenshots.mjs: where a clip sits on the 1280×800 store page, where a clip pixel
// lands on it, and the shots file's checks. (Taking screenshots needs Chrome; not part of npm test.)
import { describe, expect, it } from "vitest";

// @ts-expect-error plain JavaScript build scripts
import { pagePoint, placeVideo, shotsProblems, SIZE } from "../scripts/store-screenshots.mjs";

describe("placeVideo", () => {
  it("fills the width of a 16:9 clip and centres it vertically", () => {
    expect(placeVideo(1920, 1080)).toEqual({ left: 0, top: 40, width: 1280, height: 720, scale: 1280 / 1920 });
  });

  it("fills the height of a tall clip and centres it horizontally", () => {
    const p = placeVideo(910, 1046);
    expect(p.height).toBe(SIZE.height);
    expect(p.left).toBe(Math.round((SIZE.width - p.width) / 2));
    expect(p.top).toBe(0);
  });

  it("maps a clip pixel to the page", () => {
    const p = placeVideo(1920, 1080);
    expect(pagePoint(p, 960, 540)).toEqual({ x: 640, y: 400 });
    expect(pagePoint(p, 0, 0)).toEqual({ x: 0, y: 40 });
  });
});

describe("shotsProblems", () => {
  const good = [
    { name: "1-master-duel", video: "/clips/md.webm", hover: [793, 351] },
    { name: "3-popup", video: "/clips/paper.webm", hover: [576, 493], popup: true },
  ];

  it("accepts a well-formed list", () => {
    expect(shotsProblems(good)).toEqual([]);
  });

  it("refuses an empty list, bad names, repeats, unknown clips and bad points", () => {
    expect(shotsProblems([])).toHaveLength(1);
    expect(shotsProblems([{ ...good[0], name: "../x" }])[0]).toMatch(/name/);
    expect(shotsProblems([good[0], good[0]])[0]).toMatch(/twice/);
    expect(shotsProblems([{ ...good[0], video: "/clips/frame.png" }])[0]).toMatch(/video/);
    expect(shotsProblems([{ ...good[0], hover: [10] }])[0]).toMatch(/hover/);
    expect(shotsProblems([{ ...good[0], hover: [-1, 5] }])[0]).toMatch(/hover/);
    expect(shotsProblems([{ ...good[0], popup: "yes" }])[0]).toMatch(/popup/);
  });
});
