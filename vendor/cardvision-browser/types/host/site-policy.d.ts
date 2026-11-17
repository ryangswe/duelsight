import type { ProductConfig } from "./config.js";
export type Site = "youtube" | "twitch" | "local";
export type PagePolicy = {
    active: false;
} | {
    active: true;
    site: Site;
    load: "play" | "pointer";
    route: string;
};
export interface Route {
    id: string;
    site: Site;
    load: "play" | "pointer";
    test(path: string): boolean;
}
/** The seven Twitch side pages: addresses that are not a channel and load at a hover (S-G3). */
export declare const TWITCH_SIDE_PAGES: readonly string[];
/** The side pages and the rest of the shared list of Twitch's own first path segments (28). None of
 *  them is a channel name. Lowercase; a name is lowercased before the lookup. */
export declare const TWITCH_RESERVED: readonly string[];
/** One array, first match wins, path only (a query and a `#` part are not part of a path). A route
 *  is looked up only among the routes of the page's site. */
export declare const ROUTES: readonly Route[];
/** Whether hovers run on this page, and when its video loads. Read at each event from the current
 *  address, so in-page navigation needs no extra code. */
export declare function pagePolicy(url: URL, config: Pick<ProductConfig, "sites" | "dev">): PagePolicy;
/** Whether a page at this origin may frame the compute page. */
export declare function allowedParentOrigin(origin: string, config: Pick<ProductConfig, "sites" | "dev">): boolean;
