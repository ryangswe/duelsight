import { type ClientBox } from "../capture.js";
/** The narrowest video that can be the main one, in CSS pixels. */
export declare const MIN_VIDEO_WIDTH = 320;
/** A pick is kept this long before a pointer move picks again. */
export declare const VIDEO_RECHECK_MS = 1000;
/** The page, as the pick needs it: its videos, in page order. A `Document` fits. */
export interface VideoSource {
    querySelectorAll(selector: "video"): Iterable<HTMLVideoElement>;
}
/** The main video of `doc` now: the largest by area among those wide enough and with a picture;
 *  the first of equals. Null when there is none. */
export declare function pickMainVideo(doc: VideoSource): HTMLVideoElement | null;
/** Where the video's picture sits on the page, for its `object-fit`. */
export declare function pictureOf(video: HTMLVideoElement): ClientBox;
export interface VideoPickEnv {
    doc: VideoSource;
    now?: () => number;
    /** The main video changed (to another video, or to none). Called after the pick is stored. */
    onChange(video: HTMLVideoElement | null): void;
}
export interface VideoPick {
    /** The main video: the kept pick while it is connected and was made less than a second ago,
     *  otherwise a new pick. A result of "no video" is kept for up to a second too: this differs from
     *  products that scan again on every call while no video exists, and follows S-G4's "at most
     *  once a second", which has no exception for none. A trusted `playing` always picks again at
     *  once. Call it on a trusted pointer move or whenever the pick is wanted. */
    current(): HTMLVideoElement | null;
    /** A `playing` event: picks again now when the event is trusted, whatever its target. Returns
     *  the main video; an untrusted event changes nothing and returns the kept pick. */
    onPlaying(event: Pick<Event, "isTrusted">): HTMLVideoElement | null;
    /** Forget the pick without calling `onChange` (the host is stopping or the page is not active). */
    clear(): void;
}
export declare function createVideoPick(env: VideoPickEnv): VideoPick;
