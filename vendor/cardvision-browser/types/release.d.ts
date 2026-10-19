import { type EmbeddingBank } from "./bank.js";
import type { DetectorSettings, FrameDetector } from "./detector/detector.js";
import type { BatchEmbedder, EmbedderSettings } from "./embedder.js";
import { type HoverSelection } from "./hover-layer.js";
import { type IdentityDisplay, type IdentityGroups, type IdentityRule } from "./identity.js";
import { type ExecutionProvider } from "./providers.js";
import { Pipeline } from "./pipeline.js";
import { type PreprocessingId } from "./preprocess.js";
import type { AcceptRule } from "./recognizer.js";
export declare const RELEASE_SCHEMA_VERSION = 1;
export declare const RELEASE_KIND = "vision-release";
/** How many rows a detector of this input size emits. */
export declare function anchorCount(width: number, height: number): number;
/** A file a release pins: its path relative to the release document, its SHA-256 and its size. */
export interface PinnedFile {
    path: string;
    sha256: string;
    bytes: number;
}
/** A release document, checked and narrowed to what the runtime acts on. */
export interface VisionRelease {
    id: string;
    game: string;
    locale: string;
    detector: PinnedFile & {
        arm: "yolox";
        version: string;
        weights: string;
        settings: DetectorSettings;
    };
    recognizer: PinnedFile & {
        version: string;
        weights: string;
        dim: number;
        inputName: string;
        outputName: string;
        preprocessing: PreprocessingId;
    };
    bank: PinnedFile & {
        version: number;
        cardCount: number;
        entryCount: number;
    };
    identity: {
        level: IdentityRule;
        groups: PinnedFile & {
            version: number;
        };
        display: IdentityDisplay;
    };
    catalog: PinnedFile & {
        cardCount: number;
    };
    accept: AcceptRule;
    hover: {
        selection: HoverSelection;
        maxAgeMs: number;
    };
    runtime: {
        ortWeb: string;
        executionProviders: ExecutionProvider[];
        wasmThreads: 1;
        analysisWidth: {
            min: number;
            max: number;
        };
    };
}
/** Whether a path is a plain relative one that stays inside the folder of the release document. */
export declare function isRelativePath(path: unknown): path is string;
/**
 * Check a parsed release document and narrow it. Strict: a missing part, a malformed field, an
 * unknown key at the top, or a contract this runtime does not implement refuses the whole
 * document. Returns the reason on failure. The id is checked by `loadRelease`, which has the
 * document's text.
 */
export declare function parseRelease(raw: unknown): {
    release: VisionRelease;
} | {
    error: string;
};
/**
 * The text a release's id is the hash of: the document without its `id` key, as JSON with
 * sorted keys and no whitespace, non-ASCII characters as themselves. Numbers are copied from
 * the document's own text, character for character, because the id was computed over numbers
 * as Python writes them (`1.0` stays `1.0`), which parsing and printing again would not
 * preserve. Throws when the text is not a JSON object.
 */
export declare function canonicalReleaseText(text: string): string;
/** The id of a release document, from its text: 16 hex digits of the SHA-256 of
 *  `canonicalReleaseText`. */
export declare function releaseIdOf(text: string, digestSha256Hex: (bytes: ArrayBuffer) => Promise<string>): Promise<string>;
/** How bytes are fetched and hashed. The defaults are `fetch` and the Web Crypto API. */
export interface ReleaseDeps {
    fetchFn: (url: string) => Promise<{
        ok: boolean;
        status: number;
        arrayBuffer(): Promise<ArrayBuffer>;
    }>;
    digestSha256Hex: (bytes: ArrayBuffer) => Promise<string>;
}
export declare function sha256HexWebCrypto(bytes: ArrayBuffer): Promise<string>;
export declare const defaultReleaseDeps: ReleaseDeps;
/** One card of a release's catalog, as far as the runtime reads it. */
export interface CatalogCard {
    id: string;
    name: string;
    /** Where the card's image is: a path relative to a base the caller supplies, or a URL. The
     *  runtime never opens it. Null for a card without art (`"art": null`): a card known by its id
     *  and name with no image yet. A bank built from the catalog has no row for it (a bank extended
     *  from one that had a row keeps it), so it is never named by its own row; a printing of it
     *  that has art still names its identity. */
    art: string | null;
    /** The id of the card this one is an alternate printing of, or null. */
    printingOf: string | null;
}
/** Everything a release loaded, checked against the document and against each other. */
export interface ReleaseData {
    release: VisionRelease;
    detectorBytes: Uint8Array;
    recognizerBytes: Uint8Array;
    bank: EmbeddingBank;
    identityGroups: IdentityGroups;
    cards: CatalogCard[];
    /** Card id to name. */
    names: Map<string, string>;
}
export type ReleaseLoad = {
    ok: true;
    data: ReleaseData;
} | {
    ok: false;
    reason: string;
};
export interface ReleaseLoadOptions {
    /** The onnxruntime-web version this build runs on. A release measured on another line of it
     *  is refused; leave it out to skip the check (a caller without ONNX Runtime). */
    ortWeb?: string;
}
/**
 * Whether a release measured on onnxruntime-web `releaseOrt` may run on `bundledOrt`: the same
 * major and minor version, any patch. A minor release can change kernels and so the numbers a
 * model produces; a release's measured accuracy then no longer describes what runs.
 */
export declare function ortWebCompatible(releaseOrt: string, bundledOrt: string): boolean;
/** One facet a catalog declares (a filter of the labeling tool), with its values in chip order:
 *  the declared ones, else those the cards carry (numbers ascending, text in order of first
 *  appearance). The runtime reads no facet; it checks them as the Python package does. */
export interface CatalogFacet {
    key: string;
    label: string;
    type: "text" | "number";
    values: Array<string | number>;
}
/**
 * Read the cards of a catalog document, the identity rule it states ("name" when it states
 * none) and the facets it declares; the reason as a string when it is not one. Under the
 * "printing" rule a `printingOf` must name a card that is a printing of none, as in Python.
 */
export declare function parseCatalog(raw: unknown): {
    game: string;
    locale: string;
    identity: IdentityRule;
    cards: CatalogCard[];
    facets: CatalogFacet[];
} | string;
/**
 * Load a release from the absolute URL of its document, all-or-nothing. In order: the document (its
 * shape, its contracts, its id); the onnxruntime-web line; every component in parallel, each
 * against its size and SHA-256; then the agreement between them (the bank against the
 * recognizer and the accept rule, the identity groups against the bank and the catalog's
 * identity rule, every bank id against the catalog). Never throws: any failure is
 * `{ok: false}` with the reason.
 */
export declare function loadReleaseData(releaseUrl: string, deps?: ReleaseDeps, opts?: ReleaseLoadOptions): Promise<ReleaseLoad>;
/** A model that can free its session. */
interface Releasable {
    release?(): Promise<void>;
}
export type ReleaseEmbedder = BatchEmbedder & Releasable & {
    readonly ep: ExecutionProvider;
};
export type ReleaseDetector = FrameDetector & Releasable & {
    readonly ep: ExecutionProvider;
};
/** The models a release needs. Each tries `providers` in order and resolves null when none
 *  initializes. */
export interface ReleaseModelFactories {
    embedder(bytes: Uint8Array, settings: EmbedderSettings, providers: readonly ExecutionProvider[]): Promise<ReleaseEmbedder | null>;
    detector(bytes: Uint8Array, settings: DetectorSettings, providers: readonly ExecutionProvider[]): Promise<ReleaseDetector | null>;
}
export interface ReleaseBuild {
    pipeline: Pipeline;
    embedder: ReleaseEmbedder;
    detector: ReleaseDetector;
    /** The execution providers that were tried, in order. */
    providers: ExecutionProvider[];
}
/**
 * Build the pipeline a release describes. All-or-nothing here too: when a model does not
 * initialize on any provider, the one already created is released and the reason returned.
 * `providers` defaults to the release's own list.
 */
export declare function buildReleasePipeline(data: ReleaseData, factories: ReleaseModelFactories, providers?: readonly ExecutionProvider[]): Promise<ReleaseBuild | {
    error: string;
}>;
export {};
