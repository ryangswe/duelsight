/**
 * Resize the RGB channels of an RGBA image (alpha is ignored) to `outW` x `outH` and return
 * packed RGB bytes (`outW * outH * 3`). Any target size, smaller or larger; an axis whose size
 * does not change is copied, as Pillow skips that pass.
 */
export declare function resizeBilinearRgb(rgba: Uint8ClampedArray | Uint8Array, srcW: number, srcH: number, outW: number, outH: number): Uint8Array;
