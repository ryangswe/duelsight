// SPDX-License-Identifier: Apache-2.0
// Konami's own words for the parts of a card's type line, its attribute and the headings of a
// Pendulum card's text, by language. scripts/localized-details.mjs words each card's type line
// and attribute with them; the stats line's words (Niveau, Rang, ...) are in src/details/details.ts.
//
// French: the names Yugipedia's pages give for each term (`fr_name`), checked against the type
// lines and attributes of Konami's French card database on 24 cards (2026-10-29). A term not in
// this table leaves that card's whole type line in English.

/** The words of one language. */
export const TERMS = {
  fr: {
    /** Yugipedia's property names for this language. */
    yugipedia: { name: "French name", lore: "French lore", pendulum: "French Pendulum Effect" },
    /** A monster's type line, part by part ("Spellcaster / Fusion / Effect"). */
    monsterParts: {
      Aqua: "Aqua",
      Beast: "Bête",
      "Beast-Warrior": "Bête-Guerrier",
      Cyberse: "Cyberse",
      Dinosaur: "Dinosaure",
      "Divine-Beast": "Bête Divine",
      Dragon: "Dragon",
      Fairy: "Elfe",
      Fiend: "Démon",
      Fish: "Poisson",
      Illusion: "Illusion",
      Insect: "Insecte",
      Machine: "Machine",
      Plant: "Plante",
      Psychic: "Psychique",
      Pyro: "Pyro",
      Reptile: "Reptile",
      Rock: "Rocher",
      "Sea Serpent": "Serpent de Mer",
      Spellcaster: "Magicien",
      Thunder: "Tonnerre",
      Warrior: "Guerrier",
      "Winged Beast": "Bête Ailée",
      Wyrm: "Wyrm",
      Zombie: "Zombie",
      Effect: "Effet",
      Flip: "Flip",
      Fusion: "Fusion",
      Gemini: "Gémeau",
      Link: "Lien",
      Normal: "Normal",
      Pendulum: "Pendule",
      Ritual: "Rituel",
      Spirit: "Spirit",
      Synchro: "Synchro",
      Toon: "Toon",
      Tuner: "Syntoniseur",
      Union: "Union",
      Xyz: "Xyz",
    },
    /** A spell's or a trap's whole type line. */
    spellTrap: {
      "Normal Spell": "Magie Normale",
      "Quick-Play Spell": "Magie Jeu-Rapide",
      "Continuous Spell": "Magie Continue",
      "Field Spell": "Magie de Terrain",
      "Equip Spell": "Magie d'Équipement",
      "Ritual Spell": "Magie Rituelle",
      "Normal Trap": "Piège Normal",
      "Continuous Trap": "Piège Continu",
      "Counter Trap": "Contre-Piège",
    },
    attributes: {
      DARK: "TÉNÈBRES",
      LIGHT: "LUMIÈRE",
      EARTH: "TERRE",
      WATER: "EAU",
      FIRE: "FEU",
      WIND: "VENT",
      DIVINE: "DIVIN",
    },
    /** The headings of a Pendulum card's two texts, in place of "[ Pendulum Effect ]" and
     *  "[ Monster Effect ]". */
    headings: { pendulum: "Effet Pendule", monster: "Effet de Monstre" },
  },
};
