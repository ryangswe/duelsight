// SPDX-License-Identifier: Apache-2.0
// The models' license files (release-legal/) ship beside the release they describe. The build
// refuses a release whose id the first line of release-legal/NOTICE does not name ("(id …)"), so
// that a later release cannot ship with another release's notice and provenance.

export const LEGAL_FILES = ["LICENSE", "NOTICE", "PROVENANCE.md"];

/** Why the legal files do not fit the release, or null. */
export function releaseLegalProblem(releaseId, files) {
  const missing = LEGAL_FILES.filter((name) => typeof files[name] !== "string");
  if (missing.length > 0) return `release-legal/ is missing ${missing.join(", ")}: the models do not ship without their license and notice`;
  if (typeof releaseId !== "string" || !/^[0-9a-f]{16}$/.test(releaseId)) return `the release id ${JSON.stringify(releaseId)} is not 16 hex digits`;
  // The release the notice is for is named on its first line; other lines may name earlier
  // releases (what this one differs from), which must not pass for it.
  const firstLine = files.NOTICE.split("\n", 1)[0];
  if (!firstLine.includes(`(id ${releaseId})`)) {
    return `release-legal/NOTICE's first line does not name release ${releaseId}: update NOTICE and PROVENANCE.md for this release before building`;
  }
  return null;
}
