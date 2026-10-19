// @vitest-environment happy-dom
// SPDX-License-Identifier: Apache-2.0
// The tooltip frame: the card's picture alone (or its name), its sizes, its fallbacks, nothing
// clickable, its origin rule, unknown ids, and the settings refresh per shown card.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import type { Settings } from "../src/settings/schema.js";
import { artSize, connectTooltipFrame, LANDSCAPE_WIDTH, PORTRAIT_WIDTH, TooltipController, type TooltipElements } from "../src/tooltip/controller.js";
import { tag, type TooltipSize } from "../src/shared/messages.js";
import { SITE_ORIGIN } from "./helpers/fork.js";

/** Settings for these tests (a fixture, not the build's own). */
const defaultSettings = (): Settings => ({
  schemaVersion: 1,
  updatedAt: "2026-10-16T00:00:00Z",
  namesOnly: false,
  primary: { id: "art", template: "https://art.example/art/{art}" },
  fallbacks: [],
  update: null,
  geometric: true,
});

const table = {
  "OP01-001": ["Roronoa Zoro", "OP01", "OP01-001.jpg"],
  don_8: ["DON!! Card", "DON!!", "don_8.png"],
  wide: ["A Wide Card", "X", "wide.png"],
} as const;

/** The real markup of the tooltip page. */
const PAGE = /<body>([\s\S]*)<\/body>/.exec(readFileSync(resolve(process.cwd(), "static/tooltip.html"), "utf-8"))![1]!;

let elements: TooltipElements;
let refreshes: number;
let loads: string[];
let sizes: TooltipSize[];
/** What each test's pictures decode to (by URL), and which fail. */
let pixels: Record<string, { width: number; height: number }>;
let failing: Set<string>;
let release: (() => void) | null;
let controller: TooltipController;

function build(): TooltipController {
  document.body.innerHTML = PAGE;
  const $ = (id: string) => document.getElementById(id)!;
  elements = { root: $("card"), art: $("art"), img: $("img") as HTMLImageElement, placeholder: $("placeholder"), pill: $("pill") };
  refreshes = 0;
  loads = [];
  sizes = [];
  pixels = {};
  failing = new Set();
  release = null;
  return new TooltipController({
    elements,
    table: table as never,
    maps: {},
    load: async (url) => {
      loads.push(url);
      if (release) await new Promise<void>((r) => (release = r));
      if (failing.has(url)) throw new Error("404");
      return new Blob([url]);
    },
    imageSize: async (blob) => pixels[await blob.text()] ?? { width: 600, height: 838 },
    requestRefresh: () => void (refreshes += 1),
    onSize: (size) => void sizes.push(size),
    createObjectURL: () => "blob:fake",
    revokeObjectURL: () => undefined,
  });
}

const tick = async () => {
  for (let i = 0; i < 5; i += 1) await new Promise((r) => setTimeout(r, 0));
};

beforeEach(() => {
  controller = build();
  controller.setSettings(defaultSettings());
});

describe("art sizes", () => {
  it("shows a portrait card 320 wide in its own shape, and landscape art 448 wide", () => {
    expect(artSize(600, 838)).toEqual({ width: PORTRAIT_WIDTH, height: 447 });
    expect(artSize(320, 448)).toEqual({ width: 320, height: 448 });
    expect(artSize(838, 600)).toEqual({ width: LANDSCAPE_WIDTH, height: 321 });
    expect(artSize(0, 0)).toEqual({ width: 320, height: 447 });
  });
});

describe("TooltipController", () => {
  it("shows the card's picture alone, with the card's name as its alt text", async () => {
    expect(controller.show("OP01-001")).toBe(true);
    expect(elements.root.hidden).toBe(false);
    await tick();
    expect(loads).toEqual(["https://art.example/art/OP01-001.jpg"]);
    expect(elements.art.hidden).toBe(false);
    expect(elements.art.classList.contains("loading")).toBe(false);
    expect(elements.pill.hidden).toBe(true);
    expect(elements.img.getAttribute("src")).toBe("blob:fake");
    expect(elements.img.alt).toBe("Roronoa Zoro");
    expect(sizes.at(-1)).toEqual({ width: 320, height: 447, shape: "card", cardId: "OP01-001" });
  });

  it("has no name, number, set or link row, and nothing that can be clicked or focused", () => {
    controller.show("OP01-001");
    const page = document.body;
    expect(page.querySelectorAll("a, button, input, select, textarea, [tabindex], [href], [onclick]")).toHaveLength(0);
    for (const id of ["name", "number", "set", "link"]) expect(document.getElementById(id)).toBeNull();
  });

  it("shows a dark card with the name while the picture loads, in the card's shape", async () => {
    release = () => undefined;
    controller.show("OP01-001");
    await tick();
    expect(elements.art.classList.contains("loading")).toBe(true);
    expect(elements.placeholder.textContent).toBe("Roronoa Zoro");
    expect(elements.pill.hidden).toBe(true);
    expect(sizes.at(-1)).toEqual({ width: 320, height: 447, shape: "card", cardId: "OP01-001" });
    release!();
    await tick();
    expect(elements.art.classList.contains("loading")).toBe(false);
    expect(elements.img.getAttribute("src")).toBe("blob:fake");
  });

  it("sizes landscape art to its own shape", async () => {
    pixels["https://art.example/art/wide.png"] = { width: 1000, height: 700 };
    controller.show("wide");
    await tick();
    expect(sizes.at(-1)).toEqual({ width: 448, height: 314, shape: "card", cardId: "wide" });
  });

  it("shows the name in a pill when no picture can be loaded", async () => {
    failing.add("https://art.example/art/OP01-001.jpg");
    controller.show("OP01-001");
    await tick();
    expect(elements.art.hidden).toBe(true);
    expect(elements.pill.hidden).toBe(false);
    expect(elements.pill.textContent).toBe("Roronoa Zoro");
    expect(sizes.at(-1)?.shape).toBe("pill");
  });

  it("shows the name in a pill when a picture does not decode", async () => {
    controller = build();
    controller.setSettings(defaultSettings());
    elements.img.decode = () => Promise.reject(new Error("broken"));
    controller.show("OP01-001");
    await tick();
    expect(elements.art.hidden).toBe(true);
    expect(elements.pill.hidden).toBe(false);
  });

  it("shows the name in a pill, and requests no picture, once the settings say names only", async () => {
    controller.setSettings({ ...defaultSettings(), namesOnly: true });
    controller.show("OP01-001");
    await tick();
    expect(loads).toEqual([]);
    expect(elements.art.hidden).toBe(true);
    expect(elements.pill.hidden).toBe(false);
    expect(elements.pill.textContent).toBe("Roronoa Zoro");
    expect(sizes.at(-1)?.shape).toBe("pill");
  });

  it("shows the name in a pill with no image source at all (a fork with no image hosts)", async () => {
    controller.setSettings({ ...defaultSettings(), primary: null, fallbacks: [] });
    controller.show("OP01-001");
    await tick();
    expect(loads).toEqual([]);
    expect(elements.pill.hidden).toBe(false);
  });

  it("survives show A, clear, show A while A's picture loads (Chrome rejects a pending decode on a new src)", async () => {
    // Chrome's rule: setting src, even to the same value, rejects the decode() still pending.
    let pending: { reject: (e: Error) => void } | null = null;
    let decodes = 0;
    const settled: Array<() => void> = [];
    elements.img.decode = () =>
      new Promise<void>((resolve, reject) => {
        decodes += 1;
        pending?.reject(new Error("EncodingError: src changed"));
        pending = { reject };
        settled.push(() => {
          pending = null;
          resolve();
        });
      });
    release = () => undefined;
    controller.show("OP01-001");
    await tick();
    const firstLoad = release!;
    controller.clear();
    release = () => undefined;
    controller.show("OP01-001");
    await tick();
    const secondLoad = release!;
    release = null;
    // Both loads arrive; the second src setting rejects the first decode, then the second decodes.
    firstLoad();
    await tick();
    secondLoad();
    await tick();
    expect(decodes).toBeGreaterThanOrEqual(1);
    settled.at(-1)!();
    await tick();
    expect(elements.root.hidden).toBe(false);
    expect(elements.pill.hidden).toBe(true);
    expect(elements.art.hidden).toBe(false);
    expect(elements.art.classList.contains("loading")).toBe(false);
    expect(elements.img.getAttribute("src")).toBe("blob:fake");
    // The superseded chain never fell back to the name pill, not even for a moment.
    expect(sizes.some((x) => x.shape === "pill")).toBe(false);
  });

  it("keeps the placeholder until the frame has the picture's shape (no stretched landscape art)", async () => {
    controller = build();
    let fit: (() => void) | null = null;
    (controller as unknown as { deps: { frameFits: () => Promise<void> } }).deps.frameFits = () => new Promise<void>((r) => (fit = r));
    controller.setSettings(defaultSettings());
    pixels["https://art.example/art/wide.png"] = { width: 1000, height: 700 };
    controller.show("wide");
    await tick();
    expect(sizes.at(-1)).toEqual({ width: 448, height: 314, shape: "card", cardId: "wide" });
    expect(elements.art.classList.contains("loading")).toBe(true);
    fit!();
    await tick();
    expect(elements.art.classList.contains("loading")).toBe(false);
  });

  it("echoes the content script's sequence number in every size: placeholder, picture and pill", async () => {
    controller.show("OP01-001", 7);
    expect(controller.currentSeq).toBe(7);
    expect(sizes.at(-1)).toMatchObject({ shape: "card", cardId: "OP01-001", seq: 7 });
    await tick();
    expect(elements.art.classList.contains("loading")).toBe(false);
    expect(sizes.at(-1)).toMatchObject({ shape: "card", cardId: "OP01-001", seq: 7 });
    expect(sizes.every((x) => x.seq === 7)).toBe(true);
    controller.setSettings({ ...defaultSettings(), namesOnly: true });
    controller.show("OP01-001", 9);
    expect(controller.currentSeq).toBe(9);
    expect(sizes.at(-1)).toMatchObject({ shape: "pill", cardId: "OP01-001", seq: 9 });
  });

  it("shows nothing for an id the catalog does not have", () => {
    controller.show("OP01-001");
    expect(controller.show("<img src=x onerror=alert(1)>")).toBe(false);
    expect(elements.root.hidden).toBe(true);
    expect(controller.current).toBeNull();
    expect(controller.show("constructor")).toBe(false);
  });

  it("asks for a settings refresh on each newly shown card", () => {
    controller.show("OP01-001");
    controller.show("don_8");
    controller.show("unknown");
    expect(refreshes).toBe(2);
  });

  it("does not show a picture that arrives after another card was asked for", async () => {
    release = () => undefined;
    controller.show("OP01-001");
    await tick();
    const first = release!;
    release = null;
    controller.show("don_8");
    first();
    await tick();
    expect(elements.img.alt).toBe("DON!! Card");
    expect(loads.at(-1)).toBe("https://art.example/art/don_8.png");
  });
});

describe("tooltip frame origin rule", () => {
  function connect(parentOrigin: string | null, dev = false, framed = true) {
    const posted: Array<{ message: unknown; origin: string }> = [];
    const parent = { postMessage: (message: unknown, origin: string) => posted.push({ message, origin }) };
    let listener: ((e: MessageEvent) => void) | null = null;
    const shown: string[] = [];
    const seqs: Array<number | undefined> = [];
    const post = connectTooltipFrame(
      { win: { parent, addEventListener: (_: "message", l: (e: MessageEvent) => void) => void (listener = l) }, framed, parentOrigin, dev },
      { show: (id: string, seq?: number) => (shown.push(id), seqs.push(seq), true), clear: () => void shown.push("clear") },
    );
    const send = (data: unknown, source: unknown = parent, origin = parentOrigin) => listener?.({ data, source, origin } as unknown as MessageEvent);
    return { post, posted, shown, seqs, send, parent };
  }

  it("passes a card message's sequence number on to show()", () => {
    const { shown, seqs, send } = connect(SITE_ORIGIN);
    send(tag({ kind: "card", cardId: "OP01-001", name: "x", seq: 12 }));
    send(tag({ kind: "card", cardId: "OP01-002", name: "y" }));
    expect(shown).toEqual(["OP01-001", "OP01-002"]);
    expect(seqs).toEqual([12, undefined]);
  });

  it("does not listen inside a page it does not serve", () => {
    for (const [origin, dev, framed] of [["https://evil.example", false, true], ["http://127.0.0.1:8770", false, true], [null, false, true], [SITE_ORIGIN, false, false]] as const) {
      const { post, shown, send } = connect(origin, dev, framed);
      expect(post).toBeNull();
      send(tag({ kind: "card", cardId: "OP01-001", name: "x" }));
      expect(shown).toEqual([]);
    }
  });

  it("acts only on its parent's messages from its parent's origin, and posts there only", () => {
    const { post, posted, shown, send, parent } = connect(SITE_ORIGIN);
    send(tag({ kind: "card", cardId: "OP01-001", name: "Not the catalog's" }), {}, SITE_ORIGIN);
    send(tag({ kind: "card", cardId: "OP01-001", name: "x" }), parent, "https://evil.example");
    send({ kind: "card", cardId: "OP01-001", name: "untagged" });
    expect(shown).toEqual([]);
    send(tag({ kind: "card", cardId: "OP01-001", name: "x" }));
    send(tag({ kind: "clear" }));
    expect(shown).toEqual(["OP01-001", "clear"]);
    post!({ kind: "ready" });
    expect(posted).toEqual([{ message: tag({ kind: "ready" }), origin: SITE_ORIGIN }]);
  });
});
