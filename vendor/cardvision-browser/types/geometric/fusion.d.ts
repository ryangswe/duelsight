import type { GeometricSettings } from "./config.js";
export declare const EMBEDDING = "embedding";
export declare const VOTE = "vote";
export declare const BOTH = "both";
export type FoundBy = typeof EMBEDDING | typeof VOTE | typeof BOTH;
/** One verified candidate (Python: `Verified`). */
export interface Verified {
    cardId: string;
    /** Its cosine as the caller gave it; for a card the vote added that the caller did not rank,
     *  the lowest cosine the caller gave. */
    cosine: number;
    foundBy: FoundBy;
    /** Crop keypoints that voted for it (0 when the vote is off). */
    votes: number;
    /** Matched keypoints that passed the ratio test. */
    matches: number;
    /** Matches the fitted model explains (0 with no fit). */
    inliers: number;
    /** The inliers less the baseline, at least 0. */
    evidence: number;
    fused: number;
    /** Whether the index has the card; a card it lacks keeps its cosine. */
    indexed: boolean;
}
/** What the stage found for one crop (Python: `StageResult`). */
export interface StageResult {
    /** The verified candidates in the order they were chosen: embedding rank, then vote rank. */
    candidates: Verified[];
    cropKeypoints: number;
    ms: number;
}
/** A verified candidate as a report records it (Python: `Verified.to_json`). */
export interface VerifiedJson {
    cardId: string;
    cosine: number;
    foundBy: FoundBy;
    votes: number;
    matches: number;
    inliers: number;
    evidence: number;
    fused: number;
}
/** The stage's part in one recognition (Python: `GeometricOutcome.to_json`): what the
 *  recognizer would have answered without it, and the verified candidates. */
export interface GeometricEvidence {
    before: {
        topId: string;
        similarity: number;
        margin: number;
        accepted: boolean;
    };
    candidates: VerifiedJson[];
}
/** A verified candidate's fused score from its evidence (Python: `fused_score`). */
export declare function fusedScore(cosine: number, evidence: number, fusion: GeometricSettings["fusion"]): number;
/** NumPy's median of whole numbers: the middle value, or the mean of the two middle ones. */
export declare function median(values: readonly number[]): number;
/** The baseline the inliers are measured from (`fusion.baseline`): 0, or the median inlier
 *  count of the crop's verified candidates. */
export declare function baselineOf(inliers: readonly number[], fusion: GeometricSettings["fusion"]): number;
/** A candidate's evidence: its inliers less the baseline, never below 0. */
export declare function evidenceOf(inliers: number, baseline: number): number;
/**
 * A row of similarities with each verified card's rows moved by its fused score less its
 * cosine (Python: `fused[column] += found.fused - found.cosine`). `columnsOf` gives a card's
 * bank rows. The row given is not changed.
 */
export declare function fuseRow(row: Float64Array, candidates: readonly Verified[], columnsOf: (cardId: string) => readonly number[]): Float64Array;
/**
 * Python's `round(x, digits)` for a float: the exact value rounded to `digits` decimals, a tie
 * to the even neighbour, the result the nearest double to that decimal.
 */
export declare function pyRound(x: number, digits: number): number;
/** A verified candidate as a report records it. */
export declare function verifiedToJson(found: Verified): VerifiedJson;
/** The stage's record for one recognition. */
export declare function evidenceToJson(before: {
    topId: string;
    similarity: number;
    margin: number;
    accepted: boolean;
}, result: StageResult): GeometricEvidence;
