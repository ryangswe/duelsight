// SPDX-License-Identifier: Apache-2.0
// The tooltip frame's logic, apart from the browser globals so that it can be tested.
//
//   - It starts only inside a page the extension is built for, and acts only on messages from
//     that page's window, from that origin.
//   - It shows only cards of the release's catalog, with the catalog's name: an id it does not
//     know (which only a page posting to the frame itself could send) shows nothing. A card of a
//     remote release (the vendored remote-release module) comes with that release's id; its facts
//     arrive from the compute frame over the extension-only facts channel (`addFacts`), which the page cannot reach, and win
//     over the bundled table. An id in neither is waited for FACTS_WAIT_MS, then shows nothing.
//   - Each newly shown card asks the background for a settings refresh. The background fetches
//     at most once an hour, so a long-open tab still picks up `namesOnly` within the hour.
//   - With the details panel on and the card's details loaded (src/details/), the picture comes
//     with a text panel: its text is set with textContent only, measured at a few widths and sent
//     with the picture's size, and the frame lays both out in the size it is given
//     (panel-layout.ts). No details for the card (the file not loaded yet, or the card not in it)
//     is the picture alone, as with the panel off; names only and the name pill never have one.

import { resolveCardImage, type Resolution, SourceHealth } from "../images/chain.js";
import type { Settings } from "../settings/schema.js";
import { allowedParentOrigin, parseTooltipIn, tag, type TooltipOut, type TooltipSize } from "../shared/messages.js";
import type { CardFacts, CardTable } from "./card-data.js";
import { type DetailsTable, detailLines, detailsFor } from "../details/details.js";
import { arrange } from "../shared/panel-layout.js";

/** Pictures kept for cards shown in this page, oldest dropped first. */
export const CACHE_LIMIT = 60;
/** A portrait card's picture is shown this wide (and as tall as its shape asks: 320 x 448). */
export const PORTRAIT_WIDTH = 320;
/** A landscape picture is shown this wide. */
export const LANDSCAPE_WIDTH = 448;
/** How long a card of a remote release waits for its facts from the channel. */
export const FACTS_WAIT_MS = 300;
/** Facts kept from the channel, oldest dropped first. */
export const FACTS_LIMIT = 500;
/** The card's shape while its picture loads (a Yu-Gi-Oh! card: 59 x 86 mm). */
export const CARD_ASPECT = 86 / 59;

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
  /** The details panel beside or under the picture. */
  panel: PanelElements;
}

export interface PanelElements {
  root: HTMLElement;
  name: HTMLElement;
  type: HTMLElement;
  stats: HTMLElement;
  power: HTMLElement;
  text: HTMLElement;
}

export interface TooltipDeps {
  elements: TooltipElements;
  table: CardTable;
  /** Load one picture (the fallback chain calls it per source). */
  load(url: string): Promise<Blob>;
  /** The pixel size of a loaded picture (rejects when it does not decode). */
  imageSize(blob: Blob): Promise<{ width: number; height: number }>;
  /** Ask the background to fetch the settings file if it is due. */
  requestRefresh(): void;
  /** The tooltip's size and shape for the card it shows: the content script sizes the frame. */
  onSize?(size: TooltipSize): void;
  /** Resolves once the frame has the picture's shape (the content script sized it), so the
   *  picture is never drawn stretched into the placeholder's shape; with `panel`, the shape of
   *  the picture and its panel together. Absent: at once. */
  frameFits?(size: { width: number; height: number }, panel: boolean): Promise<void>;
  /** The heights the panel's content (as filled now) needs at the panel widths. Absent: no panel. */
  measurePanel?(): Array<[number, number]>;
  /** The frame's own size now. */
  frameSize?(): { width: number; height: number };
  /** Clamp the panel's text to the panel's box as laid out now (an ellipsis when it is too long). */
  fitText?(): void;
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
  /** Ask the compute frames for a card's facts (the facts channel). */
  requestFacts?(releaseId: string, cardId: string): void;
  /** A timer (the facts wait); setTimeout by default. */
  setTimer?(fn: () => void, ms: number): unknown;
  clearTimer?(handle: unknown): void;
}

/** Pictures are cached by card id and art path. */
const pictureKey = (card: CardFacts): string => `${card.id}|${card.art ?? ""}`;

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
  /** The facts of the card on show: every later lookup for it uses them (Addendum 1, A1). */
  private currentFacts: CardFacts | null = null;
  /** The remote release the card on show came with, if any. */
  private currentRelease: string | undefined = undefined;
  /** Card facts from the channel, by `${releaseId}|${cardId}`. */
  private readonly facts = new Map<string, CardFacts>();
  /** A card of a remote release whose facts have not come yet. */
  private waiting: { cardId: string; releaseId: string; seq: number | undefined; timer: unknown } | null = null;
  private details: DetailsTable | null = null;
  private detailsOn = true;
  /** The picture on show (decoded and shown): its card, size and whether a panel goes with it. */
  private picture: { cardId: string; width: number; height: number; panel: boolean } | null = null;

  constructor(private readonly deps: TooltipDeps) {}

  /** Fresh settings: every source is tried again, and no picture is kept from the old ones. */
  setSettings(settings: Settings): void {
    this.settings = settings;
    this.health.reset();
    this.cache.clear();
    for (const url of this.objectUrls.values()) this.deps.revokeObjectURL(url);
    this.objectUrls.clear();
  }

  /** The details file, once loaded (null: none). A card on show gets its panel at once. */
  setDetails(details: DetailsTable | null): void {
    if (details === this.details) return;
    this.details = details;
    this.refreshPanel();
  }

  /** The popup's details switch. A card on show gains or loses its panel at once. */
  setDetailsOn(on: boolean): void {
    if (on === this.detailsOn) return;
    this.detailsOn = on;
    this.refreshPanel();
  }

  /** Facts for a card of a remote release, from the compute frame (the facts channel only). */
  addFacts(releaseId: string, card: CardFacts): void {
    const key = `${releaseId}|${card.id}`;
    this.facts.delete(key);
    this.facts.set(key, card);
    while (this.facts.size > FACTS_LIMIT) this.facts.delete(this.facts.keys().next().value as string);
    const w = this.waiting;
    if (w && w.releaseId === releaseId && w.cardId === card.id) {
      this.stopWaiting();
      this.show(w.cardId, w.seq, w.releaseId);
      return;
    }
    // The card on show came before its facts and was shown from the bundled table: the release's
    // facts win (a renamed card, another artwork).
    const shown = this.currentFacts;
    if (this.current === card.id && this.currentRelease === releaseId && shown && JSON.stringify(shown) !== JSON.stringify(card)) {
      this.show(card.id, this.currentSeq, releaseId);
    }
  }

  /** The facts for a card: the channel's for its release, then the bundled table. */
  private lookup(cardId: string, releaseId: string | undefined): CardFacts | null {
    if (releaseId !== undefined) {
      const f = this.facts.get(`${releaseId}|${cardId}`);
      if (f) return f;
    }
    return knownCard(this.deps.table, cardId);
  }

  private stopWaiting(): void {
    if (this.waiting) (this.deps.clearTimer ?? ((h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>)))(this.waiting.timer);
    this.waiting = null;
  }

  /** Show a card: its picture alone, or its name. False (and nothing shown) for an id the
   *  catalog does not have, and no facts came for (a card of a remote release is waited for
   *  FACTS_WAIT_MS first). */
  show(cardId: string, messageSeq?: number, releaseId?: string): boolean {
    this.stopWaiting();
    const card = this.lookup(cardId, releaseId);
    const e = this.deps.elements;
    // A card of a remote release whose facts this frame has not received: ask for them (they win
    // over the bundled table when they come). Asked once the wait or the card on show is set, so an
    // answer that comes at once is not lost.
    const ask = releaseId !== undefined && !this.facts.has(`${releaseId}|${cardId}`);
    if (!card) {
      this.clear();
      if (releaseId !== undefined) {
        const timer = (this.deps.setTimer ?? setTimeout)(() => {
          if (this.waiting?.timer === timer) this.waiting = null;
        }, FACTS_WAIT_MS);
        this.waiting = { cardId, releaseId, seq: messageSeq, timer };
        if (ask) this.deps.requestFacts?.(releaseId, cardId);
      }
      return false;
    }
    this.deps.requestRefresh();
    this.current = card.id;
    this.currentFacts = card;
    this.currentRelease = releaseId;
    if (ask) this.deps.requestFacts?.(releaseId!, cardId);
    this.currentSeq = messageSeq;
    const seq = ++this.seq;
    const settings = this.settings;
    const live = (): boolean => this.seq === seq && this.current === card.id && this.settings === settings;
    this.picture = null;
    this.layout();
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
        let url = this.objectUrls.get(pictureKey(card));
        if (!url) {
          url = this.deps.createObjectURL(r.blob);
          this.objectUrls.set(pictureKey(card), url);
        }
        e.img.src = url;
        // Shown once it is drawable, so the placeholder never gives way to an empty box; a
        // picture that does not decode here shows the name (the catch below). Chrome rejects a
        // pending decode() whenever src is set again, even to the same value: the token keeps a
        // superseded chain from acting on that.
        await e.img.decode?.();
        if (!live()) return;
        // The frame takes the picture's shape first (with its panel, both together), then the
        // picture replaces the placeholder.
        const panel = this.fillPanel(card);
        this.deps.onSize?.({ ...size, shape: "card", cardId: card.id, ...(messageSeq !== undefined ? { seq: messageSeq } : {}), ...(panel ? { panel } : {}) });
        await this.deps.frameFits?.(size, panel !== null);
        if (!live()) return;
        e.pill.hidden = true;
        e.art.hidden = false;
        e.art.classList.remove("loading");
        this.picture = { cardId: card.id, ...size, panel: panel !== null };
        this.layout();
      })
      .catch(() => {
        if (live()) this.showPill(card.id, messageSeq);
      });
    return true;
  }

  clear(): void {
    this.stopWaiting();
    this.seq += 1;
    this.current = null;
    this.currentFacts = null;
    this.currentRelease = undefined;
    this.picture = null;
    this.deps.elements.root.hidden = true;
  }

  /**
   * Lay the picture and its panel out in the frame's size now (panel-layout.ts `arrange`): side
   * by side, stacked, or the picture alone filling the frame (as without details). The frame
   * calls it on every resize; the text is then clamped to the panel.
   */
  layout(): void {
    const e = this.deps.elements;
    const picture = this.picture;
    const frame = this.deps.frameSize?.();
    const plan = picture?.panel && frame ? arrange(frame, picture) : null;
    if (!plan || !plan.panel) {
      e.art.removeAttribute("style");
      e.panel.root.hidden = true;
      return;
    }
    const place = (el: HTMLElement, b: { left: number; top: number; width: number; height: number }): void => {
      el.style.cssText = `position:absolute;left:${b.left}px;top:${b.top}px;width:${b.width}px;height:${b.height}px;`;
    };
    place(e.art, plan.art);
    place(e.panel.root, plan.panel);
    e.panel.root.hidden = false;
    this.deps.fitText?.();
  }

  /** Fill the panel with the card's details and measure it; null (and the panel emptied) when the
   *  card has none to show. */
  private fillPanel(card: CardFacts): Array<[number, number]> | null {
    const p = this.deps.elements.panel;
    const details = this.detailsOn && this.deps.measurePanel ? detailsFor(this.details, card.id) : null;
    p.root.hidden = true;
    if (!details) {
      for (const el of [p.name, p.type, p.stats, p.power, p.text]) el.textContent = "";
      return null;
    }
    const lines = detailLines(details);
    // Text only: nothing in a card's details is ever read as markup.
    p.name.textContent = card.name;
    p.type.textContent = lines.type;
    p.stats.textContent = lines.stats ?? "";
    p.power.textContent = lines.power ?? "";
    p.text.textContent = lines.text;
    const heights = this.deps.measurePanel!();
    return heights.length > 0 ? heights : null;
  }

  /** The details switch or file changed: the picture on show is sent again with its panel, or
   *  without it. Its picture stays; the frame follows the size the content script gives it. */
  private refreshPanel(): void {
    const picture = this.picture;
    if (!picture || picture.cardId !== this.current) return;
    const card = this.currentFacts;
    if (!card || card.id !== picture.cardId) return;
    const panel = this.fillPanel(card);
    this.picture = { ...picture, panel: panel !== null };
    const seq = this.currentSeq;
    this.deps.onSize?.({ width: picture.width, height: picture.height, shape: "card", cardId: card.id, ...(seq !== undefined ? { seq } : {}), ...(panel ? { panel } : {}) });
    this.layout();
  }

  /** The name alone, in a small pill sized to it. */
  private showPill(cardId: string, messageSeq?: number): void {
    const e = this.deps.elements;
    this.picture = null;
    this.layout();
    e.art.hidden = true;
    e.art.classList.remove("loading");
    e.pill.hidden = false;
    const r = e.pill.getBoundingClientRect();
    this.deps.onSize?.({ width: Math.ceil(r.width), height: Math.ceil(r.height), shape: "pill", cardId, ...(messageSeq !== undefined ? { seq: messageSeq } : {}) });
  }

  private resolve(card: CardFacts, settings: Settings): Promise<Resolution> {
    // By id and art path: the same id may carry another artwork in a remote release's facts.
    const key = pictureKey(card);
    let entry = this.cache.get(key);
    if (!entry) {
      entry = resolveCardImage(card, settings, this.health, this.deps.load);
      this.cache.set(key, entry);
      // A card that showed names only is tried again next time.
      void entry.then((r) => {
        if (r.kind === "names" && this.cache.get(key) === entry) this.cache.delete(key);
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
    else controller.show(message.cardId, message.seq, message.releaseId);
  });
  return (message) => env.win.parent.postMessage(tag(message), parentOrigin);
}
