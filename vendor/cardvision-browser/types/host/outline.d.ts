import type { ClientBox } from "../capture.js";
import type { FractionBox } from "../compute-messages.js";
import type { ProductConfig } from "./config.js";
/** Smallest outline drawn, in CSS pixels on either side. */
export declare const MIN_OUTLINE_SIDE = 4;
/** The fade-in when the outline appears (none for viewers who ask for reduced motion). */
export declare const OUTLINE_FADE_MS = 100;
/** The edge's width, in CSS pixels; the outline is drawn this far outside the box. */
export declare const OUTLINE_WIDTH = 2;
/**
 * Where the outline goes: the box (fractions of the picture) on the picture's rectangle on
 * screen, or null when the picture's geometry is unknown or the box lies off the picture.
 * A box reaching a little past an edge is clipped to the picture (S-F1).
 */
export declare function outlineRect(picture: ClientBox, box: FractionBox, pictureKnown?: boolean): ClientBox | null;
/** Where the outline goes and its turn in degrees (0 upright, positive clockwise). The element
 *  takes the rectangle, then `rotate()` about its center. */
export interface OutlinePlace extends ClientBox {
    rotation: number;
}
/** A shown card as the outline needs it: its box, its turned outline when it has one, and
 *  whether the card is held (S-F4). */
export interface OutlinedCard {
    box: FractionBox;
    rotation?: number;
    localWidth?: number;
    localHeight?: number;
    held?: true;
}
/**
 * Where the outline of a shown card goes. A turned card (`rotatedOutlines`) gets the outline the
 * compute frame's hit test uses: its own sides (`localWidth` of the picture's width, `localHeight`
 * of its height) about the center of the box, turned by `rotation` degrees in pixels, as
 * `computeCardQuad` draws it. There is no upright fallback for a turned outline that reaches past
 * the picture: the toolkit cuts a card's box to the frame before it works out the turn, so the
 * turned outline fits inside the picture (S-F3). That holds by construction only while the picture
 * keeps the frame's aspect (one uniform scale); a stretched `object-fit: fill` picture is outside
 * it. An upright card, an out-of-range turn, a
 * malformed outline or a side under 4 px gets the box, as `outlineRect` places it. Null when the
 * box itself draws nothing, and for a held card, which keeps its tooltip and loses its outline
 * (S-F4).
 */
export declare function outlinePlace(picture: ClientBox, card: OutlinedCard, pictureKnown?: boolean): OutlinePlace | null;
/**
 * The outline's edge: a solid edge fading into a glow, with a faint light hairline inside the
 * edge so a dark edge still reads on a dark board. Drawn OUTLINE_WIDTH outside the card's box.
 */
export declare function outlineEdgeStyle(edge: string, glow: string): Partial<CSSStyleDeclaration>;
export interface OutlineEnvironment {
    /** Whether the viewer asked for reduced motion (no fade). */
    reducedMotion?: () => boolean;
}
/** The outline element: one per tooltip, in the same place in the page (`host`). */
export declare class CardOutline {
    private readonly config;
    private readonly env;
    /** The element in the page (the shadow root's host). */
    readonly element: HTMLDivElement;
    private readonly edge;
    private visible;
    constructor(host: Element, config: Pick<ProductConfig, "tag" | "outline">, env?: OutlineEnvironment);
    get shown(): boolean;
    /** Draw it around `rect` (page coordinates), turned by its `rotation` degrees about its center
     *  when it has one, or hide it when `rect` is null. */
    show(rect: (ClientBox & {
        rotation?: number;
    }) | null): void;
    hide(): void;
    remove(): void;
}
