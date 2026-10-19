// SPDX-License-Identifier: Apache-2.0
// Waiting for the tooltip frame to take a picture's shape (the content script sizes the frame,
// maybe scaled down), so that the picture is never drawn into the placeholder's shape.

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

/** Resolves once `win` has the shape of `size` (within 2 %), or after FRAME_SHAPE_TIMEOUT_MS
 *  whatever shape it has. */
export function frameHasShape(size: { width: number; height: number }, win: ShapeWindow): Promise<void> {
  const fits = (): boolean => Math.abs(win.innerWidth / Math.max(1, win.innerHeight) - size.width / size.height) < 0.02;
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
