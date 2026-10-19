// @vitest-environment happy-dom
// SPDX-License-Identifier: Apache-2.0
// The content script in a page: trusted pointer events only, the frames it makes and remakes,
// the capture gate, the tooltip's hide timer, leaving on a hidden tab, and teardown.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Agent, HIDE_DELAY_MS } from "../src/content/agent.js";
import type { PlayerButton } from "../src/content/player-button.js";
import { memoryStorage as memory } from "./helpers/memory-storage.js";
import { tag } from "../src/shared/messages.js";

const EXT = "chrome-extension://igfdjmpikcbplijnlpkligaafepgoaaa";

let video: HTMLVideoElement;
let agent: Agent;

/** What the stand-in video reports; tests change it. */
const media = { paused: false, readyState: 4, currentTime: 12.5 };

function makeVideo(): HTMLVideoElement {
  const v = document.createElement("video");
  Object.defineProperties(v, {
    videoWidth: { value: 1920 },
    videoHeight: { value: 1080 },
    readyState: { get: () => media.readyState },
    currentTime: { get: () => media.currentTime },
    paused: { get: () => media.paused },
  });
  v.getBoundingClientRect = () => ({ left: 0, top: 0, width: 960, height: 540, right: 960, bottom: 540, x: 0, y: 0, toJSON() {} }) as DOMRect;
  document.body.appendChild(v);
  return v;
}

const frames = () => [...document.querySelectorAll("iframe")];
const compute = () => frames().find((f) => f.src.endsWith("/compute.html"));
const tooltip = () => frames().find((f) => f.src.endsWith("/tooltip.html"));
const outline = () => document.querySelector<HTMLElement>("[data-kenbunshoku=outline]");

function move(x: number, y: number): void {
  document.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true }));
}

/** Each frame's window, as a stand-in: nothing is loaded into the frames here. */
const windows = new WeakMap<HTMLIFrameElement, { sent: Array<Record<string, unknown>>; postMessage(m: Record<string, unknown>): void }>();
Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
  configurable: true,
  get(this: HTMLIFrameElement) {
    if (!windows.has(this)) {
      const sent: Array<Record<string, unknown>> = [];
      windows.set(this, { sent, postMessage: (m) => void sent.push(m) });
    }
    return windows.get(this);
  },
});

function message(data: unknown, origin: string, source: unknown): Event {
  const event = new Event("message");
  Object.defineProperties(event, { data: { value: data }, origin: { value: origin }, source: { value: source } });
  return event;
}

/** A message from one of the extension's frames, as the browser would deliver it. */
function fromFrame(frame: HTMLIFrameElement | undefined, data: object): void {
  window.dispatchEvent(message(tag(data), EXT, frame!.contentWindow));
}

/** The compute frame names a card, and the tooltip frame answers with its size for it (the
 *  frame is shown only once that size has come). */
function showCard(card: { cardId: string; name: string; box: { x: number; y: number; width: number; height: number } }): void {
  fromFrame(compute(), { kind: "shown", card });
  fromFrame(tooltip(), { kind: "size", width: 320, height: 448, shape: "card", cardId: card.cardId });
}

function spyOn(frame: HTMLIFrameElement | undefined): Array<Record<string, unknown>> {
  return windows.get(frame!)!.sent;
}

beforeEach(() => {
  Object.assign(media, { paused: false, readyState: 4, currentTime: 12.5 });
  agent?.stop();
  document.body.innerHTML = "";
  for (const f of frames()) f.remove();
  vi.stubGlobal("chrome", { runtime: { getURL: (path: string) => `${EXT}/${path}` } });
  vi.stubGlobal("location", new URL("http://127.0.0.1:8770/"));
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (cb(0), 0));
  video = makeVideo();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** A stand-in for chrome.storage.local, with card hovers on for the test page's "channel". */
const memoryStorage = (data: Record<string, unknown> = { "channel:local:/": 1 }) => memory(data);

const settle = async () => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

async function startAgent(trusted = true, storage = memoryStorage()): Promise<Agent> {
  const a = new Agent({ dev: true, isTrusted: () => trusted, storage });
  a.start();
  a.setEnabled(true);
  await settle();
  return a;
}

describe("Agent", () => {
  it("ignores pointer events a page script made", async () => {
    agent = new Agent({ dev: true, storage: memoryStorage() });
    agent.start();
    agent.setEnabled(true);
    await settle();
    move(100, 100);
    expect(frames()).toEqual([]);
  });

  it("makes the two frames when the pointer first comes over the picture, and not before", async () => {
    agent = await startAgent();
    move(100, 600);
    expect(frames()).toEqual([]);
    move(100, 100);
    expect(compute()).toBeDefined();
    expect(tooltip()).toBeDefined();
  });

  it("makes a frame again when the page removed it", async () => {
    agent = await startAgent();
    move(100, 100);
    const first = compute()!;
    first.remove();
    move(110, 100);
    expect(compute()).toBeDefined();
    expect(compute()).not.toBe(first);
  });

  it("refuses to capture when the pointer is not over the player", async () => {
    agent = await startAgent();
    move(100, 100);
    const sent = spyOn(compute());
    fromFrame(compute(), { kind: "ready" });
    move(100, 600);
    fromFrame(compute(), { kind: "capture", requestId: 7, analysisWidth: { min: 720, max: 1920 } });
    expect(sent.at(-1)).toMatchObject({ kind: "capture-failed", requestId: 7, reason: "no pointer over the player" });
  });

  it("tells the compute frame the pointer left when the tab is hidden", async () => {
    agent = await startAgent();
    move(100, 100);
    const sent = spyOn(compute());
    fromFrame(compute(), { kind: "ready" });
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(sent.at(-1)).toMatchObject({ kind: "leave" });
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  });

  it("shows the tooltip for a card, and hides it a moment after the card is gone", async () => {
    vi.useFakeTimers();
    agent = await startAgent();
    move(100, 100);
    const card = { cardId: "OP01-001", name: "Roronoa Zoro", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } };
    showCard(card);
    expect(tooltip()!.style.visibility).toBe("visible");
    fromFrame(compute(), { kind: "shown", card: null });
    expect(tooltip()!.style.visibility).toBe("visible");
    vi.advanceTimersByTime(HIDE_DELAY_MS + 1);
    expect(tooltip()!.style.visibility).toBe("hidden");
  });

  it("lets the pointer through the tooltip", async () => {
    agent = await startAgent();
    move(100, 100);
    expect(tooltip()!.style.pointerEvents).toBe("none");
  });

  it("has no link: nothing it adds takes the pointer, and moves under the tooltip still reach the video", async () => {
    agent = await startAgent();
    move(100, 100);
    fromFrame(tooltip(), { kind: "ready" });
    fromFrame(compute(), { kind: "ready" });
    showCard({ cardId: "OP01-001", name: "Zoro", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    expect(tooltip()!.style.visibility).toBe("visible");
    expect(document.querySelector("[data-kenbunshoku=link]")).toBeNull();
    expect(document.querySelectorAll("a")).toHaveLength(0);
    expect(tooltip()!.style.pointerEvents).toBe("none");
    expect(tooltip()!.tabIndex).toBe(-1);
    // Page styles for iframes and divs do not reach the extension's frames or the outline.
    expect(tooltip()!.getAttribute("style")).toMatch(/^all: ?initial/);
    expect(compute()!.getAttribute("style")).toMatch(/^all: ?initial/);
    expect(outline()!.getAttribute("style")).toMatch(/^all: ?initial/);
    // A move where the tooltip is drawn is still a move over the picture.
    const sent = spyOn(compute());
    const left = Number.parseFloat(tooltip()!.style.left);
    const top = Number.parseFloat(tooltip()!.style.top);
    move(left + 20, top + 20);
    expect(sent.filter((m) => m.kind === "pointer").at(-1)).toMatchObject({ x: (left + 20) / 960, y: (top + 20) / 540 });
  });

  it("sizes the frame to the tooltip: the card's picture with rounded corners, or a name pill", async () => {
    agent = await startAgent();
    move(100, 100);
    fromFrame(tooltip(), { kind: "ready" });
    const card = { cardId: "OP01-001", name: "Zoro", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } };
    showCard(card);
    fromFrame(tooltip(), { kind: "size", width: 320, height: 448, shape: "card" });
    expect([tooltip()!.style.width, tooltip()!.style.height, tooltip()!.style.borderRadius]).toEqual(["320px", "448px", "14px"]);
    fromFrame(tooltip(), { kind: "size", width: 130, height: 33, shape: "pill" });
    expect([tooltip()!.style.width, tooltip()!.style.height, tooltip()!.style.borderRadius]).toEqual(["130px", "33px", "17px"]);
  });

  it("scales the picture down, keeping its shape, when the window is short, and keeps it inside", async () => {
    const height = Object.getOwnPropertyDescriptor(window, "innerHeight");
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 360 });
    try {
      agent = await startAgent();
      move(100, 100);
      fromFrame(tooltip(), { kind: "ready" });
      showCard({ cardId: "OP01-001", name: "Zoro", box: { x: 0.1, y: 0.7, width: 0.1, height: 0.2 } });
      fromFrame(tooltip(), { kind: "size", width: 320, height: 448, shape: "card" });
      // 360 - 8 - 8 = 344 tall: 320 x 448 becomes 245 x 343 (rounded down, never over).
      expect([tooltip()!.style.width, tooltip()!.style.height]).toEqual(["245px", "343px"]);
      const top = Number.parseFloat(tooltip()!.style.top);
      expect(top).toBeGreaterThanOrEqual(8);
      expect(top + 343).toBeLessThanOrEqual(360 - 8);
    } finally {
      if (height) Object.defineProperty(window, "innerHeight", height);
    }
  });

  it("dates a paused live stream's frozen picture at the time it showed while playing", async () => {
    agent = await startAgent();
    move(100, 100);
    const sent = spyOn(compute());
    fromFrame(compute(), { kind: "ready" });
    video.dispatchEvent(new Event("timeupdate"));
    Object.assign(media, { paused: true, readyState: 1, currentTime: 0 });
    move(120, 100);
    expect(sent.filter((m) => m.kind === "pointer").at(-1)).toMatchObject({ mediaTime: 12.5 });
    // A picture is still taken from it (here the stand-in canvas has no 2D context).
    fromFrame(compute(), { kind: "capture", requestId: 3, analysisWidth: { min: 720, max: 1920 } });
    expect(sent.at(-1)).not.toMatchObject({ reason: "no picture" });
  });

  it("ignores tooltip messages it does not know (an old link message), and any from elsewhere", async () => {
    agent = await startAgent();
    move(100, 100);
    fromFrame(tooltip(), { kind: "ready" });
    showCard({ cardId: "OP01-001", name: "Zoro", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    const before = tooltip()!.style.cssText;
    fromFrame(tooltip(), { kind: "link", href: "https://example.org/" });
    fromFrame(compute(), { kind: "size", width: 900, height: 900, shape: "card" });
    window.dispatchEvent(message(tag({ kind: "size", width: 900, height: 900, shape: "card" }), "http://127.0.0.1:8770", window));
    expect(tooltip()!.style.cssText).toBe(before);
    expect(document.querySelector("[data-kenbunshoku=link]")).toBeNull();
  });

  it("forgets the time a video last played when its source changes", async () => {
    agent = await startAgent();
    move(100, 100);
    const sent = spyOn(compute());
    fromFrame(compute(), { kind: "ready" });
    video.dispatchEvent(new Event("timeupdate"));
    video.dispatchEvent(new Event("emptied"));
    Object.assign(media, { paused: true, readyState: 1, currentTime: 0 });
    move(120, 100);
    expect(sent.filter((m) => m.kind === "pointer").at(-1)).toMatchObject({ mediaTime: 0 });
  });

  it("refuses a frozen picture that draws nothing", async () => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
      return {
        canvas: this,
        drawImage() {},
        getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4).fill(30) }),
      } as unknown as CanvasRenderingContext2D;
    } as unknown as typeof getContext;
    try {
      agent = await startAgent();
      move(100, 100);
      const sent = spyOn(compute());
      fromFrame(compute(), { kind: "ready" });
      video.dispatchEvent(new Event("timeupdate"));
      Object.assign(media, { paused: true, readyState: 1, currentTime: 0 });
      move(120, 100);
      fromFrame(compute(), { kind: "capture", requestId: 4, analysisWidth: { min: 720, max: 1920 } });
      await new Promise((r) => setTimeout(r, 0));
      expect(sent.at(-1)).toMatchObject({ kind: "capture-failed", requestId: 4, reason: "no picture (the paused video draws nothing)" });
    } finally {
      HTMLCanvasElement.prototype.getContext = getContext;
    }
  });

  it("sends the pointer even when the browser holds back animation frames", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", () => 7);
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    agent = await startAgent();
    move(100, 100);
    void compute()!.contentWindow;
    const sent = spyOn(compute());
    fromFrame(compute(), { kind: "ready" });
    move(130, 120);
    expect(sent.filter((m) => m.kind === "pointer")).toEqual([]);
    vi.advanceTimersByTime(60);
    expect(sent.filter((m) => m.kind === "pointer")).toHaveLength(1);
    move(140, 120);
    vi.advanceTimersByTime(60);
    expect(sent.filter((m) => m.kind === "pointer")).toHaveLength(2);
  });

  it("ignores messages that do not come from its own frames", async () => {
    agent = await startAgent();
    move(100, 100);
    const shown = tag({ kind: "shown", card: { cardId: "X-1", name: "x", box: { x: 0, y: 0, width: 0.1, height: 0.1 } } });
    window.dispatchEvent(message(shown, "http://127.0.0.1:8770", window));
    window.dispatchEvent(message(shown, EXT, window));
    expect(tooltip()!.style.visibility).toBe("hidden");
  });

  it("is dormant on a channel that is not on: no frame, only the button", async () => {
    const storage = memoryStorage({});
    agent = await startAgent(true, storage);
    move(100, 100);
    expect(frames()).toEqual([]);
    const button = document.querySelector("[data-kenbunshoku=button]") as HTMLElement;
    expect(button.style.display).toBe("block");
    const b = (agent as unknown as { button: PlayerButton }).button;
    expect(b.element.getAttribute("aria-label")).toBe("Card hovers for this channel");
    expect(b.element.getAttribute("aria-pressed")).toBe("false");
    // One click turns it on for this channel: remembered, and the frames come with the next move.
    b.press();
    await settle();
    expect(storage.data).toHaveProperty("channel:local:/");
    expect(b.element.getAttribute("aria-pressed")).toBe("true");
    move(110, 100);
    expect(compute()).toBeDefined();
    // Another click turns it off and removes the frames, as the main switch does.
    b.press();
    await settle();
    expect(storage.data).not.toHaveProperty("channel:local:/");
    expect(frames()).toEqual([]);
    move(120, 100);
    expect(frames()).toEqual([]);
  });

  it("goes dormant when in-app navigation reaches a channel that is off, pointer resting", async () => {
    agent = await startAgent();
    move(100, 100);
    const sent = spyOn(compute());
    fromFrame(compute(), { kind: "ready" });
    expect(frames()).toHaveLength(2);
    // The site changes video without a reload; the pointer does not move.
    vi.stubGlobal("location", new URL("http://127.0.0.1:8770/other"));
    const frame = compute();
    fromFrame(frame, { kind: "capture", requestId: 9, analysisWidth: { min: 720, max: 1920 } });
    expect(sent.filter((m) => m.kind === "frame")).toEqual([]);
    expect(frames()).toEqual([]);
  });

  it("toggles the channel of the video on screen, even right after navigation", async () => {
    const storage = memoryStorage({});
    agent = await startAgent(true, storage);
    move(100, 100);
    vi.stubGlobal("location", new URL("http://127.0.0.1:8770/next"));
    (agent as unknown as { button: PlayerButton }).button.press();
    await settle();
    expect(storage.data).toHaveProperty("channel:local:/next");
    expect(storage.data).not.toHaveProperty("channel:local:/");
  });

  it("a change that arrives during the first read of the channels is not undone by it", async () => {
    const storage = memoryStorage({ "channel:local:/": 1 });
    const a = new Agent({ dev: true, isTrusted: () => true, storage });
    agent = a;
    a.start();
    a.setEnabled(true);
    // Turned off in another tab before the first read has resolved.
    delete storage.data["channel:local:/"];
    a.onStorageChanged({ "channel:local:/": { newValue: undefined } });
    await settle();
    expect(a.channelIsOn).toBe(false);
    move(100, 100);
    expect(frames()).toEqual([]);
  });

  it("hides the button when the pointer leaves the player", async () => {
    agent = await startAgent();
    move(100, 100);
    const button = document.querySelector("[data-kenbunshoku=button]") as HTMLElement;
    expect(button.style.display).toBe("block");
    move(100, 700);
    expect(button.style.display).toBe("none");
  });

  it("follows a channel turned off in another tab", async () => {
    agent = await startAgent();
    move(100, 100);
    expect(compute()).toBeDefined();
    agent.onStorageChanged({ "channel:local:/": { newValue: undefined } });
    expect(frames()).toEqual([]);
    agent.onStorageChanged({ "channel:local:/": { newValue: 2 } });
    move(110, 100);
    expect(compute()).toBeDefined();
  });

  it("hides the tooltip quickly, wherever the pointer is heading", async () => {
    vi.useFakeTimers();
    agent = await startAgent();
    move(100, 100);
    fromFrame(tooltip(), { kind: "ready" });
    const card = { cardId: "OP01-001", name: "Zoro", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } };
    showCard(card);
    move(200, 200);
    move(240, 240);
    fromFrame(compute(), { kind: "shown", card: null });
    vi.advanceTimersByTime(HIDE_DELAY_MS - 10);
    move(270, 270);
    expect(tooltip()!.style.visibility).toBe("visible");
    vi.advanceTimersByTime(11);
    expect(tooltip()!.style.visibility).toBe("hidden");
  });

  it("outlines the card the tooltip names, on the same box, and hides it with the tooltip", async () => {
    vi.useFakeTimers();
    agent = await startAgent();
    move(100, 100);
    const card = { cardId: "OP01-001", name: "Roronoa Zoro", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } };
    showCard(card);
    const el = outline()!;
    expect(el.style.display).toBe("block");
    expect(el.style.pointerEvents).toBe("none");
    // The 960 x 540 video shows its 1920 x 1080 picture whole: the box in page pixels.
    expect([el.style.left, el.style.top, el.style.width, el.style.height].map(parseFloat)).toEqual([96, 54, 96, 108]);
    // Another card: the outline moves with the tooltip.
    showCard({ ...card, cardId: "OP01-002", box: { x: 0.5, y: 0.5, width: 0.1, height: 0.2 } });
    expect([el.style.left, el.style.top].map(parseFloat)).toEqual([480, 270]);
    // Gone: both stay for the quick hide, then go together.
    fromFrame(compute(), { kind: "shown", card: null });
    expect(el.style.display).toBe("block");
    vi.advanceTimersByTime(HIDE_DELAY_MS + 1);
    expect(tooltip()!.style.visibility).toBe("hidden");
    expect(el.style.display).toBe("none");
  });

  it("hides the outline with the tooltip when the pointer leaves the player", async () => {
    vi.useFakeTimers();
    agent = await startAgent();
    move(100, 100);
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    expect(outline()!.style.display).toBe("block");
    move(2000, 2000);
    // The compute frame answers a leave with no card.
    fromFrame(compute(), { kind: "shown", card: null });
    vi.advanceTimersByTime(HIDE_DELAY_MS + 1);
    expect(tooltip()!.style.visibility).toBe("hidden");
    expect(outline()!.style.display).toBe("none");
  });

  it("outlines a paused live stream's frozen picture too", async () => {
    agent = await startAgent();
    Object.assign(media, { paused: true, readyState: 1 });
    move(100, 100);
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    expect(tooltip()!.style.visibility).toBe("visible");
    expect(outline()!.style.display).toBe("block");
  });

  it("draws no outline for a box off the picture, while the tooltip still shows", async () => {
    agent = await startAgent();
    move(100, 100);
    showCard({ cardId: "OP01-001", name: "x", box: { x: 1.2, y: 0.1, width: 0.1, height: 0.2 } });
    expect(tooltip()!.style.visibility).toBe("visible");
    expect(outline()!.style.display).toBe("none");
  });

  it("removes the outline when the channel or the extension is turned off", async () => {
    const storage = memoryStorage();
    agent = await startAgent(true, storage);
    move(100, 100);
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    expect(outline()).not.toBeNull();
    agent.onStorageChanged({ "channel:local:/": { newValue: undefined } });
    expect(outline()).toBeNull();
    agent.onStorageChanged({ "channel:local:/": { newValue: 1 } });
    move(110, 100);
    expect(outline()).not.toBeNull();
    agent.setEnabled(false);
    expect(outline()).toBeNull();
  });

  it("moves the outline and the tooltip with the page while a card is held (resize, scroll)", async () => {
    agent = await startAgent();
    move(100, 100);
    fromFrame(tooltip(), { kind: "ready" });
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    const rect = () => ["left", "top", "width", "height"].map((k) => Number.parseFloat(outline()!.style[k as "left"]));
    expect(rect()).toEqual([96, 54, 96, 108]);
    const tooltipLeft = tooltip()!.style.left;
    // The player grows and moves (theater mode, a resized window): the next resize re-places both.
    video.getBoundingClientRect = () => ({ left: 100, top: 60, width: 1280, height: 720, right: 1380, bottom: 780, x: 100, y: 60, toJSON() {} }) as DOMRect;
    window.dispatchEvent(new Event("resize"));
    expect(rect()).toEqual([228, 132, 128, 144]);
    expect(tooltip()!.style.left).not.toBe(tooltipLeft);
    // Scrolling the page moves the player up: a scroll anywhere (capture) re-places them too.
    video.getBoundingClientRect = () => ({ left: 100, top: -40, width: 1280, height: 720, right: 1380, bottom: 680, x: 100, y: -40, toJSON() {} }) as DOMRect;
    document.body.dispatchEvent(new Event("scroll"));
    expect(rect()).toEqual([228, 32, 128, 144]);
  });

  it("re-places at most once per animation frame, and not at all with no card and no button shown", async () => {
    const frames: Array<() => void> = [];
    const queue = (cb: FrameRequestCallback): number => (frames.push(() => cb(0)), frames.length);
    agent = await startAgent();
    move(100, 100);
    move(2000, 2000); // off the player: no button, no card
    vi.stubGlobal("requestAnimationFrame", queue);
    window.dispatchEvent(new Event("resize"));
    expect(frames).toHaveLength(0);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (cb(0), 0));
    move(100, 100);
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    vi.stubGlobal("requestAnimationFrame", queue);
    for (let i = 0; i < 5; i += 1) window.dispatchEvent(new Event("resize"));
    expect(frames).toHaveLength(1);
  });

  it("re-mounts the tooltip and the outline inside the full-screen element, and places them there", async () => {
    agent = await startAgent();
    move(100, 100);
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    const player = document.createElement("div");
    document.body.appendChild(player);
    player.appendChild(video);
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => player });
    try {
      document.dispatchEvent(new Event("fullscreenchange"));
      expect(tooltip()!.parentElement).toBe(player);
      expect(outline()!.parentElement).toBe(player);
      expect(document.querySelectorAll("[data-kenbunshoku=outline]")).toHaveLength(1);
      fromFrame(tooltip(), { kind: "ready" });
      showCard({ cardId: "OP01-002", name: "y", box: { x: 0.5, y: 0.5, width: 0.1, height: 0.2 } });
      expect(tooltip()!.style.visibility).toBe("visible");
      expect([outline()!.style.left, outline()!.style.top].map(parseFloat)).toEqual([480, 270]);
    } finally {
      Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => null });
    }
  });

  it("keeps working across in-app navigation between two channels that are both on", async () => {
    vi.useFakeTimers();
    agent = await startAgent(true, memoryStorage({ "channel:local:/": 1, "channel:local:/other": 1 }));
    move(100, 100);
    fromFrame(tooltip(), { kind: "ready" });
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    const before = { compute: compute(), tooltip: tooltip() };
    vi.stubGlobal("location", new URL("http://127.0.0.1:8770/other"));
    window.dispatchEvent(new Event("popstate"));
    // Still on: nothing is torn down.
    expect(compute()).toBe(before.compute);
    expect(tooltip()).toBe(before.tooltip);
    // The new video's first answer clears the old card; both go together.
    fromFrame(compute(), { kind: "shown", card: null });
    vi.advanceTimersByTime(HIDE_DELAY_MS + 1);
    expect(tooltip()!.style.visibility).toBe("hidden");
    expect(outline()!.style.display).toBe("none");
    move(300, 300);
    showCard({ cardId: "OP01-002", name: "y", box: { x: 0.5, y: 0.5, width: 0.1, height: 0.2 } });
    expect(tooltip()!.style.visibility).toBe("visible");
    expect([outline()!.style.left, outline()!.style.top].map(parseFloat)).toEqual([480, 270]);
  });

  it("shows the frame only once the tooltip has sized itself for the card shown (no flash of the previous card)", async () => {
    agent = await startAgent();
    move(100, 100);
    fromFrame(tooltip(), { kind: "ready" });
    fromFrame(compute(), { kind: "shown", card: { cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } } });
    expect(tooltip()!.style.visibility).toBe("hidden");
    expect(outline()!.style.display).toBe("none");
    fromFrame(tooltip(), { kind: "size", width: 320, height: 448, shape: "card", cardId: "OP01-001" });
    expect(tooltip()!.style.visibility).toBe("visible");
    expect(outline()!.style.display).toBe("block");
    // Another card: hidden until its own size comes; a late size for the old card changes nothing.
    fromFrame(compute(), { kind: "shown", card: { cardId: "OP01-002", name: "y", box: { x: 0.5, y: 0.5, width: 0.1, height: 0.2 } } });
    expect(tooltip()!.style.visibility).toBe("hidden");
    expect(outline()!.style.display).toBe("none");
    fromFrame(tooltip(), { kind: "size", width: 448, height: 320, shape: "card", cardId: "OP01-001" });
    expect(tooltip()!.style.visibility).toBe("hidden");
    fromFrame(tooltip(), { kind: "size", width: 320, height: 448, shape: "card", cardId: "OP01-002" });
    expect(tooltip()!.style.visibility).toBe("visible");
    expect(tooltip()!.style.width).toBe("320px");
  });

  it("does not breathe: a size a few pixels off the shown one keeps the shown one", async () => {
    agent = await startAgent();
    move(100, 100);
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    expect([tooltip()!.style.width, tooltip()!.style.height]).toEqual(["320px", "448px"]);
    fromFrame(tooltip(), { kind: "size", width: 323, height: 452, shape: "card", cardId: "OP01-001" });
    expect([tooltip()!.style.width, tooltip()!.style.height]).toEqual(["320px", "448px"]);
    fromFrame(tooltip(), { kind: "size", width: 448, height: 320, shape: "card", cardId: "OP01-001" });
    expect([tooltip()!.style.width, tooltip()!.style.height]).toEqual(["448px", "320px"]);
  });

  it("moves the tooltip by the card's own displacement when the page moves (no lag, no jump)", async () => {
    agent = await startAgent();
    move(100, 100);
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    const before = { left: Number.parseFloat(tooltip()!.style.left), top: Number.parseFloat(tooltip()!.style.top) };
    // The page scrolls by 30 px: the video, the card and the tooltip all go up by 30.
    video.getBoundingClientRect = () => ({ left: 0, top: -30, width: 960, height: 540, right: 960, bottom: 510, x: 0, y: -30, toJSON() {} }) as DOMRect;
    document.dispatchEvent(new Event("scroll"));
    expect(Number.parseFloat(outline()!.style.top)).toBe(54 - 30);
    expect(Number.parseFloat(tooltip()!.style.left)).toBe(before.left);
    expect(Number.parseFloat(tooltip()!.style.top)).toBe(Math.max(8, before.top - 30));
  });

  it("ignores scrolls that cannot move the video (a chat scrolling itself)", async () => {
    const frames: Array<() => void> = [];
    agent = await startAgent();
    move(100, 100);
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (frames.push(() => cb(0)), frames.length));
    const chat = document.createElement("div");
    document.body.appendChild(chat);
    chat.dispatchEvent(new Event("scroll"));
    expect(frames).toHaveLength(0);
    const player = document.createElement("div");
    document.body.appendChild(player);
    player.appendChild(video);
    player.dispatchEvent(new Event("scroll"));
    expect(frames).toHaveLength(1);
  });

  function withWindow<T>(width: number, height: number, run: () => T): T {
    const w = Object.getOwnPropertyDescriptor(window, "innerWidth");
    const h = Object.getOwnPropertyDescriptor(window, "innerHeight");
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
    try {
      return run();
    } finally {
      if (w) Object.defineProperty(window, "innerWidth", w);
      if (h) Object.defineProperty(window, "innerHeight", h);
    }
  }

  it("keeps the shown size against breathing only while it still fits beside the card", async () => {
    agent = await startAgent();
    move(100, 100);
    const card = { cardId: "OP01-001", name: "x", box: { x: 0.3, y: 0.1, width: 0.05, height: 0.2 } };
    withWindow(1024, 768, () => showCard(card));
    expect([tooltip()!.style.width, tooltip()!.style.height]).toEqual(["320px", "448px"]);
    // A narrower, shorter window: beside the card there is room for 316 x 442 only (4 and 6 px
    // less, within the no-breathing margin); keeping 320 x 448 would eat the card's margin.
    withWindow(670, 500, () => window.dispatchEvent(new Event("resize")));
    expect([tooltip()!.style.width, tooltip()!.style.height]).toEqual(["316px", "442px"]);
  });

  it("stays beside the card through a scroll longer than STICKY_PX when its spot is not the best one", async () => {
    agent = await startAgent();
    move(100, 100);
    const box = { x: 0.4, y: 0.5, width: 0.08, height: 0.2 };
    const onLeft = { x: 0.1, y: 0.4, width: 0.1, height: 0.2 };
    const onRight = { x: 0.6, y: 0.4, width: 0.12, height: 0.2 };
    // At first only the left spot is taken: the tooltip goes right.
    showCard({ cardId: "OP01-001", name: "x", box, others: [onLeft] } as never);
    const right = Number.parseFloat(tooltip()!.style.left);
    expect(right).toBeGreaterThan(384 + 77);
    // Now both spots are taken, the right one a little more: left is best, but not clearly, so
    // it stays right.
    showCard({ cardId: "OP01-001", name: "x", box, others: [onLeft, onRight] } as never);
    expect(Number.parseFloat(tooltip()!.style.left)).toBe(right);
    // The page scrolls 40 px (more than STICKY_PX): it moves with the card and stays right.
    const top = Number.parseFloat(tooltip()!.style.top);
    video.getBoundingClientRect = () => ({ left: 0, top: -40, width: 960, height: 540, right: 960, bottom: 500, x: 0, y: -40, toJSON() {} }) as DOMRect;
    document.dispatchEvent(new Event("scroll"));
    expect(Number.parseFloat(tooltip()!.style.left)).toBe(right);
    expect(Number.parseFloat(tooltip()!.style.top)).toBe(top - 40);
  });

  it("ignores a late size for the previous card that arrives after the new card's own", async () => {
    agent = await startAgent();
    move(100, 100);
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    fromFrame(compute(), { kind: "shown", card: { cardId: "OP01-002", name: "y", box: { x: 0.5, y: 0.5, width: 0.1, height: 0.2 } } });
    fromFrame(tooltip(), { kind: "size", width: 320, height: 448, shape: "card", cardId: "OP01-002" });
    fromFrame(tooltip(), { kind: "size", width: 448, height: 320, shape: "card", cardId: "OP01-001" });
    expect(tooltip()!.style.visibility).toBe("visible");
    expect([tooltip()!.style.width, tooltip()!.style.height]).toEqual(["320px", "448px"]);
  });

  it("ignores a late size from an earlier showing of the same card", async () => {
    vi.useFakeTimers();
    agent = await startAgent();
    move(100, 100);
    fromFrame(tooltip(), { kind: "ready" });
    const card = { cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } };
    const sent = spyOn(tooltip());
    fromFrame(compute(), { kind: "shown", card });
    const first = sent.filter((m) => m.kind === "card").at(-1)!.seq as number;
    fromFrame(tooltip(), { kind: "size", width: 320, height: 448, shape: "card", cardId: "OP01-001", seq: first });
    fromFrame(compute(), { kind: "shown", card: null });
    vi.advanceTimersByTime(HIDE_DELAY_MS + 1);
    fromFrame(compute(), { kind: "shown", card });
    const second = sent.filter((m) => m.kind === "card").at(-1)!.seq as number;
    expect(second).not.toBe(first);
    fromFrame(tooltip(), { kind: "size", width: 448, height: 320, shape: "card", cardId: "OP01-001", seq: first });
    expect(tooltip()!.style.visibility).toBe("hidden");
    fromFrame(tooltip(), { kind: "size", width: 320, height: 448, shape: "card", cardId: "OP01-001", seq: second });
    expect(tooltip()!.style.visibility).toBe("visible");
    expect(tooltip()!.style.width).toBe("320px");
  });

  it("shows a held card again in the new frame after a full-screen change, without a new card", async () => {
    agent = await startAgent();
    move(100, 100);
    showCard({ cardId: "OP01-001", name: "x", box: { x: 0.1, y: 0.1, width: 0.1, height: 0.2 } });
    const player = document.createElement("div");
    document.body.appendChild(player);
    player.appendChild(video);
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => player });
    try {
      document.dispatchEvent(new Event("fullscreenchange"));
      const fresh = tooltip()!;
      expect(fresh.parentElement).toBe(player);
      fromFrame(fresh, { kind: "ready" });
      // The new frame is asked for the same card at once...
      expect(spyOn(fresh).filter((m) => m.kind === "card").at(-1)).toMatchObject({ cardId: "OP01-001" });
      // ...and shows it, outline too, once it has sized itself: no new pointer move needed.
      fromFrame(fresh, { kind: "size", width: 320, height: 448, shape: "card", cardId: "OP01-001" });
      expect(fresh.style.visibility).toBe("visible");
      expect(outline()!.style.display).toBe("block");
    } finally {
      Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => null });
    }
  });

  it("moves the in-player button with the player on a resize", async () => {
    agent = await startAgent();
    move(100, 100);
    const button = document.querySelector("[data-kenbunshoku=button]") as HTMLElement;
    expect(button.style.display).toBe("block");
    const before = button.style.left;
    video.getBoundingClientRect = () => ({ left: 100, top: 60, width: 1280, height: 720, right: 1380, bottom: 780, x: 100, y: 60, toJSON() {} }) as DOMRect;
    window.dispatchEvent(new Event("resize"));
    expect(button.style.left).not.toBe(before);
    expect(Number.parseFloat(button.style.left)).toBeGreaterThan(Number.parseFloat(before));
  });

  it("hides the in-player button when the pointer leaves the window", async () => {
    agent = await startAgent();
    move(100, 100);
    const button = document.querySelector("[data-kenbunshoku=button]") as HTMLElement;
    expect(button.style.display).toBe("block");
    document.documentElement.dispatchEvent(new PointerEvent("pointerleave"));
    expect(button.style.display).toBe("none");
  });

  it("removes everything when switched off", async () => {
    agent = await startAgent();
    move(100, 100);
    expect(frames()).toHaveLength(2);
    expect(document.querySelector("[data-kenbunshoku=button]")).not.toBeNull();
    agent.setEnabled(false);
    expect(frames()).toHaveLength(0);
    expect(document.querySelector("[data-kenbunshoku=button]")).toBeNull();
    move(100, 100);
    expect(frames()).toHaveLength(0);
  });
});
