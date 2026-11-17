import type { KeyValueStorage, StorageChanges } from "./settings-core.js";
export declare const ENABLED_KEY = "enabled";
export declare const KEEP_CARD_KEY = "keepCard";
export interface Switches {
    /** On unless stored `false`; a missing or unreadable value reads as on. */
    enabled(): Promise<boolean>;
    keepCard(): Promise<boolean>;
    /** Calls back for real flips only: a write of the same state calls nothing. Returns the stop. */
    watch(on: {
        enabled?(on: boolean): void;
        keepCard?(on: boolean): void;
    }): () => void;
}
export declare function createSwitches(storage: Pick<KeyValueStorage, "get">, changes: StorageChanges): Switches;
