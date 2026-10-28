// SPDX-License-Identifier: Apache-2.0
// The build's manifest and card data.
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// @ts-expect-error plain JavaScript build scripts
import { releaseLegalProblem } from "../scripts/release-legal.mjs";
import { buildCardTable } from "../vendor/cardvision-browser/remote-release.js";
// @ts-expect-error plain JavaScript build scripts
import { buildManifest, UNPACKED_EXTENSION_ID } from "../scripts/manifest.mjs";
// @ts-expect-error plain JavaScript build scripts
import { configProblems, loadForkConfig, videoSitePatterns, withCdnBase } from "../scripts/fork-config.mjs";
import { IMAGE_HOSTS, SETTINGS_URL, UPDATE_URL_PREFIX } from "../src/constants.js";
import { isActivePage } from "../src/content/site.js";
import { allowedParentOrigin } from "../src/shared/messages.js";
import { makePrintedId, printedId } from "../src/settings/templates.js";
import { CONFIG, FIXTURE_CDN, IS_DUELSIGHT, TOY_CONFIG } from "./helpers/fork.js";
import { buildLoadRequest } from "../src/compute/load-request.js";
import { knownCard } from "../src/tooltip/controller.js";

/** The config as a fork without a cdnBase would write it: the hosts and the settings address spelled out. */
const NO_CDN = { ...CONFIG, cdnBase: null };

describe("the config (duelsight.config.json)", () => {
  it("has no problem", () => {
    expect(configProblems(CONFIG)).toEqual([]);
  });

  it("refuses what the build cannot use", () => {
    const bad = (patch: Record<string, unknown>) => configProblems({ ...NO_CDN, ...patch }, null);
    expect(bad({ videoSites: { youtube: false, twitch: false } })).toContain("videoSites: at least one site");
    expect(bad({ imageHosts: ["https://x.example"] })[0]).toMatch(/imageHosts/);
    expect(bad({ settingsUrl: "http://x.example/c.json" })[0]).toMatch(/settingsUrl/);
    expect(bad({ settingsUrl: "https://not-listed.example/c.json", imageHosts: [] })[0]).toMatch(/must be in imageHosts/);
    expect(bad({ printedNumber: { regex: "^[A-Z]+$" } })[0]).toMatch(/capture group/);
    expect(bad({ printedNumber: { regex: "([" } })[0]).toMatch(/printedNumber.regex/);
    expect(bad({ geometric: { settings: "x.json", manifestSha256: "a".repeat(64) } })).toContain('unknown key "geometric"');
    expect(bad({ packageName: "My Extension" })[0]).toMatch(/packageName/);
    expect(bad({ extra: 1 })).toContain('unknown key "extra"');
    // The tooltip has no link any more, and so no link label.
    expect(bad({ cardLinkLabel: "Official card list" })).toContain('unknown key "cardLinkLabel"');
  });

  it.each([
    ["name too long", { name: "x".repeat(46) }, "name:"],
    ["empty name", { name: " " }, "name:"],
    ["shortName too long", { shortName: "x".repeat(13) }, "shortName:"],
    ["description too long", { description: "x".repeat(133) }, "description:"],
    ["http updateUrlPrefix", { updateUrlPrefix: "http://x.example/releases" }, "updateUrlPrefix:"],
    ["http projectUrl", { projectUrl: "http://x.example/" }, "projectUrl:"],
    ["missing projectUrl", { projectUrl: null }, "projectUrl:"],
    ["http runtimeUrl", { runtimeUrl: "http://x.example/" }, "runtimeUrl:"],
    ["non-https modelUrl", { modelUrl: "ftp://x.example/m" }, "modelUrl:"],
    ["non-https maintainerContactUrl", { maintainerContactUrl: "mailto:x@x.example" }, "maintainerContactUrl:"],
    ["a printedNumber word it does not know", { printedNumber: "regex" }, "printedNumber:"],
    ["a printedNumber object with another key", { printedNumber: { regex: "(a)", flags: "i" } }, "printedNumber:"],
    ["an extra key in videoSites", { videoSites: { youtube: true, twitch: true, vimeo: true } }, "videoSites:"],
    ["a cdnBase with a path", { cdnBase: "https://cdn.example.com/art" }, "cdnBase:"],
    ["a cdnBase that is not https", { cdnBase: "http://cdn.example.com" }, "cdnBase:"],
    ["a cdnBase whose derived hosts were changed", { cdnBase: CONFIG.cdnBase, imageHosts: ["other.example.com"] }, "cdnBase:"],
    ["an upper-case host", { imageHosts: ["CDN.example.com"] }, "imageHosts:"],
    ["an empty icons folder name", { icons: "" }, "icons:"],
  ])("refuses %s", (_label, patch, prefix) => {
    expect(configProblems({ ...NO_CDN, ...patch }, null).some((p: string) => p.startsWith(prefix))).toBe(true);
  });

  it("refuses a config that is not an object", () => {
    for (const c of [null, [], "config", 1]) expect(configProblems(c, null)).toEqual(["not a JSON object"]);
  });

  it("refuses a file that is not readable JSON, and lists every problem of a bad one", () => {
    const dir = mkdtempSync(join(tmpdir(), "fork-config-"));
    try {
      writeFileSync(join(dir, "bad.json"), "{ not json");
      expect(() => loadForkConfig(join(dir, "bad.json"), null)).toThrow(/not readable JSON/);
      writeFileSync(join(dir, "worse.json"), JSON.stringify({ ...NO_CDN, name: "", packageName: "Bad Name" }));
      expect(() => loadForkConfig(join(dir, "worse.json"), null)).toThrow(/name:[\s\S]*packageName:/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("derives imageHosts and settingsUrl from cdnBase, the one place the CDN host is written", () => {
    const { imageHosts: _h, settingsUrl: _s, ...written } = CONFIG as unknown as Record<string, unknown>;
    const derived = withCdnBase(written);
    expect(derived.imageHosts).toEqual([new URL(CONFIG.cdnBase!).hostname]);
    expect(derived.settingsUrl).toBe(`${CONFIG.cdnBase}/config.json`);
    expect(derived).toEqual(CONFIG);
    // Writing either beside cdnBase is refused, not silently overridden.
    const dir = mkdtempSync(join(tmpdir(), "fork-config-"));
    try {
      writeFileSync(join(dir, "both.json"), JSON.stringify({ ...written, settingsUrl: "https://other.example.com/config.json" }));
      expect(() => loadForkConfig(join(dir, "both.json"), null)).toThrow(/settingsUrl: not written beside cdnBase/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("has no geometric stage: no key, no settings file, no OpenCV in the build script", () => {
    expect(CONFIG).not.toHaveProperty("geometric");
    expect(existsSync(new URL("../data/geometric.json", import.meta.url))).toBe(false);
    const build = readFileSync(new URL("../scripts/build.mjs", import.meta.url), "utf-8");
    expect(build).not.toMatch(/copyFileSync\([^)]*opencv/);
    expect(build).not.toContain("geometric.json");
  });

  it("takes an optional outline color, as a plain CSS color only", () => {
    const problems = (outlineColor: unknown) => configProblems({ ...CONFIG, outlineColor }, null);
    for (const ok of ["#f4f4f6", "#fff", "#ffffffcc", "rgb(255, 255, 255)", "rgba(250,250,250,.9)", "hsl(0 0% 96% / 0.9)", "hsl(120deg 50% 50%)", "rgb(10% 20% 30%)", "white", "RebeccaPurple"]) {
      expect(problems(ok)).toEqual([]);
    }
    for (const no of [
      "", " #fff", "\u2003#fff", "#fff\u00a0", "rgb(1\u00a02 3)", "#ggg", "red; background:url(x)", "url(x)", "expression(alert(1))", "var(--x)",
      "rgb(var(--x))", "notacolor", "transparent", "currentcolor", "inherit", "rgba(0,0,0,0)", "rgba(0,0,0,0%)", "hsl(0 0% 0% / 0)", "#fff0", "#ffffff00",
      "rgb(1,2)", "rgb(1dd,2,3)", "rgb(1 2 3 4)", "rgb(1,,2,3)", "rgb(1deg 2deg 3deg)", "rgb()", "rgb(1 2 3 /)", "rgb(1, 2 3)", "rgba(61,111,224,1.)", "rgb(10%, 20, 30)",
      "hsl(1 2 3)", "hsla(0,0%,0%,0%)", 12, null,
    ]) {
      expect(problems(no).some((p: string) => p.startsWith("outlineColor:"))).toBe(true);
    }
    const { outlineColor: _, ...without } = CONFIG as unknown as Record<string, unknown>;
    expect(configProblems(without, null)).toEqual([]);
  });

  it("takes an optional outline glow color under the same rules", () => {
    const problems = (outlineGlowColor: unknown) => configProblems({ ...CONFIG, outlineGlowColor }, null);
    for (const ok of ["rgba(61, 111, 224, 0.6)", "#3d6fe0", "hsl(222 72% 56% / 0.6)", "royalblue"]) expect(problems(ok)).toEqual([]);
    for (const no of ["var(--x)", "rgba(0,0,0,0)", "transparent", "rgb(1 2 3 4)", "notacolor", "", 5]) {
      expect(problems(no).some((p: string) => p.startsWith("outlineGlowColor:"))).toBe(true);
    }
    const { outlineGlowColor: _, ...without } = CONFIG as unknown as Record<string, unknown>;
    expect(configProblems(without, null)).toEqual([]);
  });

  it("checks its files on disk", () => {
    expect(configProblems({ ...CONFIG, icons: "no-such-folder" }).some((p: string) => p.startsWith("icons:"))).toBe(true);
  });
});

describe("manifest", () => {
  const m = buildManifest({ version: "0.1.0", dev: false });
  const hosts = CONFIG.imageHosts.map((h) => `https://${h}`);

  it("asks for storage and nothing else (no unlimited storage: there is no feature index)", () => {
    expect(m.permissions).toEqual(["storage"]);
    expect(m).not.toHaveProperty("optional_permissions");
  });

  it("names the config's video sites and image hosts, and nothing else", () => {
    expect(m.host_permissions).toEqual([...videoSitePatterns(CONFIG), ...hosts.map((h) => `${h}/*`)]);
    expect(m.content_scripts[0].matches).toEqual(videoSitePatterns(CONFIG));
    expect(m.name).toBe(CONFIG.name);
    expect(m.short_name).toBe(CONFIG.shortName);
    expect(m.description).toBe(CONFIG.description);
  });

  it("lets extension pages compile WebAssembly, and connect only to themselves and the image hosts", () => {
    expect(m.content_security_policy.extension_pages).toBe(
      `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self'${hosts.map((h) => ` ${h}`).join("")}; img-src 'self' blob: data:`,
    );
  });

  it("lets only a dev build fetch from a local server, and run on the local test page", () => {
    expect(JSON.stringify(m)).not.toContain("127.0.0.1");
    expect(JSON.stringify(m)).not.toContain("localhost");
    const dev = buildManifest({ version: "0.1.0", dev: true });
    expect(dev.content_security_policy.extension_pages).toContain(" http://127.0.0.1:*");
    expect(dev.content_scripts[0].matches).toContain("http://127.0.0.1/*");
    expect(dev.content_scripts[0].matches).toContain("http://localhost/*");
    expect(dev.host_permissions).not.toContain("http://127.0.0.1/*");
    expect(dev.name).toBe(`${CONFIG.name} (dev)`);
  });

  it("fixes the unpacked ID with the committed public key, and leaves it out of a store build", () => {
    expect(typeof m.key).toBe("string");
    const id = createHash("sha256")
      .update(Buffer.from(m.key, "base64"))
      .digest("hex")
      .slice(0, 32)
      .replace(/./g, (c: string) => String.fromCharCode(97 + Number.parseInt(c, 16)));
    expect(id).toBe(UNPACKED_EXTENSION_ID);
    expect(buildManifest({ version: "0.1.0", dev: true }).key).toBe(m.key);
    expect(buildManifest({ version: "0.1.0", dev: false, store: true })).not.toHaveProperty("key");
  });

  it.runIf(IS_DUELSIGHT)("is DuelSight's: its ID", () => {
    expect(UNPACKED_EXTENSION_ID).toBe("ddhnolhobdfnfofeloiimlelijgjihfp");
  });

  it("is DuelSight's name exactly when it is DuelSight's key (a fork changes both)", () => {
    const ownKey = UNPACKED_EXTENSION_ID === "ddhnolhobdfnfofeloiimlelijgjihfp";
    // A fork that renames its package but keeps keys/unpacked-public.pem would install over
    // DuelSight; one that keeps the name with its own key would run DuelSight's tests.
    expect({ packageNameIsOwn: CONFIG.packageName === "duelsight", keyIsOwn: ownKey }).toEqual({
      packageNameIsOwn: ownKey,
      keyIsOwn: CONFIG.packageName === "duelsight",
    });
  });

  it.runIf(IS_DUELSIGHT)("is DuelSight's: its network surface, value for value (YouTube, twitch.tv and the CDN, nothing else)", () => {
    const host = new URL(FIXTURE_CDN).hostname;
    const release = buildManifest({ version: "0.1.0", dev: false });
    expect(release.permissions).toEqual(["storage"]);
    expect(release.host_permissions).toEqual(["https://www.youtube.com/*", "https://www.twitch.tv/*", `https://${host}/*`]);
    expect(release.content_security_policy).toEqual({
      extension_pages: `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' https://${host}; img-src 'self' blob: data:`,
    });
    expect(SETTINGS_URL).toBe(`${FIXTURE_CDN}/config.json`);
    expect(CONFIG.cdnBase).toBe(FIXTURE_CDN);
  });
});

describe("a fork's minimal config (names only, no settings address, no stage, one site)", () => {
  const m = buildManifest({ version: "1.0.0", dev: false, config: TOY_CONFIG });
  it("is a valid config", () => {
    expect(configProblems(TOY_CONFIG)).toEqual([]);
  });
  it("asks for one site and storage only, and may connect to nothing but itself", () => {
    expect(m.name).toBe("Toy Cards");
    expect(m.permissions).toEqual(["storage"]);
    expect(m.host_permissions).toEqual(["https://www.youtube.com/*"]);
    expect(m.content_scripts[0].matches).toEqual(["https://www.youtube.com/*"]);
    expect(m.web_accessible_resources[0].matches).toEqual(["https://www.youtube.com/*"]);
    expect(m.content_security_policy.extension_pages).toBe("script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self'; img-src 'self' blob: data:");
    expect(m.action.default_title).toBe("Toy Cards");
  });
  it("its pages and frames accept only that site", () => {
    expect(isActivePage(new URL("https://www.youtube.com/watch?v=abc"), false, TOY_CONFIG.videoSites)).toBe(true);
    expect(isActivePage(new URL("https://www.twitch.tv/someone"), false, TOY_CONFIG.videoSites)).toBe(false);
    expect(allowedParentOrigin("https://www.twitch.tv", false, TOY_CONFIG.videoSites)).toBe(false);
    expect(allowedParentOrigin("https://www.youtube.com", false, TOY_CONFIG.videoSites)).toBe(true);
  });
  it("its printed-number rule 'none' gives no number and so no {printedId}", () => {
    expect(makePrintedId("none")("OP01-001")).toBeNull();
    expect(makePrintedId("catalog")("x", "TOY-001")).toBe("TOY-001");
    expect(makePrintedId("catalog")("x", null)).toBeNull();
  });
});

describe("card data (names from our own catalog; no third-party card source)", () => {
  // Passcodes as ids; one name's other artworks share its identity in the release's groups.
  const catalog = {
    cards: [
      { id: "89631139", name: "Blue-Eyes White Dragon", art: "89631139.jpg", facets: { set: "LOB" } },
      { id: "46986414", name: "Dark Magician", art: "46986414.jpg", facets: { set: "LOB" } },
      { id: "122", name: "No Art Yet", art: null, facets: {} },
    ],
  };

  it("writes name, set and art per card", () => {
    const table = buildCardTable(catalog);
    expect(table["89631139"]).toEqual(["Blue-Eyes White Dragon", "LOB", "89631139.jpg"]);
    expect(table["122"]).toEqual(["No Art Yet", null, null]);
    expect(knownCard(table, "122")).toEqual({ id: "122", name: "No Art Yet", set: null, art: null, printed: null });
    expect(knownCard(table, "ZZ-1")).toBeNull();
    expect(knownCard(table, "__proto__")).toBeNull();
  });

  it("has no reader of any third-party card source in the build or the extension", () => {
    for (const path of ["../vendor/cardvision-browser/remote-release.js", "../scripts/build.mjs", "../src/tooltip/card-data.ts", "../src/settings/templates.ts"]) {
      const text = readFileSync(new URL(path, import.meta.url), "utf-8");
      expect(text).not.toMatch(/optcgapi|sourceFile|source-files/);
    }
    expect(existsSync(new URL("../data/source-files.json", import.meta.url))).toBe(false);
  });

  it("carries each card's printed number with the 'catalog' rule", () => {
    const table = buildCardTable({ cards: [{ id: "a", name: "A", art: null, printed: "TOY-001" }, { id: "b", name: "B", art: null }] }, { printed: true });
    expect(table.a).toEqual(["A", null, null, "TOY-001"]);
    expect(table.b).toEqual(["B", null, null, null]);
    expect(knownCard(table, "a")?.printed).toBe("TOY-001");
  });
});

describe("load request", () => {
  it("is the runtime's plain load: no feature index, nothing else to download", () => {
    expect(buildLoadRequest("chrome-extension://x/release/release.json", "chrome-extension://x/runtime/")).toEqual({
      kind: "load",
      releaseUrl: "chrome-extension://x/release/release.json",
      wasmPaths: "chrome-extension://x/runtime/",
    });
  });
});

describe("public copy", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf-8");
  const disclaimer = "is an unofficial fan project, not affiliated with or endorsed by Konami.";
  // The popup leaves it out (owner, 2026-10-24): the manifest description (shown on the extensions page
  // and as the store summary), the store description, the README and PRIVACY carry it.
  it("says in the README, PRIVACY and the manifest that it is not affiliated with Konami", () => {
    expect(read("../README.md")).toContain(`DuelSight ${disclaimer}`.replace("DuelSight is", "**DuelSight is").replace("Konami.", "Konami.**"));
    expect(read("../PRIVACY.md")).toContain("not affiliated with or endorsed by Konami");
    expect(CONFIG.description).toContain("not affiliated with or endorsed by Konami");
  });
  it("avoids the words the project does not use in its own copy", () => {
    for (const path of ["../README.md", "../PRIVACY.md", "../static/popup.html", "../MAINTAINING.md", "../docs/store-listing.md", "../docs/using.md", "../docs/how-it-works.md", "../docs/accuracy.md", "../docs/permissions.md", "../docs/install-from-zip.md"]) {
      const text = read(path).replace(/<!--[\s\S]*?-->/g, "");
      expect(text, path).not.toMatch(/\b(first|only|best)\b|any video|every card/i);
    }
    expect(CONFIG.description).not.toMatch(/\b(first|only|best)\b|any video|every card/i);
  });
});

describe("release-legal", () => {
  it("holds the models' LICENSE, NOTICE and PROVENANCE.md; NOTICE's first line names a release", () => {
    for (const name of ["LICENSE", "NOTICE", "PROVENANCE.md"]) expect(existsSync(new URL(`../release-legal/${name}`, import.meta.url))).toBe(true);
    expect(readFileSync(new URL("../release-legal/NOTICE", import.meta.url), "utf-8").split("\n")[0]).toMatch(/\(id [0-9a-f]{16}\)/);
  });

  it("is marked PLACEHOLDER while it describes the dev fixture, not a DuelSight release", () => {
    const notice = readFileSync(new URL("../release-legal/NOTICE", import.meta.url), "utf-8");
    const placeholder = notice.startsWith("PLACEHOLDER");
    if (placeholder) expect(readFileSync(new URL("../release-legal/PROVENANCE.md", import.meta.url), "utf-8")).toContain("PLACEHOLDER");
    // A DuelSight release's notice says what it is and who it is not by.
    else expect(notice).toContain("not affiliated with or endorsed by Konami");
  });
});

describe("release-legal fits the release", () => {
  const read = (name: string) => readFileSync(new URL(`../release-legal/${name}`, import.meta.url), "utf-8");
  const files = { LICENSE: read("LICENSE"), NOTICE: read("NOTICE"), "PROVENANCE.md": read("PROVENANCE.md") };
  const id = /\(id ([0-9a-f]{16})\)/.exec(files.NOTICE.split("\n")[0] ?? "")?.[1] ?? "";

  it("passes for the release its NOTICE's first line names", () => {
    expect(releaseLegalProblem(id, files)).toBeNull();
  });
  it("fails for a release only mentioned further down", () => {
    const later = { ...files, NOTICE: `${files.NOTICE.split("\n")[0]}\nIt differs from 0123456789abcdef.\n` };
    expect(releaseLegalProblem("0123456789abcdef", later)).toMatch(/first line does not name release 0123456789abcdef/);
  });
  it("fails when a file is missing", () => {
    const { NOTICE: _, ...rest } = files;
    expect(releaseLegalProblem(id, rest)).toMatch(/missing NOTICE/);
  });
  it("fails for an id that is not a release id", () => {
    expect(releaseLegalProblem("", files)).toMatch(/not 16 hex digits/);
  });
});

describe("the bundled default settings", () => {
  it("are the published cdn/config.json", async () => {
    const { defaultSettings } = await import("../src/settings/store.js");
    const { validateSettings } = await import("../src/settings/schema.js");
    const published = JSON.parse(readFileSync(new URL("../cdn/config.json", import.meta.url), "utf-8"));
    expect(defaultSettings()).toEqual(validateSettings(published).settings);
  });
});

// DuelSight's own CDN contract: only for a build that uses that CDN.
describe.runIf(IS_DUELSIGHT)("cdn/SETTINGS.md states what the extension enforces", () => {
  const doc = existsSync(new URL("../cdn/SETTINGS.md", import.meta.url)) ? readFileSync(new URL("../cdn/SETTINGS.md", import.meta.url), "utf-8") : "";
  it("gives the releases prefix and the image hosts the build uses", () => {
    if (UPDATE_URL_PREFIX) expect(doc).toContain(UPDATE_URL_PREFIX);
    for (const host of IMAGE_HOSTS) expect(doc).toContain(`\`${host}\``);
  });
  it("its printed-number examples are what the build's rule gives", () => {
    const table = doc.slice(doc.indexOf("| Card id | `{printedId}` |"));
    const rows = [...table.matchAll(/^\| (`[^|]+`) \| ([^|]+) \|$/gm)].slice(0, 20);
    expect(rows.length).toBeGreaterThan(3);
    for (const [, ids, printed] of rows) {
      const left = [...ids!.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
      const right = [...printed!.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
      const want = printed!.trim() === "none" ? left.map(() => null) : right;
      expect(left.map((id) => printedId(id))).toEqual(want);
    }
  });
});
