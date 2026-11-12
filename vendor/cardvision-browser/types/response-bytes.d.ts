/** Read a fetch response's body as bytes. In Chrome, `Response.arrayBuffer()` in a worker leaves
 *  about 1.5 times the file size resident after the buffer is garbage-collected (about 27 MB on a
 *  mid-size release); `blob().arrayBuffer()` leaves nothing. So read through `blob()` when the
 *  response has one, and through `arrayBuffer()` otherwise (test fakes, `load.ts`'s file reader).
 *  The bytes are the same either way. */
export declare function readResponseBytes(response: {
    arrayBuffer(): Promise<ArrayBuffer>;
    blob?(): Promise<Blob>;
}): Promise<ArrayBuffer>;
