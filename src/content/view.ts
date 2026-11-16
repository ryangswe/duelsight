// SPDX-License-Identifier: Apache-2.0
// DuelSight's view adapter for the toolkit's shared hover host (host-content.js, experimental).
//
// The host follows the main video, makes and removes the two frames, gives pictures to the compute
// frame on the authority of the viewer's own pointer, draws the outline and decides when a card is
// shown and when it goes (index.ts starts it). What stays DuelSight's own is here: the tooltip
// frame's size and place beside the card the compute frame names.
//   - Its own size comes from the tooltip frame (the card's picture, a name pill, or the picture
//     with its details panel), scaled to the viewer's card size and fitted into the page: off the
//     card and the cards around it, below the player's top, and scaled down (shape kept) when the
//     page has no room. With the details panel, the picture and its text together, the text never
//     scaled (shared/panel-layout.ts).
//   - It does not breathe: a size within a few pixels of the shown one keeps the shown one while it
//     still fits; and it stays where it is unless another place covers clearly less, moving with
//     the card when the page moves.
//   - It tells the tooltip frame which card to show, once the frame has said it is ready, and is
//     shown only once the frame has measured itself for that card (`show` returns true), so it
//     never shows a previous card or the wrong shape. Sizes for another card, or from an earlier
//     showing of the same card, are stale.

import type { ShownCard, ViewAdapter, ViewFrame, ViewLayout } from "../../vendor/cardvision-browser/host-content.js";
import { parseTooltipOut, tag, type TooltipIn, type TooltipSize } from "../shared/messages.js";
import { arrange } from "../shared/panel-layout.js";
import { availableSpace, CARD_CORNER, fitBesideCard, fitsBesideCard, fitTooltipSize, fitWithPanel, placeTooltipAvoiding, type Rect, scaleTooltipSize, tooltipRadius } from "./geometry.js";

/** A new fitted size closer than this to the shown one keeps the shown one (no breathing). */
const SIZE_HYSTERESIS_PX = 8;
/** The tooltip frame's size before it has measured itself for a card. */
const START_SIZE: TooltipSize = { width: 320, height: 448, shape: "card" };

/** The frame's look: its title (for assistive tools) and its shadow. */
export const TOOLTIP_LOOK = { title: "Card", shadow: "0 10px 30px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.35)" } as const;

export interface TooltipView extends ViewAdapter {
  /** The popup's card size (a percentage, already clamped). True when it changed: the host then
   *  places the shown card again (`relayout`). */
  setCardSize(percent: number): boolean;
}

function sameSize(a: { width: number; height: number }, b: { width: number; height: number }): boolean {
  return a.width === b.width && a.height === b.height;
}

export function createTooltipView(): TooltipView {
  let frame: ViewFrame | null = null;
  let ready = false;
  /** One message waits for the frame to say it is ready (the latest replaces an earlier one). */
  let pending: TooltipIn | null = null;
  /** The tooltip's own size (tooltip.ts), before it is fitted into the page. */
  let tooltipSize: TooltipSize = START_SIZE;
  /** The size and layout it is shown at, and the box last placed. */
  let shownSize = { width: START_SIZE.width, height: START_SIZE.height };
  let shownLayout: "card" | "pill" | "details" | null = null;
  let placed: { left: number; top: number } | null = null;
  /** The viewer's card size, as a factor of the tooltip's own size. */
  let cardScale = 1;
  let displayedCardId: string | null = null;
  /** The card whose own size the tooltip has sent: the frame is shown only for that card. */
  let sizedCardId: string | null = null;
  /** Numbers each card message sent to the tooltip; its sizes echo it (stale ones are ignored). */
  let cardSeq = 0;
  /** Where the displayed card was last placed against, so the tooltip moves with it. */
  let placedFor: { cardId: string; rect: Rect } | null = null;

  function post(message: TooltipIn): void {
    if (!frame || !ready || !frame.post(tag(message))) pending = message;
  }

  /** A new frame, or none: everything known about the last one goes. */
  function forget(): void {
    ready = false;
    pending = null;
    shownSize = { width: START_SIZE.width, height: START_SIZE.height };
    shownLayout = null;
    placed = null;
    displayedCardId = null;
    sizedCardId = null;
    placedFor = null;
  }

  return {
    look: TOOLTIP_LOOK,

    attach(next) {
      forget();
      frame = next;
      // The host sets no size of its own: the frame starts at the tooltip's first size, off the
      // page's corner, hidden until a card is shown.
      next.place({ left: 0, top: 0, width: shownSize.width, height: shownSize.height, cornerRadius: tooltipRadius(shownSize, "card") });
    },

    detach() {
      forget();
      frame = null;
    },

    message(data) {
      const message = parseTooltipOut(data);
      if (!message) return false;
      if (message.kind === "ready") {
        ready = true;
        const queued = pending;
        pending = null;
        if (queued) post(queued);
        return false;
      }
      // A size for another card than the one shown now is stale.
      if (message.cardId !== undefined && message.cardId !== displayedCardId) return false;
      // A size from an earlier showing of the same card (hidden and shown again) is stale too.
      if (message.seq !== undefined && message.seq !== cardSeq) return false;
      tooltipSize = { width: Math.ceil(message.width), height: Math.ceil(message.height), shape: message.shape, ...(message.panel ? { panel: message.panel } : {}) };
      if (message.cardId !== undefined) sizedCardId = message.cardId;
      return true;
    },

    show(card: ShownCard, layout: ViewLayout): boolean {
      if (!frame) return false;
      const cardRect: Rect = layout.card;
      const playerTop = layout.minTop;
      const viewport = layout.viewport;
      // At the viewer's card size first; the fitting then keeps it inside and off the card.
      const requested = scaleTooltipSize(tooltipSize, cardScale);
      const fitted = fitTooltipSize(requested, viewport, playerTop);
      // A picture with no room beside the card is made smaller rather than laid over it.
      let size = tooltipSize.shape === "card" ? fitBesideCard(cardRect, fitted, viewport, playerTop) : fitted;
      // With the card's details: the picture and its text panel together (panel-layout.ts). No
      // room for a panel at all: the picture alone, as above.
      const panel = tooltipSize.shape === "card" && tooltipSize.panel ? fitWithPanel(cardRect, requested, tooltipSize.panel, viewport, playerTop) : null;
      if (panel) size = { width: panel.width, height: panel.height };
      const kind = panel ? "details" : tooltipSize.shape;
      // No breathing: a size within a few pixels of the shown one keeps the shown one while it
      // still fits: in the room, and (a picture) beside the card, as fitBesideCard would leave it.
      const room = availableSpace(viewport, playerTop);
      const shown = shownSize;
      const stillFits =
        shown.width <= room.width &&
        shown.height <= room.height &&
        (tooltipSize.shape !== "card" ||
          (panel ? fitsBesideCard(cardRect, shown, viewport, playerTop) || !fitsBesideCard(cardRect, size, viewport, playerTop) : sameSize(fitBesideCard(cardRect, shown, viewport, playerTop), shown)));
      if (shownLayout === kind && Math.abs(size.width - shown.width) < SIZE_HYSTERESIS_PX && Math.abs(size.height - shown.height) < SIZE_HYSTERESIS_PX && stillFits) {
        size = shown;
      }
      shownSize = size;
      shownLayout = kind;
      // With a panel, the picture's own corners (the frame lays itself out the same way).
      const cornerRadius = panel ? Math.round(arrange(size, requested).art.width * CARD_CORNER) : tooltipRadius(size, tooltipSize.shape);
      // Stay where it is unless another place covers clearly less (no jumping between equals).
      let current = layout.visible ? placed : null;
      // The same card moved (the page scrolled, the player resized): the tooltip moves with it.
      if (current && placedFor && placedFor.cardId === card.cardId) {
        current = { left: current.left + cardRect.left - placedFor.rect.left, top: current.top + cardRect.top - placedFor.rect.top };
      }
      const at = placeTooltipAvoiding(
        cardRect,
        size,
        viewport,
        layout.others,
        playerTop,
        current && Number.isFinite(current.left) && Number.isFinite(current.top) ? current : null,
      );
      frame.place({ left: at.left, top: at.top, width: size.width, height: size.height, cornerRadius });
      placed = { left: at.left, top: at.top };
      placedFor = { cardId: card.cardId, rect: cardRect };
      if (card.cardId !== displayedCardId) {
        displayedCardId = card.cardId;
        cardSeq += 1;
        post({ kind: "card", cardId: card.cardId, name: card.name, seq: cardSeq, ...(card.releaseId ? { releaseId: card.releaseId } : {}) });
      }
      // Shown once the tooltip has sized itself for this card; the host shows the outline with it.
      return sizedCardId === card.cardId;
    },

    hide() {
      if (displayedCardId !== null) post({ kind: "clear" });
      displayedCardId = null;
      sizedCardId = null;
      placedFor = null;
    },

    setCardSize(percent) {
      const scale = percent / 100;
      if (!(scale > 0) || scale === cardScale) return false;
      cardScale = scale;
      return true;
    },
  };
}
