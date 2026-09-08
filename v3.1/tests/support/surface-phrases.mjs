// One definition of the phrase lists the evidence surfaces are tested against (Supervisor ruling
// BLP-005 Q5: shared, never duplicated, so the lists cannot drift into two versions).
//
// GENERIC_FRESHNESS_PHRASES: a generic freshness substitute standing in for a real evidence-window
// fact (BLP-004 negative fixture). Forbidden on every evidence-window surface.
export const GENERIC_FRESHNESS_PHRASES = Object.freeze(["snapshot at analysis", "recent", "current"]);
// ABSENCE_PHRASES: wording that phrases a FAILURE as an absence. Forbidden on a failure surface,
// where it is false: a source that did not respond is not a source with nothing in it (BLP-005 Q4).
export const ABSENCE_PHRASES = Object.freeze(["no results", "nothing found", "none found", "no postings found", "no matching"]);
