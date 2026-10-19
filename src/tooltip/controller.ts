// SPDX-License-Identifier: Apache-2.0
// The tooltip frame's logic, apart from the browser globals so that it can be tested.
//
//   - It starts only inside a page the extension is built for, and acts only on messages from
//     that page's window, from that origin.
//   - It shows only cards of the release's catalog, with the catalog's name: an id it does not
//     know (which only a page posting to the frame itself could send) shows nothing.
//   - Each newly shown card asks the background for a settings refresh. The background fetches
//     at most once an hour, so a long-open tab still picks up `namesOnly` within the hour.

import { resolveCardImage, type Resolution, SourceHealth } from "../images/chain.js";
import type { Settings } from "../settings/schema.js";
import type { SourceFileMaps } from "../settings/templates.js";
import { allowedParentOrigin, parseTooltipIn, tag, type TooltipOut, type TooltipSize } from "../shared/messages.js";
import type { CardFacts, CardTable } from "./card-data.js";

/** Pictures kept for cards shown in this page, oldest dropped first. */
export const CACHE_LIMIT = 60;
/** A portrait card's picture is shown this wide (and as tall as its shape asks: 320 x 448). */
export const PORTRAIT_WIDTH = 320;
/** A landscape picture is shown this wide. */
export const LANDSCAPE_WIDTH = 448;
/** The card's shape while its picture loads (One Piece and most card games: 63 x 88 mm). */
export const CARD_ASPECT = 88 / 63;

/** The size a picture is shown at, before the content script fits it into the page. */
export function artSize(width: number, height: number): { width: number; height: number } {
  if (!(width > 0 && height > 0)) return { width: PORTRAIT_WIDTH, height: Math.round(PORTRAIT_WIDTH * CARD_ASPECT) };
  const w = width > height ? LANDSCAPE_WIDTH : PORTRAIT_WIDTH;
  return { width: w, height: Math.round((w * height) / width) };
}

export interface TooltipElements {
  root: HTMLElement;
  /** The picture's box: the picture, or a dark card with the name while it loads. */
  art: HTMLElement;
  img: HTMLImageElement;
  placeholder: HTMLElement;
  /** The name alone, when there is no picture (names only, or none could be loaded). */
  pill: HTMLElement;
}

export interface TooltipDeps {
  elements: TooltipElements;
  table: CardTable;
  maps: SourceFileMaps;
  /** Load one picture (the fallback chain calls it per source). */
  load(url: string): Promise<Blob>;
  /** The pixel size of a loaded picture (rejects when it does not decode). */
  imageSize(blob: Blob): Promise<{ width: number; height: number }>;
  /** Ask the background to fetch the settings file if it is due. */
  requestRefresh(): void;
  /** The tooltip's size and shape for the card it shows: the content script sizes the frame. */
  onSize?(size: TooltipSize): void;
  /** Resolves once the frame has the picture's shape (the content script sized it), so the
   *  picture is never drawn stretched into the placeholder's shape. Absent: at once. */
  frameFits?(size: { width: number; height: number }): Promise<void>;
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

/** The card for an id, from the catalog only; null for an id the catalog does not have. */
export function knownCard(table: CardTable, id: string): CardFacts | null {
  if (!Object.hasOwn(table, id)) return null;
  const row = table[id]!;
  return { id, name: row[0], set: row[1], art: row[2], printed: row[3] ?? null };
}

export class TooltipController {
  private settings: Settings | null = null;
  private readonly health = new SourceHealth();
  private readonly cache = new Map<string, Promise<Resolution>>();
  private readonly objectUrls = new Map<string, string>();
  /** One per show(): a picture's chain acts only while its show() is the latest. */
  private seq = 0;
  current: string | null = null;
  /** The content script's number for the card shown (echoed in sizes). */
  currentSeq: number | undefined = undefined;

  constructor(private readonly deps: TooltipDeps) {}

  /** Fresh settings: every source is tried again, and no picture is kept from the old ones. */
  setSettings(settings: Settings): void {
    this.settings = settings;
    this.health.reset();
    this.cache.clear();
    for (const url of this.objectUrls.values()) this.deps.revokeObjectURL(url);
    this.objectUrls.clear();
  }

  /** Show a card: its picture alone, or its name. False (and nothing shown) for an id the
   *  catalog does not have. */
  show(cardId: string, messageSeq?: number): boolean {
    const card = knownCard(this.deps.table, cardId);
    const e = this.deps.elements;
    if (!card) {
      this.clear();
      return false;
    }
    this.deps.requestRefresh();
    this.current = card.id;
    this.currentSeq = messageSeq;
    const seq = ++this.seq;
    const settings = this.settings;
    const live = (): boolean => this.seq === seq && this.current === card.id && this.settings === settings;
    e.img.alt = card.name;
    e.placeholder.textContent = card.name;
    e.pill.textContent = card.name;
    e.root.hidden = false;
    if (!settings || settings.namesOnly) {
      this.showPill(card.id, messageSeq);
      return true;
    }
    // A dark card with the name until the picture decodes, in the picture's place.
    e.pill.hidden = true;
    e.art.hidden = false;
    e.art.classList.add("loading");
    e.img.removeAttribute("src");
    this.deps.onSize?.({ ...artSize(0, 0), shape: "card", cardId: card.id, ...(messageSeq !== undefined ? { seq: messageSeq } : {}) });
    void this.resolve(card, settings)
      .then(async (r) => {
        if (!live()) return;
        if (r.kind !== "image") {
          this.showPill(card.id, messageSeq);
          return;
        }
        const pixels = await this.deps.imageSize(r.blob);
        if (!live()) return;
        const size = artSize(pixels.width, pixels.height);
        let url = this.objectUrls.get(card.id);
        if (!url) {
          url = this.deps.createObjectURL(r.blob);
          this.objectUrls.set(card.id, url);
        }
        e.img.src = url;
        // Shown once it is drawable, so the placeholder never gives way to an empty box; a
        // picture that does not decode here shows the name (the catch below). Chrome rejects a
        // pending decode() whenever src is set again, even to the same value: the token keeps a
        // superseded chain from acting on that.
        await e.img.decode?.();
        if (!live()) return;
        // The frame takes the picture's shape first, then the picture replaces the placeholder.
        this.deps.onSize?.({ ...size, shape: "card", cardId: card.id, ...(messageSeq !== undefined ? { seq: messageSeq } : {}) });
        await this.deps.frameFits?.(size);
        if (!live()) return;
        e.pill.hidden = true;
        e.art.hidden = false;
        e.art.classList.remove("loading");
      })
      .catch(() => {
        if (live()) this.showPill(card.id, messageSeq);
      });
    return true;
  }

  clear(): void {
    this.seq += 1;
    this.current = null;
    this.deps.elements.root.hidden = true;
  }

  /** The name alone, in a small pill sized to it. */
  private showPill(cardId: string, messageSeq?: number): void {
    const e = this.deps.elements;
    e.art.hidden = true;
    e.art.classList.remove("loading");
    e.pill.hidden = false;
    const r = e.pill.getBoundingClientRect();
    this.deps.onSize?.({ width: Math.ceil(r.width), height: Math.ceil(r.height), shape: "pill", cardId, ...(messageSeq !== undefined ? { seq: messageSeq } : {}) });
  }

  private resolve(card: CardFacts, settings: Settings): Promise<Resolution> {
    let entry = this.cache.get(card.id);
    if (!entry) {
      entry = resolveCardImage(card, settings, this.deps.maps, this.health, this.deps.load);
      this.cache.set(card.id, entry);
      // A card that showed names only is tried again next time.
      void entry.then((r) => {
        if (r.kind === "names" && this.cache.get(card.id) === entry) this.cache.delete(card.id);
      });
      while (this.cache.size > CACHE_LIMIT) {
        const oldest = this.cache.keys().next().value as string;
        this.cache.delete(oldest);
        const url = this.objectUrls.get(oldest);
        if (url) this.deps.revokeObjectURL(url);
        this.objectUrls.delete(oldest);
      }
    }
    return entry;
  }
}

/** The part of the frame's window used here. */
export interface TooltipWindow {
  parent: { postMessage(message: unknown, targetOrigin: string): void };
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
}

/**
 * Listen to the embedding page, when it is one the extension is built for. Returns a function
 * that posts to it, or null when the frame does not serve this page.
 */
export function connectTooltipFrame(
  env: { win: TooltipWindow; framed: boolean; parentOrigin: string | null; dev: boolean },
  controller: Pick<TooltipController, "show" | "clear">,
): ((message: TooltipOut) => void) | null {
  const parentOrigin = env.parentOrigin;
  if (!env.framed || parentOrigin === null || !allowedParentOrigin(parentOrigin, env.dev)) return null;
  env.win.addEventListener("message", (event) => {
    if (event.source !== env.win.parent || event.origin !== parentOrigin) return;
    const message = parseTooltipIn(event.data);
    if (!message) return;
    // The page's name for the card is never shown: the catalog's is.
    if (message.kind === "clear") controller.clear();
    else controller.show(message.cardId, message.seq);
  });
  return (message) => env.win.parent.postMessage(tag(message), parentOrigin);
}
