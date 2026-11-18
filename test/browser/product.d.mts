// SPDX-License-Identifier: Apache-2.0
// Types of product.mjs, for test/hover-product.test.ts.
declare const product: {
  places: Record<"A" | "B" | "C" | "D", { x: number; y: number; from?: number; until?: number; back?: number }>;
  clip: { width: number; height: number; fps: number; seconds: number };
  unsupported?: Record<string, string>;
  [key: string]: unknown;
};
export default product;
