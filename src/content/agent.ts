// SPDX-License-Identifier: Apache-2.0
// The content script's work in a video page.
//
//   - It follows the page's main video (the largest one on show) and the pointer over its
//     picture, and reports both to the compute frame. Nothing is analyzed until the pointer
//     first comes over a picture: that is when the two frames are created and the model loads.
//   - When the compute frame asks, it draws the current picture at analysis size and transfers
//     it there. Pictures go only to that frame, which is the extension's own; nothing is sent
//     over the network.
//   - It shows the tooltip frame (the card's picture alone, or its name) beside the card the
//     compute frame names, placed off the cards around it and scaled down when the page has no
//     room for it, and hides it shortly after. Nothing it shows takes the pointer: hovering goes
//     on to the card underneath.
//   - It outlines the card the tooltip names (outline.ts): the same accepted box, shown and
//     hidden with the tooltip, never taking the pointer.
//   - It is dormant on every video until the viewer turns card hovers on for the video's channel
//     with the in-player button (player-button.ts): until then no frame is made, no model loads
//     and nothing is downloaded. Turning a channel off removes the frames again.
//   - A paused live Twitch stream resets its <video> (no current frame, time 0) but keeps the
//     last frame on screen, and that frame can still be drawn. While a video is paused that way
//     ("frozen"), pictures are taken from it anyway, at the time it showed before the pause.

import { CONFIG } from "../config.js";
import { MIN_VIDEO_WIDTH } from "../constants.js";
import { type ComputeIn, parseComputeOut, parseTooltipOut, type ShownCard, tag, type TooltipIn, type TooltipSize } from "../shared/messages.js";
import { captureAllowed } from "./gate.js";
import { analysisSize, availableSpace, CARD_CORNER, fitBesideCard, fitsBesideCard, fitTooltipSize, fitWithPanel, fractionIn, pictureRect, placeTooltipAvoiding, type Rect, scaleTooltipSize, tooltipRadius } from "./geometry.js";
import { arrange } from "../shared/panel-layout.js";
import { isActivePage } from "./site.js";
import { channelKey, ownerHrefOf } from "./channel.js";
import { PlayerButton } from "./player-button.js";
import { CardOutline, outlineRect } from "./outline.js";
import { applyChannelChanges, BUTTON_INTRO_KEY, type ChannelMap, channelOn, type ChannelStorage, readChannels, setChannel } from "../shared/channels.js";

function sameSize(a: { width: number; height: number }, b: { width: number; height: number }): boolean {
  return a.width === b.width && a.height === b.height;
}

/** A new fitted size closer than this to the shown one keeps the shown one (no breathing). */
const SIZE_HYSTERESIS_PX = 8;
/** The tooltip goes this long after the card is no longer under the pointer. */
export const HIDE_DELAY_MS = 120;
/** How often the channel of the page is looked up again while the pointer moves. */
const CHANNEL_RECHECK_MS = 1_000;
/** A pointer position waits at most this long for an animation frame before it is sent. */
const POINTER_FLUSH_MS = 50;

/** Whether a drawn picture is empty: a 16 x 16 reduction of it with almost no variation. */
function blank(ctx: CanvasRenderingContext2D, _width: number, _height: number): boolean {
  const n = 16;
  const small = document.createElement("canvas");
  small.width = n;
  small.height = n;
  const s = small.getContext("2d");
  if (!s) return false;
  s.drawImage(ctx.canvas, 0, 0, n, n);
  const d = s.getImageData(0, 0, n, n).data;
  let sum = 0;
  let sum2 = 0;
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i]! + d[i + 1]! + d[i + 2]!) / 3;
    sum += l;
    sum2 += l * l;
  }
  const mean = sum / (n * n);
  return sum2 / (n * n) - mean * mean < 9;
}
const VIDEO_RECHECK_MS = 1_000;
/** The extension's frames in the page: `all:initial` first, so none of the page's styles for
 *  iframes reach them. */
const FRAME_STYLE = "all:initial;position:fixed;display:block;border:0;margin:0;padding:0;background:transparent;color-scheme:normal;transform:none;filter:none;";

export interface AgentOptions {
  dev: boolean;
  /** Whether an event came from the user; replaceable for tests. Default: `event.isTrusted`. */
  isTrusted?: (event: Event) => boolean;
  /** Where the channels turned on are kept. Default: chrome.storage.local. */
  storage?: ChannelStorage;
}

export class Agent {
  private enabled = false;
  private video: HTMLVideoElement | null = null;
  private videoPickedAt = -Infinity;
  private detachVideo: (() => void) | null = null;
  private canvas: HTMLCanvasElement | null = null;
  /** Whether the current canvas was shown to be readable (checked once per canvas). */
  private canvasReadable = false;

  private compute: HTMLIFrameElement | null = null;
  private computeReady = false;
  private tooltip: HTMLIFrameElement | null = null;
  private tooltipReady = false;
  /** The tooltip's own size (tooltip.ts), before it is fitted into the page. */
  private tooltipSize: TooltipSize = { width: 320, height: 448, shape: "card" };
  /** The size it is shown at. */
  private shownSize = { width: 320, height: 448 };
  /** The viewer's card size (the popup's dial), as a factor of the tooltip's own size. */
  private cardScale = 1;
  private pendingTooltip: TooltipIn | null = null;

  private inside = false;
  private lastTrustedPointerAt = -Infinity;
  private lastTooltipAt = -Infinity;
  private pendingPointer: ComputeIn | null = null;
  private pointerFlush = 0;
  private pointerFlushTimer: ReturnType<typeof setTimeout> | undefined;
  private pointerFlushPending = false;
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
  /** The video's time while it last played; what a frozen (paused live) picture is dated. */
  private lastPlayingTime: number | null = null;
  /** The in-player button, and the channel it turns on or off. */
  private button: PlayerButton | null = null;
  private channels: ChannelMap = {};
  private channelsLoaded = false;
  /** Storage changes seen while the first read of the channels is in flight; null after it. */
  private pendingChannelChanges: Array<Record<string, { newValue?: unknown } | undefined>> | null = null;
  private channel: string | null = null;
  private channelUrl = "";
  private channelCheckedAt = -Infinity;
  private introSeen = true;

  /** `chrome-extension://<id>`: the extension's base address without its trailing slash. */
  private readonly extensionOrigin = chrome.runtime.getURL("").replace(/\/$/, "");

  constructor(private readonly options: AgentOptions) {}

  private get storage(): ChannelStorage {
    return this.options.storage ?? (chrome.storage.local as unknown as ChannelStorage);
  }

  private trusted(event: Event): boolean {
    return (this.options.isTrusted ?? ((e: Event) => e.isTrusted))(event);
  }

  start(): void {
    // Changes that arrive while the first read is in flight are applied on top of it, so an
    // older read never undoes a newer change.
    this.pendingChannelChanges = [];
    void readChannels(this.storage).then((map) => {
      let channels = map;
      for (const changes of this.pendingChannelChanges ?? []) channels = applyChannelChanges(channels, changes);
      this.pendingChannelChanges = null;
      this.channels = channels;
      this.channelsLoaded = true;
      this.applyChannel();
    });
    void this.storage.get(BUTTON_INTRO_KEY).then((v) => {
      this.introSeen = v[BUTTON_INTRO_KEY] === true;
    });
    document.addEventListener("pointermove", this.onPointer, { capture: true, passive: true });
    document.addEventListener("pointerdown", this.onPointer, { capture: true, passive: true });
    document.documentElement.addEventListener("pointerleave", this.onWindowLeave, { passive: true });
    window.addEventListener("message", this.onMessage);
    document.addEventListener("fullscreenchange", this.onFullscreen);
    document.addEventListener("visibilitychange", this.onVisibility);
    // In-app navigation (YouTube's own event; back/forward); Twitch's route changes are caught
    // by the address check on presented frames and pointer moves.
    window.addEventListener("yt-navigate-finish", this.onNavigate);
    window.addEventListener("popstate", this.onNavigate);
    // The page moving under a held card: the tooltip and the outline follow it.
    window.addEventListener("resize", this.onLayout, { passive: true });
    document.addEventListener("scroll", this.onScroll, { capture: true, passive: true });
  }

  private readonly onNavigate = (): void => {
    this.refreshChannel(true);
  };

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
    if ((this.displayedCardId === null && !this.button?.shown) || this.relayoutPending) return;
    this.relayoutPending = true;
    requestAnimationFrame(() => {
      this.relayoutPending = false;
      const video = this.video;
      if (!video) return;
      // The in-player button follows the player too (it is placed on pointer moves otherwise).
      if (this.button?.shown) this.button.show(video.getBoundingClientRect(), this.pictureOf(video).top);
      const card = this.displayedCard;
      if (this.displayedCardId === null || !card) return;
      this.showTooltip(card, video);
    });
  };

  /** The tab went to the background: the pointer is gone, so analysis stops. */
  private readonly onVisibility = (): void => {
    if (document.visibilityState === "hidden" && this.inside) this.leave();
  };

  /** Stop listening and remove everything the agent added to the page. */
  stop(): void {
    document.removeEventListener("pointermove", this.onPointer, { capture: true });
    document.removeEventListener("pointerdown", this.onPointer, { capture: true });
    document.documentElement.removeEventListener("pointerleave", this.onWindowLeave);
    window.removeEventListener("message", this.onMessage);
    document.removeEventListener("fullscreenchange", this.onFullscreen);
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("yt-navigate-finish", this.onNavigate);
    window.removeEventListener("popstate", this.onNavigate);
    window.removeEventListener("resize", this.onLayout);
    document.removeEventListener("scroll", this.onScroll, { capture: true });
    this.enabled = false;
    this.teardown();
  }

  /** Channels were turned on or off (here or in another tab): chrome.storage.onChanged. */
  onStorageChanged(changes: Record<string, { newValue?: unknown } | undefined>): void {
    this.pendingChannelChanges?.push(changes);
    const next = applyChannelChanges(this.channels, changes);
    if (next === this.channels) return;
    this.channels = next;
    this.applyChannel();
  }

  /** Whether card hovers are on for the page's channel. */
  get channelIsOn(): boolean {
    return this.channelsLoaded && channelOn(this.channels, this.channel);
  }

  private applyChannel(): void {
    const on = this.channelIsOn;
    this.button?.setOn(on);
    if (!on) this.teardownFrames();
  }

  /** Look the page's channel up again: at once when the address changed or `force`, else at
   *  most once a CHANNEL_RECHECK_MS. */
  private refreshChannel(force = false): void {
    const now = performance.now();
    const href = location.href;
    if (!force && href === this.channelUrl && now - this.channelCheckedAt < CHANNEL_RECHECK_MS) return;
    this.channelUrl = href;
    this.channelCheckedAt = now;
    const url = new URL(href);
    const key = channelKey(url, ownerHrefOf(document, url));
    if (key !== this.channel) {
      this.channel = key;
      this.applyChannel();
    }
  }

  private toggleChannel(): void {
    // The channel of the video on screen now, not the one last looked up.
    this.refreshChannel(true);
    const key = this.channel;
    if (key === null) return;
    const on = !this.channelIsOn;
    // At once on screen; storage follows (and tells the other tabs).
    if (on) this.channels = { ...this.channels, [key]: Date.now() };
    else {
      const { [key]: _gone, ...rest } = this.channels;
      this.channels = rest;
    }
    this.applyChannel();
    void setChannel(this.storage, key, on).catch(() => undefined);
  }

  private ensureButton(): PlayerButton {
    if (!this.button) {
      this.button = new PlayerButton({
        onToggle: () => this.toggleChannel(),
        introSeen: () => this.introSeen,
        markIntroSeen: () => {
          this.introSeen = true;
          void this.storage.set({ [BUTTON_INTRO_KEY]: true }).catch(() => undefined);
        },
        isTrusted: (e) => this.trusted(e),
      });
      this.button.setOn(this.channelIsOn);
    }
    if (!this.button.host.isConnected) this.mountHost().appendChild(this.button.host);
    return this.button;
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
  private readonly onPointer = (event: PointerEvent): void => {
    // Only the user's own pointer counts: events a page script makes are ignored.
    if (!this.trusted(event)) return;
    const path = event.composedPath();
    // On the in-player button: it stays; this is not a pointer over the picture either.
    if (this.button && path.includes(this.button.host)) return;
    if (!this.enabled || !isActivePage(new URL(location.href), this.options.dev)) {
      if (this.inside) this.leave();
      this.button?.hide();
      return;
    }
    const video = this.currentVideo();
    if (!video) {
      if (this.inside) this.leave();
      this.button?.hide();
      return;
    }
    // The button shows while the pointer is over the player at all.
    this.refreshChannel();
    const box = video.getBoundingClientRect();
    if (this.channel !== null && fractionIn(box, event.clientX, event.clientY)) this.ensureButton().show(box, this.pictureOf(video).top);
    else this.button?.hide();
    // Dormant until card hovers are on for this channel: no frame, no model, no download.
    if (!this.channelIsOn) {
      if (this.inside) this.leave();
      return;
    }
    const at = fractionIn(this.pictureOf(video), event.clientX, event.clientY);
    if (!at) {
      if (this.inside) this.leave();
      return;
    }
    this.inside = true;
    this.lastTrustedPointerAt = performance.now();
    this.ensureFrames();
    this.pendingPointer = { kind: "pointer", x: at.x, y: at.y, mediaTime: this.mediaTimeOf(video), touch: event.pointerType === "touch" };
    // One message per frame at most; a timer backs up the animation frame, which a browser may
    // hold back (a window it thinks is hidden), so that a pointer position is never left unsent.
    if (!this.pointerFlushPending) {
      this.pointerFlushPending = true;
      const flush = (): void => {
        if (!this.pointerFlushPending) return;
        this.pointerFlushPending = false;
        cancelAnimationFrame(this.pointerFlush);
        clearTimeout(this.pointerFlushTimer);
        if (this.pendingPointer) this.toCompute(this.pendingPointer);
        this.pendingPointer = null;
      };
      this.pointerFlush = requestAnimationFrame(flush);
      this.pointerFlushTimer = setTimeout(flush, POINTER_FLUSH_MS);
    }
  };

  private readonly onWindowLeave = (): void => {
    if (this.inside) this.leave();
    // The pointer left the window: the in-player button goes too.
    this.button?.hide();
  };

  private leave(): void {
    this.inside = false;
    this.pendingPointer = null;
    this.toCompute({ kind: "leave" });
  }

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
    if (best !== this.video) this.attachVideo(best);
    return best;
  }

  /** A paused live stream whose <video> was reset (no current frame) while its last frame stays
   *  on screen. */
  private frozen(video: HTMLVideoElement): boolean {
    return video.paused && video.readyState < 2 && video.videoWidth > 0;
  }

  /** The time of the picture on screen: for a frozen video, its time when it last played. */
  private mediaTimeOf(video: HTMLVideoElement): number {
    return this.frozen(video) && this.lastPlayingTime !== null ? this.lastPlayingTime : video.currentTime;
  }

  private pictureOf(video: HTMLVideoElement): Rect {
    return pictureRect(video.getBoundingClientRect(), { width: video.videoWidth, height: video.videoHeight }, getComputedStyle(video).objectFit);
  }

  private attachVideo(video: HTMLVideoElement | null): void {
    this.detachVideo?.();
    this.detachVideo = null;
    this.video = video;
    this.lastPlayingTime = null;
    // A canvas that once read a picture it may not read stays unreadable: a new one per video.
    this.canvas = null;
    this.toCompute({ kind: "discontinuity", newSource: true });
    if (!video) return;
    const seeking = (): void => this.toCompute({ kind: "discontinuity", newSource: false });
    // A video that becomes ready re-arms analysis (a paused one presents no other frame).
    const ready = (): void => this.toCompute({ kind: "presented", mediaTime: this.mediaTimeOf(video) });
    video.addEventListener("canplay", ready);
    video.addEventListener("playing", ready);
    const newSource = (): void => {
      this.canvas = null;
      this.refreshChannel(true);
      // Another source: the time it last played is not this picture's.
      this.lastPlayingTime = null;
      this.toCompute({ kind: "discontinuity", newSource: true });
    };
    const presented = (): void => {
      if (location.href !== this.channelUrl) this.refreshChannel(true);
      if (!video.paused && video.readyState >= 2) this.lastPlayingTime = video.currentTime;
      this.toCompute({ kind: "presented", mediaTime: this.mediaTimeOf(video) });
    };
    video.addEventListener("seeking", seeking);
    video.addEventListener("emptied", newSource);
    video.addEventListener("loadeddata", newSource);
    video.addEventListener("timeupdate", presented);
    video.addEventListener("seeked", presented);
    // The player resized (theater mode, the site's own layout): see onLayout.
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(() => this.onLayout()) : null;
    observer?.observe(video);
    this.detachVideo = () => {
      observer?.disconnect();
      video.removeEventListener("seeking", seeking);
      video.removeEventListener("emptied", newSource);
      video.removeEventListener("loadeddata", newSource);
      video.removeEventListener("timeupdate", presented);
      video.removeEventListener("seeked", presented);
      video.removeEventListener("canplay", ready);
      video.removeEventListener("playing", ready);
    };
  }

  /** Draw the current picture at analysis size and transfer it to the compute frame. */
  private async capture(requestId: number, range: { min: number; max: number }): Promise<void> {
    const video = this.video;
    // `retry`: the picture itself could not be had (not ready yet, or blank): worth asking again.
    const fail = (reason: string, retry = false): void => this.toCompute({ kind: "capture-failed", requestId, reason, retry });
    // In-app navigation with a resting pointer: the channel may have changed under it.
    if (location.href !== this.channelUrl) this.refreshChannel(true);
    if (!this.channelIsOn) {
      fail("card hovers are off for this channel");
      this.teardownFrames();
      return;
    }
    const gate = {
      inside: this.inside,
      lastTrustedPointerAt: this.lastTrustedPointerAt,
      tooltipShowing: this.displayedCardId !== null,
      lastTooltipAt: this.lastTooltipAt,
    };
    if (!captureAllowed(gate, performance.now())) {
      fail("no pointer over the player");
      return;
    }
    if (!video || !video.isConnected || video.videoWidth === 0) {
      fail("no picture", true);
      return;
    }
    const frozen = this.frozen(video);
    if (video.readyState < 2 && !frozen) {
      fail("no picture", true);
      return;
    }
    const size = analysisSize(video.videoWidth, video.videoHeight, range);
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvasReadable = false;
    }
    const canvas = this.canvas;
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      fail("no 2d context");
      return;
    }
    const mediaTime = this.mediaTimeOf(video);
    try {
      ctx.drawImage(video, 0, 0, size.width, size.height);
      // A frozen video may draw nothing (black or one colour): then there is no picture.
      if (frozen && blank(ctx, size.width, size.height)) {
        this.canvasReadable = true;
        fail("no picture (the paused video draws nothing)", true);
        return;
      }
      // Throws when the picture may not be read (a video from another origin): say so rather
      // than send a picture the worker cannot read. Once per canvas: a read-back is not free.
      if (!this.canvasReadable) {
        ctx.getImageData(0, 0, 1, 1);
        this.canvasReadable = true;
      }
      const bitmap = await createImageBitmap(canvas);
      if (!this.compute?.contentWindow) {
        bitmap.close();
        return;
      }
      this.compute.contentWindow.postMessage(tag({ kind: "frame", requestId, bitmap, mediaTime }), this.extensionOrigin, [bitmap]);
    } catch (error) {
      fail(error instanceof DOMException && error.name === "SecurityError" ? "the video may not be read" : String(error));
    }
  }

  // ------------------------------------------------------------------ the frames
  private ensureFrames(): void {
    // A frame the page removed is made again.
    if (this.compute && !this.compute.isConnected) {
      this.compute = null;
      this.computeReady = false;
    }
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
      // not rendered.
      frame.style.cssText = `${FRAME_STYLE}width:1px;height:1px;left:-10px;top:-10px;opacity:0;pointer-events:none;`;
      frame.src = chrome.runtime.getURL("compute.html");
      this.computeReady = false;
      document.documentElement.appendChild(frame);
      this.compute = frame;
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
    // The button moves to where it will be drawn (a plain element: moving it costs nothing).
    if (this.button?.host.isConnected) this.mountHost().appendChild(this.button.host);
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

  private toCompute(message: ComputeIn): void {
    if (!this.compute?.contentWindow || !this.computeReady) return;
    this.compute.contentWindow.postMessage(tag(message), this.extensionOrigin);
  }

  private toTooltip(message: TooltipIn): void {
    if (!this.tooltip?.contentWindow || !this.tooltipReady) {
      this.pendingTooltip = message;
      return;
    }
    this.tooltip.contentWindow.postMessage(tag(message), this.extensionOrigin);
  }

  private readonly onMessage = (event: MessageEvent): void => {
    if (event.origin !== this.extensionOrigin) return;
    if (this.compute && event.source === this.compute.contentWindow) {
      const message = parseComputeOut(event.data);
      if (!message) return;
      switch (message.kind) {
        case "ready":
          this.computeReady = true;
          if (this.video) this.toCompute({ kind: "presented", mediaTime: this.mediaTimeOf(this.video) });
          break;
        case "status":
          if (message.state === "failed" && message.error !== this.loadError) {
            this.loadError = message.error;
            // The page's own console only; nothing is reported anywhere.
            console.warn(`${CONFIG.name}: the card recognition model did not load (${message.error ?? "unknown reason"}).`);
          }
          break;
        case "capture":
          void this.capture(message.requestId, message.analysisWidth);
          break;
        case "shown":
          this.shown = message.card;
          this.updateTooltip();
          break;
      }
      return;
    }
    if (this.tooltip && event.source === this.tooltip.contentWindow) {
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
    }
  };

  // ------------------------------------------------------------------ the tooltip
  private updateTooltip(): void {
    const card = this.shown;
    if (card && this.video && this.inside) {
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.hideTimer = null;
      this.showTooltip(card, this.video);
      return;
    }
    if (this.displayedCardId === null || this.hideTimer) return;
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      if (this.shown && this.inside) return;
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
      this.toTooltip({ kind: "card", cardId: card.cardId, name: card.name, seq: this.cardSeq });
    }
    // Shown once the tooltip has sized itself for this card; the outline comes with it.
    const ready = this.sizedCardId === card.cardId;
    frame.style.visibility = ready ? "visible" : "hidden";
    if (this.outline && !this.outline.element.isConnected) {
      this.outline = new CardOutline(this.tooltip!.parentElement ?? this.mountHost());
    }
    // The same box, on the same picture; nothing when the picture's size is not known.
    this.outline?.show(ready ? outlineRect(picture, card.box, video.videoWidth > 0 && video.videoHeight > 0) : null);
    this.lastTooltipAt = performance.now();
  }

  private hideTooltip(): void {
    if (this.displayedCardId !== null) this.lastTooltipAt = performance.now();
    if (this.tooltip) this.tooltip.style.visibility = "hidden";
    if (this.displayedCardId !== null) this.toTooltip({ kind: "clear" });
    this.displayedCardId = null;
    this.sizedCardId = null;
    this.placedFor = null;
    this.outline?.hide();
  }

  /** Remove everything but the button and the video it follows (a channel turned off). */
  private teardownFrames(): void {
    if (this.inside) this.leave();
    this.inside = false;
    this.lastTooltipAt = -Infinity;
    this.shown = null;
    this.displayedCardId = null;
    this.sizedCardId = null;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
    this.compute?.remove();
    this.compute = null;
    this.computeReady = false;
    this.tooltip?.remove();
    this.tooltip = null;
    this.tooltipReady = false;
    this.pendingTooltip = null;
    this.outline?.remove();
    this.outline = null;
  }

  private teardown(): void {
    this.button?.remove();
    this.button = null;
    this.inside = false;
    this.lastTrustedPointerAt = -Infinity;
    this.lastTooltipAt = -Infinity;
    this.shown = null;
    this.displayedCardId = null;
    this.sizedCardId = null;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
    this.compute?.remove();
    this.compute = null;
    this.computeReady = false;
    this.tooltip?.remove();
    this.tooltip = null;
    this.tooltipReady = false;
    this.pendingTooltip = null;
    this.outline?.remove();
    this.outline = null;
    this.detachVideo?.();
    this.detachVideo = null;
    this.video = null;
    this.canvas = null;
  }
}
