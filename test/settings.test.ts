// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import DEFAULT_CONFIG from "../cdn/config.json";
import { UPDATE_URL_PREFIX } from "../src/constants.js";
import { detailsUrl, validateSettings as validateWithHosts } from "../src/settings/schema.js";
import { FIXTURE_CDN as CDN, IS_DUELSIGHT } from "./helpers/fork.js";

/** A settings file (a fixture, not the build's own), and the hosts these tests allow. */
const FIXTURE = {
  schemaVersion: 1,
  updatedAt: "2026-10-16T00:00:00Z",
  namesOnly: false,
  primary: { id: "cdn", template: `${CDN}/art/{art}` },
  fallbacks: [{ id: "mirror", template: `${CDN}/mirror/{cardId}.jpg` }],
  cardLink: "https://www.example.org/cards/{printedId}",
};
const HOSTS = [new URL(CDN).hostname];
const base = () => JSON.parse(JSON.stringify(FIXTURE)) as Record<string, unknown>;
const validateSettings = (raw: unknown) => validateWithHosts(raw, HOSTS);

describe("the bundled default settings (cdn/config.json)", () => {
  it("are usable as they ship, under the build's image hosts", () => {
    const { settings, problems } = validateWithHosts(DEFAULT_CONFIG);
    expect(problems).toEqual([]);
    expect(settings).not.toBeNull();
  });
});

describe("validateSettings", () => {
  it.runIf(IS_DUELSIGHT)("accepts DuelSight's bundled default as it ships", () => {
    const { settings, problems } = validateWithHosts(DEFAULT_CONFIG);
    expect(problems).toEqual([]);
    const { release, localDetails, ...rest } = settings!;
    // The details files in other languages, once published, are named the same way (details-fr-<sha8>.json).
    for (const [lang, source] of Object.entries(localDetails)) expect(source).toEqual({ path: expect.stringMatching(new RegExp(`^data/details-${lang}-[0-9a-f]{8}\\.json$`)), sha256: expect.stringMatching(/^[0-9a-f]{64}$/) });
    expect(rest).toEqual({
      schemaVersion: 1,
      updatedAt: "2026-10-18T00:00:00Z",
      namesOnly: false,
      primary: { id: "cdn", template: `${CDN}/art/{art}` },
      fallbacks: [],
      update: null,
      details: { path: expect.stringMatching(/^data\/details-[0-9a-f]{8}\.json$/), sha256: expect.stringMatching(/^[0-9a-f]{64}$/) },
    });
    // cdn/config.json mirrors the live one, so it carries the live release pointer (or none): a well-formed one.
    if (release !== null && release !== undefined) {
      const id = (release as { id?: unknown }).id;
      expect(release).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{16}$/),
        path: `vision/releases/${String(id)}/release.json`,
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        minimumExtensionVersion: expect.stringMatching(/^\d+\.\d+\.\d+$/),
      });
    }
    // The versioned name is the start of the file's SHA-256.
    expect(settings!.details!.sha256.startsWith(settings!.details!.path.slice("data/details-".length, -".json".length))).toBe(true);
  });

  it("ignores unknown extra fields", () => {
    const { settings } = validateSettings({ ...base(), somethingNew: { a: 1 }, colour: "red" });
    expect(settings).not.toBeNull();
    expect(settings).not.toHaveProperty("somethingNew");
  });

  it.each([
    ["not an object", [1, 2]],
    ["null", null],
    ["schemaVersion 2", { ...base(), schemaVersion: 2 }],
    ["schemaVersion '1'", { ...base(), schemaVersion: "1" }],
    ["schemaVersion true", { ...base(), schemaVersion: true }],
    ["namesOnly missing", (({ namesOnly: _, ...rest }) => rest)(base())],
    ["namesOnly 'false'", { ...base(), namesOnly: "false" }],
    ["updatedAt missing", (({ updatedAt: _, ...rest }) => rest)(base())],
    ["primary missing", (({ primary: _, ...rest }) => rest)(base())],
    ["primary a string", { ...base(), primary: `${CDN}/art/{art}` }],
    ["primary without id", { ...base(), primary: { template: `${CDN}/art/{art}` } }],
    ["fallbacks missing", (({ fallbacks: _, ...rest }) => rest)(base())],
    ["fallbacks an object", { ...base(), fallbacks: {} }],
    ["a fallback of the wrong shape", { ...base(), fallbacks: [{ id: "x" }] }],
  ])("refuses a file with %s", (_, raw) => {
    const { settings, problems } = validateSettings(raw);
    expect(settings).toBeNull();
    expect(problems.length).toBe(1);
  });

  it("takes primary null and an empty fallback list", () => {
    const { settings } = validateSettings({ ...base(), primary: null, fallbacks: [] });
    expect(settings?.primary).toBeNull();
    expect(settings?.fallbacks).toEqual([]);
  });

  it("drops a source that is not https://, keeping the rest", () => {
    const { settings, problems } = validateSettings({
      ...base(),
      fallbacks: [
        { id: "plain", template: `${CDN.replace("https", "http")}/mirror/{cardId}.jpg` },
        { id: "mirror", template: `${CDN}/mirror/{cardId}.jpg` },
      ],
    });
    expect(settings?.fallbacks.map((s) => s.id)).toEqual(["mirror"]);
    expect(problems[0]).toMatch(/fallbacks\[0\] dropped: not https/);
  });

  it("drops a source with an unknown placeholder", () => {
    const { settings } = validateSettings({ ...base(), fallbacks: [{ id: "x", template: `${CDN}/{nope}` }] });
    expect(settings?.fallbacks).toEqual([]);
  });

  it("drops a source on a host the extension may not request", () => {
    const { settings, problems } = validateSettings({ ...base(), primary: { id: "cdn", template: "https://elsewhere.example/art/{art}" } });
    expect(settings?.primary).toBeNull();
    expect(problems[0]).toMatch(/elsewhere\.example/);
  });

  it("drops a source that uses {sourceFile}, a placeholder this build does not have", () => {
    const { settings } = validateSettings({ ...base(), primary: { id: "cdn", template: `${CDN}/art/{sourceFile}` } });
    expect(settings?.primary).toBeNull();
    expect(settings?.fallbacks.length).toBe(1);
  });

  it("ignores the obsolete cardLink, whatever it holds, and does without it", () => {
    for (const cardLink of ["https://www.example.org/cards/{printedId}", "javascript:alert(1)", null, 5, { x: 1 }]) {
      const { settings, problems } = validateSettings({ ...base(), cardLink });
      expect(settings).not.toBeNull();
      expect(problems).toEqual([]);
      expect(settings).not.toHaveProperty("cardLink");
    }
    const { cardLink: _, ...without } = base();
    expect(validateSettings(without).settings).not.toBeNull();
  });

  it("reads namesOnly", () => {
    expect(validateSettings({ ...base(), namesOnly: true }).settings?.namesOnly).toBe(true);
  });

  it("ignores the retired geometric field, whatever it holds", () => {
    for (const geometric of [true, false, null, "false"]) {
      const { settings, problems } = validateSettings({ ...base(), geometric });
      expect(settings).not.toBeNull();
      expect(problems).toEqual([]);
      expect(settings).not.toHaveProperty("geometric");
    }
  });

  const P = UPDATE_URL_PREFIX ?? "";
  describe.runIf(UPDATE_URL_PREFIX !== null)("the optional update field", () => {
    it("takes an address under the project's releases only", () => {
      for (const url of [
        P,
        `${P}/tag/v0.2.0`,
        `${P}?q=1`,
      ]) {
        expect(validateSettings({ ...base(), update: { latest: "0.2.0", url } }).settings?.update?.url).toBe(url);
      }
    });

    it("reads a well-formed one", () => {
      const { settings } = validateSettings({ ...base(), update: { latest: "0.2.0", url: P } });
      expect(settings?.update).toEqual({ latest: "0.2.0", url: new URL(P).href });
    });

    it.each([
      [{ latest: "0.2", url: "https://x.example/" }],
      [{ latest: "v0.2.0", url: "https://x.example/" }],
      [{ latest: "0.2.0", url: "http://x.example/" }],
      [{ latest: "0.2.0", url: "not a url" }],
      [{ latest: "0.2.0", url: "https://evil.example/duelsight" }],
      [{ latest: "0.2.0", url: `${P}-fake` }],
      [{ latest: "0.2.0", url: "https://github.com/someone-else/duelsight/releases" }],
      [{ latest: "0.2.0" }],
      ["0.2.0"],
    ])("ignores a malformed one without refusing the file: %j", (update) => {
      const { settings, problems } = validateSettings({ ...base(), update });
      expect(settings).not.toBeNull();
      expect(settings?.update).toBeNull();
      expect(problems.some((p) => p.startsWith("update: ignored"))).toBe(true);
    });
  });
  describe("the optional details field", () => {
    const sha = "0123456789abcdef".repeat(4);
    it("is absent (null) in a file that does not have it", () => {
      expect(validateSettings(base()).settings?.details).toBeNull();
      expect(validateSettings({ ...base(), details: null }).settings?.details).toBeNull();
    });

    it("reads a path on the settings host and the file's SHA-256", () => {
      const { settings, problems } = validateSettings({ ...base(), details: { path: "data/details-01234567.json", sha256: sha } });
      expect(problems).toEqual([]);
      expect(settings?.details).toEqual({ path: "data/details-01234567.json", sha256: sha });
      expect(detailsUrl(settings!.details!, `${CDN}/config.json`)).toBe(`${CDN}/data/details-01234567.json`);
      expect(detailsUrl(settings!.details!, null)).toBeNull();
    });

    it.each([
      [{ path: "../details.json", sha256: "0123456789abcdef".repeat(4) }],
      [{ path: "/data/details.json", sha256: "0123456789abcdef".repeat(4) }],
      [{ path: "data/./details.json", sha256: "0123456789abcdef".repeat(4) }],
      [{ path: "https://evil.example/details.json", sha256: "0123456789abcdef".repeat(4) }],
      [{ path: "//evil.example/details.json", sha256: "0123456789abcdef".repeat(4) }],
      [{ path: "data/details.js", sha256: "0123456789abcdef".repeat(4) }],
      [{ path: "data/details.json", sha256: "ABCDEF" }],
      [{ path: "data/details.json" }],
      ["data/details.json"],
    ])("ignores a malformed one without refusing the file: %j", (details) => {
      const { settings, problems } = validateSettings({ ...base(), details });
      expect(settings).not.toBeNull();
      expect(settings?.details).toBeNull();
      expect(problems.some((p) => p.startsWith("details: ignored"))).toBe(true);
    });
  });
  describe("the optional details<Lang> fields (the card details file in other languages)", () => {
    const sha = "fedcba9876543210".repeat(4);
    it("are none in a file that has none", () => {
      expect(validateSettings(base()).settings?.localDetails).toEqual({});
    });

    it("read each language's path on the settings host and SHA-256, like details, by language code", () => {
      const fr = { path: "data/details-fr-01234567.json", sha256: sha };
      const de = { path: "data/details-de-89abcdef.json", sha256: sha };
      const { settings, problems } = validateSettings({ ...base(), detailsFr: fr, detailsDe: de });
      expect(problems).toEqual([]);
      expect(settings?.localDetails).toEqual({ fr, de });
    });

    it("ignore a malformed one without refusing the file, and name it in the problem", () => {
      const { settings, problems } = validateSettings({ ...base(), detailsFr: { path: "../x.json", sha256: sha }, detailsIt: { path: "data/details-it-01234567.json", sha256: sha } });
      expect(settings).not.toBeNull();
      expect(Object.keys(settings!.localDetails)).toEqual(["it"]);
      expect(problems.some((p) => p.startsWith("detailsFr: ignored"))).toBe(true);
    });

    it("ignore keys that are not details<Lang>, and detailsEn (English is details)", () => {
      const source = { path: "data/details-xx-01234567.json", sha256: sha };
      const { settings, problems } = validateSettings({ ...base(), detailsEn: source, detailsFR: source, detailsFrench: source, details_fr: source, detailsDE1: source });
      expect(settings?.localDetails).toEqual({});
      expect(problems).toEqual([]);
    });
  });
});
