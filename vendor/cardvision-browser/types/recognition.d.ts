import { type AABB, type Candidate, type Rect } from "./boxes.js";
import type { Frame } from "./detector/detector.js";
import type { BatchEmbedder } from "./embedder.js";
import { type GeometricEvidence } from "./geometric/fusion.js";
import type { GeometricStage } from "./geometric/stage.js";
import type { AcceptRule, EmbeddingRecognizer, ScoredMatch } from "./recognizer.js";
/** Among boxes whose look reaches tau, one that overlaps a better one by this much is dropped. */
export declare const ACCEPTED_NMS_IOU = 0.3;
/**
 * Cut a fractional box out of a frame. The convention is truncation: each of the four edges is
 * clipped to the frame and then cut down to a whole number, so the left and top edges move in
 * by a fraction of a pixel and the right and bottom edges move out by less than one. The
 * recognizer's training crops and the bank's measurements were made this way; rounding the
 * edges instead shifts some crops by a pixel and changes the embedding slightly.
 */
export declare function cropRgba(frame: Frame, box: AABB): {
    rgba: Uint8ClampedArray;
    width: number;
    height: number;
};
/** A look's orientation: 0 is upright, k is k quarter turns counter-clockwise. */
export type Orientation = 0 | 1 | 2 | 3;
/** The look the orientation rule settled on for one crop. */
export interface LookChoice {
    orientation: Orientation;
    match: ScoredMatch;
    /** Whether the three turned looks were scored. */
    retried: boolean;
}
/** Whether one look is accepted: its score reaches tau and its margin over the best different
 *  identity reaches delta. tau refuses crops that resemble nothing in the bank; delta refuses
 *  crops that resemble two different cards about equally. */
export declare function lookAccepted(m: ScoredMatch, rule: Pick<AcceptRule, "tau" | "delta">): boolean;
/**
 * The orientation rule. A card may lie sideways or upside down, so a crop can be looked at in
 * four orientations; the rule keeps the common case to one look.
 *
 * - If the upright look is accepted it is used, and the turned looks are never asked for. The
 *   same holds, accepted or not, when the rule's `rotationRetry` is false.
 * - Otherwise the looks at one, two and three quarter turns are asked for (`rotations` is
 *   called at most once) and all four compete:
 *   - if any look is accepted, the accepted look with the highest score is used (on equal
 *     scores, the lower orientation);
 *   - if none is, the look with the highest score is reported, a turned look replacing the
 *     upright one only when it is strictly higher. Nothing is named in that case, though a look
 *     that reaches tau still takes part in the suppression and in the tracker.
 */
export declare function chooseLook(upright: ScoredMatch, rotations: () => readonly [ScoredMatch, ScoredMatch, ScoredMatch], rule: AcceptRule): LookChoice;
/** One face box after recognition, in the orientation `chooseLook` picked. */
export interface ScoredProposal {
    aabb: AABB;
    rect: Rect;
    /** The detector's score for the box. */
    detectorScore: number;
    /** The chosen look's best bank row: its card id, whether or not the score reaches tau. */
    topId: string;
    /** The identity `topId` belongs to. */
    identity: string;
    /** The id shown when this proposal is accepted. */
    displayId: string;
    /** The chosen look's score. */
    score: number;
    /** The chosen look's margin over the best different identity. */
    margin: number;
    /** The chosen orientation. */
    orientation: Orientation;
    /** Whether the three turned looks were computed. */
    retried: boolean;
    /** Whether the score reaches tau. This alone admits a box to the suppression and the tracker. */
    tauPassed: boolean;
    /** Whether the look is accepted (tau and the margin): whether a card is named. */
    accepted: boolean;
    /** The chosen look's embedding when the score reaches tau, else null. A copy: the tracker
     *  keeps it beyond this frame. */
    embedding: Float32Array | null;
    /** With a geometric stage that ran on this crop: what it found, and what the embedding alone
     *  answered (Python: `GeometricOutcome.to_json`). The fields above are then the fused look's.
     *  Absent when no stage ran. */
    geometric?: GeometricEvidence;
}
/** One frame's recognition. */
export interface ScoredFrame {
    /** Every face box whose crop is large enough, in detector order. */
    proposals: ScoredProposal[];
    /** Indices into `proposals` of the ones that reach tau and survive the suppression, best first. */
    kept: number[];
    /** How many proposals had their turned looks computed. */
    retried: number;
    /** How many embeddings were computed: one per proposal and three more per retried one. */
    embeddings: number;
    /** With a geometric stage: the time it took on this frame, in ms. Absent without one, and
     *  when the stage failed. */
    geometricMs?: number;
    /** With a geometric stage that ran: the recognition without it (the cosine looks), which
     *  alone feeds the tracker. Absent without a stage. */
    base?: {
        proposals: ScoredProposal[];
        kept: number[];
    };
    /** The stage's error when it failed on this frame. The frame is then answered exactly as
     *  without a stage, and the caller turns the stage off. */
    geometricError?: unknown;
}
/**
 * The order in which the proposals that reach tau enter the suppression: the ones whose chosen
 * look is upright, in proposal order, then the ones whose chosen look is turned, in proposal
 * order. The suppression's sort is stable, so this order decides exact ties in score.
 */
export declare function nmsPreOrder(looks: ReadonlyArray<{
    tauPassed: boolean;
    orientation: number;
}>): number[];
/**
 * Suppression over the proposals that reach tau, by score, ignoring identity: a proposal is
 * dropped when it overlaps an already kept one by `ACCEPTED_NMS_IOU` or more. `order` is the
 * order they enter in (it decides exact ties only); it defaults to proposal order. Returns
 * indices into `proposals`, best first.
 */
export declare function keepAfterNms(proposals: ReadonlyArray<Pick<ScoredProposal, "aabb" | "score" | "tauPassed">>, order?: readonly number[]): number[];
/**
 * Recognize the face boxes of one frame.
 *
 * Every crop is embedded upright in one batch. The crops whose upright look is not accepted
 * are then embedded at one, two and three quarter turns in a second batch (when the rule
 * allows the retry), and `chooseLook` picks among the four. The turns are applied to the
 * preprocessed tensor, not to the crop. A box whose crop is under `minCropPx` on either side
 * is skipped.
 *
 * With a geometric `stage`, each crop it applies to is verified after the orientation rule has
 * chosen its look (Python: `Recognizer._geometric_recognition`): the stage is given the raw
 * upright crop and the chosen look's ranking of the cards, every row of a verified card is moved
 * by its fused score less its cosine, and the fused row gives the look (re-ranked, or within the
 * embedding's identity for the accept booster). The accept rule then judges the fused look; the
 * orientation stays the one chosen. Without a stage the result is exactly as before. The
 * cosine looks are returned too (`base`): the tracker pools those, as it did before the stage.
 * When the stage throws, the frame is answered with the cosine looks alone, exactly as without
 * a stage, and the error is returned (`geometricError`).
 */
export declare function recognizeFrame(frame: Frame, embedder: BatchEmbedder, recognizer: EmbeddingRecognizer, faces: readonly Candidate[], minCropPx?: number, stage?: GeometricStage | null): Promise<ScoredFrame>;
