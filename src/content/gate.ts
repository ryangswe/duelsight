// SPDX-License-Identifier: Apache-2.0
// When the content script hands a picture to the compute frame.
//
// The page can post messages to the compute frame (it is a frame of the page), and so could
// make it ask for pictures. The content script therefore answers a request only when the
// viewer is really pointing at the player: the pointer is over the picture, a pointer event the
// browser marks as trusted (from the user, not a script) happened within the runtime's active
// window, or a card is showing under a resting pointer (the runtime's "reading" state).

import { POINTER_GRACE_MS, READING_LINGER_MS } from "../constants.js";

export interface GateState {
  /** The pointer is over the picture (from trusted events only). */
  inside: boolean;
  /** The last trusted pointer event over the picture; -Infinity for none. */
  lastTrustedPointerAt: number;
  /** A tooltip is showing now. */
  tooltipShowing: boolean;
  /** The last time a tooltip was showing; -Infinity for never. */
  lastTooltipAt: number;
}

export function captureAllowed(state: GateState, now: number): boolean {
  if (!state.inside || !Number.isFinite(state.lastTrustedPointerAt)) return false;
  if (now - state.lastTrustedPointerAt < POINTER_GRACE_MS) return true;
  return state.tooltipShowing || now - state.lastTooltipAt < READING_LINGER_MS;
}
