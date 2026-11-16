import type { ClientBox } from "../capture.js";
import type { ShownCard } from "../compute-messages.js";
/** The view frame as the adapter may touch it. The host keeps its visibility, stacking and
 *  pointer-events (always none), and makes, moves and removes it. */
export interface ViewFrame {
    /** Works while the frame is hidden and before it has loaded. Width and height are applied
     *  exactly as given and at once: no rounding, no deferral (a frame that waits for its window to
     *  reach the size it reported does not fit). The host applies the box, plus
     *  overflow:hidden with border-radius = cornerRadius; z-index 2147483646 is the host's. */
    place(box: {
        left: number;
        top: number;
        width: number;
        height: number;
        cornerRadius: number;
    }): void;
    /** Post to the frame at the extension's origin. False when it has no window yet. */
    post(message: unknown): boolean;
}
export interface ViewLayout {
    picture: ClientBox;
    card: ClientBox;
    others: ClientBox[];
    viewport: {
        width: number;
        height: number;
    };
    minTop: number;
    visible: boolean;
}
export interface ViewAdapter {
    readonly look: {
        title: string;
        shadow: string;
    };
    /** A new view frame exists (first made, made again, moved for full screen, removed by the page
     *  and made again): forget the last one, including the last box placed. Straight after attach()
     *  the host calls show() for the displayed or held card, if any, without waiting for a new one. */
    attach(frame: ViewFrame): void;
    /** The view frame is gone (off, idle, removed by the page). */
    detach(): void;
    /** A message the host has checked (trusted, from the view frame's window, the extension's
     *  origin). True when readiness or the measured size changed: the host then shows again. */
    message(data: unknown): boolean;
    /** Size and place the frame for `card` and tell the frame which card it is. True once the frame
     *  has measured itself for this card; the host shows the frame and the outline only then. */
    show(card: ShownCard, layout: ViewLayout): boolean;
    hide(): void;
}
/** The extension's frames in the page: `all:initial` first, so none of the page's styles for
 *  iframes reach them. */
export declare const FRAME_STYLE = "all:initial;position:fixed;display:block;border:0;margin:0;padding:0;background:transparent;color-scheme:normal;transform:none;filter:none;";
/** The view frame's stacking: over the player and the outline (2147483645). */
export declare const VIEW_Z_INDEX = 2147483646;
/** Where the view frame and the outline go: in full screen only the full-screen element is drawn,
 *  so inside it (unless it is the video or a frame, which cannot hold children); else the root. */
export declare function mountHost(doc: Document): Element;
/** A new view frame, hidden, appended to `host`. The adapter places it in `attach()`. */
export declare function createViewFrame(doc: Document, host: Element, src: string, look: ViewAdapter["look"]): HTMLIFrameElement;
/** The handle the adapter gets for `frame`: placing it and posting to it, nothing else. */
export declare function viewFrameHandle(frame: HTMLIFrameElement, origin: string): ViewFrame;
/** Whether `event` is the view frame's own (S-B9): trusted, from its window, at the extension's
 *  origin. The data is not read before this holds. */
export declare function fromViewFrame(event: MessageEvent, frame: HTMLIFrameElement | null, origin: string): boolean;
