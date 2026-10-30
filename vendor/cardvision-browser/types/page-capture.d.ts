import { type AnalysisWidth } from "./capture.js";
/** The time the video showed while it last played, as `watchVideo` keeps it; null for none. */
export interface PlayingClock {
    readonly lastPlayingTime: number | null;
}
/** The canvas pictures of one source are drawn into. A canvas that once drew a picture it may
 *  not read stays unreadable, so a new source gets a new one (`createSourceCanvas`); the canvas
 *  itself is made at the first grab. */
export interface SourceCanvas {
    canvas: HTMLCanvasElement | null;
    /** Whether this canvas was shown to be readable (checked once per canvas: a read-back is not
     *  free). */
    readable: boolean;
}
/** What `grabFrame` reads: a video with its canvas and the time it last played. `watchVideo`'s
 *  watch is one; `source` is read at every grab, since a new source replaces it. */
export interface CaptureSource extends PlayingClock {
    readonly video: HTMLVideoElement;
    readonly source: SourceCanvas;
}
export type Grab = {
    kind: "frame";
    bitmap: ImageBitmap;
    mediaTime: number;
}
/** `retry`: the picture itself could not be had (not ready yet, or blank): worth asking again. */
 | {
    kind: "failed";
    reason: string;
    retry: boolean;
};
export interface GrabDeps {
    /** Makes a canvas; default `document.createElement("canvas")`. */
    createCanvas?: () => HTMLCanvasElement;
    /** Makes the bitmap; default the global `createImageBitmap`. */
    createImageBitmap?: (canvas: HTMLCanvasElement) => Promise<ImageBitmap>;
    /** Refuse a video that is not in the page ("no picture", retry). Default true: a content
     *  script's video can be replaced under it. */
    requireConnected?: boolean;
    /** The largest side of a frame taken ("the picture is too large" above it). Default
     *  `MAX_FRAME_SIDE`, what a compute frame accepts; a same-document session has no such limit. */
    maxSide?: number;
}
/** The reasons `grabFrame` gives. */
export declare const NO_PICTURE = "no picture";
export declare const BLANK_PICTURE = "no picture (the paused video draws nothing)";
export declare const NO_CONTEXT = "no 2d context";
export declare const UNREADABLE = "the video may not be read";
export declare const TOO_LARGE = "the picture is too large";
/** A new canvas record for a source (see `SourceCanvas`). */
export declare function createSourceCanvas(): SourceCanvas;
/** A paused live stream whose <video> was reset (no current frame) while its last frame stays
 *  on screen. */
export declare function isFrozen(video: HTMLVideoElement): boolean;
/** The time of the picture on screen: for a frozen video, its time when it last played. */
export declare function mediaTimeOf(video: HTMLVideoElement, clock: PlayingClock | null): number;
/** Whether a drawn picture is empty: a 16 x 16 reduction of it with almost no variation. False
 *  when there is no 2D context to tell. Throws as `getImageData` does when the picture may not
 *  be read. */
export declare function blankFrame(picture: HTMLCanvasElement, createCanvas?: () => HTMLCanvasElement): boolean;
/**
 * Draw the watched video's current picture into its source canvas at analysis size and make a
 * transferable bitmap of it. In this order: no watch, a video out of the page (unless
 * `requireConnected` is false) or with no picture size: "no picture" (retry); not ready and not
 * frozen: "no picture" (retry); a frame larger than `maxSide` (default `MAX_FRAME_SIDE`) on a
 * side: "the picture is too large" (no retry, nothing drawn); draw; frozen and blank: "no
 * picture (the paused video draws nothing)" (retry); the readable check, once per canvas; the
 * bitmap. A picture that may not be read: "the video may not be read" (no retry); any other
 * error: its text (no retry). The time is read before the draw and the first
 * await, so it belongs to the picture drawn.
 *
 * The caller owns the returned bitmap: it must transfer it (to its compute frame) or close it.
 */
export declare function grabFrame(watch: CaptureSource | null, range: AnalysisWidth, deps?: GrabDeps): Promise<Grab>;
