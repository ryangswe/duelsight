import { type PreprocessingId } from "./preprocess.js";
export declare const BANK_KIND = "embedding-bank";
/** A parsed bank: row `i` of `matrix` (`dim` values, unit length) belongs to `ids[i]`. */
export interface EmbeddingBank {
    ids: string[];
    /** `ids.length * dim` values, row-major. */
    matrix: Float32Array;
    dim: number;
    /** The bank's own version number. */
    version: number;
    /** The label of the recognizer that made the rows. */
    model: string;
    /** The preprocessing contract the rows were made with. */
    preprocessing: PreprocessingId;
    /** The accept threshold the file records, when it records one. */
    tau: number | null;
}
/** Decode base64 text of `dim` little-endian half floats; null when it is anything else. */
export declare function decodeFp16Base64(b64: string, dim: number): Float32Array | null;
/**
 * Check and unpack a bank document. The whole document is refused (null) on any bad entry: a
 * bank with rows missing would name the wrong cards, which is worse than naming none.
 */
export declare function parseBank(raw: unknown): EmbeddingBank | null;
