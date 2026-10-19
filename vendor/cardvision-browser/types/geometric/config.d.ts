export declare const FEATURE_TYPES: readonly ["orb", "akaze", "sift"];
export declare const BASELINES: readonly ["none", "median"];
export declare const MATCHERS: readonly ["bf", "flann"];
export declare const MODELS: readonly ["homography", "affine", "similarity"];
export declare const METHODS: readonly ["ransac", "usac"];
export type FeatureType = (typeof FEATURE_TYPES)[number];
/** The detector settings of each feature type, with their defaults. */
export declare const FEATURE_PARAMS: Readonly<Record<FeatureType, Readonly<Record<string, number>>>>;
export interface GeometricSettings {
    seed: number;
    features: {
        type: string;
        maxFeatures: number;
        artLongSide: number;
        mask: number[][];
        params: Record<string, number>;
    };
    crop: {
        longSide: number;
        maxFeatures: number;
    };
    candidates: {
        embeddingTopK: number;
        voteTopN: number;
    };
    vote: {
        matcher: string;
        ratio: number;
        lshTables: number;
        lshKeySize: number;
        lshProbes: number;
        kdTrees: number;
        checks: number;
    };
    match: {
        ratio: number;
    };
    ransac: {
        model: string;
        method: string;
        threshold: number;
        maxIters: number;
        confidence: number;
        minAreaRatio: number;
        maxAreaRatio: number;
    };
    fusion: {
        weight: number;
        minInliers: number;
        fullInliers: number;
        penalty: number;
        baseline: string;
        reorder: boolean;
    };
    gate: {
        belowAccept: boolean;
        sources: string[] | null;
    };
}
/** Every setting's default, in Python's order. */
export declare const DEFAULTS: Readonly<GeometricSettings>;
/** A geometric settings document is not valid. `errors` lists every reason. */
export declare class GeometricConfigError extends Error {
    readonly errors: string[];
    constructor(errors: string[]);
}
/** Loaded settings: the full settings, defaults filled in, without the index; where the index
 *  is and what its bytes must hash to (null when the document does not say). */
export declare class GeometricConfig {
    readonly indexPath: string | null;
    readonly indexSha256: string | null;
    /** The settings, a frozen copy: nothing that holds the config can change what the stage runs. */
    readonly settings: Readonly<GeometricSettings>;
    constructor(settings: Readonly<GeometricSettings>, indexPath?: string | null, indexSha256?: string | null);
    get seed(): number;
    get features(): GeometricSettings["features"];
    /** The full settings, as a report records them (the index is reported by its hash). */
    toJson(): GeometricSettings;
}
/**
 * Read settings from a parsed document. `base` is the URL a relative index path is resolved
 * against; without it the path is kept as written. Throws a `GeometricConfigError` listing
 * every problem, each prefixed with `source`.
 */
export declare function parseGeometric(doc: unknown, base?: string | URL | null, source?: string): GeometricConfig;
/** Read a settings document's text; `source` names it in messages (Python: load_geometric). */
export declare function parseGeometricText(text: string, base?: string | URL | null, source?: string): GeometricConfig;
