// SPDX-License-Identifier: Apache-2.0
// The popup's card-size dial as stored: the range, the steps and the default.
import { describe, expect, it } from "vitest";

import { CARD_SIZE_KEY, clampCardSize, DEFAULT_CARD_SIZE, describeCardSize, MAX_CARD_SIZE, MIN_CARD_SIZE, readCardSize } from "../src/shared/card-size.js";
import { memoryStorage } from "./helpers/memory-storage.js";

describe("card size", () => {
  it("is 100 % by default, from 70 % to 130 %", () => {
    expect([DEFAULT_CARD_SIZE, MIN_CARD_SIZE, MAX_CARD_SIZE]).toEqual([100, 70, 130]);
  });

  it("reads the default when nothing usable is stored", async () => {
    expect(await readCardSize(memoryStorage())).toBe(100);
    for (const bad of [null, "120", true, Number.NaN, Number.POSITIVE_INFINITY, {}, [110]]) {
      expect(await readCardSize(memoryStorage({ [CARD_SIZE_KEY]: bad }))).toBe(100);
    }
  });

  it("keeps a stored size in the range, on a step of 10", async () => {
    expect(await readCardSize(memoryStorage({ [CARD_SIZE_KEY]: 120 }))).toBe(120);
    expect(clampCardSize(70)).toBe(70);
    expect(clampCardSize(130)).toBe(130);
    expect(clampCardSize(10)).toBe(70);
    expect(clampCardSize(-40)).toBe(70);
    expect(clampCardSize(500)).toBe(130);
    expect(clampCardSize(104)).toBe(100);
    expect(clampCardSize(105)).toBe(110);
    expect(clampCardSize(126)).toBe(130);
  });

  it("labels a size as a percentage", () => {
    expect(describeCardSize(100)).toBe("100%");
    expect(describeCardSize(70)).toBe("70%");
    expect(describeCardSize(999)).toBe("130%");
  });
});
