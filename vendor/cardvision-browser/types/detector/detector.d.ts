import type { Candidate } from "../boxes.js";
import type { ExecutionProvider } from "../providers.js";
import { type DecodeSettings } from "./decode.js";
import { type LetterboxSettings } from "./letterbox.js";
/** An RGBA frame: row-major, four bytes per pixel. */
export interface Frame {
    data: Uint8ClampedArray | Uint8Array;
    width: number;
    height: number;
}
/** Everything a release document states about its detector that the runtime acts on. */
export interface DetectorSettings {
    inputName: string;
    outputName: string;
    letterbox: LetterboxSettings;
    /** Rows the model emits for one frame. */
    anchors: number;
    /** Class names, in the order of the model's class scores. */
    classes: readonly string[];
    decode: DecodeSettings;
    /** The class whose boxes go to the recognizer. */
    faceClass: number;
    /** The shortest side a box's crop may have, in pixels of the analyzed frame. */
    minCropPx: number;
}
/** What the pipeline needs from a detector. Tests supply their own. */
export interface FrameDetector {
    /** Every valid box of one analysis frame at the detector's operating point, best first. */
    propose(frame: Frame): Promise<Candidate[]>;
    /** How long the last `propose` spent preparing the input and running the model, in ms. */
    readonly lastTimings: {
        preprocessMs: number;
        inferMs: number;
    } | null;
}
export declare class Detector implements FrameDetector {
    private readonly session;
    /** The execution provider that initialized. */
    readonly ep: ExecutionProvider;
    private readonly settings;
    lastTimings: {
        preprocessMs: number;
        inferMs: number;
    } | null;
    private readonly columns;
    private constructor();
    /**
     * Create a session on the first of `providers` that initializes and, for one blank frame,
     * returns rows of the stated layout: `[1, anchors, 5 + classes]`. Returns null when no
     * provider does, which includes a model of another layout.
     */
    static create(modelBytes: Uint8Array, settings: DetectorSettings, providers: readonly ExecutionProvider[]): Promise<Detector | null>;
    propose(frame: Frame): Promise<Candidate[]>;
    release(): Promise<void>;
}
