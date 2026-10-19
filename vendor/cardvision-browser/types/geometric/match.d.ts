import type { Cv } from "./features.js";
import { type KnnResult, NO_ROW } from "./vote.js";
export { NO_ROW };
/** The two nearest index rows of each query descriptor, nearest first; on equal distances the
 *  lower row first. `NO_ROW` where there is no such row. (The voter's result, vote.ts.) */
export type KnnPairs = KnnResult;
/**
 * The vote (Python: `GeometricStage.votes`): index card position to the number of query
 * descriptors whose nearest index descriptor is that card's and that pass the ratio test. The
 * test is waived when the two nearest descriptors belong to one card, to cards of one identity,
 * or to cards taken from one image: such neighbours are not rivals. `rowCard` maps an index row
 * to its card's position; `identity` and `image` give each position's identity and image.
 * Positions appear in the order they first got a vote, as in Python's dictionary.
 */
export declare function countVotes(knn: KnnPairs, queries: number, first: number, rowCard: Uint32Array, identity: readonly string[], image: readonly string[], ratio: number): Map<number, number>;
/** A crop keypoint matched with a candidate's keypoint. */
export interface Match {
    queryIdx: number;
    trainIdx: number;
}
/**
 * The matches of a crop's descriptors with one candidate's that pass the ratio test (Python:
 * the `good` list of `GeometricStage.inliers`): OpenCV's brute-force Hamming matcher, the two
 * nearest per crop keypoint, kept when the nearest is under `ratio` times the second. In the
 * order of the crop's keypoints.
 */
export declare function ratioMatches(cv: Cv, query: Uint8Array, queryCount: number, train: Uint8Array, trainCount: number, ratio: number, width?: number): Match[];
