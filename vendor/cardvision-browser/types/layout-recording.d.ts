import type { Box, Layout, Observation, Region, Transform } from "./layout-fit.js";
import { type LayoutConfig, type LayoutSource, type Verdict } from "./layout-state.js";
export declare const LAYOUT_RECORDING_SCHEMA = "layout-recording/1";
/** A scene's true placement is unusable when a solve's marker error exceeds this many pixels,
 *  or two solves disagree by more at a fiducial point. */
export declare const MAX_TRUTH_RESIDUAL_PX = 2;
/** Where solves are compared: points of the layout's unit square (corners inset by 0.05, and the
 *  center). */
export declare const FIDUCIAL_POINTS: ReadonlyArray<{
    x: number;
    y: number;
}>;
export declare const SCENE_CLASSES: readonly ["supported-game", "two-region", "negative-no-faces", "negative-gallery", "negative-other-layout", "transition"];
export type SceneClass = (typeof SCENE_CLASSES)[number];
export interface SceneTruth {
    /** The layout's unit square in the frame (frame fractions); null for a scene with no layout to
     *  place (a negative scene). */
    region: Region | null;
    /** The largest marker error of the solve, in pixels. */
    residualPx: number;
    /** The visible captured area, frame fractions. */
    mask: Box;
    /** Areas painted over the picture, frame fractions. */
    blockers: Box[];
    /** Repeated solves during the scene, each with the placement it found (null in a negative
     *  scene). */
    solves: Array<{
        atMs: number;
        residualPx: number;
        region: Region | null;
    }>;
}
export interface Scene {
    id: string;
    class: SceneClass;
    startMs: number;
    endMs: number;
    truth?: SceneTruth;
}
export type ClockStatus = "ok" | "undecodable" | "missing";
export interface RecordedFrame {
    index: number;
    capturedAtMs: number;
    image: string;
    clock: {
        status: ClockStatus;
        streamTimeMs?: number;
    };
    analysis: {
        durationMs: number;
        faces: number;
        observations: Observation[];
    };
}
export interface LayoutCandidate {
    key: string;
    producedAtMs: number;
    arrivedAtMs: number;
    layout: Layout;
}
export interface LayoutRecording {
    schema: typeof LAYOUT_RECORDING_SCHEMA;
    frame: {
        width: number;
        height: number;
    };
    cadenceProfiles: Array<{
        name: string;
        intervalMs: number;
    }>;
    scenes: Scene[];
    frames: RecordedFrame[];
    candidates: LayoutCandidate[];
    /** What the reader set aside: a malformed clock or truth, by its path. */
    problems: string[];
}
/** Read and check a `layout-recording/1` document; throws naming the first bad field that
 *  replay needs. */
export declare function readLayoutRecording(json: unknown): LayoutRecording;
/** The candidates a picture captured at `capturedAtMs` may be offered: those that had arrived,
 *  in arrival order. */
export declare function offeredCandidates(rec: LayoutRecording, capturedAtMs: number): LayoutCandidate[];
/** The newest candidate that had arrived by `capturedAtMs`; null for none. */
export declare function latestOffered(rec: LayoutRecording, capturedAtMs: number): LayoutCandidate | null;
/** The truth state of a frame: the candidate produced nearest before (or at) its decoded stream
 *  time. Null when its clock was not decoded or nothing was produced by then. */
export declare function truthCandidate(rec: LayoutRecording, frame: RecordedFrame): LayoutCandidate | null;
/** Can a frame's clock time it: decoded, with a finite stream time? */
export declare function clockUsable(clock: RecordedFrame["clock"] | null | undefined): boolean;
/** Frames usable for time-dependent measurements (clock decoded), and how many were left out. */
export declare function timedFrames(rec: LayoutRecording): {
    frames: RecordedFrame[];
    excluded: number;
};
/** The scene a time falls in (start inclusive, end exclusive); null when none. */
export declare function sceneAt(rec: LayoutRecording, atMs: number): Scene | null;
/**
 * Is a scene's true placement usable? It must be present, its residual and every solve's within
 * `MAX_TRUTH_RESIDUAL_PX`, and the region and every solve must agree: no two of them may put a
 * fiducial point more than that many pixels apart (on either axis, in a frame of
 * `frame.width` × `frame.height`). Null for a scene with no placement to judge
 * (`region: null`, a negative scene); false for a scene without a truth.
 */
export declare function truthUsable(scene: Scene, frame: {
    width: number;
    height: number;
}): boolean | null;
/** A region as the placement it stands for. */
export declare function regionToTransform(r: Region): Transform;
/** A recording as a layout source: the newest arrived candidate; the window is that candidate's
 *  identities. */
export declare function recordingSource(rec: LayoutRecording): LayoutSource;
/** The scheduler policy the driver replays through: the toolkit's `FrameScheduler` in "layout"
 *  mode fits, and so does any product scheduler with these three calls. */
export interface ProbeScheduler {
    framePresented(): void;
    due(nowMs: number): boolean;
    started(nowMs: number): void;
}
export interface ReplayAnalysis {
    frameIndex: number;
    startedAtMs: number;
    endedAtMs: number;
    /** It ended after the next analysis was due. */
    late: boolean;
}
export interface ReplayStep {
    frameIndex: number;
    atMs: number;
    result: Verdict;
}
export interface Replay {
    /** The verdict at every frame, after any analysis that ended by then. */
    steps: ReplayStep[];
    analyses: ReplayAnalysis[];
}
export interface ReplayOptions {
    /** The product's configuration; its `intervalMs` is replaced by the profile's. */
    config: LayoutConfig;
    /** The cadence profile's name in the recording. */
    profile: string;
    /** Makes the scheduler for an interval, e.g. a `FrameScheduler` in "layout" mode. */
    scheduler: (intervalMs: number) => ProbeScheduler;
    /** Where layouts come from; the recording's own candidates by default. */
    source?: LayoutSource;
    exclude?: (identity: string) => boolean;
}
/** Replay a recording through a scheduler and the state machine (one generation). */
export declare function replayRecording(rec: LayoutRecording, options: ReplayOptions): Replay;
