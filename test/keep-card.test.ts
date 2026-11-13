// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import { KEEP_CARD_KEY, keepCardFlipped, keepCardForFrame, readKeepCardOn } from "../src/shared/keep-card.js";
import { applyStorageChange } from "../src/content/storage-sync.js";
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

  it("starts a compute frame with the stored choice, or on when the storage cannot be read", async () => {
    expect(await keepCardForFrame(memoryStorage({ [KEEP_CARD_KEY]: false }))).toBe(false);
    expect(await keepCardForFrame(memoryStorage())).toBe(true);
    expect(await keepCardForFrame({ get: () => Promise.reject(new Error("no storage")) })).toBe(true);
  });
});

describe("the popup's choices reaching the content script", () => {
  const spy = () => {
    const calls: string[] = [];
    return { calls, agent: { setEnabled: (on: boolean) => void calls.push(`enabled:${on}`), setCardSize: (p: number) => void calls.push(`size:${p}`), keepCardChanged: () => void calls.push("keepCard") } };
  };

  it("remakes the compute frame only on a keep-card change between on and off, in local storage", () => {
    const { calls, agent } = spy();
    applyStorageChange(agent, { keepCard: { newValue: false } }, "local");
    applyStorageChange(agent, { keepCard: { oldValue: false, newValue: true } }, "local");
    expect(calls).toEqual(["keepCard", "keepCard"]);
    applyStorageChange(agent, { keepCard: { oldValue: true, newValue: true } }, "local");
    applyStorageChange(agent, { keepCard: { newValue: false } }, "sync");
    applyStorageChange(agent, { details: { newValue: false } }, "local");
    expect(calls).toEqual(["keepCard", "keepCard"]);
  });

  it("passes the main switch and the card size on as before", () => {
    const { calls, agent } = spy();
    applyStorageChange(agent, { enabled: { newValue: false } }, "local");
    applyStorageChange(agent, { enabled: { oldValue: false } }, "local");
    applyStorageChange(agent, { cardSize: { newValue: 120 } }, "local");
    applyStorageChange(agent, { enabled: { newValue: false }, cardSize: { newValue: 70 } }, "sync");
    expect(calls).toEqual(["enabled:false", "enabled:true", "size:120"]);
  });
});
