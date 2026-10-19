/** The canvas the frame is fitted into: the model's input size and the fill value. */
export interface LetterboxSettings {
    width: number;
    height: number;
    pad: number;
}
/** The input of the published detector. A release document states its own. */
export declare const DEFAULT_LETTERBOX: Readonly<LetterboxSettings>;
/** Round to the nearest integer, halves to the even neighbor (as Python's `round`). */
export declare function roundHalfEven(v: number): number;
export interface Letterbox {
    /** Canvas pixels per frame pixel. Boxes are divided by it to return to the frame. */
    ratio: number;
    /** Size of the resized frame inside the canvas. */
    width: number;
    height: number;
}
export declare function letterboxGeometry(srcW: number, srcH: number, settings?: LetterboxSettings): Letterbox;
/** The canvas as packed bytes, row-major, three bytes per pixel in the order blue, green, red. */
export declare function letterboxBgr(rgba: Uint8ClampedArray | Uint8Array, srcW: number, srcH: number, settings?: LetterboxSettings): Letterbox & {
    canvas: Uint8Array;
};
/** An RGBA analysis frame as the detector's input tensor (`3 * height * width` float32 values:
 *  the blue plane, then green, then red) and the letterbox geometry. */
export declare function toDetectorTensor(rgba: Uint8ClampedArray | Uint8Array, srcW: number, srcH: number, settings?: LetterboxSettings): Letterbox & {
    tensor: Float32Array;
};
