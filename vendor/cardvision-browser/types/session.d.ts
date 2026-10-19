import { type AABB } from "./boxes.js";
import { type AnalysisMode } from "./cadence.js";
import { type FrameSource } from "./capture.js";
import { type AnalysisState } from "./frame-scheduler.js";
import type { ReleaseStatus } from "./messages.js";
import { type FrameAnalysis } from "./pipeline.js";
import type { ExecutionProvider } from "./providers.js";
export interface SessionOptions {
    /** URL of the release document. Its paths are relative to it. */
    releaseUrl: string | URL;
    /** URL of the worker script (the built `worker.js`). Default: `worker.js` beside this module. */
    workerUrl?: string | URL;
    /** URL of the folder that holds ONNX Runtime's `.wasm` files. Default: the worker's folder. */
    wasmPaths?: string;
    /** The execution providers to try, in order, in place of the release's own list. */
    providers?: ExecutionProvider[];
    /** "pointer" (the default): analyze only around pointer activity. "always-on": analyze for as
     *  long as the session runs. */
    mode?: AnalysisMode;
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
/**
 * Start a session on an element. The release loads in the background (`status().state`); until
 * then, and whenever nothing can be said, `at` returns null.
 */
export declare function createSession(source: FrameSource, options: SessionOptions): Session;
