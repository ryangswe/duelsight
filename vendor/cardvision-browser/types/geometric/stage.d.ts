import { type GeometricConfig } from "./config.js";
import { type CropFeatures, type Cv } from "./features.js";
import { type StageResult } from "./fusion.js";
import { type KnnPairs } from "./match.js";
/** One card of the packed index (geometric/index.ts). */
export interface IndexCard {
    cardId: string;
    artV: string;
    width: number;
    height: number;
    /** The card's first row in the whole index. */
    start: number;
    n: number;
}
/** The packed descriptor index, as geometric/index.ts loads it. */
export interface StageIndex {
    cards: IndexCard[];
    /** rows x 32 descriptor bytes. */
    desc: Uint8Array;
    /** rows x 2 keypoint positions. */
    xy: Float32Array;
    /** Index row to its card's position in `cards`. */
    rowCard: Uint32Array;
    rows: number;
    sourceSha256: string;
    bankSha256: string;
    opencv: string;
    /** The `features` block the index's keypoints were taken with. */
    features: Readonly<Record<string, unknown>>;
}
/** The whole-catalog nearest-neighbour search (geometric/vote.ts). */
export interface StageVoter {
    knn2(queries: Uint8Array): Promise<KnnPairs>;
    dispose(): void;
}
/** A card the recognizer ranked, with its cosine (its best bank row's). */
export interface RankedCard {
    cardId: string;
    cosine: number;
}
/** One crop to verify: RGBA pixels, upright as cut from the frame, and the recognizer's
 *  ranking of the cards for it. */
export interface VerifyItem {
    rgba: Uint8Array | Uint8ClampedArray;
    width: number;
    height: number;
    ranked: readonly RankedCard[];
}
/** Why the stage cannot run these settings with this OpenCV, or null when it can. */
export declare function unsupportedSettings(config: GeometricConfig, cv: Cv): string | null;
export declare class GeometricStage {
    readonly config: GeometricConfig;
    readonly index: StageIndex;
    private readonly voter;
    private readonly cv;
    private readonly position;
    /** Each index card's identity and image, by position, for the vote's ratio test. */
    private readonly identity;
    private readonly image;
    /** With debug on, each result carries the stage's record of its crop (debug.ts). It decides
     *  nothing: a scoring run asks for it, a session never does. */
    debug: boolean;
    /**
     * `identities` maps card id to identity key, as Python's `Catalog.identities()` with the
     * release's identity groups over it (`voteIdentities`); a card it lacks is its own identity.
     * Throws when the settings are outside what this runtime ports.
     */
    constructor(config: GeometricConfig, index: StageIndex, voter: StageVoter, cv: Cv, identities?: ReadonlyMap<string, string>);
    /** Whether the settings re-rank (`fusion.reorder`) or only boost the embedding's answer. */
    get reorder(): boolean;
    /**
     * Whether the stage runs on a crop from `sourceType` (null when unknown, as in a browser)
     * whose embedding look the accept rule `accepted` or not (Python: `applies`).
     */
    applies(sourceType: string | null, accepted: boolean): boolean;
    /** Free the voter. */
    dispose(): void;
    /** The crop's keypoints. A test may replace it to give the stage known keypoints. */
    protected cropFeatures(item: VerifyItem): CropFeatures;
    /** `[matches, inliers]` of one index card against a crop's keypoints (Python: `inliers`). */
    private inliers;
    /** Verify one crop. `known`, when given, holds the cards the vote may add (the bank's). */
    verify(item: VerifyItem, known?: ReadonlySet<string>): Promise<StageResult>;
    /**
     * Verify the crops of one frame (Python: `verify`, crop by crop). The vote of every crop is
     * one call to the voter. Each crop's `ranked` is ranked here by cosine, best first (in the
     * given order on a tie), a card given twice keeping its first pair; a card the vote adds that
     * `ranked` lacks takes the lowest cosine given.
     */
    verifyBatch(items: readonly VerifyItem[], known?: ReadonlySet<string>): Promise<StageResult[]>;
    /** The crop's keypoints as `cropFeatures` takes them, from a grey image whose hash and size
     *  are handed to `seen` before it is freed. */
    private debugFeatures;
    /** The debug record of one crop (Python: `debug_record`). */
    private debugRecord;
    private finish;
}
/** Python's `fnmatch.fnmatchcase`: `*`, `?`, `[seq]` and `[!seq]`, case-sensitive. */
export declare function fnmatchcase(name: string, pattern: string): boolean;
/**
 * Card id to identity key for the vote, as Python's evaluation builds it: the catalog's own
 * rule for every card (`identityOf`), and the release's identity groups over it, each member
 * keyed `group:` and its representative (Python: `groups_identities`).
 */
export declare function voteIdentities(cards: ReadonlyArray<{
    id: string;
    name: string;
    printingOf: string | null;
}>, rule: "name" | "printing", groups: {
    groups: string[][];
    representative: ReadonlyMap<string, string>;
} | null): Map<string, string>;
/**
 * The watchdog: the stage is turned off for the session when its share of a frame is over
 * `limitMs` on `frames` frames in a row.
 */
export declare class GeometricWatchdog {
    readonly limitMs: number;
    readonly frames: number;
    private run;
    constructor(limitMs?: number, frames?: number);
    /** Record one frame's stage time; true when the stage must be turned off. */
    observe(stageMs: number): boolean;
    reset(): void;
}
/** The keys of two `features` blocks that differ, sorted; empty when they agree (Python:
 *  `cardvision.geometric.index.same_features`). */
export declare function sameFeatures(a: Readonly<Record<string, unknown>>, b: Readonly<Record<string, unknown>>): string[];
/** A warning when the index's keypoints were taken by another OpenCV version than the one
 *  running, else null (Python: `GeometricStage.opencv_note`). */
export declare function opencvNote(built: string, cv: Cv): string | null;
/** What opening a stage needs from the runtime: the loaders of its three parts, and the
 *  release it serves. */
export interface StageOpenDeps {
    fetchText(url: string): Promise<string>;
    loadIndex(manifestUrl: string, opts: {
        bankSha256: string;
        bankIds: string[];
    }): Promise<StageIndex>;
    loadCv(): Promise<Cv>;
    makeVoter(desc: Uint8Array): Promise<StageVoter>;
    bankSha256: string;
    bankIds: string[];
    identities: ReadonlyMap<string, string>;
}
/**
 * Open the stage whose settings document is at `settingsUrl`: read the settings, load the
 * packed index its `index.path` names (relative to the settings), check that it is a repack of
 * the index the settings pin (`index.sha256`) and that it serves the bank, then load OpenCV and
 * the voter. Rejects with an Error whose message says why; nothing is left running.
 */
export declare function openGeometricStage(settingsUrl: string, deps: StageOpenDeps): Promise<{
    stage: GeometricStage;
    bytes: number;
    note: string | null;
}>;
