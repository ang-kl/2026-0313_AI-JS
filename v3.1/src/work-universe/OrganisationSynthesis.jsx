import React, { useMemo } from "react";
import { buildOrganisationSynthesis, WITHHELD_ORGANISATION_FIELDS } from "./organisationSynthesisData.js";
import BlueprintTracePanel from "../blueprint/BlueprintTracePanel.jsx";
import { createBlueprintTrace } from "../blueprint/blueprintTraceData.js";

export default function OrganisationSynthesis({ result, onEvidenceSelect }) {
  const data = useMemo(() => buildOrganisationSynthesis(result), [result]);
  const trace = createBlueprintTrace({ id: "trace:organisation-synthesis", requirement: "BLP-024", component: "Cross-posting organisation synthesis", sourceIds: data.groups.flatMap((group) => [...group.sourceIdentifiers, ...group.evidenceIds]), status: data.status === "available" ? "AVAILABLE" : "WITHHELD", rule: data.status === "available" ? "Shown because one unambiguous employer set contains a source-linked capability repeated across at least two postings." : data.reason, knownGap: "Hierarchy, maturity, headcount, performance and ownership remain withheld unless separately supplied." });
  return (
    <section className="os-root" data-testid="organisation-synthesis" data-status={data.status}>
      <style>{`.os-root{margin:0 0 12px;border:1px solid #dce2ec;border-radius:12px;background:#fff;padding:12px}.os-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.os-title{font-size:12px;font-weight:900}.os-meta{font-size:9px;color:#747991;line-height:1.45}.os-status{border:1px solid #635bdf;border-radius:999px;padding:3px 7px;color:#4f46c7;font-size:8px;font-weight:900}.os-status.withheld{border-style:dashed;border-color:#d6b66d;color:#9a5b10}.os-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:9px}.os-card{border:1px solid #e1e7f0;border-left:3px solid #635bdf;border-radius:8px;padding:9px}.os-card b{font-size:10px}.os-ids{margin-top:5px;font:7px/1.4 ui-monospace,monospace;color:#747991;overflow-wrap:anywhere}.os-evidence{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.os-evidence button{min-width:44px;min-height:44px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#4f46c7;font-size:8px;font-weight:900}.os-withheld{display:flex;flex-wrap:wrap;gap:4px;margin-top:9px}.os-withheld span{border:1px dashed #d6b66d;border-radius:999px;padding:2px 6px;color:#9a5b10;font-size:7px;font-weight:900}@media(max-width:600px){.os-groups{grid-template-columns:1fr}}`}</style>
      <div className="os-head"><div><div className="om-eyebrow">Cross-posting organisation synthesis</div><div className="os-title">Repeated supplied capabilities</div></div><span className={`os-status ${data.status}`}>{data.status === "available" ? "SUPPLIED" : "WITHHELD"}</span></div>
      <p className="os-meta">{data.employer ? `${data.employer.name} · stable employer id ${data.employer.id}` : data.reason} Capabilities appear only when the same source-linked label occurs in at least two postings.</p>
      <BlueprintTracePanel traces={[trace]} label="Organisation synthesis blueprint trace" />
      {data.groups.length > 0 && <div className="os-groups">{data.groups.map((group) => <article className="os-card" data-testid="organisation-synthesis-group" key={group.id}><b>{group.label}</b><div className="os-meta">{group.statement}</div><div className="os-ids">postings: {group.sourceIdentifiers.join(" · ")}</div><div className="os-evidence">{group.evidenceIds.map((id) => <button type="button" key={id} onClick={() => onEvidenceSelect?.(id)}>{id}</button>)}</div></article>)}</div>}
      <div className="os-withheld" aria-label="Fields not inferred">{WITHHELD_ORGANISATION_FIELDS.map((field) => <span key={field}>{field.toUpperCase()} WITHHELD</span>)}</div>
    </section>
  );
}
