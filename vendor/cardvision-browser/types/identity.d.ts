export declare const GROUPS_KIND = "identity-groups";
export interface IdentityGroups {
    version: number;
    groups: string[][];
    /** Member id to its group's representative, for every member that is not the representative. */
    representative: Map<string, string>;
}
/** Check a parsed identity-groups document. The whole document is refused (null) on any
 *  inconsistency: a partly read map would change which matches count as doubtful. */
export declare function parseIdentityGroups(raw: unknown): IdentityGroups | null;
/**
 * The identity rules a catalog can state, in its top-level `identity` (absent means "name"):
 *  - "name": entries with exactly the same name are one identity.
 *  - "printing": an entry whose `printingOf` is null is a card of its own, and every entry
 *    whose `printingOf` is that entry's id is the same card. Equal names join nothing.
 */
export declare const IDENTITY_RULES: readonly ["name", "printing"];
export type IdentityRule = (typeof IDENTITY_RULES)[number];
export declare function isIdentityRule(value: unknown): value is IdentityRule;
/**
 * The identity a catalog card belongs to, as a key: two cards are the same card exactly when
 * their keys are equal. This is the one place the rule is read (Python: Catalog.identity_of).
 */
export declare function identityOf(card: {
    id: string;
    name: string;
    printingOf: string | null;
}, rule: IdentityRule): string;
/**
 * The ids that share a key, as groups of two or more: `keys` maps an id to its key (its
 * identity, from `identityOf`). Keys are compared as exact strings and ids without a key are
 * left alone. Each group is sorted, and the list is ordered by each group's first id.
 */
export declare function groupsByKey(ids: Iterable<string>, keys: ReadonlyMap<string, string>): string[][];
/** `groupsByKey` with names as the keys: the groups the "name" rule gives. */
export declare function groupsByName(ids: Iterable<string>, names: ReadonlyMap<string, string>): string[][];
/**
 * What a recognized card shows:
 *  - "best-printing": the id of the bank row that matched best. The groups still decide the
 *    margin (a different identity must be beaten), but the printing whose image matched is shown.
 *  - "representative": the group's representative, whichever printing matched.
 */
export type IdentityDisplay = "representative" | "best-printing";
/**
 * Card id to identity (its group's representative; the id itself when it is in no group).
 * `known`, under the "representative" display, sets aside any group whose representative it
 * rejects (one that could not be shown); that group's members stay separate identities. Under
 * "best-printing" the representative is never shown, so nothing is set aside.
 */
export declare class IdentityMap {
    private readonly rep;
    readonly display: IdentityDisplay;
    constructor(groups?: IdentityGroups | null, known?: (cardId: string) => boolean, display?: IdentityDisplay);
    /** The identity a card id belongs to. */
    of(cardId: string): string;
    /** The id shown for a look whose best bank row is `topId`. */
    shown(topId: string): string;
    /** How many ids map to another id. */
    get collapsedCount(): number;
}
