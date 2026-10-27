import { type PreprocessingId } from "./preprocess.js";
export declare const BANK_KIND = "embedding-bank";
/** The binary bank format version this runtime reads. */
export declare const BANK_BINARY_VERSION = 1;
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
/** Widen `dim` little-endian half floats, starting at `offset` of `bytes`, to float32. This is
 *  the runtime's one fp16 decode: both forms of the bank go through it. */
export declare function decodeFp16(bytes: Uint8Array, offset: number, dim: number): Float32Array;
/** Decode base64 text of `dim` little-endian half floats; null when it is anything else. */
export declare function decodeFp16Base64(b64: string, dim: number): Float32Array | null;
/**
 * Check and unpack a bank document. The whole document is refused (null) on any bad entry: a
 * bank with rows missing would name the wrong cards, which is worse than naming none.
 */
export declare function parseBank(raw: unknown): EmbeddingBank | null;
/** Whether bytes are a binary bank, of any format version: they start with "CVBANK\0". */
export declare function isBinaryBank(bytes: Uint8Array): boolean;
/** The format version of a binary bank (the byte after "CVBANK\0"); null for other bytes. */
export declare function binaryBankVersion(bytes: Uint8Array): number | null;
/**
 * Check and unpack a binary bank (`bank.bin`). Refused (null) on anything wrong, as a JSON bank
 * is: another magic or format version, a header that is not a bank's, an entryCount that is not
 * the number of card ids, or a body that is not exactly entryCount x dim fp16 values.
 */
export declare function parseBankBinary(data: Uint8Array | ArrayBuffer): EmbeddingBank | null;
