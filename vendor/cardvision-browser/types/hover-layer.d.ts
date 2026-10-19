import { type AABB, type Rect } from "./boxes.js";
import { type LayerCard, type StageSize } from "./hover-geometry.js";
import type { ScoredFrame, ScoredProposal } from "./recognition.js";
import { type SceneContext } from "./scene.js";
export type HoverSelection = "accepted-nms" | "best-score" | "detector-score";
export declare const HOVER_SELECTIONS: readonly HoverSelection[];
export declare function isHoverSelection(v: unknown): v is HoverSelection;
/** The selection a release is built with unless it names another. */
export declare const DEFAULT_HOVER_SELECTION: HoverSelection;
/** A hover-layer card keeps its id from one frame to the next when a card of the same identity
 *  overlaps its previous box by at least this much. */
export declare const HOVER_ID_IOU = 0.5;
/** Prefix of hover-layer ids. Track ids use another, so the two never collide. */
export declare const HOVER_ID_PREFIX = "hover_";
/** One box of the hover layer before it becomes a layer card. */
export interface HoverEntry {
    /** Index of the proposal in `ScoredFrame.proposals`. */
    proposal: number;
    aabb: AABB;
    rect: Rect;
    /** The card id to show, or null: the box takes part and shows nothing. */
    identity: string | null;
    /** The proposal's score. */
    score: number;
    /** Stack rank, 1 at the bottom. The winner under a pointer is the highest rank containing it. */
    zIndex: number;
}
type HoverFrame = Pick<ScoredFrame, "kept"> & {
    proposals: ReadonlyArray<Pick<ScoredProposal, "aabb" | "rect" | "score" | "detectorScore" | "accepted" | "displayId">>;
};
/**
 * The selection's members as indices into `frame.proposals`, bottom of the stack first (entry
 * k of `selectHoverLayer` has stack rank k + 1).
 */
export declare function hoverOrder(frame: HoverFrame, selection: HoverSelection): number[];
/** The hover layer of one frame's proposals, in stacking order (bottom first). */
export declare function selectHoverLayer(frame: HoverFrame, selection?: HoverSelection): HoverEntry[];
/**
 * Ids for hover-layer cards that stay the same from one frame to the next, so that whatever
 * draws a tooltip need not rebuild it on every analysis: an entry takes the id of the previous
 * frame's entry with the same identity (null matches null) and the highest overlap of at least
 * `HOVER_ID_IOU`; otherwise it gets a new id. Ids keep counting across `reset`.
 */
export declare class HoverIdAssigner {
    private prev;
    private nextId;
    reset(): void;
    assign(entries: readonly HoverEntry[]): string[];
}
/**
 * Hover entries as layer cards, each carrying its stack rank and the position of its box.
 * `boxIndexOf` turns a proposal's index into the position of its box in the list the caller
 * reports; without it the proposal's index is used.
 */
export declare function hoverEntriesToCards(entries: readonly HoverEntry[], ids: readonly string[], ctx: SceneContext, boxIndexOf?: (proposal: number) => number): LayerCard[];
/** What a pointer resolves to. */
export interface HoverOutcome {
    /** The card the pointer is on, or null when it is on none. */
    card: LayerCard | null;
    /** The position of that card's box in the frame's list of boxes. */
    boxIndex: number | null;
    /** That card's box in pixels of the analyzed frame. */
    box: AABB | null;
    /** The card id shown, or null when nothing is shown (no card, or one that is not accepted). */
    cardId: string | null;
    /** The name shown. */
    name: string | null;
}
export declare const NOTHING_HIT: HoverOutcome;
/**
 * Resolve a pointer against a hover layer. `cards` are the layer's cards (each with its stack
 * rank), `point` is in pixels of a stage of size `stage` that the frame fills exactly.
 */
export declare function resolveHover(cards: readonly LayerCard[], point: {
    x: number;
    y: number;
}, stage: StageSize): HoverOutcome;
export {};
