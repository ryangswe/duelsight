// SPDX-License-Identifier: Apache-2.0
// Waiting for the tooltip frame to take a picture's shape before the picture replaces the
// placeholder.
import { afterEach, describe, expect, it, vi } from "vitest";

import { FRAME_SHAPE_TIMEOUT_MS, frameHasShape, type ShapeWindow } from "../src/tooltip/frame-shape.js";

function fakeWindow(width: number, height: number) {
  const listeners = new Set<() => void>();
  const win: ShapeWindow & { resize(w: number, h: number): void; listeners: Set<() => void> } = {
    innerWidth: width,
    innerHeight: height,
    addEventListener: (_type, l) => void listeners.add(l),
    removeEventListener: (_type, l) => void listeners.delete(l),
    setTimeout: (h, ms) => setTimeout(h, ms),
    clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
    resize(w, h) {
      this.innerWidth = w;
      this.innerHeight = h;
      for (const l of [...listeners]) l();
    },
    listeners,
  };
  return win;
}

afterEach(() => vi.useRealTimers());

describe("frameHasShape", () => {
  it("resolves at once when the frame already has the shape (scaled sizes count)", async () => {
    let done = false;
    void frameHasShape({ width: 320, height: 448 }, fakeWindow(245, 343)).then(() => (done = true));
    await Promise.resolve();
    expect(done).toBe(true);
  });

  it("waits for a resize that gives the frame the shape, then stops listening", async () => {
    vi.useFakeTimers();
    const win = fakeWindow(320, 448);
    let done = false;
    void frameHasShape({ width: 448, height: 320 }, win).then(() => (done = true));
    await Promise.resolve();
    expect(done).toBe(false);
    win.resize(330, 448); // a resize, still portrait
    await Promise.resolve();
    expect(done).toBe(false);
    win.resize(448, 320);
    await Promise.resolve();
    expect(done).toBe(true);
    expect(win.listeners.size).toBe(0);
  });

  it("gives up after FRAME_SHAPE_TIMEOUT_MS (400 ms) whatever the shape", async () => {
    vi.useFakeTimers();
    expect(FRAME_SHAPE_TIMEOUT_MS).toBe(400);
    const win = fakeWindow(320, 448);
    let done = false;
    void frameHasShape({ width: 448, height: 320 }, win).then(() => (done = true));
    vi.advanceTimersByTime(399);
    await Promise.resolve();
    expect(done).toBe(false);
    vi.advanceTimersByTime(1);
    await Promise.resolve();
    expect(done).toBe(true);
    expect(win.listeners.size).toBe(0);
  });

  it("with a panel, waits for the picture and its panel together (side by side or stacked)", async () => {
    vi.useFakeTimers();
    const win = fakeWindow(320, 466);
    let done = false;
    void frameHasShape({ width: 320, height: 466 }, win, true).then(() => (done = true));
    await Promise.resolve();
    // The picture's own shape is not the combined one.
    expect(done).toBe(false);
    win.resize(620, 466);
    await Promise.resolve();
    expect(done).toBe(true);
    expect(win.listeners.size).toBe(0);
    let stacked = false;
    void frameHasShape({ width: 320, height: 466 }, fakeWindow(300, 700), true).then(() => (stacked = true));
    await Promise.resolve();
    expect(stacked).toBe(true);
  });
});
