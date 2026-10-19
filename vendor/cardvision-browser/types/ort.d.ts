import * as ort from "onnxruntime-web/all";
import type { ExecutionProvider } from "./providers.js";
/** The version of onnxruntime-web this build runs on. */
export declare function ortWebVersion(): string;
/**
 * Set the runtime's global options. `wasmPaths` is the URL of the folder that holds ONNX
 * Runtime's `.wasm` files (in a browser they are fetched from there; under Node, leave it out
 * and the package's own files are used).
 */
export declare function configureOrt(options?: {
    wasmPaths?: string;
    wasmThreads?: number;
}): void;
/** The reasons collected since the last call, for an error message; the list is emptied. */
export declare function takeSessionFailures(): string[];
export interface OpenSession {
    session: ort.InferenceSession;
    /** The execution provider that initialized. */
    ep: ExecutionProvider;
}
/**
 * Create a session from model bytes on the first provider of `providers` that initializes and
 * passes `check` (a warm-up run that also verifies the model's shapes). Returns null when none
 * does. A session that fails its check is released before the next provider is tried.
 */
export declare function createSession(modelBytes: Uint8Array, providers: readonly ExecutionProvider[], check: (session: ort.InferenceSession) => Promise<boolean>): Promise<OpenSession | null>;
export declare function float32Tensor(data: Float32Array, dims: readonly number[]): ort.Tensor;
export type { InferenceSession } from "onnxruntime-web/all";
export type { ExecutionProvider };
