import { RS_SEC_MAP, RS_TIME_LINE } from "./rs-rules.js";

// Shared, deterministic Job Ad manuscript contract. Both Review Studio and the
// Work Universe consume this module so a posting has one section model. It only
// groups supplied text; it never invents a heading or rewrites a line.
export function jobAdText(job) {
  const html = String((job && (job.description || job.responsibilitiesText)) || "");
  return html
    .replace(/<\s*(?:br|\/p|\/div|\/li|\/h[1-6]|\/tr)\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ");
}

export function stripJobAdHeadingEmoji(value) {
  return String(value || "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function jobAdSections(adText) {
  const lines = String(adText || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const isHeading = (raw) => {
    const line = stripJobAdHeadingEmoji(raw);
    if (!line || RS_TIME_LINE.test(line)) return false;
    return line.length <= 60
      && line.split(/\s+/).length <= 7
      && !/[.,;:!?]$/.test(line)
      && /^[A-Za-z]/.test(line)
      && !/^[-*\u2022]/.test(line);
  };
  const sections = [];
  let current = { title: null, lines: [] };
  lines.forEach((line) => {
    if (isHeading(line)) {
      if (current.title || current.lines.length) sections.push(current);
      current = { title: stripJobAdHeadingEmoji(line), lines: [] };
    } else {
      current.lines.push(line);
    }
  });
  if (current.title || current.lines.length) sections.push(current);
  return sections.map((section) => {
    const match = section.title ? RS_SEC_MAP.find(([pattern]) => pattern.test(section.title)) : null;
    return {
      title: section.title,
      lines: section.lines,
      canon: match ? match[1] : (section.title ? null : "Role overview"),
    };
  });
}
