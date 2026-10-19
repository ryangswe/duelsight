export declare const PACKED_KIND = "geometric-index-packed";
export declare const PACKED_SCHEMA_VERSION = 1;
export declare const DESCRIPTOR_BYTES = 32;
export declare const SHARD_PARALLELISM = 2;
export declare const INDEX_CACHE_NAME = "cardvision-geometric-index";
/** One card of the index. `start` is its first row in the whole index; its `n` rows follow. */
export interface PackedCard {
    cardId: string;
    artV: string;
    width: number;
    height: number;
    start: number;
    n: number;
}
export interface PackedIndex {
    cards: PackedCard[];
    /** rows x 32 descriptor bytes, row-major. */
    desc: Uint8Array;
    /** rows x 2 keypoint positions (x, y), in the card image scaled to `width` x `height`. */
    xy: Float32Array;
    /** Row to the position of its card in `cards`. */
    rowCard: Uint32Array;
    rows: number;
    sourceSha256: string;
    bankSha256: string;
    opencv: string;
    /** The `features` block the keypoints were taken with (the index's own). */
    features: Readonly<Record<string, unknown>>;
}
export type GeometricIndexErrorCode = "manifest" | "manifest-sha" | "shard" | "hash" | "bank-sha" | "bank-ids";
/** Why a packed index cannot be used. The stage maps every one to "off". */
export declare class GeometricIndexError extends Error {
    readonly code: GeometricIndexErrorCode;
    constructor(code: GeometricIndexErrorCode, message: string);
}
/** Build the index from a parsed manifest document and its shards' bytes, in the manifest's
 *  order. Pure: it checks shapes and sizes, not hashes (`loadPackedIndex` does). */
export declare function parsePackedIndex(manifest: unknown, shards: ArrayBuffer[]): PackedIndex;
export interface LoadOptions {
    /** The SHA-256 of the bank of the release that is loaded. */
    bankSha256: string;
    /** The card ids of that bank. Every one must have an entry in the index. */
    bankIds: string[];
    fetch?: typeof fetch;
    /** Where shards are kept between starts; omitted when the page has no Cache API. */
    cache?: CacheStorage;
    /** When given, the SHA-256 the manifest file's bytes must have: the manifest is pinned, and
     *  through it every shard. */
    manifestSha256?: string;
}
export declare function sha256Hex(bytes: ArrayBuffer): Promise<string>;
/** Whether an index serves a bank: same SHA-256 and a row for every bank card (the Python
 *  package's `bank_mismatch`, for the case of a bank the index records). */
export declare function checkBankBinding(manifest: {
    bankSha256: string;
    cards: {
        cardId: string;
    }[];
}, bankSha256: string, bankIds: string[]): void;
/** Fetch the manifest and its shards (two at a time), check every shard's SHA-256 against the
 *  manifest, and return the index. Shards are kept in the Cache API (by URL, immutable) and
 *  hashed again each time they are read from it; one that no longer matches is fetched again
 *  once. The bank binding is checked from the manifest alone, before any shard is downloaded.
 *  When a shard fails, the other lane stops and its download is aborted. After a load that
 *  succeeds, the cache keeps only entries under the manifest's folder: the shards of an index
 *  no longer in use are deleted.
 *
 *  The loader does not ask for persistent storage: `navigator.storage.persist()` exists in a
 *  page, not in a worker, so the page that hosts the worker may call it. */
export declare function loadPackedIndex(manifestUrl: string, opts: LoadOptions): Promise<PackedIndex>;
