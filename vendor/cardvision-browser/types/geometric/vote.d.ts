/** Bytes in one descriptor. */
export declare const DESCRIPTOR_BYTES = 32;
/** The row and distance given when there is no such neighbour (an index of fewer than two rows). */
export declare const NO_ROW = 4294967295;
export declare const NO_DISTANCE = 65535;
/** The two nearest index rows of each query, in query order. */
export interface KnnResult {
    best: Uint32Array;
    second: Uint32Array;
    dBest: Uint16Array;
    dSecond: Uint16Array;
}
export interface Voter {
    /** `queries` holds `q` descriptors of 32 bytes each. */
    knn2(queries: Uint8Array): Promise<KnnResult>;
    dispose(): void;
}
/** The reference voter: a plain loop over every row for every query. Exact; slow on a large index. */
export declare function cpuVoter(desc: Uint8Array): Voter;
export declare const GPU_MAX_ROWS: number;
/** Tuning of the GPU voter. The defaults suit an Apple M-series GPU; any value gives the same result. */
export interface GpuVoterOptions {
    /** Invocations per workgroup; each holds `queriesPerInvocation` queries. */
    workgroupSize?: number;
    queriesPerInvocation?: number;
    /** Rows staged in workgroup memory at a time. */
    tileRows?: number;
    /** Rows one workgroup scans; each chunk gives every query a partial result. */
    chunkRows?: number;
    /** Most queries in one dispatch; a larger call is split. */
    maxQueriesPerDispatch?: number;
    /** Most rows in one storage buffer (at most the device's limit allows). For tests of the split. */
    maxRowsPerBuffer?: number;
}
/**
 * The device limits to ask for when creating the device the vote runs on: the adapter's own
 * storage-buffer limits, so that a large index fits in few buffers. Pass the result as
 * `requiredLimits` to `adapter.requestDevice`. The voter works within any limits: a smaller
 * limit only splits the index into more buffers.
 */
export declare function voteDeviceLimits(adapter: GPUAdapter): Record<string, number>;
/**
 * The voter on a WebGPU device. The index is copied to the GPU once, split over several storage
 * buffers when it is larger than the device allows in one binding.
 */
export declare function gpuVoter(device: GPUDevice, desc: Uint8Array, options?: GpuVoterOptions): Promise<Voter>;
