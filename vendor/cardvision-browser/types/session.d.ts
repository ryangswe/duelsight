import { type AABB } from "./boxes.js";
import { type AnalysisMode } from "./cadence.js";
import { type FrameSource } from "./capture.js";
import { type AnalysisState } from "./frame-scheduler.js";
import { type GeometricStatus, type ReleaseProgress, type ReleaseStatus } from "./messages.js";
import { type FrameAnalysis } from "./pipeline.js";
import type { ExecutionProvider } from "./providers.js";
export interface SessionOptions {
    /** URL of the release document. Its paths are relative to it. With `releaseFiles`, the
     *  document's path among those files (`release.json`). */
    releaseUrl: string | URL;
    /** The release's files, by path relative to the release document's folder, when they come from
     *  the page (a folder the visitor chose) and not from a server. They are handed to the worker,
     *  which reads the release from them and fetches nothing for it; each file is checked against
     *  the size and SHA-256 the document pins, as a fetched one is. */
    releaseFiles?: Record<string, Blob>;
    /** URL of the worker script (the built `worker.js`). Default: `worker.js` beside this module. */
    workerUrl?: string | URL;
    /** URL of the folder that holds ONNX Runtime's `.wasm` files. Default: the worker's folder. */
    wasmPaths?: string;
    /** The execution providers to try, in order, in place of the release's own list. */
    providers?: ExecutionProvider[];
    /** "pointer" (the default): analyze only around pointer activity. "always-on": analyze for as
     *  long as the session runs. */
    mode?: AnalysisMode;
    /** URL of the geometric stage's settings document (it names the packed index). Optional and
     *  off by default: without it recognition is the embedding's alone. With it the stage loads
     *  after the release and joins between frames; `status().geometric` says where it is. */
    geometricUrl?: string | URL;
    /** The SHA-256 the packed index's manifest.json must have: a manifest with other bytes is
     *  refused and the stage is off. */
    geometricManifestSha256?: string;
    /** False turns the geometric watchdog off (default: on). Meant for measuring the stage, not
     *  for showing cards: with it off, a slow stage is never turned off. */
    geometricWatchdog?: boolean;
    /** Called whenever the status or what would be shown may have changed. */
    onUpdate?: () => void;
}
/** A rectangle in CSS pixels of the viewport, like `getBoundingClientRect`. */
export interface ClientBox {
    left: number;
    top: number;
    width: number;
    height: number;
}
/** What would be shown for a pointer position. */
export interface Shown {
    name: string;
    cardId: string;
    /** The card's box on the page, in CSS pixels of the viewport. */
    box: ClientBox;
    /** The card's box in pixels of the analyzed frame. */
    frameBox: AABB;
}
export interface SessionStatus {
    /** "loading" until the release has loaded; "failed" when it did not (see `error`). */
    state: "loading" | "ready" | "failed" | "stopped";
    error: string | null;
    /** The release in effect, once loaded. */
    release: ReleaseStatus["release"];
    /** The execution provider the recognizer runs on. */
    backend: ExecutionProvider | null;
    /** What the scheduler is doing: "fast", "reading", "idle" or "always-on". */
    schedule: AnalysisState;
    /** Frames analyzed and shown so far. */
    frames: number;
    /** The worker's time for the newest frame (reading the pixels back and analyzing them), and
     *  the time from capture to result as the page saw it, in ms. */
    lastWorkerMs: number | null;
    lastRoundTripMs: number | null;
    /** Why the newest frame was not analyzed, when it was not. */
    lastFrameError: string | null;
    /** The geometric stage's state as the worker last reported it; null when none was asked for. */
    geometric?: {
        state: GeometricStatus["state"];
        reason: string | null;
        bytes: number | null;
    } | null;
    /** While the release loads: downloading its files (`bytes`, their sum once known) or preparing
     *  the models. Null once it has loaded or failed, and before the worker has said. */
    loading?: {
        phase: "downloading" | "preparing";
        bytes: number | null;
    } | null;
}
export interface Session {
    status(): SessionStatus;
    /** What would be shown for a pointer at these viewport coordinates, or null for nothing. */
    at(clientX: number, clientY: number): Shown | null;
    /** The same for the pointer's current position over the element; null when it is elsewhere. */
    atPointer(): Shown | null;
    /** The newest result that still describes the picture on screen, or null. */
    analysis(): FrameAnalysis | null;
    /** The catalog's cards (id, name, art path), once the release has loaded. */
    cards(): ReleaseStatus["cards"];
    /** Stop analyzing, end the worker and remove every listener. */
    stop(): void;
}
/**
 * Where the picture sits inside an element's box, for the element's `object-fit`. A video is
 * fitted inside its box by default, leaving bars; an image fills its box by default.
 */
export declare function pictureBox(element: ClientBox, picture: {
    width: number;
    height: number;
}, fit: string): ClientBox;
/** Whether a result whose frame was taken at `resultSec` may still be shown against a picture
 *  at `nowSec`: their distance in video time is at most `maxAgeMs`. */
export declare function withinMaxAge(resultSec: number, nowSec: number, maxAgeMs: number): boolean;
/** What `status().loading` becomes on a release-progress reply: the reply's phase while the
 *  release loads; `undefined` (no change) once it has loaded or failed, or the session has
 *  stopped, so a reply that arrives late changes nothing. */
export declare function progressUpdate(state: SessionStatus["state"], reply: ReleaseProgress): SessionStatus["loading"] | undefined;
/**
 * Start a session on an element. The release loads in the background (`status().state`); until
 * then, and whenever nothing can be said, `at` returns null.
 */
export declare function createSession(source: FrameSource, options: SessionOptions): Session;
