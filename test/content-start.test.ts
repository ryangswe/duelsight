// SPDX-License-Identifier: Apache-2.0
// The content script's entry (src/content/index.ts), with a stand-in for chrome.storage, the
// shared hover host and the view: it starts the host with DuelSight's config, the extension's
// storage and its change events, and the tooltip view; and it applies the stored card size when a
// page opens, the default when it cannot be read, and a popup change made while the read is
// pending over the read. The main switch's start-up read is the host's (tested in the toolkit, and
// through the host in content.test.ts).

import { afterEach, describe, expect, it, vi } from "vitest";

import { OUTLINE_COLOR, OUTLINE_GLOW_COLOR } from "../src/constants.js";

const calls: string[] = [];
const started: Array<Record<string, unknown>> = [];
vi.mock("../vendor/cardvision-browser/host-content.js", () => ({
  startHostContent: (env: Record<string, unknown>) => {
    started.push(env);
    return { relayout: () => void calls.push("relayout"), state: "off", stop: () => undefined };
  },
}));
vi.mock("../src/content/view.js", () => ({
  createTooltipView: () => ({
    look: { title: "Card", shadow: "" },
    setCardSize: (percent: number) => {
      calls.push(`size:${percent}`);
      return percent !== 100;
    },
  }),
}));

type Changes = Record<string, { oldValue?: unknown; newValue?: unknown }>;
type Pending = { key: string; resolve: (data: Record<string, unknown>) => void; reject: (error: unknown) => void };

const flush = async (): Promise<void> => {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
};

/** Loads index.ts with a storage whose reads wait until the test answers them, in any order. */
async function load(): Promise<{ answer(key: string, data: Record<string, unknown>): Promise<void>; fail(key: string): Promise<void>; popup(changes: Changes): void; sync(changes: Changes): void }> {
  calls.length = 0;
  started.length = 0;
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
    storage: { local, onChanged: { addListener: (l: (changes: Changes, area: string) => void) => (listener = l), removeListener: () => undefined } },
    runtime: { getURL: (path: string) => `chrome-extension://x/${path}` },
  };
  (globalThis as Record<string, unknown>).window = {};
  (globalThis as Record<string, unknown>).document = {};
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
    sync(changes) {
      listener?.(changes, "sync");
    },
  };
}

afterEach(() => {
  for (const name of ["chrome", "window", "document"]) delete (globalThis as Record<string, unknown>)[name];
});

describe("the content script's start-up", () => {
  it("starts the shared hover host with DuelSight's config, the extension's storage and the tooltip view", async () => {
    await load();
    expect(started).toHaveLength(1);
    const env = started[0]!;
    const chromeStorage = (globalThis as unknown as { chrome: { storage: { local: unknown; onChanged: unknown } } }).chrome.storage;
    expect(env.config).toMatchObject({ tag: "duelsight", dev: false, frames: { compute: "compute.html", view: "tooltip.html" }, capabilities: { geometricStage: false } });
    // The outline in the configured colors (duelsight.config.json outlineColor, outlineGlowColor).
    expect(env.config).toMatchObject({ outline: { edgeColor: OUTLINE_COLOR, glowColor: OUTLINE_GLOW_COLOR } });
    expect(env.storage).toBe(chromeStorage.local);
    expect(env.storageChanges).toBe(chromeStorage.onChanged);
    expect((env.extensionUrl as (p: string) => string)("tooltip.html")).toBe("chrome-extension://x/tooltip.html");
    expect((env.view as { look: { title: string } }).look.title).toBe("Card");
  });

  it("applies the default card size when the storage cannot be read", async () => {
    const s = await load();
    await s.fail("cardSize");
    expect(calls).toEqual(["size:100"]);
  });

  it("applies the stored card size, and places the shown card again", async () => {
    const s = await load();
    await s.answer("cardSize", { cardSize: 120 });
    expect(calls).toEqual(["size:120", "relayout"]);
  });

  it("keeps a popup change made while the read was pending, whether the read fails or answers late", async () => {
    let s = await load();
    s.popup({ cardSize: { oldValue: 100, newValue: 120 } });
    await s.answer("cardSize", { cardSize: 100 });
    expect(calls).toEqual(["size:120", "relayout"]);
    s = await load();
    s.popup({ cardSize: { oldValue: 100, newValue: 120 } });
    await s.fail("cardSize");
    expect(calls).toEqual(["size:120", "relayout"]);
  });

  it("follows later changes in the extension's own storage only", async () => {
    const s = await load();
    await s.answer("cardSize", { cardSize: 100 });
    s.popup({ cardSize: { oldValue: 100, newValue: 70 } });
    s.popup({ enabled: { oldValue: true, newValue: false } });
    s.sync({ cardSize: { oldValue: 70, newValue: 130 } });
    expect(calls).toEqual(["size:100", "size:70", "relayout"]);
  });
});
