import React, { useEffect, useMemo, useRef } from "react";
import { buildOccupationVisualProfile, OCCUPATION_VISUALS } from "./occupationVisualProfileData.js";

export default function OccupationVisualSelector({ result, activeVisual, onSelect, onEvidenceSelect }) {
  const profile = useMemo(() => buildOccupationVisualProfile(result), [result]);
  const scrollRef = useRef(null);
  const suppliedContext = [profile.workNature, profile.escoOccupation?.title].filter(Boolean).join(" · ");
  const explanation = profile.linkedReasons[0]?.reason
    ? `${profile.linkedReasons[0].reason} · ${profile.boundary}`
    : profile.boundary;

  useEffect(() => {
    const scroller = scrollRef.current;
    const active = scroller?.querySelector('[aria-pressed="true"]');
    if (!scroller || !active) return;
    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    if (left < scroller.scrollLeft) scroller.scrollLeft = left;
    else if (right > scroller.scrollLeft + scroller.clientWidth) scroller.scrollLeft = right - scroller.clientWidth;
  }, [activeVisual]);

  return (
    <section className="ovs-root" data-testid="occupation-visual-selector" aria-label="Occupation-sensitive visual selector">
      <style>{`
        .ovs-root{min-height:0;border-bottom:1px solid #e7edf4;background:#fff;color:#1a202c;font-family:Inter,Arial,sans-serif}.ovs-root *{box-sizing:border-box;min-width:0}.ovs-scroll{overflow-x:auto;scrollbar-gutter:stable;padding:7px clamp(10px,.8vw,18px) 6px;scrollbar-width:thin;scrollbar-color:#98a8b7 transparent}.ovs-scroll::-webkit-scrollbar{height:8px}.ovs-scroll::-webkit-scrollbar-thumb{background:#98a8b7;border:2px solid #fff;border-radius:999px}.ovs-ribbon{display:grid;grid-template-columns:repeat(4,minmax(118px,1fr));gap:6px;min-width:520px}.ovs-choice{position:relative;min-height:48px;border:1px solid #dde3ec;border-radius:8px;background:#f8fafc;padding:6px 8px;text-align:left;cursor:pointer}.ovs-choice:hover,.ovs-choice.active{border-color:#1a56db;background:#e8f0fe}.ovs-choice:focus-visible,.ovs-evidence:focus-visible{outline:3px solid #1a56db;outline-offset:2px}.ovs-choice strong{display:block;font-size:10px;line-height:1.1}.ovs-choice small{display:block;margin-top:3px;color:#6b7a8d;font-size:8px;line-height:1.2}.ovs-rec{position:absolute;right:5px;top:5px;border:1px solid #1a56db;border-radius:999px;background:#fff;color:#1a56db;padding:1px 5px;font-size:6px;font-weight:900;letter-spacing:.04em}.ovs-context{display:flex;align-items:center;gap:7px;min-height:31px;padding:5px clamp(10px,.8vw,18px) 7px;color:#64748b;font-size:8.5px;line-height:1.3}.ovs-status{flex:0 0 auto;border:1px dashed #d6b66d;border-radius:999px;background:#fffbeb;color:#92400e;padding:3px 7px;font-size:7px;font-weight:900;letter-spacing:.04em}.ovs-status.available{border-style:solid;border-color:#1a56db;background:#eef4ff;color:#1a56db}.ovs-boundary{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ovs-evidence{flex:0 0 auto;min-width:38px;min-height:28px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#1a56db;font-size:8px;font-weight:900;cursor:pointer}.ovs-unavailable{color:#92400e;font-weight:800}.ovs-supplied{flex:0 1 auto;white-space:nowrap;color:#475569;font-weight:800}
        @media(max-width:700px){.ovs-context{align-items:flex-start;flex-wrap:wrap}.ovs-boundary{white-space:normal;flex:1 1 220px}.ovs-supplied{white-space:normal}.ovs-ribbon{grid-template-columns:repeat(4,122px);min-width:max-content}}
        @media(max-width:560px){.ovs-ribbon{grid-template-columns:repeat(2,minmax(0,1fr));min-width:0}.ovs-choice{min-height:44px}}
      `}</style>
      <div className="ovs-scroll" ref={scrollRef}>
        <div className="ovs-ribbon" role="group" aria-label="Choose visual question">
          {OCCUPATION_VISUALS.map((visual) => (
            <button
              key={visual.id}
              data-testid={`visual-choice-${visual.id}`}
              type="button"
              className={`ovs-choice ${activeVisual === visual.id ? "active" : ""}`}
              onClick={() => onSelect?.(visual.id)}
              aria-pressed={activeVisual === visual.id}
            >
              {profile.recommendation === visual.id && <span className="ovs-rec">RECOMMENDED</span>}
              <strong>{visual.label}</strong><small>{visual.question}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="ovs-context" aria-live="polite">
        <span className={`ovs-status ${profile.status}`}>{profile.status === "available" ? "SUPPLIED RECOMMENDATION" : "RECOMMENDATION WITHHELD"}</span>
        {suppliedContext && <span className="ovs-supplied">{suppliedContext}</span>}
        <span className="ovs-boundary">{explanation}</span>
        {profile.unsupported.length > 0 && <span className="ovs-unavailable">Unavailable: {profile.unsupported.map((visual) => visual.supplied).join(" · ")}</span>}
        {profile.linkedReasons.map((reason) => <button key={reason.id} className="ovs-evidence" type="button" onClick={() => onEvidenceSelect?.(reason.evidenceId)} aria-label={`Open source ${reason.evidenceId}`}>{reason.evidenceId}</button>)}
      </div>
    </section>
  );
}
