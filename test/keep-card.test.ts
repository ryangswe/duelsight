// SPDX-License-Identifier: Apache-2.0
// The popup's "Keep the card I'm pointing at" as stored. What a change does in a page (a new
// compute frame, at once in front and when a tab behind comes to the front) is the shared hover
// host's, tested through it in content.test.ts.
import { describe, expect, it } from "vitest";

import { KEEP_CARD_KEY, readKeepCardOn } from "../src/shared/keep-card.js";
import { memoryStorage } from "./helpers/memory-storage.js";

describe("Keep the card I'm pointing at (owner, 2026-11-12)", () => {
  it("is on unless stored false", async () => {
    expect(await readKeepCardOn(memoryStorage())).toBe(true);
    expect(await readKeepCardOn(memoryStorage({ [KEEP_CARD_KEY]: true }))).toBe(true);
    expect(await readKeepCardOn(memoryStorage({ [KEEP_CARD_KEY]: false }))).toBe(false);
  });
});
