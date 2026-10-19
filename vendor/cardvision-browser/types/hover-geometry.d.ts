/** A box as fractions of the frame: 0 is the left or top edge, 1 the right or bottom edge. */
export interface NormalizedBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
/**
 * One card of a layer, in fractions of the frame.
 *
 * `bounds` is the card's axis-aligned box. `localWidth` and `localHeight` are the card's own
 * size before any turn, and `rotation` its tilt in degrees, in (-45, 45]. The detector's boxes
 * are axis-aligned, so for them the tilt is 0 and the local size equals the box's size.
 * `cardId` and `name` are set only for a card that is named; a card that was detected and not
 * named carries neither, so nothing can be shown for it by mistake.
 */
export interface LayerCard {
    instanceId: string;
    bounds: NormalizedBounds;
    rotation: number;
    localWidth: number;
    localHeight: number;
    /** Wider than tall. */
    landscape: boolean;
    cardId: string | null;
    name: string | null;
    /** Stack rank: among cards under a pointer the highest wins. */
    zIndex?: number;
    /** For a hover-layer card: the position of its box in the frame's list of boxes. */
    boxIndex?: number;
}
export interface Point {
    x: number;
    y: number;
}
/** Four corners in pixels: top-left, top-right, bottom-right, bottom-left of the card before
 *  its turn, each turned about the card's center. The winding is always the same. */
export interface CardQuad {
    points: [Point, Point, Point, Point];
}
export interface StageSize {
    width: number;
    height: number;
}
export interface NormalizedBox {
    left: number;
    top: number;
    width: number;
    height: number;
}
/**
 * The card's own box before its turn, in fractions of the frame: the center of `bounds` with
 * the card's local size. The axis-aligned box of a turned card is larger than the card, but
 * its center is still the card's center.
 */
export declare function computeHitboxBox(card: Pick<LayerCard, "bounds" | "localWidth" | "localHeight">): NormalizedBox;
/**
 * The card's outline as four corners in pixels of a stage of the given size. The turn is
 * applied in pixels, not in fractions: a stage is not square, so a turn in fractions would
 * skew the angle. Positive degrees turn clockwise on screen (y grows downward).
 */
export declare function computeCardQuad(card: Pick<LayerCard, "bounds" | "localWidth" | "localHeight" | "rotation">, stageSize: StageSize): CardQuad;
/**
 * Whether a point is inside a convex outline: on the same side of every edge, whichever way
 * the outline winds. A point exactly on an edge is inside.
 */
export declare function pointInConvexQuad(point: Point, quad: CardQuad): boolean;
export interface HoverCandidate<C = LayerCard> {
    card: C;
    quad: CardQuad;
    zIndex: number;
}
/**
 * The card a pointer is on: among the candidates whose outline contains the point, the one
 * with the highest `zIndex`; on equal `zIndex`, the one later in the list. Null when no outline
 * contains the point.
 */
export declare function resolveHoveredCard<C>(point: Point, candidates: ReadonlyArray<HoverCandidate<C>>): C | null;
