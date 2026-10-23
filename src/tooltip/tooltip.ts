// SPDX-License-Identifier: Apache-2.0
// The tooltip frame: an extension page the content script places beside a card. It shows the
// card's picture (from the sources the settings name, in order), with the card's details beside
// or under it when the details panel is on and the details file is loaded, or the card's name
// when there is no picture. Nothing in it can be clicked: the pointer passes through to the video.
// Being an extension page, it loads pictures under the extension's host permissions and policy,
// not the video site's. The logic is in controller.ts.

import { loadImage } from "../images/chain.js";
import { detailsUrl, type Settings } from "../settings/schema.js";
import { LAST_GOOD_KEY, readEffectiveSettings } from "../settings/store.js";
import { forgetDetails, loadDetails, sha256Hex } from "../details/cache.js";
import { DETAILS_KEY, readDetailsOn } from "../shared/details-pref.js";
import { fitPanelText, measurePanel } from "./panel-dom.js";
import { SETTINGS_URL } from "../constants.js";
import type { CardTable } from "./card-data.js";
import { connectTooltipFrame, TooltipController } from "./controller.js";
import { frameHasShape, type ShapeWindow } from "./frame-shape.js";
import type { TooltipOut } from "../shared/messages.js";

declare const __DEV__: boolean;

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(chrome.runtime.getURL(path));
  return response.ok ? response.json() : null;
}

const decode = async (blob: Blob): Promise<void> => {
  const bitmap = await createImageBitmap(blob);
  bitmap.close();
};

let post: ((message: TooltipOut) => void) | null = null;

void (async () => {
  const framed = window.parent !== window;
  const parentOrigin = location.ancestorOrigins?.[0] ?? null;
  const [cards, effective] = await Promise.all([fetchJson("data/cards.json"), readEffectiveSettings(chrome.storage.local)]);
  const controller = new TooltipController({
    elements: {
      root: $("card"),
      art: $("art"),
      img: $<HTMLImageElement>("img"),
      placeholder: $("placeholder"),
      pill: $("pill"),
      panel: { root: $("panel"), name: $("panel-name"), type: $("panel-type"), stats: $("panel-stats"), power: $("panel-power"), text: $("panel-text") },
    },
    table: (cards ?? {}) as CardTable,
    load: (url) => loadImage(url, { fetch: (...args) => fetch(...args), decode }),
    imageSize: async (blob) => {
      const bitmap = await createImageBitmap(blob);
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return size;
    },
    requestRefresh: () => void chrome.runtime.sendMessage({ kind: "settings:refresh" }).catch(() => undefined),
    createObjectURL: (blob) => URL.createObjectURL(blob),
    revokeObjectURL: (url) => URL.revokeObjectURL(url),
    onSize: (size) => post?.({ kind: "size", ...size }),
    frameFits: (size, panel) => frameHasShape(size, window as unknown as ShapeWindow, panel),
    measurePanel: () => measurePanel($("panel")),
    frameSize: () => ({ width: window.innerWidth, height: window.innerHeight }),
    fitText: () => fitPanelText($("panel"), $("panel-text")),
  });
  controller.setSettings(effective.settings);
  // The details file: fetched (once, then from the cache) only while the panel is on and the
  // settings name one; until it is loaded, pictures show alone.
  let detailsOn = await readDetailsOn(chrome.storage.local).catch(() => true);
  let detailsKey: string | null = null;
  const syncDetails = (settings: Settings): void => {
    controller.setDetailsOn(detailsOn);
    const url = settings.details ? detailsUrl(settings.details, SETTINGS_URL) : null;
    if (!url || !settings.details) {
      detailsKey = null;
      controller.setDetails(null);
      // No details file named any more: none is kept either.
      if (settings.details === null) void forgetDetails(caches);
      return;
    }
    const key = `${url}#${settings.details.sha256}`;
    if (!detailsOn || key === detailsKey) return;
    detailsKey = key;
    void loadDetails(url, settings.details.sha256, { caches, fetch: (...args) => fetch(...args), sha256: sha256Hex }).then((table) => {
      if (detailsKey === key) controller.setDetails(table);
    });
  };
  let settingsNow = effective.settings;
  post = connectTooltipFrame({ win: window, framed, parentOrigin, dev: __DEV__ }, controller);
  if (!post) return;
  const send = post;
  syncDetails(settingsNow);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && LAST_GOOD_KEY in changes) {
      void readEffectiveSettings(chrome.storage.local).then((e) => {
        controller.setSettings(e.settings);
        settingsNow = e.settings;
        syncDetails(settingsNow);
      });
    }
    if (area === "local" && DETAILS_KEY in changes) {
      detailsOn = changes[DETAILS_KEY]?.newValue !== false;
      syncDetails(settingsNow);
    }
  });
  // The pill's size follows its text's layout (fonts can arrive late).
  const pill = $("pill");
  new ResizeObserver(() => {
    const r = pill.getBoundingClientRect();
    if (!pill.hidden && r.width > 0 && r.height > 0 && controller.current) {
      const seq = controller.currentSeq;
      send({ kind: "size", width: Math.ceil(r.width), height: Math.ceil(r.height), shape: "pill", cardId: controller.current, ...(seq !== undefined ? { seq } : {}) });
    }
  }).observe(pill);
  // The frame lays the picture and its panel out in whatever size the content script gives it.
  window.addEventListener("resize", () => controller.layout());
  // The background fetches the settings file when it is due (at most once an hour).
  void chrome.runtime.sendMessage({ kind: "settings:refresh" }).catch(() => undefined);
  send({ kind: "ready" });
})();
