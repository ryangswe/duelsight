// SPDX-License-Identifier: Apache-2.0
// The build's manifest and card data.
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// @ts-expect-error plain JavaScript build scripts
import { releaseLegalProblem } from "../scripts/release-legal.mjs";
// @ts-expect-error plain JavaScript build scripts
import { buildCardTable, buildSourceFileMaps } from "../scripts/card-data.mjs";
// @ts-expect-error plain JavaScript build scripts
import { buildManifest, UNPACKED_EXTENSION_ID } from "../scripts/manifest.mjs";
// @ts-expect-error plain JavaScript build scripts
import { configProblems, geometricIndexProblem, loadForkConfig, videoSitePatterns } from "../scripts/fork-config.mjs";
import { GEOMETRIC_MANIFEST_SHA256, IMAGE_HOSTS, SETTINGS_URL, UPDATE_URL_PREFIX } from "../src/constants.js";
import { isActivePage } from "../src/content/site.js";
import { allowedParentOrigin } from "../src/shared/messages.js";
import { makePrintedId, printedId } from "../src/settings/templates.js";
import { CONFIG, IS_KENBUNSHOKU, TOY_CONFIG } from "./helpers/fork.js";
import { buildLoadRequest, geometricOption, stageForPage } from "../src/compute/load-request.js";
import { parseSourceFileMaps } from "../src/tooltip/card-data.js";
import { knownCard } from "../src/tooltip/controller.js";

describe("the config (kenbunshoku.config.json)", () => {
  it("has no problem", () => {
    expect(configProblems(CONFIG)).toEqual([]);
  });

  it("refuses what the build cannot use", () => {
    const bad = (patch: Record<string, unknown>) => configProblems({ ...CONFIG, ...patch }, null);
    expect(bad({ videoSites: { youtube: false, twitch: false } })).toContain("videoSites: at least one site");
    expect(bad({ imageHosts: ["https://x.example"] })[0]).toMatch(/imageHosts/);
    expect(bad({ settingsUrl: "http://x.example/c.json" })[0]).toMatch(/settingsUrl/);
    expect(bad({ settingsUrl: "https://not-listed.example/c.json", imageHosts: [] })[0]).toMatch(/must be in imageHosts/);
    expect(bad({ printedNumber: { regex: "^[A-Z]+$" } })[0]).toMatch(/capture group/);
    expect(bad({ printedNumber: { regex: "([" } })[0]).toMatch(/printedNumber.regex/);
    expect(bad({ geometric: { settings: "x.json", manifestSha256: "nope" } })[0]).toMatch(/manifestSha256/);
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
    ["a geometric object with another key", { geometric: { settings: "x.json", manifestSha256: "a".repeat(64), url: "x" } }, "geometric:"],
    ["an upper-case host", { imageHosts: ["CDN.example.com"] }, "imageHosts:"],
    ["an empty icons folder name", { icons: "" }, "icons:"],
  ])("refuses %s", (_label, patch, prefix) => {
    expect(configProblems({ ...CONFIG, ...patch }, null).some((p: string) => p.startsWith(prefix))).toBe(true);
  });

  it("refuses a geometric settings file that is not there, and a config that is not an object", () => {
    expect(configProblems({ ...CONFIG, geometric: { settings: "data/no-such-file.json", manifestSha256: "a".repeat(64) } })).toContain("geometric.settings: data/no-such-file.json is missing");
    for (const c of [null, [], "config", 1]) expect(configProblems(c, null)).toEqual(["not a JSON object"]);
  });

  it("refuses a file that is not readable JSON, and lists every problem of a bad one", () => {
    const dir = mkdtempSync(join(tmpdir(), "fork-config-"));
    try {
      writeFileSync(join(dir, "bad.json"), "{ not json");
      expect(() => loadForkConfig(join(dir, "bad.json"), null)).toThrow(/not readable JSON/);
      writeFileSync(join(dir, "worse.json"), JSON.stringify({ ...CONFIG, name: "", packageName: "Bad Name" }));
      expect(() => loadForkConfig(join(dir, "worse.json"), null)).toThrow(/name:[\s\S]*packageName:/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses a geometric index that is not on the image hosts (or not https)", () => {
    const config = { imageHosts: ["cdn.example.com"] };
    expect(geometricIndexProblem({ index: { path: "https://cdn.example.com/vision/geo/x/manifest.json" } }, config)).toBeNull();
    for (const path of ["https://other.example.com/m.json", "http://cdn.example.com/m.json", "manifest.json", undefined]) {
      expect(geometricIndexProblem({ index: { path } }, config)).toMatch(/index.path/);
    }
    expect(geometricIndexProblem({}, config)).toMatch(/index.path/);
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

  it("asks for storage (and unlimited storage only with the card-feature file) and nothing else", () => {
    expect(m.permissions).toEqual(CONFIG.geometric ? ["storage", "unlimitedStorage"] : ["storage"]);
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
    const dev = buildManifest({ version: "0.1.0", dev: true });
    expect(dev.content_security_policy.extension_pages).toContain(" http://127.0.0.1:*");
    expect(dev.content_scripts[0].matches).toContain("http://127.0.0.1/*");
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

  it.runIf(IS_KENBUNSHOKU)("is Kenbunshoku's: its ID", () => {
    expect(UNPACKED_EXTENSION_ID).toBe("igfdjmpikcbplijnlpkligaafepgoaaa");
  });

  it("is Kenbunshoku's name exactly when it is Kenbunshoku's key (a fork changes both)", () => {
    const kenbunshokuKey = UNPACKED_EXTENSION_ID === "igfdjmpikcbplijnlpkligaafepgoaaa";
    // A fork that renames its package but keeps keys/unpacked-public.pem would install over
    // Kenbunshoku; one that keeps the name with its own key would run Kenbunshoku's tests.
    expect({ packageNameIsKenbunshoku: CONFIG.packageName === "kenbunshoku", keyIsKenbunshoku: kenbunshokuKey }).toEqual({
      packageNameIsKenbunshoku: kenbunshokuKey,
      keyIsKenbunshoku: CONFIG.packageName === "kenbunshoku",
    });
  });

  it.runIf(IS_KENBUNSHOKU)("is Kenbunshoku's: its network surface, value for value", () => {
    const release = buildManifest({ version: "0.1.0", dev: false });
    expect(release.permissions).toEqual(["storage", "unlimitedStorage"]);
    expect(release.host_permissions).toEqual(["https://www.youtube.com/*", "https://www.twitch.tv/*", "https://cdn.kenbunshoku.com/*", "https://optcgapi.com/*"]);
    expect(release.content_security_policy).toEqual({
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' https://cdn.kenbunshoku.com https://optcgapi.com; img-src 'self' blob: data:",
    });
    expect(SETTINGS_URL).toBe("https://cdn.kenbunshoku.com/config.json");
    expect(GEOMETRIC_MANIFEST_SHA256).toBe("7b9a96f636611e34183b1a845db93846cb92e5d12ad0d273dd14d1e2c60cef19");
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
  it("its stage is off whatever the settings say", () => {
    expect(geometricOption({ geometric: true }, (p) => p, null)).toBeNull();
  });
});

describe("card data", () => {
  const catalog = {
    cards: [
      { id: "OP01-001", name: "Roronoa Zoro", art: "OP01-001.jpg", facets: { set: "OP01" } },
      { id: "OP03-081_p1", name: "Kalgara", art: "OP03-081_p1__set1.jpg", facets: { set: "OP03" } },
      { id: "EB01-006_p4-JP", name: "Tony Tony.Chopper", art: "jp/EB01-006_p4-JP.png", facets: { set: "EB01" } },
      { id: "P-122", name: "Nami", art: null, facets: {} },
      { id: "OP01-002", name: "Trafalgar Law", art: "OP01-002.jpg", facets: { set: "OP01" } },
    ],
  };
  const index = [
    { file: "OP01-001.jpg", url: "https://optcgapi.com/media/static/Card_Images/OP01-001.jpg", is_placeholder: false },
    { file: "OP03-081_p1__set1.jpg", url: "https://optcgapi.com/media/static/Card_Images/OP03-081_p1_cCn0Rtb.jpg", is_placeholder: false },
    { file: "OP01-002.jpg", url: "https://optcgapi.com/media/static/Card_Images/OP01-002.jpg", is_placeholder: true },
  ];

  it("maps a card to optcgapi's own file name only for the picture the catalog names", () => {
    const { maps, unmapped } = buildSourceFileMaps(catalog, index);
    expect(maps).toEqual({ optcgapi: { "OP01-001": "OP01-001.jpg", "OP03-081_p1": "OP03-081_p1_cCn0Rtb.jpg" } });
    expect(unmapped).toBe(3);
  });

  it("writes name, set and art per card", () => {
    const table = buildCardTable(catalog);
    expect(table["OP01-001"]).toEqual(["Roronoa Zoro", "OP01", "OP01-001.jpg"]);
    expect(table["P-122"]).toEqual(["Nami", null, null]);
    expect(knownCard(table, "P-122")).toEqual({ id: "P-122", name: "Nami", set: null, art: null, printed: null });
    expect(knownCard(table, "ZZ-1")).toBeNull();
    expect(knownCard(table, "__proto__")).toBeNull();
  });

  it("reads a map file defensively", () => {
    expect(parseSourceFileMaps({ optcgapi: { a: "a.jpg", b: 3, c: "" }, x: [] })).toEqual({ optcgapi: { a: "a.jpg" } });
    expect(parseSourceFileMaps(null)).toEqual({});
  });

  it("carries each card's printed number with the 'catalog' rule", () => {
    const table = buildCardTable({ cards: [{ id: "a", name: "A", art: null, printed: "TOY-001" }, { id: "b", name: "B", art: null }] }, { printed: true });
    expect(table.a).toEqual(["A", null, null, "TOY-001"]);
    expect(table.b).toEqual(["B", null, null, null]);
    expect(knownCard(table, "a")?.printed).toBe("TOY-001");
  });
});

const PIN = "a".repeat(64);

describe("load request (the geometric stage)", () => {
  it("is the runtime's plain load request when the stage is off", () => {
    expect(buildLoadRequest("chrome-extension://x/release/release.json", "chrome-extension://x/runtime/", null)).toEqual({
      kind: "load",
      releaseUrl: "chrome-extension://x/release/release.json",
      wasmPaths: "chrome-extension://x/runtime/",
    });
  });
  it("carries the settings file and the pinned manifest together when it is on", () => {
    expect(buildLoadRequest("a", "b", { url: "chrome-extension://x/data/geometric.json", manifestSha256: PIN })).toEqual({
      kind: "load",
      releaseUrl: "a",
      wasmPaths: "b",
      geometricUrl: "chrome-extension://x/data/geometric.json",
      geometricManifestSha256: PIN,
    });
  });
});

describe("the settings file's kill switch for the stage", () => {
  const url = (path: string) => `chrome-extension://x/${path}`;
  it("passes the bundled settings and the pinned manifest unless geometric is false", () => {
    expect(geometricOption({ geometric: true }, url, PIN)).toEqual({ url: "chrome-extension://x/data/geometric.json", manifestSha256: PIN });
    expect(geometricOption({ geometric: false }, url, PIN)).toBeNull();
    expect(buildLoadRequest("r", "w", geometricOption({ geometric: false }, url, PIN))).not.toHaveProperty("geometricUrl");
    // The build's own pin is the config's.
    expect(geometricOption({ geometric: true }, url)?.manifestSha256 ?? null).toBe(CONFIG.geometric?.manifestSha256 ?? null);
  });
});

describe("the stage when the settings cannot be read", () => {
  const url = (path: string) => `chrome-extension://x/${path}`;
  it("is off for the page (settings-unreadable), and the base pipeline still starts", async () => {
    const d = await stageForPage(() => Promise.reject(new Error("storage gone")), url);
    expect(d).toEqual({ option: null, offReason: "settings-unreadable" });
    expect(buildLoadRequest("r", "w", d.option)).toEqual({ kind: "load", releaseUrl: "r", wasmPaths: "w" });
  });
  it.runIf(CONFIG.geometric !== null)("follows the settings otherwise", async () => {
    expect((await stageForPage(async () => ({ geometric: true }), url)).offReason).toBeNull();
    expect(await stageForPage(async () => ({ geometric: false }), url)).toEqual({ option: null, offReason: "settings" });
  });
});

describe.runIf(CONFIG.geometric !== null)("the geometric stage's settings file (the config's geometric.settings)", () => {
  const doc = CONFIG.geometric ? JSON.parse(readFileSync(new URL(`../${CONFIG.geometric.settings}`, import.meta.url), "utf-8")) : null;
  it("names the index on the CDN, in the folder of the index it pins", () => {
    const url = new URL(doc.index.path);
    expect(url.protocol).toBe("https:");
    expect(IMAGE_HOSTS).toContain(url.hostname);
    expect(url.pathname).toBe(`/vision/geo/${doc.index.sha256.slice(0, 16)}/manifest.json`);
    expect(doc.index.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
  it("holds only the runtime's keys (it refuses others)", () => {
    expect(Object.keys(doc).sort()).toEqual(["candidates", "crop", "features", "fusion", "index", "match", "ransac", "seed", "vote"]);
    expect(Object.keys(doc.index).sort()).toEqual(["path", "sha256"]);
  });
});

describe.runIf(existsSync(new URL("../data/source-files.json", import.meta.url)))("the committed {sourceFile} map", () => {
  const raw = JSON.parse(readFileSync(new URL("../data/source-files.json", import.meta.url), "utf-8")) as Record<string, Record<string, unknown>>;

  it("holds card ids and file names, and nothing else", () => {
    for (const [id, file] of Object.values(raw).flatMap((m) => Object.entries(m))) {
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(file).toMatch(/^[A-Za-z0-9_.-]+\.(jpg|jpeg|png|webp)$/);
    }
  });

  it("reads back unchanged through the tooltip's parser", () => {
    expect(parseSourceFileMaps(raw)).toEqual(raw);
  });
});

describe("release-legal", () => {
  it("holds the models' LICENSE, NOTICE and PROVENANCE.md; NOTICE's first line names a release", () => {
    for (const name of ["LICENSE", "NOTICE", "PROVENANCE.md"]) expect(existsSync(new URL(`../release-legal/${name}`, import.meta.url))).toBe(true);
    expect(readFileSync(new URL("../release-legal/NOTICE", import.meta.url), "utf-8").split("\n")[0]).toMatch(/\(id [0-9a-f]{16}\)/);
  });

  it.runIf(IS_KENBUNSHOKU)("is Kenbunshoku's: release B2.1, and how it differs from the evaluated B2", () => {
    const notice = readFileSync(new URL("../release-legal/NOTICE", import.meta.url), "utf-8");
    expect(notice.split("\n")[0]).toContain("(id f80d5b56cd907f03)");
    expect(notice.replace(/\s+/g, " ")).toContain(
      "differs from the evaluated release B2 (26a98a0f49a74545) in one catalog entry, OP09-051_p2",
    );
    expect(notice.replace(/\s+/g, " ")).toContain("where that entry moves from the OP05-067 identity to the OP09-051 identity");
    expect(notice).toContain("YOLOX");
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

// Kenbunshoku's own CDN contract: only for a build that uses that CDN.
describe.runIf(CONFIG.settingsUrl?.startsWith("https://cdn.kenbunshoku.com/") ?? false)("cdn/SETTINGS.md states what the extension enforces", () => {
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
