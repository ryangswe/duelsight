import { type ComputeProtocol, type ShownCard } from "./compute-messages.js";
import type { SessionCore } from "./session-core.js";
import { type ReleaseInEffect, type WorkerSessionEnv } from "./worker-session.js";
/** The part of the compute frame's window used here. */
export interface ComputeFrameWindow {
    parent: {
        postMessage(message: unknown, targetOrigin: string): void;
    };
    addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
    removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
}
export interface ComputeFrameEnv extends Omit<WorkerSessionEnv, "capture" | "onShown" | "onStatus"> {
    /** The frame's own window (`window`). */
    win: ComputeFrameWindow;
    /** Whether the frame is inside another page at all (`window.parent !== window`). */
    framed: boolean;
    /** The embedding page's origin (`location.ancestorOrigins[0]`), or null. */
    parentOrigin: string | null;
    /** Whether the frame may serve a page of this origin (the extension's own list). */
    allowedParentOrigin(origin: string): boolean;
    /** The contract under the extension's tag (`computeProtocol(tag)`). */
    protocol: ComputeProtocol;
    /** A card is about to be posted as shown (null: nothing is shown), with the release in effect.
     *  Called before every post, the one answering a `hello` included. */
    onShown?(card: ShownCard | null, release: ReleaseInEffect): void;
    /** Makes the frame's `instance` (16 lowercase hex characters); random by default. For tests. */
    instanceId?(): string;
}
export interface ComputeFrame {
    /** Null only while `chooseRelease` decides. */
    readonly core: SessionCore | null;
    /** Recognition is off for good in this page. */
    readonly stopped: boolean;
    readonly restarts: number;
    readonly release: ReleaseInEffect;
    /** The `instance` this frame says in `ready`. */
    readonly instance: string;
    /** Call every `DRIVER_TICK_MS`. */
    tick(): void;
    /** End the worker and the core, and stop listening. */
    stop(): void;
}
/** Start the compute frame, or return null when it is not inside a page it may serve. */
export declare function startComputeFrame(env: ComputeFrameEnv): ComputeFrame | null;
