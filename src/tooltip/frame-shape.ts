// SPDX-License-Identifier: Apache-2.0
// Waiting for the tooltip frame to take a picture's shape (the content script sizes the frame,
// maybe scaled down), so that the picture is never drawn into the placeholder's shape. With the
// card's details panel, the shape waited for is the picture and the panel together: a frame the
// layout (panel-layout.ts) lays out side by side or stacked, so that the picture and its text
// appear together.

import { arrange } from "../shared/panel-layout.js";

/** How long to wait for the frame before showing the picture anyway. */
export const FRAME_SHAPE_TIMEOUT_MS = 400;

export interface ShapeWindow {
  innerWidth: number;
  innerHeight: number;
  addEventListener(type: "resize", listener: () => void): void;
  removeEventListener(type: "resize", listener: () => void): void;
  setTimeout(handler: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
}

/** Resolves once `win` has the shape of `size` (within 2 %), or with `panel` the shape of a
 *  picture of that shape and a panel, or after FRAME_SHAPE_TIMEOUT_MS whatever shape it has. */
export function frameHasShape(size: { width: number; height: number }, win: ShapeWindow, panel = false): Promise<void> {
  const fits = (): boolean =>
    panel
      ? arrange({ width: win.innerWidth, height: win.innerHeight }, size).kind !== "art"
      : Math.abs(win.innerWidth / Math.max(1, win.innerHeight) - size.width / size.height) < 0.02;
  if (fits()) return Promise.resolve();
  return new Promise((resolve) => {
    const done = (): void => {
      win.removeEventListener("resize", check);
      win.clearTimeout(timer);
      resolve();
    };
    const check = (): void => {
      if (fits()) done();
    };
    const timer = win.setTimeout(done, FRAME_SHAPE_TIMEOUT_MS);
    win.addEventListener("resize", check);
  });
}
