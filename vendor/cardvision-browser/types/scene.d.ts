import type { AABB, Rect } from "./boxes.js";
import type { LayerCard } from "./hover-geometry.js";
/** One box to place in a layer. */
export interface SceneItem {
    instanceId: string;
    aabb: AABB;
    rect: Rect;
    /** The card id to show, or null: detected, not named. */
    identity: string | null;
}
export interface SceneContext {
    frameWidth: number;
    frameHeight: number;
    /** Card id to name, from the release's catalog. */
    names: ReadonlyMap<string, string>;
}
export declare function toLayerCards(items: readonly SceneItem[], ctx: SceneContext): LayerCard[];
