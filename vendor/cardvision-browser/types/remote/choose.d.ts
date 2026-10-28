import type { WorkerRequest } from "../messages.js";
import type { CardTable } from "./card-table.js";
import { type SkipStorage } from "./pointer.js";
import type { ReleasePointer } from "./pointer.js";
import { type RemoteLoadDeps } from "./remote-load.js";
/** The runtime worker's `load` request. */
export type LoadRequest = Extract<WorkerRequest, {
    kind: "load";
}>;
/** What `chooseRelease` decided for this page. */
export type RemoteReleaseChoice = {
    source: "bundled";
    reason: string;
    pointer: ReleasePointer | null;
    downloaded: number;
    ms: number;
    /** The bundled request to use instead of the page's own (a fallback from a remote release
     *  may load it with the geometric stage off, geometric.ts). */
    request?: LoadRequest;
} | {
    source: "remote";
    pointer: ReleasePointer;
    /** The load request with the release's files. */
    request: LoadRequest;
    /** The bundled request a fallback from this release uses (rules 10-11). */
    fallback?: LoadRequest;
    /** The card facts of that release's catalog, built before the load (docs/remote-releases.md, "Card facts"). */
    facts: CardTable;
    reused: number;
    downloaded: number;
    ms: number;
};
/** One decision, for the log line (docs/remote-releases.md, "Logging"). */
export interface ReleaseDecision {
    source: "remote" | "bundled";
    reason: string;
    pointer: string | null;
    reused: number;
    downloaded: number;
    ms: number;
}
export interface ChooseDeps extends Omit<RemoteLoadDeps, "onDownloading"> {
    storage: SkipStorage;
    /** The settings in effect: their `release` field as written. */
    readReleaseField(): Promise<unknown>;
    /** The running extension's version. */
    running: string;
    now(): number;
    /** The bundled release's request (wasmPaths reused for a remote load). */
    bundled: LoadRequest;
    /** The card facts table for a catalog (the build's rule). */
    buildCardTable(catalog: unknown): CardTable;
}
export declare function chooseRelease(deps: ChooseDeps, hooks: {
    onDownloading(): void;
}): Promise<RemoteReleaseChoice>;
/** Record a release not to try again for 24 h (docs/remote-releases.md, "The skip-list"). */
export declare function recordSkip(storage: SkipStorage, pointer: ReleasePointer, reason: string): Promise<void>;
/** The log line of one decision (docs/remote-releases.md, "Logging"): no page, channel, video, frame or card. */
export declare function decisionLine(name: string, d: {
    source: string;
    reason: string;
    pointer: string | null;
    reused: number;
    downloaded: number;
    ms: number;
}, bundled: string): string;
