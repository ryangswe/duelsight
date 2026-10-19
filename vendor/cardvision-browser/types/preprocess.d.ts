export type PoolVersion = 1 | 2;
/** How a fractional box becomes whole-pixel crop edges. Every contract truncates: each edge is
 *  clipped to the frame and cut down to a whole number (see `cropRgba`). */
export type CropEdges = "truncate";
export type PreprocessingId = "full128";
/** A preprocessing contract, as a release document and a bank file write it. */
export interface PreprocessingContract {
    id: PreprocessingId;
    /** Side of the square model input, in pixels. */
    size: number;
    /** Whether a border is masked out before pooling. No contract here does. */
    centerMask: boolean;
    poolVersion: PoolVersion;
    crop: CropEdges;
}
/**
 * The contracts this runtime implements. `full128` is the whole crop pooled to 128 x 128 with
 * pool version 2 and normalized; the aspect ratio is not preserved.
 */
export declare const PREPROCESSING: Readonly<Record<PreprocessingId, Readonly<PreprocessingContract>>>;
export declare function isPreprocessingId(v: unknown): v is PreprocessingId;
/**
 * The contract a document's `preprocessing` object names, or null when this runtime cannot
 * reproduce it: the id must be known and every field must equal the contract's own, with no
 * field more or fewer.
 */
export declare function contractOf(raw: unknown): PreprocessingId | null;
/**
 * Pool an RGBA crop (alpha ignored) to `outW` x `outH` cell means per color channel, on the
 * 0 to 255 scale, as a row-major Float64Array of `outW * outH * 3` values (R, G, B per cell).
 */
export declare function boxAverageRgb(rgba: Uint8ClampedArray | Uint8Array, srcW: number, srcH: number, outW: number, outH: number, version: PoolVersion): Float64Array;
/**
 * An RGBA crop as the model tensor of a contract: `3 * size * size` float32 values, channel
 * first.
 */
export declare function toContractTensor(rgba: Uint8ClampedArray | Uint8Array, srcW: number, srcH: number, contract: Pick<PreprocessingContract, "size" | "poolVersion">): Float32Array;
/**
 * A square channel-first tensor turned `k` quarter turns counter-clockwise in the image plane
 * (numpy.rot90 over the two spatial axes). `k = 0` returns the tensor itself. The recognizer
 * looks at a crop in up to four orientations; the turns are applied to the pooled tensor, not
 * to the crop, on both the Python side and this one, so the two agree exactly.
 */
export declare function rotateTensor90(t: Float32Array, k: number, n: number): Float32Array;
