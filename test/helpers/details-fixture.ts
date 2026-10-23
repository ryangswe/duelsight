// SPDX-License-Identifier: Apache-2.0
// A made-up card details file for tests. Every name, stat and line of text here is invented: no
// real card's text is ever in this repository.

export const DETAILS_FIXTURE = {
  schemaVersion: 1,
  cards: {
    "10000001": ["effect", "When this test card is summoned, nothing happens.\nIt is only a fixture.", "Robot / Effect", "LIGHT", 4, 1800, 1000],
    "10000002": ["xyz", "2 Level 3 test monsters\nDetach 1 material: draw a sample line.", "Robot / Xyz / Effect", "DARK", 3, 2100, -1],
    "10000003": ["link", "2 test monsters\nThis card points at nothing in particular.", "Robot / Link / Effect", "WIND", null, 2300, null, null, 2, ["Bottom-Right", "Top", "Bottom-Left"]],
    "10000004": ["effect_pendulum", "[ Pendulum Effect ]\nA made-up scale line.\n[ Monster Effect ]\nA made-up monster line.", "Robot / Pendulum / Effect", "EARTH", 5, -1, 1500, 7],
    "10000005": ["spell", "Draw nothing. This invented spell is only a fixture.", "Quick-Play Spell"],
    "10000006": ["trap", "An invented trap line.\r\nSecond invented line.", "Normal Trap"],
    "10000007": ["spell", "<b>not markup</b> & <img src=x onerror=alert(1)>", "Normal Spell"],
    "10000008": "not a row",
    "10000009": ["effect", "Row with a bad attribute", "Robot / Effect", 7],
  },
} as const;
