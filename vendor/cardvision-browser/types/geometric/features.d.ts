/** An OpenCV.js matrix, as far as the stage uses it. */
export interface CvMat {
    rows: number;
    cols: number;
    data: Uint8Array;
    empty(): boolean;
    type(): number;
    delete(): void;
}
/** The part of the OpenCV.js module the stage uses. */
export interface Cv {
    Mat: new (...args: any[]) => CvMat;
    matFromArray(rows: number, cols: number, type: number, data: ArrayLike<number>): CvMat;
    cvtColor(src: CvMat, dst: CvMat, code: number): void;
    resize(src: CvMat, dst: CvMat, size: any, fx: number, fy: number, interpolation: number): void;
    Size: new (width: number, height: number) => any;
    ORB: new (...args: any[]) => any;
    BFMatcher: new (normType: number, crossCheck: boolean) => any;
    KeyPointVector: new () => any;
    DMatchVectorVector: new () => any;
    estimateAffine2D: (...args: any[]) => CvMat;
    /** Not in this runtime's build (the "similarity" model is refused without it). */
    estimateAffinePartial2D?: (...args: any[]) => CvMat;
    /** Not in this runtime's build (the "homography" model is refused without them). */
    findHomography?: (...args: any[]) => CvMat;
    perspectiveTransform?: (src: CvMat, dst: CvMat, m: CvMat) => void;
    transform(src: CvMat, dst: CvMat, m: CvMat): void;
    isContourConvex(contour: CvMat): boolean;
    contourArea(contour: CvMat, oriented: boolean): number;
    setRNGSeed?: (seed: number) => void;
    /** OpenCV's build information, which names its version. */
    getBuildInformation?: () => string;
    CV_8UC1: number;
    CV_8UC4: number;
    CV_32FC2: number;
    COLOR_RGBA2GRAY: number;
    INTER_AREA: number;
    INTER_LINEAR: number;
    NORM_HAMMING: number;
    RANSAC: number;
    USAC_MAGSAC?: number;
    ORB_HARRIS_SCORE: number;
}
/** The keypoints of one crop: positions in the scaled image as float32 pairs, ORB descriptors
 *  (32 bytes each), and the scaled image's size. */
export interface CropFeatures {
    n: number;
    xy: Float32Array;
    desc: Uint8Array;
    size: [number, number];
}
/** Python's `round(x)` to a whole number: a tie goes to the even neighbour. */
export declare function pyRoundHalfEven(x: number): number;
/** The size a `width` x `height` image is scaled to so that its longer side is `longSide`, and
 *  whether it is scaled at all (Python: `scaled_grey`). */
export declare function scaledSize(width: number, height: number, longSide: number): {
    size: [number, number];
    scale: number;
};
/** An RGBA crop in grey, scaled so its longer side is `longSide`. The caller deletes it. */
export declare function scaledGrey(cv: Cv, rgba: Uint8Array | Uint8ClampedArray, width: number, height: number, longSide: number): CvMat;
/** The ORB detector with the settings of `features.params` (Python: `make_detector`), every
 *  argument of `cv::ORB::create` given; the ones Python leaves out take OpenCV's defaults
 *  (first level 0, WTA_K 2, Harris score). */
export declare function makeOrb(cv: Cv, maxFeatures: number, params: Readonly<Record<string, number>>): any;
/** Order of keypoints by response, strongest first, ties in the order found, at most `max`. */
export declare function strongestFirst(responses: ArrayLike<number>, max: number): number[];
/**
 * The strongest `maxFeatures` ORB keypoints of an RGBA image scaled to `longSide` (Python:
 * `extract` for `orb` with no mask).
 */
export declare function extractOrb(cv: Cv, rgba: Uint8Array | Uint8ClampedArray, width: number, height: number, longSide: number, maxFeatures: number, params: Readonly<Record<string, number>>): CropFeatures;
