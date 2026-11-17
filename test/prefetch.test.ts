// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import type { FrameAnalysis } from "../vendor/cardvision-browser/cardvision.js";
import { createPrefetcher, firstAddress, namedCards, PREFETCH_IN_FLIGHT, PREFETCH_LIMIT, PREFETCH_PER_ANALYSIS, type PrefetchDeps } from "../src/compute/prefetch.js";
import type { CardRef } from "../src/settings/templates.js";
import { FIXTURE_CDN } from "./helpers/fork.js";

const PRIMARY = { id: "cdn", template: `${FIXTURE_CDN}/art/{art}` };
const SETTINGS = { namesOnly: false, primary: PRIMARY, fallbacks: [] };

const card = (id: string | null) => ({ instanceId: `i${id}`, bounds: { x: 0, y: 0, width: 0.1, height: 0.1 }, rotation: 0, localWidth: 1, localHeight: 1.4, landscape: false, cardId: id, name: id });

function analysis(hover: Array<string | null>, tracks: Array<string | null> = [], opts: { shown?: boolean; reused?: boolean } = {}): FrameAnalysis {
  return {
    frame: { width: 640, height: 360 },
    boxes: [],
    hover: { selection: "accepted-nms", cards: hover.map(card) },
    tracks: { shown: opts.shown ?? tracks.length > 0, cards: tracks.map(card) },
    discontinuity: false,
    retried: 0,
    embeddings: 0,
    ...(opts.reused ? { reused: true } : {}),
    timings: { detectorMs: 1, recognizeMs: 1, analyzeMs: 2 },
  } as unknown as FrameAnalysis;
}

const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

/** A prefetcher over a table of `full/<id>.jpg` arts; fetches resolve when `release` is called. */
function setup(over: Partial<PrefetchDeps> = {}, table: Record<string, string | null> = {}) {
  const fetched: Array<{ url: string; init: RequestInit }> = [];
  const pending: Array<() => void> = [];
  let bodiesRead = 0;
  const deps: PrefetchDeps = {
    settings: async () => SETTINGS,
    card: async (id): Promise<CardRef | null> => (id in table ? { id, art: table[id] ?? null } : /^\d+$/.test(id) ? { id, art: `full/${id}.jpg` } : null),
    fetch: (url, init) => {
      fetched.push({ url, init });
      return new Promise<Response>((resolve) =>
        pending.push(() =>
          resolve({
            ok: true,
            arrayBuffer: async () => {
              bodiesRead += 1;
              return new ArrayBuffer(0);
            },
          } as Response),
        ),
      );
    },
    ...over,
  };
  const p = createPrefetcher(deps);
  return {
    p,
    fetched,
    bodiesRead: () => bodiesRead,
    async releaseAll() {
      while (pending.length) {
        pending.shift()!();
        await flush();
      }
    },
  };
}

describe("the cards an analysis offers the pointer", () => {
  it("are the named cards of the hover layer, then of the shown track layer, each once", () => {
    expect(namedCards(analysis(["1", null, "2", "1"], ["3", "2"]))).toEqual(["1", "2", "3"]);
  });
  it("leave out the track layer while it is not shown", () => {
    expect(namedCards(analysis(["1"], ["3"], { shown: false }))).toEqual(["1"]);
  });
});

describe("the address fetched ahead", () => {
  it("is the one the tooltip tries first: the primary when the card fills it", () => {
    expect(firstAddress(SETTINGS, { id: "89631139", art: "full/89631139.jpg" })).toBe(`${FIXTURE_CDN}/art/full/89631139.jpg`);
  });
  it("is the first fallback the card can fill when the primary is null or needs what it lacks", () => {
    const fallback = { id: "byid", template: `${FIXTURE_CDN}/by-id/{cardId}.jpg` };
    expect(firstAddress({ namesOnly: false, primary: null, fallbacks: [fallback] }, { id: "5", art: "full/5.jpg" })).toBe(`${FIXTURE_CDN}/by-id/5.jpg`);
    expect(firstAddress({ namesOnly: false, primary: PRIMARY, fallbacks: [fallback] }, { id: "5", art: null })).toBe(`${FIXTURE_CDN}/by-id/5.jpg`);
  });
  it("is none with names only, or with no source the card can fill", () => {
    expect(firstAddress({ ...SETTINGS, namesOnly: true }, { id: "5", art: "full/5.jpg" })).toBeNull();
    expect(firstAddress({ namesOnly: false, primary: null, fallbacks: [] }, { id: "5", art: "full/5.jpg" })).toBeNull();
    expect(firstAddress(SETTINGS, { id: "5", art: null })).toBeNull();
  });
});

describe("fetching ahead", () => {
  it("fetches each named card's picture once, as the tooltip does, and reads its body so the cache keeps it", async () => {
    const s = setup();
    s.p.onAnalysis(analysis(["1", "2"]));
    s.p.onAnalysis(analysis(["2", "1"]));
    await flush();
    await s.releaseAll();
    expect(s.fetched.map((f) => f.url)).toEqual([`${FIXTURE_CDN}/art/full/1.jpg`, `${FIXTURE_CDN}/art/full/2.jpg`]);
    expect(s.fetched[0]!.init).toEqual({ credentials: "omit", referrerPolicy: "no-referrer", cache: "default" });
    expect(s.bodiesRead()).toBe(2);
  });

  it(`starts at most ${PREFETCH_PER_ANALYSIS} new cards per analysis and runs ${PREFETCH_IN_FLIGHT} at a time`, async () => {
    const s = setup();
    const ids = Array.from({ length: PREFETCH_PER_ANALYSIS + 3 }, (_, i) => String(i + 1));
    s.p.onAnalysis(analysis(ids));
    await flush();
    expect(s.fetched).toHaveLength(PREFETCH_IN_FLIGHT);
    await s.releaseAll();
    expect(s.fetched).toHaveLength(PREFETCH_PER_ANALYSIS);
    // The rest come with the next analysis that names them.
    s.p.onAnalysis(analysis(ids));
    await flush();
    await s.releaseAll();
    expect(s.fetched).toHaveLength(ids.length);
  });

  it(`stops at ${PREFETCH_LIMIT} addresses in all`, async () => {
    const s = setup();
    for (let n = 0; n < PREFETCH_LIMIT; n += PREFETCH_PER_ANALYSIS) {
      s.p.onAnalysis(analysis(Array.from({ length: PREFETCH_PER_ANALYSIS + 1 }, (_, i) => String(1000 + n + i))));
      await flush();
      await s.releaseAll();
    }
    s.p.onAnalysis(analysis(["9", "8", "7"]));
    await flush();
    await s.releaseAll();
    expect(s.fetched).toHaveLength(PREFETCH_LIMIT);
    expect(s.p.started).toHaveLength(PREFETCH_LIMIT);
  });

  it("fetches nothing with names only, for an unknown card, for a card with no address, or on a reused analysis", async () => {
    const names = setup({ settings: async () => ({ ...SETTINGS, namesOnly: true }) });
    names.p.onAnalysis(analysis(["1"]));
    await flush();
    expect(names.fetched).toEqual([]);

    const s = setup({}, { "5": null });
    s.p.onAnalysis(analysis(["token_1", "5"]));
    s.p.onAnalysis(analysis(["6"], [], { reused: true }));
    await flush();
    expect(s.fetched).toEqual([]);
  });

  it("drops a failed fetch or an unreadable settings file without throwing", async () => {
    const failing = setup({ fetch: async () => Promise.reject(new Error("offline")) });
    failing.p.onAnalysis(analysis(["1", "2"]));
    await flush();
    expect(failing.p.started).toHaveLength(2);

    const noSettings = setup({ settings: async () => Promise.reject(new Error("storage")) });
    noSettings.p.onAnalysis(analysis(["1"]));
    await flush();
    expect(noSettings.fetched).toEqual([]);
  });

  it("does not read the body of a picture the CDN refused", async () => {
    let read = 0;
    const s = setup({ fetch: async () => ({ ok: false, arrayBuffer: async () => (read++, new ArrayBuffer(0)) }) as unknown as Response });
    s.p.onAnalysis(analysis(["1"]));
    await flush();
    expect(s.p.started).toEqual([`${FIXTURE_CDN}/art/full/1.jpg`]);
    expect(read).toBe(0);
  });
});
