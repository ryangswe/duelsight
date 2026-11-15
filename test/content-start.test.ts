// SPDX-License-Identifier: Apache-2.0
// The content script's entry (src/content/index.ts) applies the stored switch and card size when a
// page opens, with a stand-in for chrome.storage and the agent: a switch that cannot be read is on
// (hover spec S-H1), the card size does not wait for the switch, and a popup change made while a
// read is pending wins over the read.

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

type Changes = Record<string, { oldValue?: unknown; newValue?: unknown }>;
type Pending = { key: string; resolve: (data: Record<string, unknown>) => void; reject: (error: unknown) => void };

const flush = async (): Promise<void> => {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
};

/** Loads index.ts with a storage whose reads wait until the test answers them, in any order. */
async function load(): Promise<{ answer(key: string, data: Record<string, unknown>): Promise<void>; fail(key: string): Promise<void>; popup(changes: Changes): void }> {
  calls.length = 0;
  vi.resetModules();
  const pending: Pending[] = [];
  let listener: ((changes: Changes, area: string) => void) | null = null;
  const local = {
    get(keys: string | string[]): Promise<Record<string, unknown>> {
      const key = Array.isArray(keys) ? keys[0]! : keys;
      return new Promise((resolve, reject) => pending.push({ key, resolve, reject }));
    },
  };
  (globalThis as Record<string, unknown>).chrome = {
    storage: { local, onChanged: { addListener: (l: (changes: Changes, area: string) => void) => (listener = l) } },
  };
  (globalThis as Record<string, unknown>).__DEV__ = false;
  await import("../src/content/index.js");
  await flush();
  const take = (key: string): Pending => {
    const i = pending.findIndex((p) => p.key === key);
    expect(i, `a read of ${key}`).toBeGreaterThanOrEqual(0);
    return pending.splice(i, 1)[0]!;
  };
  return {
    async answer(key, data) {
      take(key).resolve(data);
      await flush();
    },
    async fail(key) {
      take(key).reject(new Error("storage gone"));
      await flush();
    },
    popup(changes) {
      listener?.(changes, "local");
    },
  };
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>).chrome;
});

describe("the content script's start-up read", () => {
  it("switches hovers on, at the default size, when the storage cannot be read", async () => {
    const s = await load();
    await s.fail("enabled");
    await s.fail("cardSize");
    expect(calls).toEqual(["enabled:true", "size:100"]);
  });

  it("applies the stored choices", async () => {
    const s = await load();
    await s.answer("enabled", { enabled: false });
    await s.answer("cardSize", { cardSize: 120 });
    expect(calls).toEqual(["enabled:false", "size:120"]);
  });

  it("applies the card size while the switch read is still pending", async () => {
    const s = await load();
    await s.answer("cardSize", { cardSize: 120 });
    expect(calls).toEqual(["size:120"]);
  });

  it("keeps a popup change made while the read was pending, whether the read fails or answers late", async () => {
    const s = await load();
    s.popup({ enabled: { oldValue: true, newValue: false }, cardSize: { oldValue: 100, newValue: 120 } });
    await s.fail("enabled");
    await s.answer("cardSize", { cardSize: 100 });
    expect(calls).toEqual(["enabled:false", "size:120"]);
  });

  it("applies a read whose choice the popup did not change", async () => {
    const s = await load();
    s.popup({ cardSize: { oldValue: 100, newValue: 120 } });
    await s.fail("enabled");
    await s.answer("cardSize", { cardSize: 100 });
    expect(calls).toEqual(["size:120", "enabled:true"]);
  });
});
