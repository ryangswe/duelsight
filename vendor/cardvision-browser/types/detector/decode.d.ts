import { type AABB, type Candidate } from "../boxes.js";
/** The class whose boxes go to the recognizer. A back is reported as a card and never named. */
export declare const FACE_CLASS = 0;
export declare const BACK_CLASS = 1;
/** Columns before the class scores: cx, cy, w, h, objectness. */
export declare const BOX_COLUMNS = 5;
/** The operating point of the detector's decode. */
export interface DecodeSettings {
    threshold: number;
    nmsIou: number;
    maxProposals: number;
}
/** The operating point of the published detector. A release document states its own. */
export declare const DEFAULT_DECODE: Readonly<DecodeSettings>;
/** A box whose crop is shorter than this on either side, in the analyzed frame, is not a valid
 *  proposal. A release document states its own value (`detector.minCropPx`). */
export declare const DEFAULT_MIN_CROP_PX = 24;
/**
 * Every box that survives the threshold, the suppression and the cut to `maxProposals`, in
 * frame pixels, best first. `out` is one frame's rows, `columns` values each (5 + the number of
 * classes), and `ratio` the letterbox ratio. No box is filtered for size or clipped here.
 */
export declare function decodeDetections(out: Float32Array, columns: number, ratio: number, settings?: DecodeSettings): Candidate[];
/**
 * Whether a box's crop is at least `minPx` pixels on both sides. The test is made on the crop:
 * the box clipped to the frame, each edge cut down to a whole number.
 */
export declare function validBox(b: AABB, frameW: number, frameH: number, minPx?: number): boolean;
/** One frame's detections: `decodeDetections`, then only the boxes that pass `validBox`. */
export declare function validDetections(out: Float32Array, columns: number, ratio: number, frameW: number, frameH: number, settings?: DecodeSettings, minPx?: number): Candidate[];
/** A box scaled from the analyzed frame to another frame of the same picture and clipped to
 *  it, as corners `[x0, y0, x1, y1]`. */
export declare function toFrameCorners(b: AABB, analysisW: number, analysisH: number, frameW: number, frameH: number): [number, number, number, number];
/** A detection with its box clipped to the frame; one that lies inside is returned untouched. */
export declare function clipToFrame(c: Candidate, frame: {
    width: number;
    height: number;
}): Candidate;
/** Split a frame's detections: the faces, which go to the recognizer, and everything else (the
 *  backs, or a class this runtime does not know), which is reported and never named. */
export declare function splitByClass<T extends {
    cls: number;
}>(detections: readonly T[], faceClass?: number): {
    faces: T[];
    others: T[];
};
