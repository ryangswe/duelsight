// SPDX-License-Identifier: Apache-2.0
// The Firefox build (`npm run build -- --target firefox`): the same bundles, Firefox's manifest.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// @ts-expect-error plain JavaScript build scripts
import { configProblems } from "../scripts/fork-config.mjs";
// @ts-expect-error plain JavaScript build scripts
import { buildManifest, FIREFOX_DATA_COLLECTION, FIREFOX_MIN_VERSION, firefoxAddonId, firefoxManifest } from "../scripts/manifest.mjs";
import { CONFIG, IS_DUELSIGHT, TOY_CONFIG } from "./helpers/fork.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const ff = (dev: boolean) => firefoxManifest(buildManifest({ version: "0.3.0", dev, store: true }), { dev, config: CONFIG });

describe.runIf(typeof CONFIG.firefoxAddonId === "string")("the Firefox manifest", () => {
  const release = ff(false);
  const chrome = buildManifest({ version: "0.3.0", dev: false, store: true });

  it("runs the background module as a background script (Firefox has no service worker)", () => {
    expect(release.background).toEqual({ scripts: ["background.js"], type: "module" });
  });

  it("has the add-on ID, the minimum Firefox and the data declaration", () => {
    expect(release.browser_specific_settings).toEqual({
      gecko: { id: CONFIG.firefoxAddonId, strict_min_version: FIREFOX_MIN_VERSION, data_collection_permissions: FIREFOX_DATA_COLLECTION },
    });
    expect(FIREFOX_DATA_COLLECTION).toEqual({ required: ["none"] });
    // 148: the first Firefox with location.ancestorOrigins, which the frames need to start.
    expect(FIREFOX_MIN_VERSION).toBe("148.0");
  });

  it("has no key and no minimum Chrome version, and is desktop only", () => {
    expect(release).not.toHaveProperty("key");
    expect(release).not.toHaveProperty("minimum_chrome_version");
    expect(release.browser_specific_settings).not.toHaveProperty("gecko_android");
    // A key in the Chrome manifest is dropped too.
    expect(firefoxManifest(buildManifest({ version: "0.3.0", dev: false }), { dev: false, config: CONFIG })).not.toHaveProperty("key");
  });

  it("is otherwise the Chrome manifest: same permissions, sites, frames, policy and popup", () => {
    const { background: _b, browser_specific_settings: _g, ...rest } = release;
    const { background: _c, minimum_chrome_version: _m, ...chromeRest } = chrome;
    expect(rest).toEqual(chromeRest);
  });

  it("gives a dev build its own ID, so it loads beside the listed add-on", () => {
    const dev = ff(true);
    expect(dev.browser_specific_settings.gecko.id).toBe(String(CONFIG.firefoxAddonId).replace("@", "-dev@"));
    expect(dev.browser_specific_settings.gecko.id).not.toBe(release.browser_specific_settings.gecko.id);
    expect(dev.content_scripts[0].matches).toContain("http://127.0.0.1/*");
  });

  it.runIf(IS_DUELSIGHT)("is DuelSight's: its permanent add-on ID", () => {
    expect(release.browser_specific_settings.gecko.id).toBe("duelsight@duelsight.com");
  });
});

describe("firefoxAddonId in the config", () => {
  it("is optional: without it there is no Firefox build", () => {
    expect(configProblems(TOY_CONFIG, null)).toEqual([]);
    expect(firefoxAddonId(TOY_CONFIG, false)).toBeNull();
    expect(() => firefoxManifest(buildManifest({ version: "1.0.0", dev: false, config: TOY_CONFIG }), { dev: false, config: TOY_CONFIG })).toThrow(/no firefoxAddonId/);
  });

  it.each([["toy-cards"], ["toy cards@example.org"], ["@example.org"], [42]])("refuses %j", (id) => {
    expect(configProblems({ ...TOY_CONFIG, firefoxAddonId: id }, null).some((p: string) => p.startsWith("firefoxAddonId:"))).toBe(true);
  });

  it("takes name@domain, or null", () => {
    expect(configProblems({ ...TOY_CONFIG, firefoxAddonId: "toy-cards@example.org" }, null)).toEqual([]);
    expect(configProblems({ ...TOY_CONFIG, firefoxAddonId: null }, null)).toEqual([]);
  });
});

describe("npm run build --target", () => {
  const run = (...args: string[]): { status: number; err: string } => {
    try {
      execFileSync(process.execPath, ["scripts/build.mjs", ...args], { cwd: root, stdio: "pipe", encoding: "utf-8" });
      return { status: 0, err: "" };
    } catch (e) {
      const x = e as { status: number; stderr: string };
      return { status: x.status, err: x.stderr };
    }
  };

  it("refuses a target it does not know, and --store with firefox (before reading any release)", () => {
    expect(run("--release", "/nonexistent", "--target", "safari")).toEqual({ status: 2, err: expect.stringMatching(/--target is chrome or firefox/) });
    expect(run("--release", "/nonexistent", "--target", "firefox", "--store")).toEqual({ status: 2, err: expect.stringMatching(/--store is the Chrome Web Store build/) });
  });
});
