/** Compare two `x.y.z` versions (a manifest may also say `x.y` or `x.y.z.w`); missing parts are 0. */
export declare function compareVersions(a: string, b: string): number;
export interface ReleasePointer {
    id: string;
    path: string;
    sha256: string;
    minimumExtensionVersion: string;
    maximumExtensionVersion: string | null;
}
export type PointerField = {
    kind: "absent";
} | {
    kind: "malformed";
    key: string;
} | {
    kind: "pointer";
    pointer: ReleasePointer;
};
/** The `release` field of the settings file, as written (null or undefined: absent). Unknown keys
 *  inside it are ignored; `geometric` is read by geometric.ts and is ignored here. */
export declare function parsePointer(raw: unknown): PointerField;
/** One release that failed in a way that will fail again (a bad document or file, a refusal by
 *  the runtime before it prepared the models): it is not tried again for SKIP_TTL_MS. */
export interface SkipEntry {
    id: string;
    sha256: string;
    reason: string;
    /** When it was recorded, ms since the epoch. */
    at: number;
}
export declare const SKIP_KEY = "releaseSkip";
export declare const SKIP_TTL_MS: number;
/** The part of an extension's own local storage used here. */
export interface SkipStorage {
    get(keys: string): Promise<Record<string, unknown>>;
    set(items: Record<string, unknown>): Promise<void>;
    remove(keys: string): Promise<void>;
}
/** The skip entry in effect, or null. An entry 24 h old or more, from the future, or malformed is
 *  deleted on read. */
export declare function readSkip(storage: SkipStorage, now: number): Promise<SkipEntry | null>;
/** Record a release not to try again; it replaces any entry. */
export declare function writeSkip(storage: SkipStorage, entry: SkipEntry): Promise<void>;
export type Decision = {
    source: "bundled";
    reason: string;
    pointer: ReleasePointer | null;
} | {
    source: "remote";
    pointer: ReleasePointer;
};
export interface DecideInput {
    field: PointerField;
    /** The running extension's version (manifest). */
    running: string;
    /** The bundled release's id. */
    bundledId: string;
    /** The skip entry in effect (readSkip), or null. */
    skip: SkipEntry | null;
}
/** Which release to load, before anything is fetched. */
export declare function decide({ field, running, bundledId, skip }: DecideInput): Decision;
/**
 * The skip-list's clearing: the entry goes when the field is absent, or when the pointer names another
 * (id, sha256), so that a later move back to the skipped release is tried again. Returns the entry
 * still in effect.
 */
export declare function clearStaleSkip(storage: SkipStorage, field: PointerField, skip: SkipEntry | null): Promise<SkipEntry | null>;
/**
 * Whether a worker refusal (rule 10) goes on the skip-list: only a refusal that came before the
 * worker said it was preparing the models (the files and their bindings were judged), and never
 * the runtime's catch-all (`unexpected:`, a transient read, crypto or memory failure) or the
 * frame's own errors.
 */
export declare function refusalRecorded(reason: string, sawPreparing: boolean): boolean;
