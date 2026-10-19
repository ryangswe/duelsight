// SPDX-License-Identifier: Apache-2.0
// The card facts a tooltip shows, from files the build writes beside the release:
//   data/cards.json         { "<card id>": [name, set, art path or null, printed number?] }, from
//                           the catalog (the printed number only with the "catalog" rule)

export interface CardFacts {
  id: string;
  name: string;
  set: string | null;
  art: string | null;
  printed?: string | null;
}

export type CardTable = Record<string, [string, string | null, string | null] | [string, string | null, string | null, string | null]>;
