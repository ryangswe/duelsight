// @vitest-environment happy-dom
// SPDX-License-Identifier: Apache-2.0
// The tooltip frame: the card's picture alone (or its name), its sizes, its fallbacks, nothing
// clickable, its origin rule, unknown ids, and the settings refresh per shown card.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import type { Settings } from "../src/settings/schema.js";
import { artSize, connectTooltipFrame, FACTS_LIMIT, LANDSCAPE_WIDTH, PORTRAIT_WIDTH, TooltipController, type TooltipDeps, type TooltipElements } from "../src/tooltip/controller.js";
import { parseDetailsFile } from "../src/details/details.js";
import { DETAILS_FIXTURE } from "./helpers/details-fixture.js";
import { parseCardFacts, tag, type TooltipSize } from "../src/shared/messages.js";
import { SITE_ORIGIN } from "./helpers/fork.js";

/** Settings for these tests (a fixture, not the build's own). */
const defaultSettings = (): Settings => ({
  schemaVersion: 1,
  updatedAt: "2026-10-16T00:00:00Z",
  namesOnly: false,
  primary: { id: "art", template: "https://art.example/art/{art}" },
  fallbacks: [],
  update: null,
  details: null,
});

const table = {
  "89631139": ["Blue-Eyes White Dragon", "LOB", "89631139.jpg"],
  token_1: ["Sample Token", "Token", "token_1.png"],
  wide: ["A Wide Card", "X", "wide.png"],
  // Made-up cards of the made-up details file.
  "10000001": ["Test Robot", "TST", "10000001.jpg"],
  "10000004": ["Test Pendulum Robot", "TST", "10000004.jpg"],
  "10000007": ["Test Markup Spell", "TST", "10000007.jpg"],
} as const;
const DETAILS = parseDetailsFile(JSON.parse(JSON.stringify(DETAILS_FIXTURE)));

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

function build(extra: Partial<TooltipDeps> = {}): TooltipController {
  document.body.innerHTML = PAGE;
  const $ = (id: string) => document.getElementById(id)!;
  elements = {
    root: $("card"),
    art: $("art"),
    img: $("img") as HTMLImageElement,
    placeholder: $("placeholder"),
    pill: $("pill"),
    panel: { root: $("panel"), name: $("panel-name"), type: $("panel-type"), stats: $("panel-stats"), power: $("panel-power"), text: $("panel-text") },
  };
  refreshes = 0;
  loads = [];
  sizes = [];
  pixels = {};
  failing = new Set();
  release = null;
  return new TooltipController({
    elements,
    table: table as never,
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
    ...extra,
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
    expect(artSize(0, 0)).toEqual({ width: 320, height: 466 });
  });
});

describe("TooltipController", () => {
  it("shows the card's picture alone, with the card's name as its alt text", async () => {
    expect(controller.show("89631139")).toBe(true);
    expect(elements.root.hidden).toBe(false);
    await tick();
    expect(loads).toEqual(["https://art.example/art/89631139.jpg"]);
    expect(elements.art.hidden).toBe(false);
    expect(elements.art.classList.contains("loading")).toBe(false);
    expect(elements.pill.hidden).toBe(true);
    expect(elements.img.getAttribute("src")).toBe("blob:fake");
    expect(elements.img.alt).toBe("Blue-Eyes White Dragon");
    expect(sizes.at(-1)).toEqual({ width: 320, height: 447, shape: "card", cardId: "89631139" });
  });

  it("has no number, set or link row, and nothing that can be clicked or focused; its name is in the details panel only", async () => {
    controller.show("89631139");
    const page = document.body;
    expect(page.querySelectorAll("a, button, input, select, textarea, [tabindex], [href], [onclick]")).toHaveLength(0);
    for (const id of ["name", "number", "set", "link"]) expect(document.getElementById(id)).toBeNull();
    // Without details (none loaded here), the panel with the name stays hidden: the picture alone.
    await tick();
    expect(document.getElementById("panel")!.hidden).toBe(true);
    expect(document.getElementById("panel-name")!.textContent).toBe("");
  });

  it("shows a dark card with the name while the picture loads, in the card's shape", async () => {
    release = () => undefined;
    controller.show("89631139");
    await tick();
    expect(elements.art.classList.contains("loading")).toBe(true);
    expect(elements.placeholder.textContent).toBe("Blue-Eyes White Dragon");
    expect(elements.pill.hidden).toBe(true);
    expect(sizes.at(-1)).toEqual({ width: 320, height: 466, shape: "card", cardId: "89631139" });
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
    failing.add("https://art.example/art/89631139.jpg");
    controller.show("89631139");
    await tick();
    expect(elements.art.hidden).toBe(true);
    expect(elements.pill.hidden).toBe(false);
    expect(elements.pill.textContent).toBe("Blue-Eyes White Dragon");
    expect(sizes.at(-1)?.shape).toBe("pill");
  });

  it("shows the name in a pill when a picture does not decode", async () => {
    controller = build();
    controller.setSettings(defaultSettings());
    elements.img.decode = () => Promise.reject(new Error("broken"));
    controller.show("89631139");
    await tick();
    expect(elements.art.hidden).toBe(true);
    expect(elements.pill.hidden).toBe(false);
  });

  it("shows the name in a pill, and requests no picture, once the settings say names only", async () => {
    controller.setSettings({ ...defaultSettings(), namesOnly: true });
    controller.show("89631139");
    await tick();
    expect(loads).toEqual([]);
    expect(elements.art.hidden).toBe(true);
    expect(elements.pill.hidden).toBe(false);
    expect(elements.pill.textContent).toBe("Blue-Eyes White Dragon");
    expect(sizes.at(-1)?.shape).toBe("pill");
  });

  it("shows the name in a pill with no image source at all (a fork with no image hosts)", async () => {
    controller.setSettings({ ...defaultSettings(), primary: null, fallbacks: [] });
    controller.show("89631139");
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
    controller.show("89631139");
    await tick();
    const firstLoad = release!;
    controller.clear();
    release = () => undefined;
    controller.show("89631139");
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
    controller.show("89631139", 7);
    expect(controller.currentSeq).toBe(7);
    expect(sizes.at(-1)).toMatchObject({ shape: "card", cardId: "89631139", seq: 7 });
    await tick();
    expect(elements.art.classList.contains("loading")).toBe(false);
    expect(sizes.at(-1)).toMatchObject({ shape: "card", cardId: "89631139", seq: 7 });
    expect(sizes.every((x) => x.seq === 7)).toBe(true);
    controller.setSettings({ ...defaultSettings(), namesOnly: true });
    controller.show("89631139", 9);
    expect(controller.currentSeq).toBe(9);
    expect(sizes.at(-1)).toMatchObject({ shape: "pill", cardId: "89631139", seq: 9 });
  });

  it("shows nothing for an id the catalog does not have", () => {
    controller.show("89631139");
    expect(controller.show("<img src=x onerror=alert(1)>")).toBe(false);
    expect(elements.root.hidden).toBe(true);
    expect(controller.current).toBeNull();
    expect(controller.show("constructor")).toBe(false);
  });

  it("asks for a settings refresh on each newly shown card", () => {
    controller.show("89631139");
    controller.show("token_1");
    controller.show("unknown");
    expect(refreshes).toBe(2);
  });

  it("does not show a picture that arrives after another card was asked for", async () => {
    release = () => undefined;
    controller.show("89631139");
    await tick();
    const first = release!;
    release = null;
    controller.show("token_1");
    first();
    await tick();
    expect(elements.img.alt).toBe("Sample Token");
    expect(loads.at(-1)).toBe("https://art.example/art/token_1.png");
  });
});

describe("the details panel", () => {
  /** The frame's size, as the content script would set it. */
  let frame = { width: 320, height: 466 };
  let fits: boolean[];
  let measured: number;
  let fitted: number;
  const withPanel = () => {
    frame = { width: 320, height: 466 };
    fits = [];
    measured = 0;
    fitted = 0;
    const c = build({
      measurePanel: () => (measured += 1, [[220, 300], [260, 260], [300, 230]]),
      frameSize: () => frame,
      fitText: () => void (fitted += 1),
      frameFits: async (_size, panel) => void fits.push(panel),
    });
    c.setSettings(defaultSettings());
    c.setDetails(DETAILS);
    pixels["https://art.example/art/10000001.jpg"] = { width: 640, height: 932 };
    return c;
  };

  it("sends the picture's size with the panel's measured heights, and waits for the combined shape", async () => {
    controller = withPanel();
    controller.show("10000001", 4);
    await tick();
    expect(sizes.at(-1)).toEqual({ width: 320, height: 466, shape: "card", cardId: "10000001", seq: 4, panel: [[220, 300], [260, 260], [300, 230]] });
    expect(fits).toEqual([true]);
    const p = elements.panel;
    expect(p.name.textContent).toBe("Test Robot");
    expect(p.type.textContent).toBe("Robot / Effect");
    expect(p.stats.textContent).toBe("LIGHT · Level 4");
    expect(p.power.textContent).toBe("ATK 1800 / DEF 1000");
    expect(p.text.textContent).toBe("When this test card is summoned, nothing happens.\nIt is only a fixture.");
  });

  it("lays the picture and the panel out in the frame's size: side by side, stacked, or the picture alone", async () => {
    controller = withPanel();
    controller.show("10000001");
    await tick();
    // Still the picture's own shape: the picture alone fills the frame.
    expect(elements.panel.root.hidden).toBe(true);
    expect(elements.art.getAttribute("style")).toBeNull();
    frame = { width: 580, height: 466 };
    controller.layout();
    expect(elements.panel.root.hidden).toBe(false);
    expect(elements.art.style.width).toBe("320px");
    expect([elements.panel.root.style.left, elements.panel.root.style.width, elements.panel.root.style.height]).toEqual(["320px", "260px", "466px"]);
    expect(fitted).toBe(1);
    frame = { width: 300, height: 720 };
    controller.layout();
    expect([elements.art.style.width, elements.art.style.height]).toEqual(["300px", "437px"]);
    expect([elements.panel.root.style.top, elements.panel.root.style.height]).toEqual(["437px", "283px"]);
  });

  it("sets the card's text as text only, never as markup", async () => {
    controller = withPanel();
    controller.show("10000007");
    await tick();
    expect(elements.panel.text.textContent).toBe("<b>not markup</b> & <img src=x onerror=alert(1)>");
    expect(elements.panel.root.querySelectorAll("b, img")).toHaveLength(0);
  });

  it("is the picture alone, silently, for a card the file does not have, or before the file is loaded", async () => {
    controller = withPanel();
    controller.show("89631139");
    await tick();
    expect(sizes.at(-1)).toEqual({ width: 320, height: 447, shape: "card", cardId: "89631139" });
    expect(fits).toEqual([false]);
    expect(elements.panel.root.hidden).toBe(true);
    controller = withPanel();
    controller.setDetails(null);
    controller.show("10000001");
    await tick();
    expect(sizes.at(-1)).not.toHaveProperty("panel");
    expect(measured).toBe(0);
  });

  it("is the picture alone with the details switch off, exactly as before", async () => {
    controller = withPanel();
    controller.setDetailsOn(false);
    controller.show("10000001");
    await tick();
    expect(sizes.at(-1)).toEqual({ width: 320, height: 466, shape: "card", cardId: "10000001" });
    expect(elements.panel.root.hidden).toBe(true);
    expect(measured).toBe(0);
  });

  it("never comes with the name pill or names only", async () => {
    controller = withPanel();
    controller.setSettings({ ...defaultSettings(), namesOnly: true });
    controller.setDetails(DETAILS);
    controller.show("10000001");
    await tick();
    expect(sizes.at(-1)).toMatchObject({ shape: "pill" });
    expect(sizes.at(-1)).not.toHaveProperty("panel");
    expect(elements.panel.root.hidden).toBe(true);
    controller = withPanel();
    failing.add("https://art.example/art/10000001.jpg");
    controller.show("10000001");
    await tick();
    expect(sizes.at(-1)).toMatchObject({ shape: "pill" });
    expect(elements.panel.root.hidden).toBe(true);
  });

  it("follows the switch and the file for the card on show: the size is sent again, with or without the panel", async () => {
    controller = withPanel();
    controller.setDetails(null);
    controller.show("10000001", 2);
    await tick();
    expect(sizes.at(-1)).not.toHaveProperty("panel");
    controller.setDetails(DETAILS);
    expect(sizes.at(-1)).toMatchObject({ width: 320, height: 466, cardId: "10000001", seq: 2, panel: [[220, 300], [260, 260], [300, 230]] });
    frame = { width: 580, height: 466 };
    controller.layout();
    expect(elements.panel.root.hidden).toBe(false);
    controller.setDetailsOn(false);
    expect(sizes.at(-1)).toEqual({ width: 320, height: 466, shape: "card", cardId: "10000001", seq: 2 });
    expect(elements.panel.root.hidden).toBe(true);
    // Nothing on show: nothing is sent.
    controller.clear();
    const count = sizes.length;
    controller.setDetailsOn(true);
    expect(sizes).toHaveLength(count);
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
    send(tag({ kind: "card", cardId: "89631139", name: "x", seq: 12 }));
    send(tag({ kind: "card", cardId: "46986414", name: "y" }));
    expect(shown).toEqual(["89631139", "46986414"]);
    expect(seqs).toEqual([12, undefined]);
  });

  it("does not listen inside a page it does not serve", () => {
    for (const [origin, dev, framed] of [["https://evil.example", false, true], ["http://127.0.0.1:8770", false, true], [null, false, true], [SITE_ORIGIN, false, false]] as const) {
      const { post, shown, send } = connect(origin, dev, framed);
      expect(post).toBeNull();
      send(tag({ kind: "card", cardId: "89631139", name: "x" }));
      expect(shown).toEqual([]);
    }
  });

  it("acts only on its parent's messages from its parent's origin, and posts there only", () => {
    const { post, posted, shown, send, parent } = connect(SITE_ORIGIN);
    send(tag({ kind: "card", cardId: "89631139", name: "Not the catalog's" }), {}, SITE_ORIGIN);
    send(tag({ kind: "card", cardId: "89631139", name: "x" }), parent, "https://evil.example");
    send({ kind: "card", cardId: "89631139", name: "untagged" });
    expect(shown).toEqual([]);
    send(tag({ kind: "card", cardId: "89631139", name: "x" }));
    send(tag({ kind: "clear" }));
    expect(shown).toEqual(["89631139", "clear"]);
    post!({ kind: "ready" });
    expect(posted).toEqual([{ message: tag({ kind: "ready" }), origin: SITE_ORIGIN }]);
  });
});

describe("cards of a remote release (the facts channel, Addendum 2)", () => {
  const RID = "0123456789abcdef";
  const facts = (id: string, name: string) => ({ id, name, set: null, art: `${id}.jpg` });
  let timers: Array<() => void>;
  const withTimers = (extra: Partial<TooltipDeps> = {}) => {
    timers = [];
    const c = build({ setTimer: (fn) => (timers.push(fn), timers.length), clearTimer: () => undefined, ...extra });
    c.setSettings(defaultSettings());
    return c;
  };

  it("shows the channel's facts for that release, which win over the bundled table (a rename)", async () => {
    const c = withTimers();
    c.addFacts(RID, facts("89631139", "Renamed Dragon"));
    expect(c.show("89631139", 1, RID)).toBe(true);
    expect(elements.placeholder.textContent).toBe("Renamed Dragon");
    await tick();
    expect(loads).toEqual(["https://art.example/art/89631139.jpg"]);
    // Without the release id (a bundled card), or for another release, the bundled table's name.
    expect(c.show("89631139", 2)).toBe(true);
    expect(elements.placeholder.textContent).toBe("Blue-Eyes White Dragon");
    expect(c.show("89631139", 3, "ffffffffffffffff")).toBe(true);
    expect(elements.placeholder.textContent).toBe("Blue-Eyes White Dragon");
  });

  it("waits for the facts of a card new in that release, and shows it when they come", () => {
    const c = withTimers();
    expect(c.show("999", 4, RID)).toBe(false);
    expect(elements.root.hidden).toBe(true);
    c.addFacts(RID, facts("999", "New Card"));
    expect(c.current).toBe("999");
    expect(c.currentSeq).toBe(4);
    expect(elements.placeholder.textContent).toBe("New Card");
  });

  it("shows nothing when the facts do not come within the wait", () => {
    const c = withTimers();
    expect(c.show("999", 5, RID)).toBe(false);
    for (const fire of timers) fire();
    c.addFacts(RID, facts("999", "Late Card"));
    expect(c.current).toBeNull();
    expect(elements.root.hidden).toBe(true);
  });

  it("keeps the shown card's facts for every later lookup, the details panel's too (A1)", async () => {
    const c = withTimers({ measurePanel: () => [[220, 300]], frameSize: () => ({ width: 600, height: 460 }) });
    c.setDetails(DETAILS);
    c.addFacts(RID, facts("10000001", "Renamed Robot"));
    c.show("10000001", 6, RID);
    await tick();
    expect(elements.panel.name.textContent).toBe("Renamed Robot");
    c.setDetailsOn(false);
    c.setDetailsOn(true);
    expect(elements.panel.name.textContent).toBe("Renamed Robot");
  });

  it("a page-originated `card` for an id the compute frame never showed displays nothing, and cannot add facts", () => {
    const c = withTimers();
    const parent = { postMessage: () => undefined };
    let listener: ((e: MessageEvent) => void) | null = null;
    connectTooltipFrame({ win: { parent, addEventListener: (_: "message", l: (e: MessageEvent) => void) => void (listener = l) }, framed: true, parentOrigin: SITE_ORIGIN, dev: false }, c);
    const fromPage = (data: unknown) => listener!({ data, source: parent, origin: SITE_ORIGIN } as unknown as MessageEvent);
    // The page posts a card with made-up facts, and a facts-shaped message: neither reaches the map.
    fromPage(tag({ kind: "card", cardId: "999", name: "Free Prize", releaseId: RID, facts: { name: "Free Prize", set: null, art: "x.jpg" } }));
    fromPage({ releaseId: RID, cardId: "999", facts: { name: "Free Prize", set: null, art: "x.jpg" } });
    fromPage(tag({ releaseId: RID, cardId: "999", facts: { name: "Free Prize", set: null, art: "x.jpg" } }));
    for (const fire of timers) fire();
    expect(c.current).toBeNull();
    expect(elements.root.hidden).toBe(true);
    fromPage(tag({ kind: "card", cardId: "999", name: "Free Prize", releaseId: RID }));
    for (const fire of timers) fire();
    expect(c.current).toBeNull();
    // Only the channel adds facts; then the same page message shows the channel's name, never the page's.
    c.addFacts(RID, facts("999", "Real Card"));
    fromPage(tag({ kind: "card", cardId: "999", name: "Free Prize", releaseId: RID }));
    expect(elements.placeholder.textContent).toBe("Real Card");
  });
});

describe("cards of a remote release: races and limits", () => {
  const RID = "0123456789abcdef";
  const facts = (id: string, name: string, art = `${id}.jpg`) => ({ id, name, set: null, art });
  let timers: Array<() => void>;
  let asked: string[];
  const make = () => {
    timers = [];
    asked = [];
    const c = build({ setTimer: (fn) => (timers.push(fn), timers.length), clearTimer: () => undefined, requestFacts: (r, id) => void asked.push(`${r}|${id}`) });
    c.setSettings(defaultSettings());
    return c;
  };

  it("asks the compute frames for facts it lacks, even when the bundled table has the id", () => {
    const c = make();
    c.show("999", 1, RID);
    c.show("89631139", 2, RID);
    c.show("89631139", 3);
    expect(asked).toEqual([`${RID}|999`, `${RID}|89631139`]);
    c.addFacts(RID, facts("89631139", "Renamed Dragon"));
    c.show("89631139", 4, RID);
    expect(asked).toHaveLength(2);
  });

  it("replaces a card on show with its release's facts when they come after it (a rename, another artwork)", async () => {
    const c = make();
    c.show("89631139", 5, RID);
    expect(elements.placeholder.textContent).toBe("Blue-Eyes White Dragon");
    await tick();
    c.addFacts(RID, facts("89631139", "Renamed Dragon", "alt/89631139.jpg"));
    expect(c.currentSeq).toBe(5);
    expect(elements.placeholder.textContent).toBe("Renamed Dragon");
    await tick();
    expect(loads).toContain("https://art.example/art/alt/89631139.jpg");
    // Facts for a card not on show, or for another release, change nothing on screen.
    c.addFacts("ffffffffffffffff", facts("89631139", "Other Release"));
    c.addFacts(RID, facts("1", "Elsewhere"));
    expect(elements.placeholder.textContent).toBe("Renamed Dragon");
  });

  it("keeps pictures apart by artwork: the bundled art is not reused for a release's other art", async () => {
    const c = make();
    c.show("89631139", 6);
    await tick();
    c.addFacts(RID, facts("89631139", "Blue-Eyes White Dragon", "alt/89631139.jpg"));
    c.show("89631139", 7, RID);
    await tick();
    expect(loads).toEqual(["https://art.example/art/89631139.jpg", "https://art.example/art/alt/89631139.jpg"]);
  });

  it("stops waiting on clear(), and on another card", () => {
    const c = make();
    c.show("999", 8, RID);
    c.clear();
    c.addFacts(RID, facts("999", "New Card"));
    expect(c.current).toBeNull();
    c.show("998", 9, RID);
    c.show("89631139", 10);
    c.addFacts(RID, facts("998", "Other New"));
    expect(c.current).toBe("89631139");
    expect(elements.placeholder.textContent).toBe("Blue-Eyes White Dragon");
  });

  it("keeps at most FACTS_LIMIT facts, dropping the oldest", () => {
    const c = make();
    for (let i = 0; i <= FACTS_LIMIT; i += 1) c.addFacts(RID, facts(`n${i}`, `Card ${i}`));
    expect(c.show("n0", 11, RID)).toBe(false);
    expect(c.show(`n${FACTS_LIMIT}`, 12, RID)).toBe(true);
  });
});

describe("parseCardFacts (A4)", () => {
  const RID = "0123456789abcdef";
  const good = { releaseId: RID, cardId: "999", facts: { name: "New Card", set: null, art: "full/999.jpg" } };
  it("accepts a well-formed message", () => {
    expect(parseCardFacts(good)).toEqual(good);
    expect(parseCardFacts({ ...good, facts: { ...good.facts, art: null, printed: "LOB-001" } })?.facts.printed).toBe("LOB-001");
  });
  it.each([
    ["a bad release id", { ...good, releaseId: "x" }],
    ["no card id", { ...good, cardId: "" }],
    ["no name", { ...good, facts: { ...good.facts, name: "" } }],
    ["a long name", { ...good, facts: { ...good.facts, name: "n".repeat(201) } }],
    ["an art path with ..", { ...good, facts: { ...good.facts, art: "../x.jpg" } }],
    ["an absolute art path", { ...good, facts: { ...good.facts, art: "/x.jpg" } }],
    ["an art URL", { ...good, facts: { ...good.facts, art: "https://evil.example/x.jpg" } }],
    ["an empty segment", { ...good, facts: { ...good.facts, art: "a//b.jpg" } }],
    ["no facts", { releaseId: RID, cardId: "999" }],
  ])("refuses %s", (_, m) => {
    expect(parseCardFacts(m)).toBeNull();
  });
});
