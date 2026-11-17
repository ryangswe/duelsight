// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";

import type { FrameAnalysis } from "../vendor/cardvision-browser/cardvision.js";
import { SOURCE_FAILURE_LIMIT } from "../src/constants.js";
import { createPrefetcher, firstAddress, namedCards, PREFETCH_IN_FLIGHT, PREFETCH_LIMIT, PREFETCH_PER_ANALYSIS, PrefetchHealth, type PrefetchDeps } from "../src/compute/prefetch.js";
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
    const { signal, ...init } = s.fetched[0]!.init;
    expect(init).toEqual({ credentials: "omit", referrerPolicy: "no-referrer", cache: "default" });
    // Given up after the tooltip's own time limit.
    expect(signal).toBeInstanceOf(AbortSignal);
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

  it("fetches nothing with names only, for an unknown card, or for a card with no address", async () => {
    const names = setup({ settings: async () => ({ ...SETTINGS, namesOnly: true }) });
    names.p.onAnalysis(analysis(["1"]));
    await flush();
    expect(names.fetched).toEqual([]);

    const s = setup({}, { "5": null });
    s.p.onAnalysis(analysis(["token_1", "5"]));
    await flush();
    expect(s.fetched).toEqual([]);
  });

  it("reads a reused analysis too: its track layer is new", async () => {
    const s = setup();
    s.p.onAnalysis(analysis([], ["7"], { reused: true }));
    await flush();
    await s.releaseAll();
    expect(s.fetched.map((f) => f.url)).toEqual([`${FIXTURE_CDN}/art/full/7.jpg`]);
  });

  it("follows the settings after they change: names only stops it, a new address is fetched for cards named again", async () => {
    let current: { namesOnly: boolean; primary: typeof PRIMARY; fallbacks: never[] } = SETTINGS;
    let reads = 0;
    const s = setup({ settings: async () => (reads++, current) });
    s.p.onAnalysis(analysis(["1"]));
    await flush();
    await s.releaseAll();

    current = { ...SETTINGS, namesOnly: true };
    s.p.settingsChanged();
    s.p.onAnalysis(analysis(["1", "2"]));
    await flush();
    await s.releaseAll();
    expect(s.fetched.map((f) => f.url)).toEqual([`${FIXTURE_CDN}/art/full/1.jpg`]);

    current = { namesOnly: false, primary: { id: "small", template: `${FIXTURE_CDN}/art/tooltip/{cardId}.webp` }, fallbacks: [] };
    s.p.settingsChanged();
    s.p.onAnalysis(analysis(["1", "2"]));
    await flush();
    await s.releaseAll();
    expect(s.fetched.map((f) => f.url)).toEqual([`${FIXTURE_CDN}/art/full/1.jpg`, `${FIXTURE_CDN}/art/tooltip/1.webp`, `${FIXTURE_CDN}/art/tooltip/2.webp`]);
    expect(reads).toBe(3);
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

  it("asks once for a picture that failed or was refused, however many analyses name it again", async () => {
    let calls = 0;
    const failing = setup({ fetch: async () => (calls++, Promise.reject(new Error("offline"))) });
    const refused = setup({ fetch: async () => (calls++, { ok: false, arrayBuffer: async () => new ArrayBuffer(0) }) as unknown as Response });
    for (const s of [failing, refused]) {
      for (let i = 0; i < 5; i++) {
        s.p.onAnalysis(analysis(["404"]));
        await flush();
      }
    }
    expect(calls).toBe(2);
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

describe("fetching ahead when a source keeps failing", () => {
  const TOOLTIP = { id: "tooltip", template: `${FIXTURE_CDN}/art/tooltip/{cardId}.webp` };
  const TWO = { namesOnly: false, primary: TOOLTIP, fallbacks: [PRIMARY] };
  const tooltipUrl = (id: string) => `${FIXTURE_CDN}/art/tooltip/${id}.webp`;
  const fullUrl = (id: string) => `${FIXTURE_CDN}/art/full/${id}.jpg`;
  const ok = { ok: true, arrayBuffer: async () => new ArrayBuffer(0) } as unknown as Response;
  const refused = { ok: false, arrayBuffer: async () => new ArrayBuffer(0) } as unknown as Response;

  /** One card per analysis, each settled before the next, so the order is the fetch order. */
  async function nameInTurn(p: ReturnType<typeof createPrefetcher>, ids: string[]) {
    for (const id of ids) {
      p.onAnalysis(analysis([id]));
      await flush();
    }
  }

  it(`skips a source after ${SOURCE_FAILURE_LIMIT} failures in a row, as the tooltip does, and fetches the next one`, async () => {
    const fetched: string[] = [];
    const p = createPrefetcher({
      settings: async () => TWO,
      card: async (id) => ({ id, art: `full/${id}.jpg` }),
      fetch: async (url) => (fetched.push(url), url.includes("/tooltip/") ? Promise.reject(new Error("timeout")) : ok),
    });
    await nameInTurn(p, ["1", "2", "3", "4", "5"]);
    expect(fetched).toEqual([tooltipUrl("1"), tooltipUrl("2"), tooltipUrl("3"), fullUrl("4"), fullUrl("5")]);
  });

  it("counts a refused picture as a failure, and a picture that came as a fresh start", async () => {
    const fetched: string[] = [];
    const answers: Record<string, Response> = { "1": refused, "2": refused, "3": ok, "4": refused, "5": refused, "6": refused, "7": ok };
    const p = createPrefetcher({
      settings: async () => TWO,
      card: async (id) => ({ id, art: `full/${id}.jpg` }),
      fetch: async (url) => (fetched.push(url), url.includes("/tooltip/") ? answers[url.match(/(\d+)\.webp$/)![1]!]! : ok),
    });
    await nameInTurn(p, ["1", "2", "3", "4", "5", "6", "7"]);
    // 1 and 2 fail, 3 comes (the count starts over), 4 to 6 fail: 7 is fetched from the full art.
    expect(fetched).toEqual([tooltipUrl("1"), tooltipUrl("2"), tooltipUrl("3"), tooltipUrl("4"), tooltipUrl("5"), tooltipUrl("6"), fullUrl("7")]);
  });

  it("tries every source again once the settings are read again", async () => {
    const fetched: string[] = [];
    const p = createPrefetcher({
      settings: async () => TWO,
      card: async (id) => ({ id, art: `full/${id}.jpg` }),
      fetch: async (url) => (fetched.push(url), url.includes("/tooltip/") ? refused : ok),
    });
    await nameInTurn(p, ["1", "2", "3", "4"]);
    p.settingsChanged();
    await nameInTurn(p, ["5"]);
    expect(fetched).toEqual([tooltipUrl("1"), tooltipUrl("2"), tooltipUrl("3"), fullUrl("4"), tooltipUrl("5")]);
  });

  it("does not count a fetch that started before the settings were read again", async () => {
    const fetched: string[] = [];
    const pending: Array<() => void> = [];
    const p = createPrefetcher({
      settings: async () => TWO,
      card: async (id) => ({ id, art: `full/${id}.jpg` }),
      fetch: (url) => {
        fetched.push(url);
        if (["1", "2"].some((id) => url === tooltipUrl(id))) return new Promise((_, reject) => pending.push(() => reject(new Error("timeout"))));
        return Promise.resolve(url.includes("/tooltip/") ? refused : ok);
      },
    });
    p.onAnalysis(analysis(["1", "2"]));
    await flush();
    p.settingsChanged();
    while (pending.length) pending.shift()!();
    await flush();
    // 1 and 2 failed under the old settings: they do not count, so 3 and 4 failing is two in a
    // row, and 5 is still asked from the tooltip pictures.
    await nameInTurn(p, ["3", "4", "5"]);
    expect(fetched.slice(2)).toEqual([tooltipUrl("3"), tooltipUrl("4"), tooltipUrl("5")]);
  });

  it("counts a picture whose body cannot be read as a failure", async () => {
    const fetched: string[] = [];
    const unreadable = { ok: true, arrayBuffer: async () => Promise.reject(new Error("reset")) } as unknown as Response;
    const p = createPrefetcher({
      settings: async () => TWO,
      card: async (id) => ({ id, art: `full/${id}.jpg` }),
      fetch: async (url) => (fetched.push(url), url.includes("/tooltip/") ? unreadable : ok),
    });
    await nameInTurn(p, ["1", "2", "3", "4"]);
    expect(fetched).toEqual([tooltipUrl("1"), tooltipUrl("2"), tooltipUrl("3"), fullUrl("4")]);
  });

  it("does not count a fetch made from settings read before they changed", async () => {
    const fetched: string[] = [];
    let readSettings: (() => void) | null = null;
    let reads = 0;
    const p = createPrefetcher({
      settings: () => (reads++ === 0 ? new Promise((resolve) => (readSettings = () => resolve(TWO))) : Promise.resolve(TWO)),
      card: async (id) => ({ id, art: `full/${id}.jpg` }),
      fetch: async (url) => (fetched.push(url), url.includes("/tooltip/") ? refused : ok),
    });
    p.onAnalysis(analysis(["1", "2"]));
    await flush();
    // The settings change while the first read is still waiting: 1 and 2 are fetched from it.
    p.settingsChanged();
    readSettings!();
    await flush();
    // So they do not count: 3 and 4 failing is two in a row, and 5 is still asked from the
    // tooltip pictures.
    await nameInTurn(p, ["3", "4", "5"]);
    expect(fetched).toEqual([tooltipUrl("1"), tooltipUrl("2"), tooltipUrl("3"), tooltipUrl("4"), tooltipUrl("5")]);
  });

  it("counts at most one failure per source per analysis, as the tooltip counts the hovered card", async () => {
    const fetched: string[] = [];
    const p = createPrefetcher({
      settings: async () => TWO,
      card: async (id) => ({ id, art: `full/${id}.jpg` }),
      fetch: async (url) => (fetched.push(url), url.includes("/tooltip/") ? refused : ok),
    });
    // Four cards fail in one analysis: one failure. Two more analyses make three.
    p.onAnalysis(analysis(["1", "2", "3", "4"]));
    await flush();
    await nameInTurn(p, ["5", "6", "7"]);
    expect(fetched).toEqual([tooltipUrl("1"), tooltipUrl("2"), tooltipUrl("3"), tooltipUrl("4"), tooltipUrl("5"), tooltipUrl("6"), fullUrl("7")]);
  });

  it("trips on a stall only after as many analyses as the tooltip would need hovers, and stays off until the settings are read", async () => {
    let stalled = true;
    const fetched: string[] = [];
    const p = createPrefetcher({
      settings: async () => TWO,
      card: async (id) => ({ id, art: `full/${id}.jpg` }),
      fetch: async (url) => (fetched.push(url), stalled ? Promise.reject(new Error("timeout")) : ok),
    });
    // Two analyses of four cards fail: two failures, not eight. The stall ends, and the tooltip
    // pictures are fetched again.
    p.onAnalysis(analysis(["1", "2", "3", "4"]));
    await flush();
    p.onAnalysis(analysis(["5", "6", "7", "8"]));
    await flush();
    stalled = false;
    await nameInTurn(p, ["9"]);
    expect(fetched.at(-1)).toBe(tooltipUrl("9"));
    // A longer one: three failed analyses skip it, as three failed hovers skip it in the tooltip,
    // and the next source is fetched until the settings are read again.
    stalled = true;
    await nameInTurn(p, ["10", "11", "12"]);
    stalled = false;
    // However long it is (the clock moves an hour on), as the tooltip does.
    vi.useFakeTimers({ toFake: ["Date", "performance"] });
    try {
      vi.setSystemTime(Date.now() + 3_600_000);
      vi.advanceTimersByTime(3_600_000);
      await nameInTurn(p, ["13", "14"]);
    } finally {
      vi.useRealTimers();
    }
    expect(fetched.slice(-2)).toEqual([fullUrl("13"), fullUrl("14")]);
    p.settingsChanged();
    await nameInTurn(p, ["15"]);
    expect(fetched.at(-1)).toBe(tooltipUrl("15"));
  });

  it("counts an analysis once when its fetches end out of order", async () => {
    const health = new PrefetchHealth();
    for (const a of [1, 2, 1]) health.record(TOOLTIP, false, a);
    expect(health.skipped(TOOLTIP)).toBe(false);
    health.record(TOOLTIP, false, 3);
    expect(health.skipped(TOOLTIP)).toBe(true);
  });
});
