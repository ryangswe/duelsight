// SPDX-License-Identifier: Apache-2.0
// The details panel's layout, shared by the content script (which sizes the tooltip frame) and
// the tooltip frame (which lays itself out in the size it is given).
//
// A tooltip with details is the card's picture and a text panel, in one of two arrangements:
//   - side by side: the picture as tall as the frame, the panel filling the rest of its width;
//   - stacked: the picture as wide as the frame, the panel filling the rest of its height.
// The frame tells them apart from its own size and the picture's shape alone: wider than the
// picture's shape is side by side, taller is stacked, the same shape is the picture alone. So no
// message is needed for the layout, and the frame follows every resize at once.
//
// The text is never scaled: its font size is fixed, and a panel too small for all of it ends in an
// ellipsis (the frame clamps it). The panel's width is chosen by the content script from the
// heights the frame measured for its text at a few widths (`PanelHeights`).

/** The panel widths the frame measures its text at, and the content script chooses from. */
export const PANEL_WIDTHS: readonly number[] = [220, 260, 300, 340, 380, 420, 480, 540];
/** A panel narrower than this is used only when no wider one fits. */
export const PANEL_PREFERRED_WIDTH = 260;
/** The narrowest panel (side by side), and the narrowest stacked frame. */
export const PANEL_MIN_WIDTH = PANEL_WIDTHS[0]!;
/** The least height a panel is given: its heading and a few lines. */
export const PANEL_MIN_HEIGHT = 120;
/** With details, the picture may be made this narrow to leave the text room. */
export const DETAILS_MIN_ART_WIDTH = 160;
/** How far (px) a frame may be off the picture's shape and still count as the picture alone
 *  (sizes are rounded to whole pixels on both sides). */
const SHAPE_SLACK = 4;

/** Measured heights of the panel's whole content: [width, height] pairs, widths ascending. */
export type PanelHeights = ReadonlyArray<readonly [number, number]>;

/** The panel's height for all its text at `width`, from the measured heights, never less than
 *  the real one: between two measured widths, the narrower one's (a wider panel is never taller);
 *  wider than all, the widest one's; narrower than all, the narrowest one's scaled up (text keeps
 *  its area). Infinity when nothing was measured. */
export function panelHeightAt(heights: PanelHeights, width: number): number {
  if (heights.length === 0 || !(width > 0)) return Number.POSITIVE_INFINITY;
  const sorted = [...heights].sort((a, b) => a[0] - b[0]);
  const below = sorted.filter(([w]) => w <= width).at(-1);
  if (below) return below[1];
  const [w0, h0] = sorted[0]!;
  return Math.ceil((h0 * w0) / width);
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Arrangement {
  kind: "art" | "side" | "stacked";
  art: Box;
  /** Null for the picture alone. */
  panel: Box | null;
}

/**
 * How a frame of `frame` size lays out a picture of shape `art` (any size of that shape) with a
 * panel: side by side when the frame is wider than the picture's shape leaves room for a panel,
 * stacked when it is taller, the picture alone otherwise.
 */
export function arrange(frame: { width: number; height: number }, art: { width: number; height: number }): Arrangement {
  const W = Math.max(0, Math.floor(frame.width));
  const H = Math.max(0, Math.floor(frame.height));
  const whole: Arrangement = { kind: "art", art: { left: 0, top: 0, width: W, height: H }, panel: null };
  if (!(W > 0 && H > 0 && art.width > 0 && art.height > 0)) return whole;
  const sideArtWidth = Math.round((H * art.width) / art.height);
  if (W - sideArtWidth > SHAPE_SLACK && W - sideArtWidth >= PANEL_MIN_WIDTH / 2) {
    return { kind: "side", art: { left: 0, top: 0, width: sideArtWidth, height: H }, panel: { left: sideArtWidth, top: 0, width: W - sideArtWidth, height: H } };
  }
  const stackedArtHeight = Math.round((W * art.height) / art.width);
  if (H - stackedArtHeight > SHAPE_SLACK && H - stackedArtHeight >= PANEL_MIN_HEIGHT / 2) {
    return { kind: "stacked", art: { left: 0, top: 0, width: W, height: stackedArtHeight }, panel: { left: 0, top: stackedArtHeight, width: W, height: H - stackedArtHeight } };
  }
  return whole;
}
