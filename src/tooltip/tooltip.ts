// SPDX-License-Identifier: Apache-2.0
// The tooltip frame: an extension page the content script places beside a card. It shows the
// card's picture alone (from the sources the settings name, in order), or the card's name when
// there is no picture. Nothing in it can be clicked: the pointer passes through to the video.
// Being an extension page, it loads pictures under the extension's host permissions and policy,
// not the video site's. The logic is in controller.ts.

import { loadImage } from "../images/chain.js";
import { LAST_GOOD_KEY, readEffectiveSettings } from "../settings/store.js";
import { type CardTable, parseSourceFileMaps } from "./card-data.js";
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
  const [cards, files, effective] = await Promise.all([fetchJson("data/cards.json"), fetchJson("data/source-files.json"), readEffectiveSettings(chrome.storage.local)]);
  const controller = new TooltipController({
    elements: { root: $("card"), art: $("art"), img: $<HTMLImageElement>("img"), placeholder: $("placeholder"), pill: $("pill") },
    table: (cards ?? {}) as CardTable,
    maps: parseSourceFileMaps(files),
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
    frameFits: (size) => frameHasShape(size, window as unknown as ShapeWindow),
  });
  controller.setSettings(effective.settings);
  post = connectTooltipFrame({ win: window, framed, parentOrigin, dev: __DEV__ }, controller);
  if (!post) return;
  const send = post;
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && LAST_GOOD_KEY in changes) void readEffectiveSettings(chrome.storage.local).then((e) => controller.setSettings(e.settings));
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
  // The background fetches the settings file when it is due (at most once an hour).
  void chrome.runtime.sendMessage({ kind: "settings:refresh" }).catch(() => undefined);
  send({ kind: "ready" });
})();
