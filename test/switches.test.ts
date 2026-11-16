// SPDX-License-Identifier: Apache-2.0
// The popup's two switches as stored, read by the shared hover host's rules (createSwitches): the
// main switch and "Keep the card I'm pointing at" are on unless stored false, and on when the
// storage cannot be read. The popup writes the host's own keys (ENABLED_KEY, KEEP_CARD_KEY). What a
// change does in a page is the host's, tested through it in content.test.ts.
import { describe, expect, it } from "vitest";

import { createSwitches, ENABLED_KEY, KEEP_CARD_KEY } from "../vendor/cardvision-browser/host-settings.js";
import { memoryStorage } from "./helpers/memory-storage.js";

const NO_CHANGES = { addListener: () => undefined, removeListener: () => undefined };
const read = (data: Record<string, unknown>) => createSwitches(memoryStorage(data), NO_CHANGES);

describe("the popup's switches (owner, 2026-10-27 and 2026-11-12)", () => {
  it("are stored under the keys the popup has always used", () => {
    expect([ENABLED_KEY, KEEP_CARD_KEY]).toEqual(["enabled", "keepCard"]);
  });

  it("are on unless stored false", async () => {
    expect(await read({}).keepCard()).toBe(true);
    expect(await read({ [KEEP_CARD_KEY]: true }).keepCard()).toBe(true);
    expect(await read({ [KEEP_CARD_KEY]: false }).keepCard()).toBe(false);
    expect(await read({}).enabled()).toBe(true);
    expect(await read({ [ENABLED_KEY]: false }).enabled()).toBe(false);
  });

  it("read as on when the storage cannot be read", async () => {
    const broken = createSwitches({ get: () => Promise.reject(new Error("no storage")) }, NO_CHANGES);
    expect(await broken.enabled()).toBe(true);
    expect(await broken.keepCard()).toBe(true);
  });
});
