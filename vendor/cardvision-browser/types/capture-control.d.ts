import { type GateLimits, type GateState } from "./capture-gate.js";
import { type ComputeOut, type ComputeProtocol, type ShownCard } from "./compute-messages.js";
import { type GrabDeps } from "./page-capture.js";
import { type VideoWatch } from "./video-events.js";
/** The reasons the controller refuses a capture with. */
export declare const NOT_POINTING = "not pointing at the video";
export declare const CAPTURE_PENDING = "a capture is already pending";
export declare const PICTURE_CHANGED = "the video changed during the capture";
/** Why the controller cannot work with the compute frame. */
export type CaptureProblem = 
/** The frame speaks another version of the contract: nothing is captured until a frame that
 *  speaks this one says `ready`. Reloading the page (or the extension) usually mends it. */
{
    kind: "version";
    expected: number;
    received: unknown;
}
/** No `ready` came after every `hello`, or the iframe kept its first `about:blank` for a minute
 *  (nothing loaded in it). A `ready` that comes later is still taken. */
 | {
    kind: "no-answer";
};
export interface CaptureControlOptions {
    /** The messages' protocol, with the extension's tag (`computeProtocol(tag)`). */
    protocol: ComputeProtocol;
    /** The compute frame's window (the iframe's `contentWindow`), or null while there is none. */
    frame: () => Window | null;
    /** The compute frame's origin (the extension's). Messages go only there and are taken only
     *  from there. */
    frameOrigin: string;
    /** The clock, in ms; default `performance.now()`. */
    now?: () => number;
    /** Where a trusted point counts: its position in fractions of the picture, or null when it
     *  does not count (outside the picture, over the product's own controls). Asked on every
     *  pointer event and again before every capture. Default: inside the watched video's picture
     *  (`pictureBox` and `fractionIn`), geometry only: something laid over the video is caught
     *  only by an `eligible` that hit-tests (for example with `document.elementsFromPoint`). */
    eligible?: (clientX: number, clientY: number, video: HTMLVideoElement) => {
        x: number;
        y: number;
    } | null;
    /** What a tooltip shows now (null: nothing). Called after the controller has noted it. */
    onShown?: (card: ShownCard | null) => void;
    /** The compute frame's status. */
    onStatus?: (status: Extract<ComputeOut, {
        kind: "status";
    }>) => void;
    /** The controller cannot work with the frame (see `CaptureProblem`). */
    onProblem?: (problem: CaptureProblem) => void;
    /** How many `hello`s `connect` sends at most; default 10 (about 16 s, see `helloDelayMs`). */
    helloRetries?: number;
    /** The wait before the n-th `hello` is sent again (n from 0); default 250 ms doubling up to 2 s. */
    helloDelayMs?: (attempt: number) => number;
    /** The gate's windows; default the scheduler's, and the `MAX_REST_MS` cap. */
    limits?: GateLimits;
    /** Passed to `grabFrame`. */
    grab?: GrabDeps;
    /** "page": a trusted pointer move anywhere in the document, while the watched video plays and
     *  at most once a second, sends an `intent` message to the frame. Off when absent. */
    intent?: "page";
    /** Opt in to dropping the whole compute frame when it goes idle. When the frame reports the
     *  status `idle` (start it with `idleUnloadMs`), the control calls `remove()` once and sends
     *  nothing more to that frame. The next trusted pointer move over the watched video calls
     *  `make()` once. An `intent` moment (a trusted move anywhere while the video plays, with
     *  `intent: "page"`) does not: while the frame is removed it does nothing and sends nothing,
     *  because rebuilding on any page move cost more than it saved for viewers who do not hover. The control then connects
     *  to the new frame as it does for any replaced iframe, so `frame()` must return the new frame's
     *  window once `make()` returns. A trusted `pointerdown` over the picture (a touch tap) makes the
     *  frame too. After `make()` the usual `no-answer` problem can fire if the frame never answers;
     *  the product handles it as it does for its first frame. If `make()` throws, the control stays
     *  in the removed state (the throw is not reported: no problem kind fits) and only the next
     *  trusted move or tap over the video tries again (a move elsewhere on the page does not). A frame the product makes and connects itself also ends the removed state,
     *  so do not make the frame on your own load triggers while `control.frameRemoved` is true:
     *  `loadWhen` fires once, so it is safe, but a reload on every `playing` event (a looping clip
     *  fires one) would quietly undo the unload.
     *
     *  The product deletes the iframe in `remove` and creates a new one in `make`: the same function
     *  it gives `loadWhen` works. Dropping the frame frees its renderer (about 90 MB on a real
     *  release) that keeping the frame and ending only its worker does not. Without this option an
     *  idle frame stays and reloads in place when a pointer or intent message reaches it. */
    whenIdle?: {
        remove(): void;
        make(): void;
    };
    /** Timers; default the global `setTimeout` / `clearTimeout`. */
    timers?: {
        set(fn: () => void, ms: number): unknown;
        clear(handle: unknown): void;
    };
}
export interface CaptureControl {
    /** Watch this video (null: none). Another video clears the gate and reports a new source to
     *  the frame; the same video again does nothing. */
    attach(video: HTMLVideoElement | null): void;
    /** Take trusted pointer events, and the document's `visibilitychange`, on this window in the
     *  capture phase (`doc` is the window's document). Call as early as the content script runs. Returns the call that stops listening. */
    listen(win: Window, doc: Document): () => void;
    /** Say `hello` to the compute frame until it says `ready` (at most `helloRetries` times). Call
     *  after making or replacing the iframe. */
    connect(): void;
    /** Hand every `message` event of the window here; returns whether it was the frame's. */
    onMessage(event: MessageEvent): boolean;
    /** The video watched now, or null. Date your own messages with `watch.mediaTime()`. */
    readonly watch: VideoWatch | null;
    /** Whether a compatible frame said `ready` (and is still the frame). */
    readonly connected: boolean;
    /** With `whenIdle`: true from the call to `remove()` until the next accepted handshake, so a
     *  product can check it before making a frame of its own. Always false without the option. */
    readonly frameRemoved: boolean;
    /** The gate's four fields now (a copy, for diagnostics). */
    gateState(): GateState;
    /** Whether a capture would be allowed now. A trusted point no longer over the picture clears
     *  the gate. */
    captureAllowedNow(): boolean;
    /** Stop: no listeners, no watch, no timers; nothing is sent after this. */
    stop(): void;
}
/**
 * Whether a `message` event comes from one of the extension's own frames: trusted (dispatched by
 * the browser, not made by a page script, which can forge `source` and `origin`), from `frame`
 * (the iframe's `contentWindow`) and from `origin` (the extension's). It does not read
 * `event.data`. Use it for every message from one of your own frames (the compute frame, a
 * tooltip frame) before reading its data.
 */
export declare function fromExtensionFrame(event: MessageEvent, frame: Window | null, origin: string): boolean;
/**
 * A `ComputeOut` from your own compute frame, or null: `fromExtensionFrame` first, and only then
 * is the data read and parsed.
 */
export declare function acceptComputeOut(event: MessageEvent, { frame, origin, protocol }: {
    frame: Window | null;
    origin: string;
    protocol: ComputeProtocol;
}): ComputeOut | null;
/**
 * Post a message that transfers `bitmap`, and own up to failure: when posting throws (the
 * target is gone, the bitmap cannot be cloned), the bitmap is still the caller's and is closed
 * here. A bitmap that was transferred is not touched. Returns whether it was sent.
 */
export declare function postWithTransfer(target: Window | null, message: unknown, targetOrigin: string, bitmap: ImageBitmap): boolean;
/** The least time between two `intent` messages, in ms. */
export declare const INTENT_INTERVAL_MS = 1000;
/** The part of a video `loadWhen` uses. */
export type PlayWatch = Pick<HTMLVideoElement, "paused" | "ended" | "addEventListener" | "removeEventListener">;
/**
 * Call `make` once when `video` is playing: at once if it already is (not paused, not ended),
 * else at its next `playing` event. Never for a paused or ended video, never twice. The result's
 * `stop()` removes the listener (and is safe to call after `make` ran). Use it to make the
 * compute frame at play rather than at the first pointer move.
 */
export declare function loadWhen(video: PlayWatch, when: "play", make: () => void): {
    stop(): void;
};
/** The page side of the two-frame contract: see the top of this file. */
export declare function createCaptureControl(options: CaptureControlOptions): CaptureControl;
