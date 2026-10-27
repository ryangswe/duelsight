// SPDX-License-Identifier: Apache-2.0
// src/shared/retired.ts: the in-player button's stored entries are removed on install or update.
import { describe, expect, it } from "vitest";

import { isRetired, removeRetired } from "../src/shared/retired.js";
import { memoryStorage } from "./helpers/memory-storage.js";

describe("removeRetired", () => {
  it("removes every channel entry and the button's intro flag, and nothing else", async () => {
    const storage = memoryStorage({
      "channel:yt:@somechannel": 1,
      "channel:tw:somechannel": 2,
      "channel:yt-video:abcdefghijk": 3,
      "button.introSeen": true,
      enabled: false,
      cardSize: 120,
      "settings.lastGood": { raw: {}, fetchedAt: 1 },
      "update.dismissed": "0.2.0",
    });
    expect(await removeRetired(storage)).toBe(4);
    expect(Object.keys(storage.data).sort()).toEqual(["cardSize", "enabled", "settings.lastGood", "update.dismissed"]);
    // Again: nothing left to remove.
    expect(await removeRetired(storage)).toBe(0);
  });

  it("knows the retired keys", () => {
    expect(isRetired("channel:local:/")).toBe(true);
    expect(isRetired("button.introSeen")).toBe(true);
    expect(isRetired("enabled")).toBe(false);
    expect(isRetired("channels")).toBe(false);
  });
});
