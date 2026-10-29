// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";

import { IMAGE_TIMEOUT_MS, SOURCE_FAILURE_LIMIT } from "../src/constants.js";
import { ImageLoadError, loadImage, resolveCardImage, SourceHealth } from "../src/images/chain.js";
import type { Settings } from "../src/settings/schema.js";
import { FIXTURE_CDN as CDN } from "./helpers/fork.js";

/** Settings with a primary and a fallback on the same host (a fixture: not the build's own). */
const defaultSettings = (): Settings => ({
  schemaVersion: 1,
  updatedAt: "2026-10-16T00:00:00Z",
  namesOnly: false,
  primary: { id: "cdn", template: `${CDN}/art/{art}` },
  fallbacks: [{ id: "mirror", template: `${CDN}/mirror/{cardId}.jpg` }],
  update: null,
  details: null,
  localDetails: {},
});

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** A decoder that, like a browser's, looks at the bytes and not at the name. */
const decodeByBytes = async (blob: Blob): Promise<void> => {
  const head = new Uint8Array(await blob.arrayBuffer()).slice(0, 8);
  if (!PNG.every((b, i) => head[i] === b)) throw new Error("not a picture");
};

function fetchOf(table: Record<string, Response | "throw" | "hang">): typeof fetch & { calls: string[] } {
  const calls: string[] = [];
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    const answer = table[url];
    if (answer === undefined || answer === "throw") throw new TypeError("Failed to fetch");
    if (answer === "hang") {
      return new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
    }
    return answer.clone();
  }) as typeof fetch & { calls: string[] };
  fn.calls = calls;
  return fn;
}

const png = () => new Response(PNG, { status: 200, headers: { "content-type": "image/jpeg" } });

afterEach(() => vi.useRealTimers());

describe("loadImage", () => {
  it("resolves with the body when it decodes, whatever the name says (.jpg holding PNG)", async () => {
    const f = fetchOf({ [`${CDN}/art/A.jpg`]: png() });
    const blob = await loadImage(`${CDN}/art/A.jpg`, { fetch: f, decode: decodeByBytes });
    expect(blob.size).toBe(PNG.length);
  });

  it("fails on non-2xx", async () => {
    const f = fetchOf({ "https://h/a": new Response("nope", { status: 404 }) });
    await expect(loadImage("https://h/a", { fetch: f, decode: decodeByBytes })).rejects.toThrow("HTTP 404");
  });

  it("fails on a network error", async () => {
    await expect(loadImage("https://h/a", { fetch: fetchOf({ "https://h/a": "throw" }), decode: decodeByBytes })).rejects.toBeInstanceOf(ImageLoadError);
  });

  it("fails on a body that is not a picture (an HTML error page with 200)", async () => {
    const f = fetchOf({ "https://h/a": new Response("<html>", { status: 200, headers: { "content-type": "image/png" } }) });
    await expect(loadImage("https://h/a", { fetch: f, decode: decodeByBytes })).rejects.toThrow("not a picture");
  });

  it("gives up after the time limit and aborts the request", async () => {
    vi.useFakeTimers();
    const f = fetchOf({ "https://h/a": "hang" });
    const p = loadImage("https://h/a", { fetch: f, decode: decodeByBytes });
    const settled = expect(p).rejects.toThrow(`no picture within ${IMAGE_TIMEOUT_MS} ms`);
    await vi.advanceTimersByTimeAsync(IMAGE_TIMEOUT_MS);
    await settled;
  });

  it("counts a slow decode against the same limit", async () => {
    vi.useFakeTimers();
    const f = fetchOf({ "https://h/a": png() });
    const p = loadImage("https://h/a", { fetch: f, decode: () => new Promise(() => undefined), timeoutMs: 100 });
    const settled = expect(p).rejects.toThrow("no picture within 100 ms");
    await vi.advanceTimersByTimeAsync(100);
    await settled;
  });
});

describe("resolveCardImage", () => {
  const card = { id: "89631139", art: "89631139.jpg" };
  const primaryUrl = `${CDN}/art/89631139.jpg`;
  const fallbackUrl = `${CDN}/mirror/89631139.jpg`;
  const loaderOf = (f: typeof fetch) => (url: string) => loadImage(url, { fetch: f, decode: decodeByBytes, timeoutMs: 50 });

  it("shows the primary when it loads, and asks nothing else", async () => {
    const f = fetchOf({ [primaryUrl]: png(), [fallbackUrl]: png() });
    const r = await resolveCardImage(card, defaultSettings(), new SourceHealth(), loaderOf(f));
    expect(r.kind).toBe("image");
    expect(r.kind === "image" && r.sourceId).toBe("cdn");
    expect(f.calls).toEqual([primaryUrl]);
  });

  it("moves to the fallback on non-2xx, then shows it", async () => {
    const f = fetchOf({ [primaryUrl]: new Response("", { status: 503 }), [fallbackUrl]: png() });
    const r = await resolveCardImage(card, defaultSettings(), new SourceHealth(), loaderOf(f));
    expect(r.kind === "image" && r.sourceId).toBe("mirror");
    expect(r.attempts.map((a) => a.failure)).toEqual(["HTTP 503", null]);
  });

  it("moves to the fallback after a timeout", async () => {
    const f = fetchOf({ [primaryUrl]: "hang", [fallbackUrl]: png() });
    const r = await resolveCardImage(card, defaultSettings(), new SourceHealth(), loaderOf(f));
    expect(r.kind === "image" && r.sourceId).toBe("mirror");
    expect(r.attempts[0]?.failure).toMatch(/no picture within/);
  });

  it("falls back to names when every source fails", async () => {
    const f = fetchOf({ [primaryUrl]: "throw", [fallbackUrl]: new Response("<html>", { status: 200 }) });
    const r = await resolveCardImage(card, defaultSettings(), new SourceHealth(), loaderOf(f));
    expect(r.kind).toBe("names");
  });

  it("skips a source whose placeholder is unavailable, without counting a failure", async () => {
    const health = new SourceHealth();
    const f = fetchOf({ [fallbackUrl.replace("89631139", "122")]: "throw" });
    const r = await resolveCardImage({ id: "122", art: null }, defaultSettings(), health, loaderOf(f));
    expect(r.kind).toBe("names");
    expect(f.calls).toEqual([fallbackUrl.replace("89631139", "122")]);
    expect(r.attempts[0]).toEqual({ sourceId: "cdn", url: null, failure: "a placeholder is unavailable for this card" });
  });

  it("requests nothing under namesOnly", async () => {
    const f = fetchOf({ [primaryUrl]: png() });
    const settings: Settings = { ...defaultSettings(), namesOnly: true };
    const r = await resolveCardImage(card, settings, new SourceHealth(), loaderOf(f));
    expect(r).toEqual({ kind: "names", reason: "names only", attempts: [] });
    expect(f.calls).toEqual([]);
  });

  it("goes straight to the fallbacks when the primary is null", async () => {
    const f = fetchOf({ [fallbackUrl]: png() });
    const r = await resolveCardImage(card, { ...defaultSettings(), primary: null }, new SourceHealth(), loaderOf(f));
    expect(r.kind === "image" && r.sourceId).toBe("mirror");
    expect(f.calls).toEqual([fallbackUrl]);
  });

  it("skips a source after repeated failures in a row, until reset", async () => {
    const health = new SourceHealth();
    const f = fetchOf({ [primaryUrl]: "throw", [fallbackUrl]: png() });
    for (let i = 0; i < SOURCE_FAILURE_LIMIT; i += 1) await resolveCardImage(card, defaultSettings(), health, loaderOf(f));
    expect(f.calls.filter((u) => u === primaryUrl).length).toBe(SOURCE_FAILURE_LIMIT);
    await resolveCardImage(card, defaultSettings(), health, loaderOf(f));
    expect(f.calls.filter((u) => u === primaryUrl).length).toBe(SOURCE_FAILURE_LIMIT);
    health.reset();
    await resolveCardImage(card, defaultSettings(), health, loaderOf(f));
    expect(f.calls.filter((u) => u === primaryUrl).length).toBe(SOURCE_FAILURE_LIMIT + 1);
  });

  it("forgets failures after a success", async () => {
    const health = new SourceHealth();
    const source = defaultSettings().primary!;
    health.record(source, false);
    health.record(source, false);
    health.record(source, true);
    health.record(source, false);
    expect(health.skipped(source)).toBe(false);
  });
});
