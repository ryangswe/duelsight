// SPDX-License-Identifier: Apache-2.0
// DuelSight's product config for the shared hover host (src/shared/product.ts) passes the host's own
// config check, which refuses unknown keys at every level, in a production and a development build.
import { describe, expect, it } from "vitest";

import { productConfigError } from "../vendor/cardvision-browser/host-settings.js";
import { productConfig } from "../src/shared/product.js";

describe("productConfig", () => {
  it.each([false, true])("passes the host's config check (dev %s)", (dev) => {
    expect(productConfigError(productConfig(dev))).toBeNull();
  });

  it("is checked by a check that refuses an unknown key", () => {
    expect(productConfigError({ ...productConfig(false), extra: 1 })).not.toBeNull();
  });
});
