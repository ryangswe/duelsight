// SPDX-License-Identifier: Apache-2.0
// DuelSight's product module for the toolkit's shared hover browser test (test/browser/product.mjs)
// has the shape the vendored harness checks before a run, and slot C comes back in time for the
// arrival check.
import { describe, expect, it } from "vitest";

// The vendored harness ships no declarations (`--harness` copies its .mjs files only).
// @ts-expect-error -- untyped vendored module
import { CHECKS } from "../vendor/cardvision-browser/harness/clauses.mjs";
// @ts-expect-error -- untyped vendored module
import { LIMIT_DEFAULTS, productProblems } from "../vendor/cardvision-browser/harness/product-shape.mjs";
import product from "./browser/product.mjs";

describe("test/browser/product.mjs", () => {
  it("has the shape the vendored harness takes", () => {
    expect(CHECKS).toContain("arrives-under-rest");
    expect(productProblems(product, CHECKS)).toEqual([]);
  });

  it("brings slot C back, so the arrival check runs instead of being unsupported", () => {
    const { until = Number.NaN, back = Number.NaN } = product.places.C;
    expect(back - until).toBeGreaterThanOrEqual(2);
    expect(back - until).toBeLessThanOrEqual(6);
    expect(back + LIMIT_DEFAULTS.arrivalMs / 1000 + 0.5).toBeLessThanOrEqual(product.clip.seconds);
    expect(product.unsupported).toBeUndefined();
  });
});
