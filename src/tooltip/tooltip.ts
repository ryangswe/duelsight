// SPDX-License-Identifier: Apache-2.0
// The tooltip frame: an extension page the content script places beside a card. It shows the
// card's picture (from the sources the settings name, in order), with the card's details beside
// or under it when the details panel is on and the details file is loaded, or the card's name
// when there is no picture. Nothing in it can be clicked: the pointer passes through to the video.
// Being an extension page, it loads pictures under the extension's host permissions and policy,
// not the video site's. The logic is in controller.ts.

import { loadImage } from "../images/chain.js";
import type { Settings } from "../settings/schema.js";
import { LAST_GOOD_KEY, readEffectiveSettings } from "../settings/store.js";
import { forgetDetails, loadDetails, sha256Hex } from "../details/cache.js";
import { DETAILS_KEY, readDetailsOn } from "../shared/details-pref.js";
import { DetailsSync } from "./details-sync.js";
import { fitPanelText, measurePanel } from "./panel-dom.js";
import { SETTINGS_URL } from "../constants.js";
import type { CardTable } from "./card-data.js";
import { connectTooltipFrame, TooltipController } from "./controller.js";
import { frameHasShape, type ShapeWindow } from "./frame-shape.js";
import { FACTS_CHANNEL, parseCardFacts, type TooltipOut } from "../shared/messages.js";

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
  const factsChannel = new BroadcastChannel(FACTS_CHANNEL);
  const [cards, effective] = await Promise.all([fetchJson("data/cards.json"), readEffectiveSettings(chrome.storage.local)]);
  const controller = new TooltipController({
    elements: {
      root: $("card"),
      art: $("art"),
      img: $<HTMLImageElement>("img"),
      placeholder: $("placeholder"),
      pill: $("pill"),
      panel: { root: $("panel"), name: $("panel-name"), alt: $("panel-alt"), type: $("panel-type"), stats: $("panel-stats"), power: $("panel-power"), text: $("panel-text") },
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
    requestFacts: (releaseId, cardId) => factsChannel.postMessage({ want: true, releaseId, cardId }),
    createObjectURL: (blob) => URL.createObjectURL(blob),
    revokeObjectURL: (url) => URL.revokeObjectURL(url),
    onSize: (size) => post?.({ kind: "size", ...size }),
    frameFits: (size, panel) => frameHasShape(size, window as unknown as ShapeWindow, panel),
    measurePanel: () => measurePanel($("panel")),
    frameSize: () => ({ width: window.innerWidth, height: window.innerHeight }),
    fitText: () => fitPanelText($("panel"), $("panel-text")),
  });
  controller.setSettings(effective.settings);
  // Facts of a remote release's cards come from a compute frame over this channel, never through
  // the page (the page can post `card` messages to this frame, not here).
  factsChannel.onmessage = (event: MessageEvent) => {
    const m = parseCardFacts(event.data);
    if (m) controller.addFacts(m.releaseId, { id: m.cardId, ...m.facts });
  };
  // The details file: fetched (once, then from the cache) only while the panel is on and the
  // settings name one; until it is loaded, pictures show alone. The browser's language picks the
  // French file when the settings name one (language.ts).
  // A load that fails is tried again at the next sync (details-sync.ts).
  const details = new DetailsSync(
    {
      setDetails: (table) => controller.setDetails(table),
      setDetailsOn: (on) => controller.setDetailsOn(on),
      load: (url, sha256) => loadDetails(url, sha256, { caches, fetch: (...args) => fetch(...args), sha256: sha256Hex }),
      forget: () => void forgetDetails(caches),
      languages: () => (navigator.languages?.length ? navigator.languages : [navigator.language]),
      settingsUrl: SETTINGS_URL,
    },
    await readDetailsOn(chrome.storage.local).catch(() => true),
  );
  const syncDetails = (settings: Settings): void => details.sync(settings);
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
      details.detailsOn = changes[DETAILS_KEY]?.newValue !== false;
      syncDetails(settingsNow);
    }
  });
  // The browser's language changed: the details follow it.
  window.addEventListener("languagechange", () => syncDetails(settingsNow));
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
