/** A box in fractions of the analyzed frame (0 to 1). */
export interface FractionBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
/** The card a pointer position shows, as the compute frame reports it. */
export interface ShownCard {
    cardId: string;
    name: string;
    /** The remote release the card was recognized with; absent for the bundled release. */
    releaseId?: string;
    box: FractionBox;
    /** The other cards of the same analysis (at most `MAX_OTHER_BOXES`), so that a tooltip can be
     *  placed off them. */
    others?: FractionBox[];
}
/** The two-frame contract's version. A content script and a compute frame work together only
 *  when they speak the same one: `hello` and `ready` carry it, and each side compares. */
export declare const PROTOCOL_VERSION = 1;
/** Content script -> compute frame. */
export type ComputeIn = 
/** Asks the compute frame to say `ready` again, with its current status and shown card (a
 *  content script that started late, or came back). Any number of times; answered only once
 *  the frame can take messages. `version`: the content script's `PROTOCOL_VERSION`. */
{
    kind: "hello";
    version: number;
}
/** The pointer over the picture, in fractions of the picture; `mediaTime` is the video's time. */
 | {
    kind: "pointer";
    x: number;
    y: number;
    mediaTime: number;
    touch: boolean;
}
/** The pointer left the picture. */
 | {
    kind: "leave";
}
/** The video presented a new frame (playback, a seek ended, the video became ready). */
 | {
    kind: "presented";
    mediaTime: number;
}
/** A seek started, or the video was given another source (`newSource`). */
 | {
    kind: "discontinuity";
    newSource: boolean;
}
/** The picture was cut to another without a seek (reserved: no page helper sends it yet). */
 | {
    kind: "cut";
}
/** The picture asked for by `capture`, at analysis size. */
 | {
    kind: "frame";
    requestId: number;
    bitmap: ImageBitmap;
    mediaTime: number;
}
/** The picture asked for could not be had; `retry` when it is worth asking again. */
 | {
    kind: "capture-failed";
    requestId: number;
    reason: string;
    retry?: boolean;
};
/** Compute frame -> content script. */
export type ComputeOut = 
/** The frame can take messages. `version`: its `PROTOCOL_VERSION`. `instance`: 16 lowercase
 *  hex characters, made once per compute frame, so that a content script tells a new frame
 *  (reloaded or replaced) from the one it spoke to. Not a secret: the page can read it. */
{
    kind: "ready";
    version: number;
    instance: string;
} | {
    kind: "status";
    state: "loading" | "ready" | "failed";
    error: string | null;
    backend: string | null;
}
/** Capture the current picture at a width within `analysisWidth` and send it back as `frame`. */
 | {
    kind: "capture";
    requestId: number;
    analysisWidth: {
        min: number;
        max: number;
    };
}
/** What a tooltip shows for the pointer's position now; null for nothing. */
 | {
    kind: "shown";
    card: ShownCard | null;
};
/** The largest picture the compute frame takes, per side: above the widest analysis frame (1920)
 *  and any sane height at that width. A larger one (only a page posting to the frame could send
 *  it) is refused and closed. */
export declare const MAX_FRAME_SIDE = 4096;
/** The most other boxes a `shown` card carries; more are dropped. */
export declare const MAX_OTHER_BOXES = 40;
/** The longest `capture-failed` reason kept; a longer one is cut. */
export declare const MAX_REASON_LENGTH = 200;
/** The longest card id or name accepted; a status's longer error or backend is cut to it. */
export declare const MAX_TEXT_LENGTH = 200;
/** A message with the protocol's tag. */
export type Tagged<T> = T & {
    readonly [tag: string]: unknown;
};
export interface ComputeProtocol {
    /** The tag every message carries (`{ [tag]: 1 }`). */
    readonly name: string;
    /** The message with the tag added, ready to post. */
    tag<T extends object>(message: T): Tagged<T>;
    /** A content-script message, checked; null when it is not one. A bitmap in a `frame` message
     *  that is refused (too large, malformed) is closed. */
    parseComputeIn(data: unknown): ComputeIn | null;
    /** A compute-frame message, checked; null when it is not one. */
    parseComputeOut(data: unknown): ComputeOut | null;
}
/** The messages of the two-frame contract, under an extension's own tag (lowercase letters,
 *  digits and hyphens, starting with a letter, and not a field of the messages). */
export declare function computeProtocol(tag?: string): ComputeProtocol;
