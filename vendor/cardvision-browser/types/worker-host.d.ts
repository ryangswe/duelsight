import { type GeometricStage, GeometricWatchdog } from "./geometric/stage.js";
import type { LoadedRelease, LoadOptions } from "./load.js";
import { type WorkerReply, type WorkerRequest } from "./messages.js";
/** The pixels of a frame, as the pipeline takes them. */
export interface FramePixels {
    data: Uint8ClampedArray;
    width: number;
    height: number;
}
/** A WebGPU device, as far as the worker uses it: to learn of its loss. */
export interface VoteDevice {
    readonly lost: Promise<{
        reason: string;
        message: string;
    }>;
}
export interface WorkerHostDeps<D extends VoteDevice = GPUDevice> {
    post(reply: WorkerReply): void;
    loadRelease(url: string, options: LoadOptions): Promise<LoadedRelease>;
    /** The folder of ONNX Runtime's `.wasm` files when the request does not say. */
    wasmPaths: string;
    /** A WebGPU device for the vote, or null when this browser has none. */
    voteDevice(): Promise<D | null>;
    /** Open the stage on `device`. The stage owns the device: disposing of it frees both. */
    openStage(loaded: LoadedRelease, settingsUrl: string, device: D, manifestSha256: string | undefined): Promise<{
        stage: GeometricStage;
        bytes: number;
        note: string | null;
    }>;
    /** Free a device the stage never took (its load failed). */
    releaseDevice(device: D): void;
    /** The frame's pixels, or null when they cannot be read. */
    readBitmap(bitmap: ImageBitmap): FramePixels | null;
    now?: () => number;
    watchdog?: GeometricWatchdog;
}
/** The request handler of one worker. */
export declare function createWorkerHost<D extends VoteDevice>(deps: WorkerHostDeps<D>): {
    handle(request: WorkerRequest): Promise<void>;
};
