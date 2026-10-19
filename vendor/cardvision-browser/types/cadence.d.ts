import type { ExecutionProvider } from "./providers.js";
export type AnalysisMode = "pointer" | "always-on";
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
/** The interval a scheduler is armed with for an execution provider in an analysis mode. */
export declare function cadenceMs(ep: ExecutionProvider | null, mode: AnalysisMode): number;
/** Whether this device runs the slower cadences. */
export declare function isSlowDevice(ep: ExecutionProvider | null): boolean;
