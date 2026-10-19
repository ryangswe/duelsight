import type { ExecutionProvider } from "./providers.js";
/**
 * Most crops one model run takes. A frame can ask for every proposal at once (up to the
 * detector's maximum) and then for three turned looks of each one retried; in a single run that
 * would be tens of megabytes of input and its activations, on a GPU that may be integrated. An
 * embedding depends on its own crop alone, so running in parts gives the same values.
 */
export declare const EMBED_MAX_BATCH = 32;
/** What the frame recognition needs from an embedding model. Tests supply their own. */
export interface BatchEmbedder {
    /** `n` preprocessed crops, concatenated, to `n` embeddings, concatenated in the same order. */
    embedBatch(data: Float32Array, n: number): Promise<Float32Array>;
}
/**
 * Run `n` concatenated crops through `run`, at most `maxBatch` at a time, and concatenate the
 * outputs in crop order (`n * dim` values). A batch that fits is one run.
 */
export declare function embedInChunks(run: (data: Float32Array, n: number) => Promise<Float32Array>, data: Float32Array, n: number, dim: number, maxBatch?: number): Promise<Float32Array>;
/** The recognizer's tensor names and sizes, as a release document states them. */
export interface EmbedderSettings {
    inputName: string;
    outputName: string;
    /** Side of the square input, in pixels (the preprocessing contract's size). */
    inputSize: number;
    /** Length of one embedding. */
    dim: number;
}
export declare class Embedder implements BatchEmbedder {
    private readonly session;
    /** The execution provider that initialized. */
    readonly ep: ExecutionProvider;
    private readonly settings;
    private constructor();
    /**
     * Create a session on the first of `providers` that initializes and returns embeddings of
     * the stated size for one blank crop. That first run also pays the one-off allocation and
     * shader compilation, away from the first real frame. Returns null when no provider does.
     */
    static create(modelBytes: Uint8Array, settings: EmbedderSettings, providers: readonly ExecutionProvider[]): Promise<Embedder | null>;
    /** Embed `n` preprocessed crops (concatenated channel-first tensors). The model normalizes
     *  its output to unit length. */
    embedBatch(data: Float32Array, n: number): Promise<Float32Array>;
    private run;
    release(): Promise<void>;
}
