// SPDX-License-Identifier: Apache-2.0
// The content script's entry (src/content/index.ts) applies the stored switch and card size when a
// page opens, with a stand-in for chrome.storage and the agent: a switch that cannot be read is on
// (hover spec S-H1), and the card size does not wait for the switch.

import { afterEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
vi.mock("../src/content/agent.js", () => ({
  Agent: class {
    start(): void {}
    setEnabled(on: boolean): void {
      calls.push(`enabled:${on}`);
    }
    setCardSize(percent: number): void {
      calls.push(`size:${percent}`);
    }
    keepCardChanged(): void {}
  },
}));

type Answer = (data: Record<string, unknown>) => Promise<Record<string, unknown>>;

/** Loads index.ts with a storage whose answer to each key is chosen by `answer`. */
async function load(answer: (key: string) => Answer | "never"): Promise<void> {
  calls.length = 0;
  vi.resetModules();
  const local = {
    get(keys: string | string[]): Promise<Record<string, unknown>> {
      const key = Array.isArray(keys) ? keys[0]! : keys;
      const how = answer(key);
      return how === "never" ? new Promise(() => {}) : how({});
    },
  };
  (globalThis as Record<string, unknown>).chrome = { storage: { local, onChanged: { addListener: () => {} } } };
  (globalThis as Record<string, unknown>).__DEV__ = false;
  await import("../src/content/index.js");
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

const fail: Answer = () => Promise.reject(new Error("storage gone"));
const stored = (data: Record<string, unknown>): Answer => () => Promise.resolve(data);

afterEach(() => {
  delete (globalThis as Record<string, unknown>).chrome;
});

describe("the content script's start-up read", () => {
  it("switches hovers on, at the default size, when the storage cannot be read", async () => {
    await load(() => fail);
    expect(calls.sort()).toEqual(["enabled:true", "size:100"]);
  });

  it("applies the stored choices", async () => {
    await load((key) => stored(key === "enabled" ? { enabled: false } : { cardSize: 120 }));
    expect(calls.sort()).toEqual(["enabled:false", "size:120"]);
  });

  it("applies the card size even when the switch read never answers", async () => {
    await load((key) => (key === "enabled" ? "never" : stored({ cardSize: 120 })));
    expect(calls).toEqual(["size:120"]);
  });
});
