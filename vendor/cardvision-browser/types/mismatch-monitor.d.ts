export interface MonitorParams {
    /** Counted analyses in the window; also the length of the recovery run. */
    window: number;
    /** Distinct accepted identities needed before the share means anything. */
    minIdentities: number;
    /** Trip when the share falls strictly below this. */
    trip: number;
    /** Recover after `window` consecutive counted analyses at or above this. */
    recover: number;
}
/** The toolkit's defaults: 10 counted analyses, 3 identities, trip below 0.4, recover at 0.7. */
export declare const MONITOR_DEFAULTS: MonitorParams;
export type MonitorState = "unknown" | "in" | "tripped";
export interface MonitorInput {
    /** The identities the product's source offered around this instant; empty: not counted. */
    windowIdentities: ReadonlySet<string>;
    /** Identities the recognizer accepted in this analysis. */
    accepted: Iterable<string>;
}
export interface MonitorStep {
    state: MonitorState;
    /** "trip" or "recover" when this analysis changed the state that way; else null. */
    event: "trip" | "recover" | null;
    /** Distinct accepted identities in the window. */
    identities: number;
    /** Their in-share, or null when there are none. */
    share: number | null;
    /** Whether this analysis was counted. */
    counted: boolean;
}
export declare class MismatchMonitor {
    private readonly params;
    private readonly exclude;
    private window;
    private stateValue;
    private recoverRun;
    constructor(options?: {
        exclude?: (identity: string) => boolean;
        params?: MonitorParams;
    });
    get state(): MonitorState;
    get tripped(): boolean;
    /** The share over the current window, or null with no identities. */
    get share(): number | null;
    observe(input: MonitorInput): MonitorStep;
    /** Geometry confirmed the layout: forget the trip and the identities behind it, so that only
     *  evidence gathered after the confirmation can trip it again. A scene with a persistently low
     *  share beside a board that keeps verifying can still trip and clear at the window's period. */
    clearTrip(): void;
    reset(): void;
    private summary;
}
