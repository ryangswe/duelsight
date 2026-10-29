import type { LoadRequest } from "./choose.js";
export interface GeometricPointer {
    path: string;
    sha256: string;
    manifestSha256: string;
}
export type GeometricField = {
    kind: "absent";
} | {
    kind: "malformed";
    key: string;
} | {
    kind: "pointer";
    geometric: GeometricPointer;
};
/** Where an index manifest may be: a flat folder or a series folder (docs/remote-releases.md, "Index folders"). */
export declare const GEO_MANIFEST_PATH: RegExp;
export declare const GEOMETRIC_TIMEOUT_MS = 10000;
/** The stage's settings file is a few KB; a body past this is not read (it fails its SHA-256). */
export declare const GEOMETRIC_MAX_BYTES: number;
/** The `geometric` part of the settings file's `release` field, as written. */
export declare function parseGeometricPointer(release: unknown): GeometricField;
export interface GeometricDeps {
    fetch: typeof fetch;
    sha256Hex(bytes: ArrayBuffer): Promise<string>;
    /** The settings file's address: the pointer's path resolves against it, and the index must be
     *  on its origin. */
    settingsUrl: string;
    timeoutMs?: number;
}
export type GeometricCheck = {
    ok: true;
    url: string;
    manifestSha256: string;
} | {
    ok: false;
    reason: "geo-setting" | "geo-absent" | `geo-malformed:${string}` | "geo-unreachable" | "geo-sha" | "geo-shape";
};
/** Rules G1 and G2: the stage's part of the load request for a remote release, or why it is off.
 *  `stageOn`: the build has the stage and the settings do not turn it off. */
export declare function checkRemoteGeometric(field: GeometricField, stageOn: boolean, deps: GeometricDeps): Promise<GeometricCheck>;
/** The bundled release chosen before anything was fetched (rules 1-5): its own request, stage
 *  included. Any other reason is a fallback from a remote release (rules 6-9). */
export declare function chosenBeforeFetch(reason: string): boolean;
/** The bundled release's request for a page that fell back from a remote release: the stage stays
 *  on only when the pointer's index is the bundled one, so the remote index stays in the cache. */
export declare function fallbackRequest(bundled: LoadRequest, field: GeometricField): LoadRequest;
/** The log line of the stage's decision for a remote release (no page, channel, video or card). */
export declare function geometricLine(name: string, pointer: string, check: GeometricCheck): string;
