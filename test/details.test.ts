// SPDX-License-Identifier: Apache-2.0
// The card details file: its rows, the panel's lines, and fetching and keeping it (made-up data).
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { DETAILS_CACHE, forgetDetails, loadDetails } from "../src/details/cache.js";
import { detailLines, detailsFor, localName, parseDetailsFile } from "../src/details/details.js";
import { browserLanguage, chooseDetails } from "../src/details/language.js";
import { readDetailsOn } from "../src/shared/details-pref.js";
import { DETAILS_FIXTURE, DETAILS_FR_FIXTURE } from "./helpers/details-fixture.js";
import { memoryStorage } from "./helpers/memory-storage.js";

const table = parseDetailsFile(JSON.parse(JSON.stringify(DETAILS_FIXTURE)))!;

describe("parseDetailsFile", () => {
  it("takes a schema 1 file with its cards", () => {
    expect(table).not.toBeNull();
    for (const bad of [null, [], "x", { schemaVersion: 2, cards: {} }, { schemaVersion: 1 }, { schemaVersion: 1, cards: [] }]) {
      expect(parseDetailsFile(bad)).toBeNull();
    }
  });
});

describe("detailsFor and detailLines", () => {
  it("gives a monster's type line, attribute, level and ATK/DEF", () => {
    const d = detailsFor(table, "10000001")!;
    expect(detailLines(d)).toEqual({
      type: "Robot / Effect",
      stats: "LIGHT · Level 4",
      power: "ATK 1800 / DEF 1000",
      text: "When this test card is summoned, nothing happens.\nIt is only a fixture.",
    });
  });

  it("calls an Xyz monster's level its rank, and shows -1 as ?", () => {
    const lines = detailLines(detailsFor(table, "10000002")!);
    expect(lines.stats).toBe("DARK · Rank 3");
    expect(lines.power).toBe("ATK 2100 / DEF ?");
  });

  it("gives a Link monster's rating and its arrows, in order, and no DEF", () => {
    const lines = detailLines(detailsFor(table, "10000003")!);
    expect(lines.stats).toBe("WIND · Link 2");
    expect(lines.power).toBe("ATK 2300  ↑ ↙ ↘");
  });

  it("gives a Pendulum monster's scale", () => {
    const lines = detailLines(detailsFor(table, "10000004")!);
    expect(lines.stats).toBe("EARTH · Level 5 · Scale 7");
    expect(lines.power).toBe("ATK ? / DEF 1500");
    expect(lines.text).toContain("[ Monster Effect ]");
  });

  it("gives a spell or a trap its type alone, and its text with plain line breaks", () => {
    expect(detailLines(detailsFor(table, "10000005")!)).toEqual({ type: "Quick-Play Spell", stats: null, power: null, text: "Draw nothing. This invented spell is only a fixture." });
    expect(detailLines(detailsFor(table, "10000006")!).text).toBe("An invented trap line.\nSecond invented line.");
  });

  it("has nothing for a card not in the file, a row of another shape, or no file", () => {
    expect(detailsFor(table, "99999999")).toBeNull();
    expect(detailsFor(table, "10000008")).toBeNull();
    expect(detailsFor(table, "10000009")).toBeNull();
    expect(detailsFor(table, "toString")).toBeNull();
    expect(detailsFor(table, "__proto__")).toBeNull();
    expect(detailsFor(null, "10000001")).toBeNull();
    expect(detailsFor(parseDetailsFile({ schemaVersion: 1, cards: { a: ["spell", "x".repeat(5000), "Normal Spell"] } }), "a")).toBeNull();
  });
});

describe("the details switch", () => {
  it("is on unless switched off", async () => {
    expect(await readDetailsOn(memoryStorage())).toBe(true);
    expect(await readDetailsOn(memoryStorage({ details: true }))).toBe(true);
    expect(await readDetailsOn(memoryStorage({ details: "no" }))).toBe(true);
    expect(await readDetailsOn(memoryStorage({ details: false }))).toBe(false);
  });
});

/** A stand-in for Cache Storage: one map per cache name. */
function fakeCaches() {
  const stores = new Map<string, Map<string, Response>>();
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const m = stores.get(name)!;
    return {
      match: async (url: string) => m.get(url)?.clone(),
      put: async (url: string, r: Response) => void m.set(url, r),
      delete: async (req: string | Request) => m.delete(typeof req === "string" ? req : req.url),
      keys: async () => [...m.keys()].map((url) => ({ url }) as Request),
    } as unknown as Cache;
  };
  return { stores, open, delete: async (name: string) => stores.delete(name) };
}

const sha256 = async (b: ArrayBuffer) => createHash("sha256").update(Buffer.from(b)).digest("hex");

describe("loadDetails", () => {
  const body = JSON.stringify(DETAILS_FIXTURE);
  const digest = createHash("sha256").update(body).digest("hex");
  const URL1 = "https://cdn.example.org/data/details-aaaaaaaa.json";

  function fetcher(responses: Record<string, () => Response>) {
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    const fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      const r = responses[url];
      if (!r) throw new TypeError("network error");
      return r();
    }) as unknown as typeof globalThis.fetch;
    return { calls, fetch };
  }

  it("fetches the file once, with no cookies and no referrer, then reads it from the cache", async () => {
    const caches = fakeCaches();
    const { calls, fetch } = fetcher({ [URL1]: () => new Response(body) });
    const first = await loadDetails(URL1, digest, { caches, fetch, sha256 });
    expect(detailsFor(first, "10000001")?.type).toBe("Robot / Effect");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.init).toMatchObject({ credentials: "omit", referrerPolicy: "no-referrer" });
    const second = await loadDetails(URL1, digest, { caches, fetch, sha256 });
    expect(detailsFor(second, "10000005")?.type).toBe("Quick-Play Spell");
    expect(calls).toHaveLength(1);
    expect([...caches.stores.get(DETAILS_CACHE)!.keys()]).toEqual([URL1]);
  });

  it("never keeps or uses a file whose bytes do not match its SHA-256", async () => {
    const caches = fakeCaches();
    const { fetch } = fetcher({ [URL1]: () => new Response(body + " ") });
    expect(await loadDetails(URL1, digest, { caches, fetch, sha256 })).toBeNull();
    expect(caches.stores.get(DETAILS_CACHE)?.size ?? 0).toBe(0);
  });

  it("fetches again when the kept copy does not match", async () => {
    const caches = fakeCaches();
    (await caches.open(DETAILS_CACHE)).put(URL1, new Response("tampered"));
    const { calls, fetch } = fetcher({ [URL1]: () => new Response(body) });
    expect(await loadDetails(URL1, digest, { caches, fetch, sha256 })).not.toBeNull();
    expect(calls).toHaveLength(1);
  });

  it("drops an older file's copy once a new one is kept", async () => {
    const caches = fakeCaches();
    const old = "https://cdn.example.org/data/details-bbbbbbbb.json";
    (await caches.open(DETAILS_CACHE)).put(old, new Response("{}"));
    const { fetch } = fetcher({ [URL1]: () => new Response(body) });
    await loadDetails(URL1, digest, { caches, fetch, sha256 });
    expect([...caches.stores.get(DETAILS_CACHE)!.keys()]).toEqual([URL1]);
  });

  it("gives null when the file cannot be had: unreachable, not found, not JSON", async () => {
    const caches = fakeCaches();
    expect(await loadDetails(URL1, digest, { caches, ...fetcher({}), sha256 })).toBeNull();
    expect(await loadDetails(URL1, digest, { caches, ...fetcher({ [URL1]: () => new Response("", { status: 404 }) }), sha256 })).toBeNull();
    const notJson = "not json";
    const notJsonSha = createHash("sha256").update(notJson).digest("hex");
    expect(await loadDetails(URL1, notJsonSha, { caches, ...fetcher({ [URL1]: () => new Response(notJson) }), sha256 })).toBeNull();
  });

  it("deletes the kept copy when the settings name no details file", async () => {
    const caches = fakeCaches();
    await loadDetails(URL1, digest, { caches, ...fetcher({ [URL1]: () => new Response(body) }), sha256 });
    await forgetDetails(caches);
    expect(caches.stores.has(DETAILS_CACHE)).toBe(false);
  });
});

describe("a localized (French) details file", () => {
  const fr = parseDetailsFile(JSON.parse(JSON.stringify(DETAILS_FR_FIXTURE)))!;

  it("is read with its language and its names; the English file has neither", () => {
    expect(fr.lang).toBe("fr");
    expect(localName(fr, "10000001")).toBe("Robot de Test");
    expect(localName(fr, "10000002")).toBeNull();
    expect(table.lang).toBeNull();
    expect(localName(table, "10000001")).toBeNull();
    expect(localName(null, "10000001")).toBeNull();
  });

  it("ignores names without a language, a bad language, and a name that is not short text", () => {
    const noLang = parseDetailsFile({ schemaVersion: 1, names: { "1": "Nom" }, cards: {} })!;
    expect([noLang.lang, localName(noLang, "1")]).toEqual([null, null]);
    expect(parseDetailsFile({ schemaVersion: 1, lang: "French", cards: {} })!.lang).toBeNull();
    expect(parseDetailsFile({ schemaVersion: 1, lang: "en", names: { "1": "Name" }, cards: {} })!.names).toBeNull();
    const odd = parseDetailsFile({ schemaVersion: 1, lang: "fr", names: { "1": 7, "2": "", "3": "x".repeat(121) }, cards: {} })!;
    expect(["1", "2", "3"].map((id) => localName(odd, id))).toEqual([null, null, null]);
  });

  it("words the stats line with the file's labels: Niveau, Rang, Lien and Échelle Pendule", () => {
    expect(detailLines(detailsFor(fr, "10000001")!, fr.labels)).toEqual({
      type: "Robot / Effet",
      stats: "LUMIÈRE · Niveau 4",
      power: "ATK 1800 / DEF 1000",
      text: "Quand cette carte de test est invoquée, rien ne se passe.",
    });
    expect(detailLines(detailsFor(fr, "10000002")!, fr.labels).stats).toBe("TÉNÈBRES · Rang 3");
    expect(detailLines(detailsFor(fr, "10000003")!, fr.labels).stats).toBe("VENT · Lien 2");
    expect(detailLines(detailsFor(fr, "10000004")!, fr.labels).stats).toBe("TERRE · Niveau 5 · Échelle Pendule 7");
    // Without labels (the English file), the stats line is in English.
    expect(detailLines(detailsFor(fr, "10000004")!).stats).toBe("TERRE · Level 5 · Scale 7");
  });

  it("keeps English for a label a file leaves out or gets wrong, and reads no labels in the English file", () => {
    const partial = parseDetailsFile({ schemaVersion: 1, lang: "de", labels: { level: "Stufe", rank: 3, link: "", scale: "x".repeat(31), atk: " ANG " }, cards: {} })!;
    expect(partial.labels).toEqual({ level: "Stufe", rank: "Rank", link: "Link", scale: "Scale", atk: "ANG", def: "DEF" });
    expect(parseDetailsFile({ schemaVersion: 1, labels: { level: "Stufe" }, cards: {} })!.labels.level).toBe("Level");
    expect(parseDetailsFile({ schemaVersion: 1, lang: "de", labels: ["Stufe"], cards: {} })!.labels.level).toBe("Level");
  });
});

describe("the browser's language picks the details file", () => {
  const en = { path: "data/details-01234567.json", sha256: "a".repeat(64) };
  const french = { path: "data/details-fr-89abcdef.json", sha256: "b".repeat(64) };

  it("is the first preferred language's base subtag", () => {
    expect(browserLanguage(["fr-CA", "en-US"])).toBe("fr");
    expect(browserLanguage(["FR"])).toBe("fr");
    expect(browserLanguage(["en-US", "fr-FR"])).toBe("en");
    expect(browserLanguage(["", "de-DE"])).toBe("de");
    expect(browserLanguage([])).toBe("");
  });

  const german = { path: "data/details-de-76543210.json", sha256: "c".repeat(64) };

  it("is the file in the browser's language when the settings name one, else the English file", () => {
    const localDetails = { fr: french, de: german };
    expect(chooseDetails({ details: en, localDetails }, ["fr-BE"])).toEqual({ source: french, lang: "fr" });
    expect(chooseDetails({ details: en, localDetails }, ["de-AT", "fr"])).toEqual({ source: german, lang: "de" });
    expect(chooseDetails({ details: en, localDetails: {} }, ["fr-BE"])).toEqual({ source: en, lang: "en" });
    expect(chooseDetails({ details: en, localDetails }, ["en-GB", "fr"])).toEqual({ source: en, lang: "en" });
    expect(chooseDetails({ details: en, localDetails }, ["it-IT"])).toEqual({ source: en, lang: "en" });
    // Never a key of the object's prototype.
    expect(chooseDetails({ details: en, localDetails }, ["constructor"])).toEqual({ source: en, lang: "en" });
  });

  it("is none when the English file is not named: the maintainer has taken the details down", () => {
    expect(chooseDetails({ details: null, localDetails: { fr: french } }, ["fr"])).toBeNull();
  });
});
