import type { ExecutionProvider } from "./providers.js";
export type AnalysisMode = "pointer" | "always-on" | "layout";
/** The modes a session runs. */
export type SessionMode = Exclude<AnalysisMode, "layout">;
/** The slow cadence on WebGPU, and before the execution provider is known. */
export declare const DEFAULT_ANALYZE_INTERVAL_MS = 1000;
/** The slow cadence on WebAssembly. */
export declare const WASM_ANALYZE_INTERVAL_MS = 2000;
/** The fast cadence on WebGPU, and before the execution provider is known. */
export declare const ACTIVE_ANALYZE_INTERVAL_MS = 500;
/** The fast cadence on WebAssembly. */
export declare const ACTIVE_WASM_ANALYZE_INTERVAL_MS = 1000;
/** The slow interval for the recognizer's execution provider (null: not known yet). */
export declare function analyzeIntervalMs(ep: ExecutionProvider | null): number;
/** The fast interval for the recognizer's execution provider (null: not known yet). */
export declare function activeAnalyzeIntervalMs(ep: ExecutionProvider | null): number;
/** The interval a scheduler is armed with for an execution provider in an analysis mode. In
 *  "layout" mode this is the pointer's fast cadence; the probe interval is the product's. */
export declare function cadenceMs(ep: ExecutionProvider | null, mode: AnalysisMode): number;
/** Whether this device runs the slower cadences. */
export declare function isSlowDevice(ep: ExecutionProvider | null): boolean;
/** Measured pacing: the share of time spent analyzing, by default. */
export declare const MEASURED_PACING_SHARE = 0.25;
/** Measured pacing: the longest wait while the pointer is active. */
export declare const MEASURED_PACING_ACTIVE_CEILING_MS = 4000;
/** Measured pacing: the longest wait in always-on mode. */
export declare const MEASURED_PACING_SLOW_CEILING_MS = 8000;
/** Measured pacing: the longest wait while the pointer rests ("reading"). A name stops showing
 *  `hoverMaxAgeMs` after its frame and the reading state ends `READING_LINGER_MS` after that, so a
 *  longer wait would never come due and analysis would stop until the pointer moved. */
export declare function readingCeilingMs(hoverMaxAgeMs: number): number;
/** Measured pacing: analyses measured before the measured wait applies. */
export declare const MEASURED_PACING_MIN_SAMPLES = 3;
/** Measured pacing: how many of the latest analyses the median is taken over. */
export declare const MEASURED_PACING_WINDOW = 5;
/** The `measuredPacing` option: `true` for the default share, or the share of time analysis may
 *  take, in (0, 1]. */
export type MeasuredPacingOption = boolean | {
    share?: number;
};
/** The share the option asks for, or null when pacing is off. Throws on a share outside (0, 1]. */
export declare function resolveMeasuredPacing(option: MeasuredPacingOption | undefined): number | null;
/** Which faces the geometric stage verifies: "all" (the default) or "focus", the faces at the
 *  pointer (`SessionOptions.geometricScope`). */
export type GeometricScope = "all" | "focus";
/** The scope a session runs. Throws on a value that is not a scope, and on "focus" outside
 *  pointer mode (it needs the pointer to say which faces to verify). */
export declare function resolveGeometricScope(scope: GeometricScope | undefined, mode: AnalysisMode | undefined): GeometricScope;
/** The median of the last `MEASURED_PACING_WINDOW` values. */
export declare function recentMedian(timesMs: readonly number[]): number;
/**
 * The wait between analyses under measured pacing.
 * @param fixedMs Today's fixed interval for the mode and backend: the wait is never shorter, and
 *   it is the wait until `MEASURED_PACING_MIN_SAMPLES` analyses have been measured.
 * @param ceilingMs The longest wait: `MEASURED_PACING_ACTIVE_CEILING_MS` while the pointer is
 *   active, `readingCeilingMs` while it rests, `MEASURED_PACING_SLOW_CEILING_MS` in always-on mode.
 * @param timesMs Measured analysis times, oldest first.
 * @param share The share of time analysis may take.
 */
export declare function pacedIntervalMs(fixedMs: number, ceilingMs: number, timesMs: readonly number[], share: number): number;
/** Learns the analysis time within one session (nothing is stored) and gives the waits. */
export declare class MeasuredPacer {
    private readonly share;
    private times;
    constructor(share: number);
    /** Record one analysis's measured time (the reply's `workerMs`); not a number: ignored. */
    record(ms: number): void;
    /** The wait in force: the fast cadence in pointer mode, the slow one in always-on mode. */
    intervalMs(ep: ExecutionProvider | null, mode: AnalysisMode): number;
    /** The wait while the pointer rests on a showing tooltip, capped by `readingCeilingMs`. */
    readingMs(ep: ExecutionProvider | null, hoverMaxAgeMs: number): number;
    /** The wait while the pointer is active. */
    activeMs(ep: ExecutionProvider | null): number;
    /** The wait in always-on mode. */
    slowMs(ep: ExecutionProvider | null): number;
}
