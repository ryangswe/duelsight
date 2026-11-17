export interface KeyValueStorage {
    get(keys: string | string[]): Promise<Record<string, unknown>>;
    set(items: Record<string, unknown>): Promise<void>;
}
export type StorageChange = {
    oldValue?: unknown;
    newValue?: unknown;
};
export interface StorageChanges {
    addListener(fn: (changes: Record<string, StorageChange | undefined>, area: string) => void): void;
    removeListener(fn: (changes: Record<string, StorageChange | undefined>, area: string) => void): void;
}
export declare const LAST_GOOD_KEY = "settings.lastGood";
export declare const LAST_ATTEMPT_KEY = "settings.lastAttemptAt";
export declare const DISMISSED_UPDATE_KEY = "update.dismissed";
export declare const SETTINGS_REFRESH_MS = 3600000;
export interface SettingsSchema<S> {
    validate(raw: unknown): {
        settings: S | null;
        problems: string[];
    };
    /** The built-in default as raw JSON; it must pass `validate`. */
    defaultRaw: unknown;
    /** The settings file's address; null: nothing is ever fetched. */
    url: string | null;
}
export interface EffectiveSettings<S> {
    settings: S;
    origin: "fetched" | "default";
    fetchedAt: number | null;
}
export type RefreshOutcome = {
    kind: "skipped";
} | {
    kind: "updated";
    problems: string[];
} | {
    kind: "kept";
    reason: string;
};
export interface SettingsCore<S> {
    defaults(): S;
    /** The last good copy, validated again on every read; else the default. */
    read(): Promise<EffectiveSettings<S>>;
    refresh(options: {
        fetch: typeof fetch;
        now: () => number;
        force?: boolean;
        timeoutMs?: number;
    }): Promise<RefreshOutcome>;
    /** Same contents, whatever the key order: an hourly re-store with a new fetchedAt is not a change. */
    same(a: S, b: S): boolean;
}
export declare function createSettingsCore<S>(schema: SettingsSchema<S>, storage: KeyValueStorage): SettingsCore<S>;
/** Compare two `x.y.z` versions (a manifest may also say `x.y` or `x.y.z.w`); missing parts are 0. */
export declare function compareVersions(a: string, b: string): number;
/** The notice to show, or null: none named, not newer than the running version, or dismissed. */
export declare function updateNotice<U extends {
    latest: string;
}>(update: U | null, running: string, dismissed: string | null): U | null;
