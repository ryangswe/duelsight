// SPDX-License-Identifier: Apache-2.0
// A stand-in for chrome.storage.local in tests.

export function memoryStorage(data: Record<string, unknown> = {}) {
  const calls = { get: 0 };
  return {
    data,
    calls,
    async get(keys: string | string[] | null) {
      calls.get += 1;
      const out: Record<string, unknown> = {};
      const wanted = keys === null ? Object.keys(data) : Array.isArray(keys) ? keys : [keys];
      for (const k of wanted) if (k in data) out[k] = structuredClone(data[k]);
      return out;
    },
    async set(items: Record<string, unknown>) {
      Object.assign(data, structuredClone(items));
    },
    async remove(keys: string | string[]) {
      for (const k of Array.isArray(keys) ? keys : [keys]) delete data[k];
    },
  };
}
