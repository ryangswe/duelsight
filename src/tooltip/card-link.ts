// SPDX-License-Identifier: Apache-2.0
// The link from a card to Konami's official card database. It is only ever built as an address
// to open: nothing here (or anywhere in the extension) fetches from that site.
//
//   with a Konami card id:  .../card_search.action?ope=2&cid=<konamiId>&request_locale=en
//   otherwise, by name:     .../card_search.action?ope=1&sess=1&keyword=<name>&stype=1&request_locale=en
//
// The card's name and its optional `konamiId` come from the catalog row (our own catalog).

const BASE = "https://www.db.yugioh-card.com/yugiohdb/card_search.action";

/** The part of a catalog row the link needs. */
export interface LinkCard {
  name: string;
  /** Konami's database id for the card (digits), when the catalog has one. */
  konamiId?: string | number | null;
}

/** A Konami card id: digits only, as a string or a whole number. Anything else is no id. */
function konamiIdOf(value: LinkCard["konamiId"]): string | null {
  if (typeof value === "number") return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  if (typeof value === "string" && /^[0-9]{1,12}$/.test(value)) return value;
  return null;
}

/**
 * The official database page of a card: its card page when the row has a usable `konamiId`, else
 * a name search. Null when there is neither an id nor a name to search for.
 */
export function konamiCardLink(card: LinkCard): string | null {
  const cid = konamiIdOf(card.konamiId);
  if (cid !== null) return `${BASE}?ope=2&cid=${cid}&request_locale=en`;
  const name = typeof card.name === "string" ? card.name.trim() : "";
  if (name === "") return null;
  return `${BASE}?ope=1&sess=1&keyword=${encodeURIComponent(name)}&stype=1&request_locale=en`;
}
