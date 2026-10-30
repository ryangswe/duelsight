import { type CaptureSource, type SourceCanvas } from "./page-capture.js";
export interface VideoSink {
    /** The video presented a picture at this time (see `mediaTimeOf`). */
    presented(mediaTime: number): void;
    /** A seek started (`newSource` false), or the video was given another source (true). */
    discontinuity(newSource: boolean): void;
}
export interface VideoWatch extends CaptureSource {
    /** The video watched. */
    readonly video: HTMLVideoElement;
    /** The time the video showed while it last played; null before it played, and after a new
     *  source. */
    readonly lastPlayingTime: number | null;
    /** The canvas record for the current source: replaced on a new source. */
    readonly source: SourceCanvas;
    /** The time of the picture on screen now (`mediaTimeOf` with this watch). */
    mediaTime(): number;
    /** Stop listening. */
    detach(): void;
}
/** Follow one video. Attaching does not report anything: the caller reports a new video as a
 *  new source itself (it may also have no video at all). */
export declare function watchVideo(video: HTMLVideoElement, sink: VideoSink): VideoWatch;
