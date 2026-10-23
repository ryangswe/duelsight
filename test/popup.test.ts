// @vitest-environment happy-dom
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { PROJECT_URL, RUNTIME_URL, UPDATE_URL_PREFIX } from "../src/constants.js";
import { CONFIG } from "./helpers/fork.js";
import { initPopup } from "../src/popup/view.js";
import { memoryStorage } from "./helpers/memory-storage.js";

const HTML = `<span id="name"></span><button id="enabled" role="switch" aria-checked="false" aria-busy="true" disabled></button>
<button id="details" role="switch" aria-checked="false" aria-busy="true" disabled></button>
<input id="card-size" type="range" disabled><output id="card-size-value"></output>
<p id="update" hidden><a id="update-link"></a><button id="update-dismiss"></button></p>
<a id="project"></a><a id="runtime"></a>`;

const settle = () => new Promise((r) => setTimeout(r, 0));
const listenersOf = () => {
  const listeners: Array<(c: Record<string, unknown>, a: string) => void> = [];
  return { listeners, onChanged: { addListener: (l: (c: Record<string, unknown>, a: string) => void) => void listeners.push(l) } };
};

beforeEach(() => {
  document.body.innerHTML = HTML;
});

describe("popup", () => {
  it("is one switch: it shows the master switch and turns it off and on", async () => {
    const local = memoryStorage();
    const { listeners, onChanged } = listenersOf();
    initPopup({ doc: document, local, onChanged, version: "0.1.0" });
    await settle();
    const toggle = document.getElementById("enabled")!;
    expect(toggle.getAttribute("role")).toBe("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    toggle.click();
    await settle();
    expect(local.data.enabled).toBe(false);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    toggle.click();
    await settle();
    expect(local.data.enabled).toBe(true);
    expect(listeners).toHaveLength(1);
  });

  it("holds the switch until the stored state is read: no press, then no slide into place", async () => {
    const local = memoryStorage({ enabled: false });
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => (release = r));
    const slow = { ...local, get: async (k: string | string[] | null) => (await gate, local.get(k)), set: local.set };
    initPopup({ doc: document, local: slow, onChanged: listenersOf().onChanged, version: "0.1.0" });
    const toggle = document.getElementById("enabled") as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);
    toggle.disabled = false; // even if the press got through, it must not act on an unread state
    toggle.click();
    toggle.disabled = true;
    await settle();
    expect(local.data.enabled).toBe(false);
    expect(toggle.hasAttribute("data-ready")).toBe(false);
    release();
    await settle();
    await settle();
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(toggle.disabled).toBe(false);
    expect(toggle.hasAttribute("aria-busy")).toBe(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(toggle.hasAttribute("data-ready")).toBe(true);
    toggle.click();
    await settle();
    expect(local.data.enabled).toBe(true);
  });

  it("shows the default (on) and enables the switch when the storage cannot be read", async () => {
    const local = memoryStorage();
    const broken = { ...local, get: async () => Promise.reject(new Error("storage unavailable")), set: local.set };
    initPopup({ doc: document, local: broken, onChanged: listenersOf().onChanged, version: "0.1.0" });
    await settle();
    await settle();
    const toggle = document.getElementById("enabled") as HTMLButtonElement;
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(toggle.disabled).toBe(false);
  });

  it("turns transitions on only after the first state has been drawn, and never for reduced motion", async () => {
    const css = readFileSync(resolve(process.cwd(), "static/popup.css"), "utf-8");
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toMatch(/\.switch\[data-ready\] \.knob[^{]*\{ transition: none; \}/);
    const frames: Array<() => void> = [];
    const win = document.defaultView as Window & typeof globalThis;
    const original = win.requestAnimationFrame;
    win.requestAnimationFrame = (f: FrameRequestCallback) => (frames.push(() => f(0)), frames.length);
    try {
      document.body.innerHTML = HTML.replace('aria-busy="true" disabled></button>', 'aria-busy="true" disabled><span class="knob"></span></button>');
      initPopup({ doc: document, local: memoryStorage(), onChanged: listenersOf().onChanged, version: "0.1.0" });
      await settle();
      const toggle = document.getElementById("enabled")!;
      expect(toggle.getAttribute("aria-checked")).toBe("true");
      expect(toggle.hasAttribute("data-ready")).toBe(false);
      // One animation frame at a time (each switch waits two of them).
      const nextFrame = () => frames.splice(0).forEach((f) => f());
      nextFrame();
      expect(toggle.hasAttribute("data-ready")).toBe(false);
      nextFrame();
      expect(toggle.hasAttribute("data-ready")).toBe(true);
      expect(document.getElementById("details")!.hasAttribute("data-ready")).toBe(true);
    } finally {
      win.requestAnimationFrame = original;
    }
  });

  it("follows the switch when it changes elsewhere", async () => {
    const local = memoryStorage();
    const { listeners, onChanged } = listenersOf();
    initPopup({ doc: document, local, onChanged, version: "0.1.0" });
    await settle();
    local.data.enabled = false;
    listeners[0]!({ enabled: { newValue: false } }, "local");
    await settle();
    expect(document.getElementById("enabled")!.getAttribute("aria-checked")).toBe("false");
  });

  it("shows the stored card size on its dial, 70 % to 130 % in steps of 10 %, 100 % by default", async () => {
    initPopup({ doc: document, local: memoryStorage(), onChanged: listenersOf().onChanged, version: "0.1.0" });
    const slider = document.getElementById("card-size") as HTMLInputElement;
    expect([slider.min, slider.max, slider.step]).toEqual(["70", "130", "10"]);
    await settle();
    expect(slider.disabled).toBe(false);
    expect(slider.value).toBe("100");
    expect(document.getElementById("card-size-value")!.textContent).toBe("100%");
    expect(slider.getAttribute("aria-valuetext")).toBe("100%");

    document.body.innerHTML = HTML;
    initPopup({ doc: document, local: memoryStorage({ cardSize: 120 }), onChanged: listenersOf().onChanged, version: "0.1.0" });
    await settle();
    expect((document.getElementById("card-size") as HTMLInputElement).value).toBe("120");
    expect(document.getElementById("card-size-value")!.textContent).toBe("120%");

    // A stored value out of range or between steps is shown clamped and stepped.
    document.body.innerHTML = HTML;
    initPopup({ doc: document, local: memoryStorage({ cardSize: 500 }), onChanged: listenersOf().onChanged, version: "0.1.0" });
    await settle();
    expect(document.getElementById("card-size-value")!.textContent).toBe("130%");
  });

  it("stores each step of the dial at once, and follows a change made elsewhere", async () => {
    const local = memoryStorage();
    const { listeners, onChanged } = listenersOf();
    initPopup({ doc: document, local, onChanged, version: "0.1.0" });
    await settle();
    const slider = document.getElementById("card-size") as HTMLInputElement;
    slider.value = "80";
    slider.dispatchEvent(new Event("input"));
    await settle();
    expect(local.data.cardSize).toBe(80);
    expect(document.getElementById("card-size-value")!.textContent).toBe("80%");
    local.data.cardSize = 110;
    listeners[0]!({ cardSize: { newValue: 110 } }, "local");
    await settle();
    expect(slider.value).toBe("110");
    expect(document.getElementById("card-size-value")!.textContent).toBe("110%");
    expect(listeners).toHaveLength(1);
  });

  it("keeps the dial still until the stored size is read", async () => {
    const local = memoryStorage({ cardSize: 120 });
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => (release = r));
    const slow = { ...local, get: async (k: string | string[] | null) => (await gate, local.get(k)), set: local.set };
    initPopup({ doc: document, local: slow, onChanged: listenersOf().onChanged, version: "0.1.0" });
    const slider = document.getElementById("card-size") as HTMLInputElement;
    expect(slider.disabled).toBe(true);
    slider.value = "70";
    slider.dispatchEvent(new Event("input"));
    await settle();
    expect(local.data.cardSize).toBe(120);
    release();
    await settle();
    await settle();
    expect(slider.disabled).toBe(false);
    expect(slider.value).toBe("120");
  });

  it("shows the card details switch, on by default, and turns it off and on", async () => {
    const local = memoryStorage();
    initPopup({ doc: document, local, onChanged: listenersOf().onChanged, version: "0.1.0" });
    const toggle = document.getElementById("details") as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);
    await settle();
    expect(toggle.disabled).toBe(false);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    toggle.click();
    await settle();
    expect(local.data.details).toBe(false);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    // The main switch is apart from it.
    expect(local.data.enabled).toBeUndefined();
    toggle.click();
    await settle();
    expect(local.data.details).toBe(true);
  });

  it("shows the details switch off when it was switched off, and follows a change made elsewhere", async () => {
    const local = memoryStorage({ details: false });
    const { listeners, onChanged } = listenersOf();
    initPopup({ doc: document, local, onChanged, version: "0.1.0" });
    await settle();
    const toggle = document.getElementById("details")!;
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    local.data.details = true;
    listeners[0]!({ details: { newValue: true } }, "local");
    await settle();
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("names the extension as the config does", () => {
    initPopup({ doc: document, local: memoryStorage(), onChanged: listenersOf().onChanged, version: "0.1.0" });
    expect(document.getElementById("name")!.textContent).toBe(CONFIG.name);
    expect(document.title).toBe(CONFIG.name);
  });

  it.runIf(UPDATE_URL_PREFIX !== null)("shows the new-version line only when the settings name a newer version", async () => {
    initPopup({ doc: document, local: memoryStorage(), onChanged: listenersOf().onChanged, version: "0.1.0" });
    await settle();
    expect(document.getElementById("update")!.hidden).toBe(true);
    document.body.innerHTML = HTML;
    const config = {
      schemaVersion: 1, updatedAt: "2026-10-16T00:00:00Z", namesOnly: false, primary: null, fallbacks: [], cardLink: null,
      update: { latest: "0.2.0", url: `${UPDATE_URL_PREFIX}/tag/v0.2.0` },
    };
    const local = memoryStorage({ "settings.lastGood": { raw: config, fetchedAt: 1 } });
    initPopup({ doc: document, local, onChanged: listenersOf().onChanged, version: "0.1.0" });
    await settle();
    expect(document.getElementById("update")!.hidden).toBe(false);
    expect(document.getElementById("update-link")!.textContent).toBe("New version available (0.2.0)");
    document.getElementById("update-dismiss")!.click();
    await settle();
    expect(document.getElementById("update")!.hidden).toBe(true);
  });

  it("links the project page and the toolkit it is built on", () => {
    initPopup({ doc: document, local: memoryStorage(), onChanged: listenersOf().onChanged, version: "0.1.0" });
    expect((document.getElementById("project") as HTMLAnchorElement).href).toBe(new URL(PROJECT_URL).href);
    expect((document.getElementById("runtime") as HTMLAnchorElement).href).toBe(new URL(RUNTIME_URL).href);
  });
});
