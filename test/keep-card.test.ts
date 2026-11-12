// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import { KEEP_CARD_KEY, keepCardFlipped, readKeepCardOn } from "../src/shared/keep-card.js";
import { memoryStorage } from "./helpers/memory-storage.js";

describe("Keep the card I'm pointing at (owner, 2026-11-12)", () => {
  it("is on unless stored false", async () => {
    expect(await readKeepCardOn(memoryStorage())).toBe(true);
    expect(await readKeepCardOn(memoryStorage({ [KEEP_CARD_KEY]: true }))).toBe(true);
    expect(await readKeepCardOn(memoryStorage({ [KEEP_CARD_KEY]: false }))).toBe(false);
  });

  it("counts only a change between on and off (missing is on)", () => {
    expect(keepCardFlipped(undefined)).toBe(false);
    expect(keepCardFlipped({ newValue: false })).toBe(true);
    expect(keepCardFlipped({ oldValue: false, newValue: true })).toBe(true);
    expect(keepCardFlipped({ oldValue: false })).toBe(true);
    expect(keepCardFlipped({ newValue: true })).toBe(false);
    expect(keepCardFlipped({ oldValue: true, newValue: true })).toBe(false);
    expect(keepCardFlipped({ oldValue: false, newValue: false })).toBe(false);
  });
});
