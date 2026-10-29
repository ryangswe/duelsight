// SPDX-License-Identifier: Apache-2.0
// Konami's own words for the parts of a card's type line, its attribute, the headings of a
// Pendulum card's text and the stats line's labels, by language. scripts/localized-details.mjs
// words each card's type line and attribute with them and writes the labels into the file, so the
// tooltip needs no new version for a new language.
//
// Each language starts from the names Yugipedia's term pages give (`fr_name`, `de_name`, ...).
// The short forms of a type line (a Fusion monster's "Fusion", a quick-play spell's "Magie
// Jeu-Rapide") are how Konami's card database prints them, which the term pages do not give in
// full. So a language is used only once its words have been checked against Konami's database on
// the 24-card sample: `checked` is that date, and the builder refuses a language without one
// (unless --draft). A term not in a table leaves that card's whole type line in English.
//
// A spell's or a trap's type line is Konami's term with "card" left out ("Carte Magie Normale" →
// "Magie Normale"). Konami's database prints the icon and the card kind side by side instead
// ("Normale Magie", "Normal Fallen"), which is not a printed line; the check compares the rest.
// The 24-card sample covers monsters' attributes, the type words of its cards and the stats
// line's words; the other terms (Aqua, Flip, Field Spell, ...) are the term pages' as they stand.

/** The English words each list of a language from the term pages follows, in order. */
const ENGLISH_RACES = ["Aqua", "Beast", "Beast-Warrior", "Cyberse", "Dinosaur", "Divine-Beast", "Dragon", "Fairy", "Fiend", "Fish", "Illusion", "Insect", "Machine", "Plant", "Psychic", "Pyro", "Reptile", "Rock", "Sea Serpent", "Spellcaster", "Thunder", "Warrior", "Winged Beast", "Wyrm", "Zombie"];
const ENGLISH_KINDS = ["Effect", "Flip", "Fusion", "Gemini", "Link", "Normal", "Pendulum", "Ritual", "Spirit", "Synchro", "Toon", "Tuner", "Union", "Xyz"];
const ENGLISH_SPELL_TRAP = ["Normal Spell", "Quick-Play Spell", "Continuous Spell", "Field Spell", "Equip Spell", "Ritual Spell", "Normal Trap", "Continuous Trap", "Counter Trap"];
const ENGLISH_ATTRIBUTES = ["DARK", "LIGHT", "EARTH", "WATER", "FIRE", "WIND", "DIVINE"];

/** A language from Yugipedia's term names; `words.checked` is the date of its 24-card check, if any. */
function fromTermPages(languageName, words) {
  const zip = (english, local) => {
    if (english.length !== local.length) throw new Error(`${languageName}: ${local.length} words for ${english.length} terms`);
    return Object.fromEntries(english.map((e, i) => [e, local[i]]));
  };
  return {
    checked: words.checked ?? null,
    yugipedia: { name: `${languageName} name`, lore: `${languageName} lore`, pendulum: `${languageName} Pendulum Effect` },
    monsterParts: { ...zip(ENGLISH_RACES, words.races), ...zip(ENGLISH_KINDS, words.kinds) },
    spellTrap: zip(ENGLISH_SPELL_TRAP, words.spellTrap),
    attributes: zip(ENGLISH_ATTRIBUTES, words.attributes),
    headings: words.headings,
    labels: words.labels,
  };
}

/** The words of one language. */
export const TERMS = {
  fr: {
    /** The date these words were checked against Konami's database (24 cards), or null. */
    checked: "2026-10-29",
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
    /** The stats line's words, written into the file (src/details/details.ts StatLabels). */
    labels: { level: "Niveau", rank: "Rang", link: "Lien", scale: "Échelle Pendule", atk: "ATK", def: "DEF" },
  },
  de: fromTermPages("German", {
    checked: "2026-10-29",
    races: ["Aqua", "Ungeheuer", "Ungeheuer-Krieger", "Cyberse", "Dinosaurier", "Göttliches Ungeheuer", "Drache", "Fee", "Unterweltler", "Fisch", "Illusion", "Insekt", "Maschine", "Pflanze", "Psi", "Pyro", "Reptil", "Fels", "Seeschlange", "Hexer", "Donner", "Krieger", "Geflügeltes Ungeheuer", "Wyrm", "Zombie"],
    kinds: ["Effekt", "Flipp", "Fusion", "Zwilling", "Link", "Normal", "Pendel", "Ritual", "Spirit", "Synchro", "Toon", "Empfänger", "Union", "Xyz"],
    spellTrap: ["Normaler Zauber", "Schnellzauber", "Permanenter Zauber", "Spielfeldzauber", "Ausrüstungszauber", "Ritualzauber", "Normale Falle", "Permanente Falle", "Konterfalle"],
    attributes: ["FINSTERNIS", "LICHT", "ERDE", "WASSER", "FEUER", "WIND", "GÖTTLICH"],
    headings: { pendulum: "Pendeleffekt", monster: "Monstereffekt" },
    labels: { level: "Stufe", rank: "Rang", link: "Link", scale: "Pendelbereich", atk: "ATK", def: "DEF" },
  }),
  it: fromTermPages("Italian", {
    checked: "2026-10-29",
    races: ["Acqua", "Bestia", "Guerriero-Bestia", "Cyberso", "Dinosauro", "Divinità-Bestia", "Drago", "Fata", "Demone", "Pesce", "Illusione", "Insetto", "Macchina", "Pianta", "Psichico", "Pyro", "Rettile", "Roccia", "Serpente Marino", "Incantatore", "Tuono", "Guerriero", "Bestia Alata", "Wyrm", "Zombie"],
    kinds: ["Effetto", "Scoperta", "Fusione", "Gemello", "Link", "Normale", "Pendulum", "Rituale", "Spirit", "Synchro", "Toon", "Tuner", "Unione", "Xyz"],
    spellTrap: ["Magia Normale", "Magia Rapida", "Magia Continua", "Magia Terreno", "Magia Equipaggiamento", "Magia Rituale", "Trappola Normale", "Trappola Continua", "Contro-Trappola"],
    attributes: ["OSCURITÀ", "LUCE", "TERRA", "ACQUA", "FUOCO", "VENTO", "DIVINO"],
    headings: { pendulum: "Effetto Pendulum", monster: "Effetto Mostro" },
    labels: { level: "Livello", rank: "Rango", link: "Link", scale: "Valore Pendulum", atk: "ATK", def: "DEF" },
  }),
  es: fromTermPages("Spanish", {
    checked: "2026-10-29",
    races: ["Aqua", "Bestia", "Guerrero-Bestia", "Ciberso", "Dinosaurio", "Bestia Divina", "Dragón", "Hada", "Demonio", "Pez", "Ilusión", "Insecto", "Máquina", "Planta", "Psíquico", "Piro", "Reptil", "Roca", "Serpiente Marina", "Lanzador de Conjuros", "Trueno", "Guerrero", "Bestia Alada", "Wyrm", "Zombi"],
    kinds: ["Efecto", "Volteo", "Fusión", "Géminis", "Enlace", "Normal", "Péndulo", "Ritual", "Spirit", "Sincronía", "Toon", "Cantante", "Unión", "Xyz"],
    spellTrap: ["Mágica Normal", "Mágica de Juego Rápido", "Mágica Continua", "Mágica de Campo", "Mágica de Equipo", "Mágica de Ritual", "Trampa Normal", "Trampa Continua", "Trampa de Contraefecto"],
    attributes: ["OSCURIDAD", "LUZ", "TIERRA", "AGUA", "FUEGO", "VIENTO", "DIVINIDAD"],
    headings: { pendulum: "Efecto de Péndulo", monster: "Efecto de Monstruo" },
    labels: { level: "Nivel", rank: "Rango", link: "Enlace", scale: "Escala de Péndulo", atk: "ATK", def: "DEF" },
  }),
  pt: fromTermPages("Portuguese", {
    checked: "2026-10-29",
    races: ["Aqua", "Besta", "Besta-Guerreira", "Ciberso", "Dinossauro", "Besta Divina", "Dragão", "Fada", "Demônio", "Peixe", "Ilusão", "Inseto", "Máquina", "Planta", "Psíquico", "Piro", "Réptil", "Rocha", "Serpente Marinha", "Mago", "Trovão", "Guerreiro", "Besta Alada", "Wyrm", "Zumbi"],
    kinds: ["Efeito", "Virar", "Fusão", "Gêmeos", "Link", "Normal", "Pêndulo", "Ritual", "Espírito", "Sincro", "Toon", "Regulador", "Union", "Xyz"],
    spellTrap: ["Magia Normal", "Magia Rápida", "Magia Contínua", "Magia de Campo", "Magia de Equipamento", "Magia de Ritual", "Armadilha Normal", "Armadilha Contínua", "Armadilha de Resposta"],
    attributes: ["TREVAS", "LUZ", "TERRA", "ÁGUA", "FOGO", "VENTO", "DIVINO"],
    headings: { pendulum: "Efeito de Pêndulo", monster: "Efeito de Monstro" },
    labels: { level: "Nível", rank: "Classe", link: "Link", scale: "Escala de Pêndulo", atk: "ATK", def: "DEF" },
  }),
};
