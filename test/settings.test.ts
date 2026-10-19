// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import DEFAULT_CONFIG from "../cdn/config.json";
import { UPDATE_URL_PREFIX } from "../src/constants.js";
import { validateSettings as validateWithHosts } from "../src/settings/schema.js";
import { IS_KENBUNSHOKU } from "./helpers/fork.js";

/** A settings file (a fixture, not the build's own), and the hosts these tests allow. */
const FIXTURE = {
  schemaVersion: 1,
  updatedAt: "2026-10-16T00:00:00Z",
  namesOnly: false,
  primary: { id: "cdn", template: "https://cdn.kenbunshoku.com/art/{art}" },
  fallbacks: [{ id: "optcgapi", template: "https://optcgapi.com/media/static/Card_Images/{sourceFile}" }],
  cardLink: "https://en.onepiece-cardgame.com/cardlist/?freewords={printedId}",
};
const HOSTS = ["cdn.kenbunshoku.com", "optcgapi.com"];
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
  it.runIf(IS_KENBUNSHOKU)("accepts Kenbunshoku's bundled default as it ships", () => {
    const { settings, problems } = validateWithHosts(DEFAULT_CONFIG);
    expect(problems).toEqual([]);
    expect(settings).toEqual({
      schemaVersion: 1,
      updatedAt: "2026-10-16T00:00:00Z",
      namesOnly: false,
      primary: { id: "cdn", template: "https://cdn.kenbunshoku.com/art/{art}" },
      fallbacks: [{ id: "optcgapi", template: "https://optcgapi.com/media/static/Card_Images/{sourceFile}" }],
      update: null,
      geometric: true,
    });
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
    ["primary a string", { ...base(), primary: "https://cdn.kenbunshoku.com/art/{art}" }],
    ["primary without id", { ...base(), primary: { template: "https://cdn.kenbunshoku.com/art/{art}" } }],
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
        { id: "plain", template: "http://optcgapi.com/{sourceFile}" },
        { id: "optcgapi", template: "https://optcgapi.com/media/static/Card_Images/{sourceFile}" },
      ],
    });
    expect(settings?.fallbacks.map((s) => s.id)).toEqual(["optcgapi"]);
    expect(problems[0]).toMatch(/fallbacks\[0\] dropped: not https/);
  });

  it("drops a source with an unknown placeholder", () => {
    const { settings } = validateSettings({ ...base(), fallbacks: [{ id: "x", template: "https://optcgapi.com/{nope}" }] });
    expect(settings?.fallbacks).toEqual([]);
  });

  it("drops a source on a host the extension may not request", () => {
    const { settings, problems } = validateSettings({ ...base(), primary: { id: "cdn", template: "https://elsewhere.example/art/{art}" } });
    expect(settings?.primary).toBeNull();
    expect(problems[0]).toMatch(/elsewhere\.example/);
  });

  it("drops a primary that uses {sourceFile}", () => {
    const { settings } = validateSettings({ ...base(), primary: { id: "cdn", template: "https://cdn.kenbunshoku.com/art/{sourceFile}" } });
    expect(settings?.primary).toBeNull();
    expect(settings?.fallbacks.length).toBe(1);
  });

  it("ignores the obsolete cardLink, whatever it holds, and does without it", () => {
    for (const cardLink of ["https://en.onepiece-cardgame.com/cardlist/?freewords={printedId}", "javascript:alert(1)", null, 5, { x: 1 }]) {
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

  describe("the optional geometric field (kill switch of the extra-accuracy stage)", () => {
    it("is on when absent or null", () => {
      expect(validateSettings(base()).settings?.geometric).toBe(true);
      expect(validateSettings({ ...base(), geometric: null }).settings?.geometric).toBe(true);
    });
    it("turns the stage off with false", () => {
      expect(validateSettings({ ...base(), geometric: false }).settings?.geometric).toBe(false);
      expect(validateSettings({ ...base(), geometric: true }).settings?.geometric).toBe(true);
    });
    it("is ignored (on) when it is not a boolean, without refusing the file", () => {
      const { settings, problems } = validateSettings({ ...base(), geometric: "false" });
      expect(settings?.geometric).toBe(true);
      expect(problems.some((p) => p.startsWith("geometric: ignored"))).toBe(true);
    });
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
      [{ latest: "0.2.0", url: "https://evil.example/kenbunshoku" }],
      [{ latest: "0.2.0", url: `${P}-fake` }],
      [{ latest: "0.2.0", url: "https://github.com/someone-else/kenbunshoku/releases" }],
      [{ latest: "0.2.0" }],
      ["0.2.0"],
    ])("ignores a malformed one without refusing the file: %j", (update) => {
      const { settings, problems } = validateSettings({ ...base(), update });
      expect(settings).not.toBeNull();
      expect(settings?.update).toBeNull();
      expect(problems.some((p) => p.startsWith("update: ignored"))).toBe(true);
    });
  });
});
