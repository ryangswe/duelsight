import type { FrameAnalysis } from "./pipeline.js";
import type { LayerCard } from "./hover-geometry.js";
import { type HoverOutcome, type HoverSelection } from "./hover-layer.js";
/**
 * The hover layer of an analyzed frame under any of the three selections, rebuilt from the
 * frame's boxes. Under the selection the frame was analyzed with, it stacks exactly as
 * `analysis.hover.cards` does; the cards' ids are positions in the stack, not the stable ids
 * of `analysis.hover.cards`.
 */
export declare function hoverCardsOf(analysis: FrameAnalysis, selection?: HoverSelection): LayerCard[];
/**
 * What a pointer at `(x, y)`, in pixels of the analyzed frame, would show for an analyzed
 * frame: the card it is on, and that card's id and name if its look was accepted. `selection`
 * defaults to the one the frame was analyzed with.
 */
export declare function hoverAt(analysis: FrameAnalysis, x: number, y: number, selection?: HoverSelection): HoverOutcome;
