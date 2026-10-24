/** A keypoint row's id: this many hexadecimal digits of its SHA-256. */
export declare const ROW_HASH_DIGITS = 16;
/** What the stage records about one crop when asked to. */
export interface StageDebug {
    /** The post-resize grey image the keypoints were taken from: its SHA-256 and size. */
    grey: {
        sha256: string;
        width: number;
        height: number;
    };
    /** How the crop was brought to `crop.longSide`: bilinear up, area averaging down, or not. */
    resize: "up" | "down" | "none";
    /** The crop's own size, `[width, height]`. */
    source: [number, number];
    /** The crop's keypoint count, and each row's id (`rowHashes`), strongest first. */
    keypoints: number;
    rows: string[];
    /** The whole vote, card id to count, before any card is left out of it. */
    votes: Record<string, number>;
    /** The stage's time on the crop, in ms (the result's `ms`). */
    ms: number;
}
/** How a `width` x `height` image is brought to `longSide` (Python: `resize_direction`). */
export declare function resizeDirection(width: number, height: number, longSide: number): StageDebug["resize"];
/**
 * The SHA-256 of `bytes` as lowercase hexadecimal text, computed in this thread. A record of a
 * frame's crops needs thousands of digests, and the Web Crypto API gives them only one promise at
 * a time.
 */
export declare function sha256Hex(bytes: Uint8Array): string;
/**
 * One id per keypoint row, in order (Python: `row_hashes`): the SHA-256 of the row's position as
 * two little-endian float32 and its descriptor bytes, to `ROW_HASH_DIGITS` hexadecimal digits.
 */
export declare function rowHashes(n: number, xy: Float32Array, desc: Uint8Array, width?: number): string[];
