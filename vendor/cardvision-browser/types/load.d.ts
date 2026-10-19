import type { Frame } from "./detector/detector.js";
import type { Cv } from "./geometric/features.js";
import { type GeometricStage, type StageIndex, type StageVoter } from "./geometric/stage.js";
import type { FrameAnalysis, Pipeline } from "./pipeline.js";
import type { ExecutionProvider } from "./providers.js";
import { type CatalogCard, type ReleaseDeps, type VisionRelease } from "./release.js";
/** A release could not be loaded. `reason` says why; nothing was loaded. */
export declare class ReleaseError extends Error {
    readonly reason: string;
    constructor(reason: string);
}
export interface LoadOptions {
    /** URL of the folder that holds ONNX Runtime's `.wasm` files. Needed in a browser unless
     *  they sit beside the script; leave it out under Node. */
    wasmPaths?: string;
    /** The execution providers to try, in order, in place of the release's own list. */
    providers?: readonly ExecutionProvider[];
    /** How bytes are fetched and hashed, in place of `fetch` and the Web Crypto API. */
    deps?: Partial<ReleaseDeps>;
}
/** A release that loaded whole: its document, its catalog and a pipeline ready for frames. */
export interface LoadedRelease {
    release: VisionRelease;
    pipeline: Pipeline;
    /** The execution provider each model runs on. */
    backend: {
        detector: ExecutionProvider;
        recognizer: ExecutionProvider;
    };
    /** The catalog's cards, and card id to name. */
    cards: CatalogCard[];
    names: Map<string, string>;
    /** What a geometric stage must serve: the bank's SHA-256 and card ids, and card id to
     *  identity key for the vote (the catalog's rule with the release's groups over it). */
    stageInputs: {
        bankSha256: string;
        bankIds: string[];
        identities: Map<string, string>;
    };
    /** Free the models. */
    dispose(): Promise<void>;
}
/**
 * Load the release whose document is at `releaseUrl`: fetch it and every file it pins, check
 * each against its size and SHA-256 and against the others, and start both models. The
 * document's paths are relative to it. All-or-nothing: any failure rejects with a
 * `ReleaseError` and nothing stays loaded.
 */
export declare function loadRelease(releaseUrl: string | URL, options?: LoadOptions): Promise<LoadedRelease>;
/**
 * Analyze one frame with a loaded release. `frame` is RGBA pixels already at analysis size
 * (an `ImageData` fits; `analysisSize` in capture.ts gives the size for a picture). Frames of
 * one video are expected in order, one call at a time; pass `videoTimeSec` so that a seek
 * resets what is carried between frames.
 */
export declare function analyzeFrame(loaded: LoadedRelease, frame: Frame, videoTimeSec?: number): Promise<FrameAnalysis>;
/** The loaders of a geometric stage's three parts. */
export interface GeometricLoaders {
    loadIndex(manifestUrl: string, opts: {
        bankSha256: string;
        bankIds: string[];
    }): Promise<StageIndex>;
    loadCv(): Promise<Cv>;
    makeVoter(desc: Uint8Array): Promise<StageVoter>;
    fetchText?: (url: string) => Promise<string>;
}
/**
 * Open the geometric stage whose settings document is at `settingsUrl` for a loaded release:
 * its packed index must serve the release's bank. It is not set on the pipeline: the caller
 * does that between frames (`Pipeline.setGeometric`). Rejects with the reason it cannot run.
 * `note` warns when the index was taken by another OpenCV version than the one loaded.
 */
export declare function loadGeometric(loaded: Pick<LoadedRelease, "stageInputs">, settingsUrl: string | URL, loaders: GeometricLoaders): Promise<{
    stage: GeometricStage;
    bytes: number;
    note: string | null;
}>;
