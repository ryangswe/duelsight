import type { EmbeddingBank } from "./bank.js";
import { IdentityMap } from "./identity.js";
import { type PreprocessingContract } from "./preprocess.js";
/** The accept rule's settings, as a release document's `accept` block states them. */
export interface AcceptRule {
    /** The similarity the best match must reach. */
    tau: number;
    /** The margin it must keep over the best match of any other identity. */
    delta: number;
    /** Whether a crop that is not accepted upright is tried in its three other orientations. */
    rotationRetry: boolean;
}
/** The values calibrated for the published model and bank. A release document states its own,
 *  and another model or another game needs its own. */
export declare const DEFAULT_ACCEPT: Readonly<AcceptRule>;
/** Stands in for "the best other identity" when the bank holds a single identity. It is below
 *  any cosine, so the margin is then large and never the reason a look is refused. */
export declare const NO_OTHER_IDENTITY = -2;
/** One look at an embedding. */
export interface ScoredMatch {
    /** The best row's card id when the score reaches tau, else null. The margin plays no part. */
    cardId: string | null;
    /** The score: the best row's similarity. */
    similarity: number;
    /** The best row's card id, whether or not the score reaches tau. */
    topId: string;
    /** The identity `topId` belongs to. */
    identity: string;
    /** The id shown for this look when it is accepted (see IdentityMap.shown). */
    displayId: string;
    /** The score minus the best similarity of a row of a different identity. */
    margin: number;
}
/** A match of a track's pooled embedding: accepted only with both tau and the margin. */
export interface PooledMatch {
    cardId: string | null;
    similarity: number;
    margin: number;
}
export declare class EmbeddingRecognizer {
    private readonly bank;
    readonly rule: AcceptRule;
    /** Identity index of each bank row: rows of one identity share an index. */
    private readonly rowIdent;
    /** Identity index to the identity's representative card id. */
    private readonly identRep;
    /** The id shown for each bank row. */
    private readonly rowShown;
    /** One similarity per row, reused between calls (calls do not overlap). */
    private readonly scratch;
    private readonly contract;
    constructor(bank: EmbeddingBank, rule?: AcceptRule, identity?: IdentityMap);
    /** Rows in the bank. */
    get size(): number;
    /** Length of one embedding. */
    get dim(): number;
    get tau(): number;
    /** The preprocessing contract a crop goes through before it is embedded. */
    get preprocessing(): PreprocessingContract;
    /** Score every row for the vector at `offset`: the best row, its score, and the best score of
     *  a row of a different identity. */
    private topAndOther;
    /** One look at the embedding stored at `offset` in `embs`. */
    matchScored(embs: Float32Array, offset: number): ScoredMatch;
    /** The similarity of the embedding at `offset` to every bank row, a new array. The values
     *  are those `matchScored` compares, computed the same way. */
    scoreRow(embs: Float32Array, offset: number): Float64Array;
    /**
     * The cards of a row of similarities, best first, each once with its best row's similarity
     * (Python: `_geometric_recognition`'s ranking: a stable argsort of the row, best first, each
     * card id kept at its first row).
     */
    rankCards(row: Float64Array): Array<{
        cardId: string;
        cosine: number;
    }>;
    /** The bank rows of each card id. */
    private columns;
    /** The bank rows of a card id (empty for an id the bank lacks). */
    columnsOf(cardId: string): readonly number[];
    private bankIdSet;
    /** The card ids the bank holds. */
    get bankIds(): ReadonlySet<string>;
    private scored;
    /**
     * One look from a full row of scores (Python: `score_look`): the first row with the highest
     * score, and the margin over the best row of a different identity (`NO_OTHER_IDENTITY` when
     * there is none). `row` in the result is the best row.
     */
    lookOf(row: Float64Array): ScoredMatch & {
        row: number;
    };
    /**
     * The accept booster's look (Python: `_geometric_recognition` without `fusion.reorder`): the
     * identity of bank row `keep` stays the answer, named by that identity's first highest row,
     * and the margin is taken over the best row of any other identity.
     */
    lookWithin(row: Float64Array, keep: number): ScoredMatch & {
        row: number;
    };
    /**
     * Match a track's pooled embedding (the unit-length mean of its recent accepted embeddings,
     * see `poolEmbeddings`). Accepted only when the score reaches tau and the margin reaches
     * delta, so a track torn between two identities names nothing instead of switching between
     * them, while two printings of one identity never hold each other back. Returns the id shown
     * for the best row.
     */
    matchPooled(vec: Float32Array, delta?: number): PooledMatch;
}
