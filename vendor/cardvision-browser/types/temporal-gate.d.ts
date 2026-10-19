/** k: consecutive frames needed to start showing, and to stop. */
export declare const CONFIRM_FRAMES = 3;
export interface TemporalGateStep {
    /** Whether the track layer may be shown after this frame. */
    confirmed: boolean;
    /** Length of the current run of frames that recognized a card (0 after one that did not). */
    consecutive: number;
}
export declare class TemporalGate {
    private readonly k;
    private run;
    private misses;
    private showing;
    constructor(k?: number);
    /** The picture is no longer continuous with the last one: back to not showing, with no run. */
    reset(): void;
    /** Feed one analyzed frame: did it recognize at least one card? */
    observe(recognized: boolean): TemporalGateStep;
}
