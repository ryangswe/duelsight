import type { NormalizedBounds } from "./hover-geometry.js";
/** The detector is run on a frame whose width lies in this range: a narrower picture is
 *  enlarged and a wider one reduced, keeping the aspect ratio. Crops come from that frame, so
 *  a small picture analyzed at its own size would give the recognizer crops too small to
 *  compare. A release document states its own range (`runtime.analysisWidth`). */
export declare const MAX_ANALYSIS_WIDTH = 1920;
export declare const MIN_ANALYSIS_WIDTH = 720;
export interface AnalysisWidth {
    min: number;
    max: number;
}
/** The size of the analysis frame for a picture of this size. */
export declare function analysisSize(sourceWidth: number, sourceHeight: number, range?: AnalysisWidth): {
    width: number;
    height: number;
};
/** An element a session can read frames from. */
export type FrameSource = HTMLVideoElement | HTMLImageElement;
/** The picture's own size, in pixels (0 x 0 until the element has one). */
export declare function sourceSize(source: FrameSource): {
    width: number;
    height: number;
};
/** The picture's time in the video, in seconds; 0 for an image. */
export declare function sourceTimeSec(source: FrameSource): number;
export interface CapturedFrame {
    bitmap: ImageBitmap;
    /** Time of the picture when it was drawn, in seconds. */
    videoTimeSec: number;
    /** What the tap cost the main thread, in ms. */
    tapMs: number;
}
/**
 * Draw the element's current picture into `canvas` at analysis size and make a transferable
 * bitmap of it. Rejects when the picture cannot be read (an element showing a file from
 * another origin without permission); the caller treats that as a source it cannot analyze.
 */
export declare function captureFrame(source: FrameSource, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, range?: AnalysisWidth): Promise<CapturedFrame>;
/** Width of the signature thumbnail, in cells; its height follows the picture's aspect ratio. */
export declare const SIGNATURE_WIDTH = 128;
/**
 * Mean absolute brightness difference (as a fraction of full scale) over the hovered box above
 * which the picture under a showing tooltip counts as cut: the tooltip is cleared and the
 * picture looked at again. Within one shot of recorded play the difference stays well under
 * this value, slow camera motion included; across a cut, or when a hand covers the card, it is
 * above it.
 */
export declare const CUT_SIGNATURE_THRESHOLD = 0.06;
/**
 * A cut is a jump, not drift that adds up. A live sample is compared with a rolling reference:
 * whenever the box's difference from the reference is at most this fraction of
 * `CUT_SIGNATURE_THRESHOLD`, the live sample becomes the reference, so slow change (a handheld
 * camera, auto-exposure) is followed sample by sample and never adds up to a cut. Between the
 * fraction and the threshold the reference holds; above the threshold it is a cut.
 *
 * The analyzed frame's own signature seeds the reference each time a result is shown, so a cut
 * during the time the analysis took is still caught: the first live sample after a seed is
 * checked against it once. Above the threshold it is a cut; otherwise that live sample becomes
 * the reference whatever the difference.
 */
export declare const CUT_REFERENCE_ADOPT_FRACTION = 0.5;
/** The least time between two live signature samples while a tooltip shows, in ms. */
export declare const CUT_SAMPLE_MIN_INTERVAL_MS = 60;
/** What one live sample said. */
export interface CutCheck {
    /** The difference from the reference over the box; null when the two cannot be compared (no
     *  reference yet, another thumbnail size, an empty box). */
    distance: number | null;
    cut: boolean;
}
/**
 * The rolling reference for cut detection. `seed` it with the analyzed frame's signature when
 * its result is shown, `observe` each live sample over the hovered box, `reset` it when what
 * is shown is cleared. It holds no timers; the session decides when to sample and what a cut
 * does.
 */
export declare class CutReference {
    private ref;
    /** The reference is a seed that no live sample has been checked against yet. */
    private seeded;
    seed(signature: FrameSignature): void;
    reset(): void;
    get hasReference(): boolean;
    observe(live: FrameSignature, box: NormalizedBounds): CutCheck;
}
/** A brightness thumbnail of one whole picture: one byte per cell, row-major, top row first. */
export interface FrameSignature {
    width: number;
    height: number;
    luma: Uint8Array;
}
/** The thumbnail size for a picture of this size. */
export declare function signatureSize(sourceWidth: number, sourceHeight: number): {
    width: number;
    height: number;
};
/** Brightness of an RGBA buffer, one byte per pixel: (77 R + 150 G + 29 B) / 256, rounded down. */
export declare function lumaFromRgba(rgba: Uint8Array | Uint8ClampedArray, width: number, height: number): Uint8Array;
/**
 * How much the picture inside `bounds` (fractions of the frame) changed between two
 * signatures: the mean absolute brightness difference over the cells the box touches, from 0
 * to 1. Null when the two cannot be compared (different thumbnail sizes) or the box is empty.
 */
export declare function signatureDistance(ref: FrameSignature, live: FrameSignature, bounds: NormalizedBounds): number | null;
/** A signature sample that was issued and not yet read. */
export interface SignatureTicket {
    readonly id: number;
}
export interface SignatureSampler {
    /** Issue a thumbnail of the element's current picture (GPU work only). Null when the sampler
     *  cannot be used or too many samples are outstanding. */
    sample(source: FrameSource): SignatureTicket | null;
    /** The thumbnail once the GPU has finished it, else null; it never waits. A ticket is read
     *  once: a successful read releases it. */
    read(ticket: SignatureTicket): FrameSignature | null;
    /** Drop a ticket without reading it. */
    release(ticket: SignatureTicket | null): void;
    /** False once the context is lost or a sample threw: no more samples from this sampler. */
    readonly usable: boolean;
    dispose(): void;
}
/**
 * The WebGL2 sampler, or null where WebGL2 is not available. Create it only once a tooltip has
 * shown and `dispose` it with the session: a page may hold only a few live WebGL contexts.
 */
export declare function createSignatureSampler(): SignatureSampler | null;
