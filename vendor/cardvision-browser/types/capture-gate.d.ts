import { POINTER_GRACE_MS, READING_LINGER_MS } from "./frame-scheduler.js";
export { POINTER_GRACE_MS, READING_LINGER_MS };
/** The longest a picture is given after the last trusted pointer event, whatever else holds:
 *  a card showing or the linger after one does not stretch it. */
export declare const MAX_REST_MS = 60000;
export interface GateState {
    /** The pointer is over the picture (from trusted events only). */
    inside: boolean;
    /** The last trusted pointer event over the picture; -Infinity for none. */
    lastTrustedPointerAt: number;
    /** A card is showing now. */
    tooltipShowing: boolean;
    /** The last time a card was showing; -Infinity for never. */
    lastTooltipAt: number;
}
export interface GateLimits {
    /** How long after a trusted pointer event pictures are given, in ms. */
    graceMs?: number;
    /** How long after a card last showed pictures are still given, in ms. */
    lingerMs?: number;
    /** The most time after a trusted pointer event any picture is given, in ms; default
     *  `MAX_REST_MS`. */
    restMs?: number;
}
/** Whether a picture may be given to the compute frame now. */
export declare function captureAllowed(state: GateState, now: number, { graceMs, lingerMs, restMs }?: GateLimits): boolean;
