/** Where a `playing` loads (S-G3): a load-at-play page, a page that loads at the pointer, or a page
 *  that is not active. */
export type LifecyclePage = "play" | "pointer" | "inactive";
export type LifecyclePhase = "off" | "waiting" | "owed" | "live" | "idle";
export interface LifecycleState {
    readonly phase: LifecyclePhase;
    /** A keep-card flip arrived while the tab was hidden and a compute frame ran: the compute frame
     *  is made again when the tab comes to the front. Any new compute frame clears it. */
    readonly remakeOwed: boolean;
    /** A switch value has been applied, from the start-up read or from a flip. A start-up read that
     *  answers after a flip is dropped: the flip is newer (S-H1). */
    readonly switchHeard: boolean;
}
/** What the host knows at the moment of the event. An untrusted event reads no fact, so the host
 *  need not work any out for one. For every other event the host works the facts out itself,
 *  whatever the reducer reads: on every trusted `playing` while hovers are on and the page is
 *  active, it picks the main video again (S-G4), in every phase, also with both frames made and
 *  after an idle removal. On a page that is not active it picks nothing (S-G5). */
export interface LifecycleFacts {
    /** The tab is in front (`document.visibilityState !== "hidden"`). */
    readonly visible: boolean;
    /** The page policy now, from `location.href`. */
    readonly page: LifecyclePage;
    /** The main video exists and is not paused. On every trusted `playing` while hovers are on and
     *  the page is active, the host picks the main video again before the step, whatever the event's
     *  target and whether or not the reducer reads this (S-G4); on an untrusted one, or on a page
     *  that is not active, it picks nothing. */
    readonly mainPlaying: boolean;
    /** Which of the host's frames are in the page now (a page script may have removed one). */
    readonly frames: {
        readonly compute: boolean;
        readonly view: boolean;
    };
}
export type LifecycleEvent = 
/** The `enabled` switch: the start-up read (`from: "read"`), which counts as a switch-on when it
 *  answers on, or a real flip seen by the watch (`from: "flip"`). The host subscribes before it
 *  reads. */
{
    readonly type: "switch";
    readonly on: boolean;
    readonly from: "read" | "flip";
}
/** A `playing` event in the page, with whether the browser made it. */
 | {
    readonly type: "playing";
    readonly trusted: boolean;
}
/** A pointer move or tap, with whether it is the viewer's own and is over the main video's
 *  picture. */
 | {
    readonly type: "pointer";
    readonly trusted: boolean;
    readonly overPicture: boolean;
}
/** The tab came to the front. */
 | {
    readonly type: "front";
}
/** The capture control's idle `remove()`. */
 | {
    readonly type: "idle-remove";
}
/** The capture control's `make()` after an idle removal (on a trusted move over the picture). */
 | {
    readonly type: "idle-make";
}
/** A real flip of the keep-card switch. */
 | {
    readonly type: "keep-card";
}
/** A `shown` card from the compute frame. */
 | {
    readonly type: "shown";
};
export type LifecycleEffect = 
/** Make whichever of the two frames is not in the page. `connect`: the host says hello to a new
 *  compute frame; false when the capture control made the call (its make() connects itself). */
{
    readonly type: "make";
    readonly connect: boolean;
}
/** Remove the compute frame and hide the shown card, keep the view frame, then make a new compute
 *  frame (and a missing view frame) and say hello (S-H3). */
 | {
    readonly type: "remake-compute";
}
/** Remove both frames, the outline and the shown card. */
 | {
    readonly type: "remove";
}
/** Stop following the video: the capture control is given none. */
 | {
    readonly type: "detach-video";
}
/** Pass the shown card on to the view. */
 | {
    readonly type: "show";
};
export interface LifecycleStep {
    readonly state: LifecycleState;
    readonly effects: readonly LifecycleEffect[];
}
export declare const INITIAL_LIFECYCLE: LifecycleState;
/** One event: the next state and the effects to carry out, in order. Pure: it reads only its
 *  arguments, and returns the same state object when nothing changes. */
export declare function lifecycleStep(state: LifecycleState, event: LifecycleEvent, facts: LifecycleFacts): LifecycleStep;
