import type { ReleasePointer } from "./pointer.js";
/** A pinned file's name: no folder, no `..`, nothing but letters, digits, `.`, `_` and `-`. */
export declare const FLAT_NAME: RegExp;
export declare const DOCUMENT_TIMEOUT_MS = 10000;
/** The release document is a few KB; a body past this is not read further (it fails its SHA-256). */
export declare const DOCUMENT_MAX_BYTES: number;
export declare const STALL_MS = 30000;
export interface PinnedFile {
    path: string;
    sha256: string;
    bytes: number;
}
export interface RemoteLoadDeps {
    fetch: typeof fetch;
    sha256Hex(bytes: ArrayBuffer): Promise<string>;
    /** The settings file's address: the pointer's path and the release folder resolve against it. */
    settingsUrl: string;
    /** A file inside the extension (in an extension, chrome.runtime.getURL). */
    extensionUrl(path: string): string;
    /** Called before the release document is asked for (the frame shows its loading state). */
    onDownloading?(): void;
    documentTimeoutMs?: number;
    stallMs?: number;
}
export type RemoteLoad = {
    ok: true;
    /** The worker's `files`: "release.json" and each pinned path. */
    files: Record<string, Blob>;
    /** The catalog, as handed to the worker (the card facts are built from it). */
    catalog: Blob;
    /** How many of the five pinned files came from the extension. */
    reused: number;
    /** Bytes received over the network (the document and the downloaded files), decoded. */
    downloaded: number;
} | {
    ok: false;
    reason: string;
    record: boolean;
    downloaded: number;
};
/** The five files a release pins, from a parsed document; null when one is missing or malformed. */
export declare function pinnedFiles(doc: unknown): PinnedFile[] | null;
export declare function loadRemoteRelease(pointer: ReleasePointer, deps: RemoteLoadDeps): Promise<RemoteLoad>;
