// SPDX-License-Identifier: Apache-2.0
// The content script's work in a video page.
//
//   - It follows the page's main video (the largest one on show). The toolkit's capture control
//     (createCaptureControl, docs/extension-session.md) does the rest of the content script's half
//     of the session: the pointer over the picture, the video's events, the handshake with the
//     compute frame, and the pictures it asks for. It gives a picture only on the authority of
//     pointer events the browser marks as trusted, checked again against the picture at each
//     capture, and never more than 60 s after the last one. Pictures go only to the compute frame,
//     which is the extension's own; nothing is sent over the network.
//   - Nothing is analyzed until the pointer first comes over a picture: that is when the two
//     frames are created and the model loads. So a video nobody points at costs nothing.
//   - It shows the tooltip frame (the card's picture alone, or its name) beside the card the
//     compute frame names, placed off the cards around it and scaled down when the page has no
//     room for it, and hides it shortly after. Nothing it shows takes the pointer: hovering goes
//     on to the card underneath.
//   - It outlines the card the tooltip names (outline.ts): the same accepted box, shown and
//     hidden with the tooltip, never taking the pointer.
//   - It is on for every video (owner, 2026-10-27: no per-channel switch; the popup's switch is
//     the only control). The popup's switch turned off removes the frames again.
//   - It takes a message from one of its frames only when the browser delivered it from that
//     frame (fromExtensionFrame): a page can make up a message event, not a trusted one.

import { CONFIG } from "../config.js";
import { MIN_VIDEO_WIDTH } from "../constants.js";
import { parseTooltipOut, tag, TAG, type TooltipIn, type TooltipSize } from "../shared/messages.js";
import { type CaptureControl, computeProtocol, createCaptureControl, fromExtensionFrame, type ShownCard } from "../../vendor/cardvision-browser/page-capture.js";
import { availableSpace, CARD_CORNER, fitBesideCard, fitsBesideCard, fitTooltipSize, fitWithPanel, fractionIn, pictureRect, placeTooltipAvoiding, type Rect, scaleTooltipSize, tooltipRadius } from "./geometry.js";
import { arrange } from "../shared/panel-layout.js";
import { isActivePage } from "./site.js";
import { CardOutline, outlineRect } from "./outline.js";

/** The two-frame contract under DuelSight's tag; the compute frame uses the same. */
const PROTOCOL = computeProtocol(TAG);

function sameSize(a: { width: number; height: number }, b: { width: number; height: number }): boolean {
  return a.width === b.width && a.height === b.height;
}

/** A new fitted size closer than this to the shown one keeps the shown one (no breathing). */
const SIZE_HYSTERESIS_PX = 8;
/** The tooltip goes this long after the card is no longer under the pointer. */
export const HIDE_DELAY_MS = 120;
const VIDEO_RECHECK_MS = 1_000;
/** The extension's frames in the page: `all:initial` first, so none of the page's styles for
 *  iframes reach them. */
const FRAME_STYLE = "all:initial;position:fixed;display:block;border:0;margin:0;padding:0;background:transparent;color-scheme:normal;transform:none;filter:none;";

export interface AgentOptions {
  dev: boolean;
  /** The clock, in ms; default `performance.now()`. For tests. */
  now?: () => number;
}

export class Agent {
  private enabled = false;
  private video: HTMLVideoElement | null = null;
  private videoPickedAt = -Infinity;
  /** Follows the video's box, to place the tooltip and the outline again. */
  private resizeObserver: ResizeObserver | null = null;

  private compute: HTMLIFrameElement | null = null;
  private tooltip: HTMLIFrameElement | null = null;
  private tooltipReady = false;
  /** The tooltip's own size (tooltip.ts), before it is fitted into the page. */
  private tooltipSize: TooltipSize = { width: 320, height: 448, shape: "card" };
  /** The size it is shown at. */
  private shownSize = { width: 320, height: 448 };
  /** The viewer's card size (the popup's dial), as a factor of the tooltip's own size. */
  private cardScale = 1;
  private pendingTooltip: TooltipIn | null = null;

  private shown: ShownCard | null = null;
  private displayedCardId: string | null = null;
  /** The card the tooltip shows (also while it is held for the quick hide), for re-placing it. */
  private displayedCard: ShownCard | null = null;
  /** A re-placement waiting for the next animation frame (resize, scroll, the video moving). */
  private relayoutPending = false;
  /** The card whose own size the tooltip has sent: the frame is shown only for that card, so
   *  it never shows a previous card or the wrong shape. */
  private sizedCardId: string | null = null;
  /** Numbers each card message sent to the tooltip; its sizes echo it (stale ones are ignored). */
  private cardSeq = 0;
  /** Where the displayed card was last placed against, so the tooltip moves with it. */
  private placedFor: { cardId: string; rect: Rect } | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private loadError: string | null = null;
  /** The outline around the card the tooltip names (a shadow root in the page). */
  private outline: CardOutline | null = null;

  /** `chrome-extension://<id>`: the extension's base address without its trailing slash. */
  private readonly extensionOrigin = chrome.runtime.getURL("").replace(/\/$/, "");
  /** The content script's half of the session (the toolkit's). */
  private readonly control: CaptureControl;
  private stopListening: (() => void) | null = null;

  constructor(private readonly options: AgentOptions) {
    this.control = createCaptureControl({
      protocol: PROTOCOL,
      frame: () => this.compute?.contentWindow ?? null,
      frameOrigin: this.extensionOrigin,
      ...(options.now ? { now: options.now } : {}),
      eligible: (x, y, video) => this.eligibleAt(x, y, video),
      onShown: (card) => {
        this.shown = card;
        this.updateTooltip();
      },
      onStatus: (status) => {
        if (status.state === "failed" && status.error !== this.loadError) {
          this.loadError = status.error;
          // The page's own console only; nothing is reported anywhere.
          console.warn(`${CONFIG.name}: the card recognition model did not load (${status.error ?? "unknown reason"}).`);
        }
      },
      onProblem: (problem) => {
        // The page's own console only. A version mismatch mends with a reload of the page.
        if (problem.kind === "version") console.warn(`${CONFIG.name}: reload the page to use the updated extension.`);
      },
    });
  }

  start(): void {
    // Before the control's own listeners, on the same target and phase: the first move over a
    // video picks it (and makes the frames) before the control reads that move.
    window.addEventListener("pointermove", this.onPointer, { capture: true, passive: true });
    window.addEventListener("pointerdown", this.onPointer, { capture: true, passive: true });
    this.stopListening = this.control.listen(window, document);
    window.addEventListener("message", this.onMessage);
    document.addEventListener("fullscreenchange", this.onFullscreen);
    // The page moving under a held card: the tooltip and the outline follow it.
    window.addEventListener("resize", this.onLayout, { passive: true });
    document.addEventListener("scroll", this.onScroll, { capture: true, passive: true });
  }

  /** A scroll that can move the video: the page's own, or a box holding the player. Others (a
   *  chat that scrolls itself) are ignored, so they do not force a layout every frame. */
  private readonly onScroll = (event: Event): void => {
    const target = event.target;
    if (target === document || target === document.documentElement || target === document.body || target === document.scrollingElement) {
      this.onLayout();
      return;
    }
    if (target instanceof Element && this.video && target.contains(this.video)) this.onLayout();
  };

  /** The window was resized or scrolled, or the video's box changed: while a card is shown,
   *  place its tooltip and outline again, at most once an animation frame. */
  private readonly onLayout = (): void => {
    if (this.displayedCardId === null || this.relayoutPending) return;
    this.relayoutPending = true;
    requestAnimationFrame(() => {
      this.relayoutPending = false;
      const video = this.video;
      if (!video) return;
      const card = this.displayedCard;
      if (this.displayedCardId === null || !card) return;
      this.showTooltip(card, video);
    });
  };

  /** Stop listening and remove everything the agent added to the page. */
  stop(): void {
    window.removeEventListener("pointermove", this.onPointer, { capture: true });
    window.removeEventListener("pointerdown", this.onPointer, { capture: true });
    this.stopListening?.();
    this.stopListening = null;
    window.removeEventListener("message", this.onMessage);
    document.removeEventListener("fullscreenchange", this.onFullscreen);
    window.removeEventListener("resize", this.onLayout);
    document.removeEventListener("scroll", this.onScroll, { capture: true });
    this.enabled = false;
    this.teardown();
    this.control.stop();
  }

  /** The popup's card size changed (a percentage, already clamped): a card on show is fitted
   *  again at once. */
  setCardSize(percent: number): void {
    const scale = percent / 100;
    if (!(scale > 0) || scale === this.cardScale) return;
    this.cardScale = scale;
    this.onLayout();
  }

  setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    if (!enabled) this.teardown();
  }

  // ------------------------------------------------------------------ the pointer
  /** Where a trusted point counts: over the main video's picture, on a page the extension serves,
   *  while it is switched on. Asked by the control on every pointer event and before every
   *  capture. */
  private eligibleAt(clientX: number, clientY: number, video: HTMLVideoElement): { x: number; y: number } | null {
    if (!this.enabled || video !== this.video || !video.isConnected || !isActivePage(new URL(location.href), this.options.dev)) return null;
    return fractionIn(this.pictureOf(video), clientX, clientY);
  }

  /** Picks the video under a trusted move, and makes the frames on the first move over its
   *  picture. The control then takes the same event (it listens after this). */
  private readonly onPointer = (event: PointerEvent): void => {
    if (event.isTrusted !== true || !this.enabled || !isActivePage(new URL(location.href), this.options.dev)) return;
    const video = this.currentVideo();
    if (video && fractionIn(this.pictureOf(video), event.clientX, event.clientY)) this.ensureFrames();
  };

  // ------------------------------------------------------------------ the video
  private currentVideo(): HTMLVideoElement | null {
    const now = performance.now();
    if (this.video?.isConnected && now - this.videoPickedAt < VIDEO_RECHECK_MS) return this.video;
    this.videoPickedAt = now;
    let best: HTMLVideoElement | null = null;
    let bestArea = 0;
    for (const v of document.querySelectorAll("video")) {
      const r = v.getBoundingClientRect();
      const area = r.width * r.height;
      if (r.width >= MIN_VIDEO_WIDTH && v.videoWidth > 0 && area > bestArea) {
        best = v;
        bestArea = area;
      }
    }
    if (best !== this.video) this.setVideo(best);
    return best;
  }

  private pictureOf(video: HTMLVideoElement): Rect {
    return pictureRect(video.getBoundingClientRect(), { width: video.videoWidth, height: video.videoHeight }, getComputedStyle(video).objectFit);
  }

  /** Another video, or none: the control watches it (and tells the compute frame of a new
   *  source); the tooltip follows its box. */
  private setVideo(video: HTMLVideoElement | null): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.video = video;
    this.control.attach(video);
    if (!video) return;
    // The player resized (theater mode, the site's own layout): see onLayout.
    this.resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(() => this.onLayout()) : null;
    this.resizeObserver?.observe(video);
  }

  // ------------------------------------------------------------------ the frames
  private ensureFrames(): void {
    // A frame the page removed is made again.
    if (this.compute && !this.compute.isConnected) this.compute = null;
    if (this.tooltip && !this.tooltip.isConnected) {
      this.tooltip = null;
      this.tooltipReady = false;
      this.displayedCardId = null;
      this.sizedCardId = null;
    }
    if (!this.compute) {
      const frame = document.createElement("iframe");
      frame.setAttribute("aria-hidden", "true");
      frame.tabIndex = -1;
      // Not display:none: a hidden frame keeps running, and the browser may slow a frame that is
      // not rendered. No referrer policy: the frame reads the page's origin from its ancestors.
      frame.style.cssText = `${FRAME_STYLE}width:1px;height:1px;left:-10px;top:-10px;opacity:0;pointer-events:none;`;
      frame.src = chrome.runtime.getURL("compute.html");
      document.documentElement.appendChild(frame);
      this.compute = frame;
      // Hello until the new frame says ready (it also says so on its own once it can listen).
      this.control.connect();
    }
    if (!this.tooltip) this.createTooltip();
  }

  private createTooltip(): void {
    const frame = document.createElement("iframe");
    frame.title = "Card";
    // Not in the tab order: there is nothing in it to focus.
    frame.tabIndex = -1;
    // Nothing in it can be clicked: the pointer passes through to whatever is under it.
    frame.style.cssText = `${FRAME_STYLE}z-index:2147483646;visibility:hidden;pointer-events:none;width:${this.shownSize.width}px;height:${this.shownSize.height}px;left:0;top:0;border-radius:${tooltipRadius(this.shownSize, "card")}px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.35);`;
    frame.src = chrome.runtime.getURL("tooltip.html");
    this.tooltipReady = false;
    const host = this.mountHost();
    host.appendChild(frame);
    this.tooltip = frame;
    this.outline?.remove();
    this.outline = new CardOutline(host);
  }

  /** In full screen only the full-screen element is drawn, so the tooltip goes inside it. */
  private mountHost(): Element {
    const fs = document.fullscreenElement;
    return fs && !(fs instanceof HTMLVideoElement) && !(fs instanceof HTMLIFrameElement) ? fs : document.documentElement;
  }

  private readonly onFullscreen = (): void => {
    if (!this.tooltip) return;
    // Moving a frame reloads it: make a new one where it will be drawn.
    const held = this.displayedCardId !== null ? this.displayedCard : null;
    this.tooltip.remove();
    this.outline?.remove();
    this.outline = null;
    this.tooltip = null;
    this.displayedCardId = null;
    this.sizedCardId = null;
    this.createTooltip();
    // A card shown (or held, on a paused video) is shown again in the new frame, rather than
    // waiting for the pointer to reach another card.
    if (held && this.video) this.showTooltip(held, this.video);
  };

  private toTooltip(message: TooltipIn): void {
    if (!this.tooltip?.contentWindow || !this.tooltipReady) {
      this.pendingTooltip = message;
      return;
    }
    this.tooltip.contentWindow.postMessage(tag(message), this.extensionOrigin);
  }

  private readonly onMessage = (event: MessageEvent): void => {
    // The compute frame's messages: the control checks and takes them.
    if (this.control.onMessage(event)) return;
    if (!this.tooltip || !fromExtensionFrame(event, this.tooltip.contentWindow, this.extensionOrigin)) return;
    const message = parseTooltipOut(event.data);
    if (!message) return;
    if (message.kind === "ready") {
      this.tooltipReady = true;
      if (this.pendingTooltip) this.toTooltip(this.pendingTooltip);
      this.pendingTooltip = null;
    } else {
      // A size for another card than the one shown now is stale.
      if (message.cardId !== undefined && message.cardId !== this.displayedCardId) return;
      // A size from an earlier showing of the same card (hidden and shown again) is stale too.
      if (message.seq !== undefined && message.seq !== this.cardSeq) return;
      this.tooltipSize = { width: Math.ceil(message.width), height: Math.ceil(message.height), shape: message.shape, ...(message.panel ? { panel: message.panel } : {}) };
      if (message.cardId !== undefined) this.sizedCardId = message.cardId;
      this.updateTooltip();
    }
  };

  // ------------------------------------------------------------------ the tooltip
  private updateTooltip(): void {
    const card = this.shown;
    if (card && this.video && this.control.gateState().inside) {
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.hideTimer = null;
      this.showTooltip(card, this.video);
      return;
    }
    if (this.displayedCardId === null || this.hideTimer) return;
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      if (this.shown && this.control.gateState().inside) return;
      this.hideTooltip();
    }, HIDE_DELAY_MS);
  }

  private showTooltip(card: ShownCard, video: HTMLVideoElement): void {
    if (this.tooltip && !this.tooltip.isConnected) {
      // The page removed it: make it again, and send the card again.
      this.tooltip = null;
      this.tooltipReady = false;
      this.displayedCardId = null;
      this.sizedCardId = null;
    }
    if (!this.tooltip) this.createTooltip();
    const frame = this.tooltip!;
    const picture = this.pictureOf(video);
    const cardRect: Rect = {
      left: picture.left + card.box.x * picture.width,
      top: picture.top + card.box.y * picture.height,
      width: card.box.width * picture.width,
      height: card.box.height * picture.height,
    };
    const toRect = (b: { x: number; y: number; width: number; height: number }): Rect => ({
      left: picture.left + b.x * picture.width,
      top: picture.top + b.y * picture.height,
      width: b.width * picture.width,
      height: b.height * picture.height,
    });
    // Off the cards around the hovered one, and below the player's top (a site's header).
    const playerTop = video.getBoundingClientRect().top;
    // Its own size, scaled down (shape kept) when the page has no room for it.
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    // At the viewer's card size first; the fitting then keeps it inside and off the card.
    const requested = scaleTooltipSize(this.tooltipSize, this.cardScale);
    const fitted = fitTooltipSize(requested, viewport, playerTop);
    // A picture with no room beside the card is made smaller rather than laid over it.
    let size = this.tooltipSize.shape === "card" ? fitBesideCard(cardRect, fitted, viewport, playerTop) : fitted;
    // With the card's details: the picture and its text panel together, the text never scaled
    // (panel-layout.ts). No room for a panel at all: the picture alone, as above.
    const panel = this.tooltipSize.shape === "card" && this.tooltipSize.panel ? fitWithPanel(cardRect, requested, this.tooltipSize.panel, viewport, playerTop) : null;
    if (panel) size = { width: panel.width, height: panel.height };
    const layout = panel ? "details" : this.tooltipSize.shape;
    // No breathing: a size within a few pixels of the shown one keeps the shown one while it still
    // fits: in the room, and (a picture) beside the card, as fitBesideCard would leave it, so the
    // space kept around the card is never eaten into.
    const room = availableSpace(viewport, playerTop);
    const shown = this.shownSize;
    const stillFits =
      shown.width <= room.width &&
      shown.height <= room.height &&
      (this.tooltipSize.shape !== "card" ||
        (panel ? fitsBesideCard(cardRect, shown, viewport, playerTop) || !fitsBesideCard(cardRect, size, viewport, playerTop) : sameSize(fitBesideCard(cardRect, shown, viewport, playerTop), shown)));
    if (
      frame.dataset.shape === layout &&
      Math.abs(size.width - shown.width) < SIZE_HYSTERESIS_PX &&
      Math.abs(size.height - shown.height) < SIZE_HYSTERESIS_PX &&
      stillFits
    ) {
      size = shown;
    }
    if (size.width !== this.shownSize.width || size.height !== this.shownSize.height || frame.dataset.shape !== layout) {
      this.shownSize = size;
      frame.dataset.shape = layout;
      frame.style.width = `${size.width}px`;
      frame.style.height = `${size.height}px`;
      // With a panel, the picture's own corners (the frame lays itself out the same way).
      frame.style.borderRadius = `${panel ? Math.round(arrange(size, requested).art.width * CARD_CORNER) : tooltipRadius(size, this.tooltipSize.shape)}px`;
    }
    // Stay where it is unless another place covers clearly less (no jumping between equals).
    let current = frame.style.visibility === "visible" ? { left: Number.parseFloat(frame.style.left), top: Number.parseFloat(frame.style.top) } : null;
    // The same card moved (the page scrolled, the player resized): the tooltip moves with it.
    if (current && this.placedFor && this.placedFor.cardId === card.cardId) {
      current = { left: current.left + cardRect.left - this.placedFor.rect.left, top: current.top + cardRect.top - this.placedFor.rect.top };
    }
    const at = placeTooltipAvoiding(
      cardRect,
      size,
      viewport,
      (card.others ?? []).map(toRect),
      playerTop,
      current && Number.isFinite(current.left) && Number.isFinite(current.top) ? current : null,
    );
    frame.style.left = `${at.left}px`;
    frame.style.top = `${at.top}px`;
    this.placedFor = { cardId: card.cardId, rect: cardRect };
    this.displayedCard = card;
    if (card.cardId !== this.displayedCardId) {
      this.displayedCardId = card.cardId;
      this.cardSeq += 1;
      this.toTooltip({ kind: "card", cardId: card.cardId, name: card.name, seq: this.cardSeq, ...(card.releaseId ? { releaseId: card.releaseId } : {}) });
    }
    // Shown once the tooltip has sized itself for this card; the outline comes with it.
    const ready = this.sizedCardId === card.cardId;
    frame.style.visibility = ready ? "visible" : "hidden";
    if (this.outline && !this.outline.element.isConnected) {
      this.outline = new CardOutline(this.tooltip!.parentElement ?? this.mountHost());
    }
    // The same box, on the same picture; nothing when the picture's size is not known.
    this.outline?.show(ready ? outlineRect(picture, card.box, video.videoWidth > 0 && video.videoHeight > 0) : null);
  }

  private hideTooltip(): void {
    if (this.tooltip) this.tooltip.style.visibility = "hidden";
    if (this.displayedCardId !== null) this.toTooltip({ kind: "clear" });
    this.displayedCardId = null;
    this.sizedCardId = null;
    this.placedFor = null;
    this.outline?.hide();
  }

  private teardown(): void {
    // The control forgets the pointer, the card showing and the video.
    this.setVideo(null);
    this.videoPickedAt = -Infinity;
    this.shown = null;
    this.displayedCardId = null;
    this.sizedCardId = null;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
    this.compute?.remove();
    this.compute = null;
    this.tooltip?.remove();
    this.tooltip = null;
    this.tooltipReady = false;
    this.pendingTooltip = null;
    this.outline?.remove();
    this.outline = null;
  }
}
