export type CardTable = Record<string, [string, string | null, string | null] | [string, string | null, string | null, string | null]>;
/** The card table for a catalog. A catalog that is not an object with a list of cards gives {}. */
export declare function buildCardTable(catalog: unknown, { printed }?: {
    printed?: boolean;
}): CardTable;
