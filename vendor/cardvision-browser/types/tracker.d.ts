import { type AABB, type Rect } from "./boxes.js";
/** One detection handed to the tracker. */
export interface Detection {
    aabb: AABB;
    rect: Rect;
    /** The best bank row's card id for this frame's look. */
    cardId: string | null;
    /** The look's unit-length embedding. */
    embedding: Float32Array;
}
/** One live track after an update. */
export interface TrackCard {
    instanceId: string;
    detection: Detection;
    /** The pooled identity, or null: not yet old enough, or no identity is clear. */
    identity: string | null;
}
/** A detection joins a track when they overlap by more than this. */
export declare const TRACK_IOU = 0.4;
/** A track survives this many analyzed frames without a matching detection. */
export declare const MAX_MISSES = 2;
/** How many of a track's most recent embeddings are pooled. */
export declare const EMBED_POOL_WINDOW = 5;
/** A track's identity is given only once it has been matched on this many frames: identities
 *  seen on a single frame are the main source of flicker. */
export declare const MIN_IDENTITY_FRAMES = 2;
/** Prefix of track ids. Hover-layer ids use another, so the two never collide. */
export declare const TRACK_ID_PREFIX = "track_";
/**
 * The mean of unit-length embeddings, brought back to unit length (each embedding counts the
 * same). Returns null when the mean has no direction, for example two exactly opposed vectors,
 * so that a caller never matches an undefined direction.
 */
export declare function poolEmbeddings(vectors: readonly Float32Array[]): Float32Array | null;
export declare class Tracker {
    private readonly identityResolver;
    private tracks;
    private nextId;
    /**
     * `identityResolver` is called with a track's pooled embedding on every frame the track is
     * live and returns the card id to show, or null to name nothing.
     */
    constructor(identityResolver: (pooled: Float32Array) => string | null);
    /** Forget every track: the picture is no longer continuous with the last one (a seek, a new
     *  image). Ids keep counting, so a track made after a reset never reuses an id, and every
     *  pooled identity is earned again from nothing. */
    reset(): void;
    private identityOf;
    /**
     * Advance by one analyzed frame. Each existing track, oldest first, takes the unmatched
     * detection it overlaps most, if that overlap is above `TRACK_IOU`; tracks left unmatched for
     * more than `MAX_MISSES` frames are dropped; detections left over start new tracks. Returns
     * the tracks matched on this frame.
     */
    update(detections: readonly Detection[]): TrackCard[];
}
