function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanRaw(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n").trim();
}

function unique(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildManualPersonEvidence({ rawText, selectedSkills, targetSkills, confirmed } = {}) {
  const raw = cleanRaw(rawText);
  if (!confirmed || !raw) return null;
  const targets = unique((Array.isArray(targetSkills) ? targetSkills : []).map(clean).filter(Boolean));
  const targetByKey = new Map(targets.map((skill) => [skill.toLowerCase(), skill]));
  const skills = unique((Array.isArray(selectedSkills) ? selectedSkills : [])
    .map(clean)
    .filter((skill) => targetByKey.has(skill.toLowerCase()))
    .map((skill) => targetByKey.get(skill.toLowerCase())));
  return {
    supplied: true,
    sourceType: "manual-paste",
    sessionOnly: true,
    confirmation: "USER-CONFIRMED",
    rawText: raw,
    skills,
    proofs: [{
      id: "PRAW1",
      label: "Manual person evidence",
      text: raw,
      evidenceIds: ["PRAW1"],
      provenance: "USER-CONFIRMED",
    }],
  };
}

export function isManualPersonEvidence(value) {
  return Boolean(value && value.sourceType === "manual-paste" && value.confirmation === "USER-CONFIRMED" && value.sessionOnly === true);
}
