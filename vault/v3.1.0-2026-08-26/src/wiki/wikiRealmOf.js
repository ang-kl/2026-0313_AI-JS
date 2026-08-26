// wikiRealmOf.js - PR5: deterministic ecotone realm classifier (spec section 2.1)
// Pure functions - NO LLM, NO fetch, NO Date.now. Tier of the output = "derived"
// (a deterministic transform over VERBATIM node text + the existing edge set).
//
// Realm vocabulary: internal | edge | external.
//   external  = the node names an outside party (regulator / customer / vendor / the
//               wider labour market) - matched against a CLOSED marker set on verbatim
//               label text only, OR the node is a mirror-occupation (competition cluster
//               = the external market).
//   edge      = an internal node that carries at least one edge to an external node -
//               the boundary-spanning "edge species" (the ecotone).
//   internal  = the default (no external marker, no boundary edge).
//
// Withhold over fabricate (spec 2.2): if no node matches an external marker and no node
// bridges to one, the edge and external lanes are honestly absent (present:false) and the
// reason is recorded in withheld[] - no faked lane.
// R005 grep targets: WIKI_EXTERNAL_MARKERS, wikiRealmOf, computeRealmMap.

// Closed marker set - matched as a lowercase substring of a node's VERBATIM label text.
// Outside-the-organisation parties only; deliberately excludes generic words like
// "stakeholder" (a Stakeholder Management skill is the EDGE species, not external itself).
export const WIKI_EXTERNAL_MARKERS = [
  "external", "regulator", "regulatory", "customer", "client",
  "vendor", "supplier", "contractor", "partner agency", "public",
  "citizen", "community", "ministry", "auditor", "audit committee",
  "industry body", "the market", "mas ", " mas", "iras", "acra",
];

// Node types that are inherently outside the role's own organisation.
const EXTERNAL_TYPES = new Set([
  "regulator", "customer", "vendor", "external-stakeholder",
  "mirror-occupation", // competition cluster = the external labour market
]);

function nodeText(node) {
  return (
    String(node.label || "") + " " +
    String(node.typeLabel || "") + " " +
    String(node.type || "")
  ).toLowerCase();
}

// Base realm from the node alone: "external" | "internal".
// ("edge" requires the edge set and is resolved in computeRealmMap.)
export function wikiRealmOf(node) {
  if (!node) return "internal";
  const t = String(node.type || "").toLowerCase();
  if (EXTERNAL_TYPES.has(t)) return "external";
  const hay = nodeText(node);
  if (WIKI_EXTERNAL_MARKERS.some(function (m) { return hay.includes(m); })) {
    return "external";
  }
  return "internal";
}

// Full realm map over nodes + edges (spec 2.1).
// Returns:
//   realm    - { [nodeId]: "internal" | "edge" | "external" }
//   realms   - [ { id, label, present } ] honesty signal (present:false = sought, ungroundable)
//   withheld - [ "external: ...", "edge: ..." ] reasons a lane was not drawn
export function computeRealmMap(nodes, edges) {
  const base = {};
  (nodes || []).forEach(function (n) { base[n.id] = wikiRealmOf(n); });

  // Undirected adjacency for boundary detection.
  const nbr = {};
  (edges || []).forEach(function (e) {
    if (!e) return;
    (nbr[e.source] = nbr[e.source] || []).push(e.target);
    (nbr[e.target] = nbr[e.target] || []).push(e.source);
  });

  const realm = {};
  (nodes || []).forEach(function (n) {
    if (base[n.id] === "external") { realm[n.id] = "external"; return; }
    const touchesExternal = (nbr[n.id] || []).some(function (o) {
      return base[o] === "external";
    });
    realm[n.id] = touchesExternal ? "edge" : "internal";
  });

  const present = { internal: false, edge: false, external: false };
  Object.keys(realm).forEach(function (id) { present[realm[id]] = true; });

  const realms = [
    { id: "internal", label: "Internal",       present: present.internal },
    { id: "edge",     label: "Edge (ecotone)", present: present.edge },
    { id: "external", label: "External",       present: present.external },
  ];

  const withheld = [];
  if (!present.external) {
    withheld.push("external: no external-party marker in this posting - no external lane drawn");
  }
  if (!present.edge) {
    withheld.push("edge: no internal node bridges to an external node - no ecotone lane drawn");
  }

  return { realm: realm, realms: realms, withheld: withheld };
}
