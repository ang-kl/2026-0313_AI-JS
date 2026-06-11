// SphericalGallery.jsx - "The Analysis Sphere" (/spherical)
// Phantom.land-style inside-a-sphere gallery of the v3 analysis artifacts.
// SPH1: drag to look around with damped lens easing + release inertia, wheel
// to tilt, click a card to open it. SPH2 (Human Lead): after an analysis
// completes the cards show the REAL results of your last run (read from the
// locally saved analysis - never invented), the artifacts interlink, and on
// click the sphere swings out to the LEFT MARGIN (you see it from outside as
// a small turning ball) while the card's detail opens in the centre, with a
// deep-link back into the analyser at that exact tab. Three.js renders; GSAP
// animates; card faces are canvas-drawn (CSP allows no external images).
// Pure presentation - every figure is a pass-through of a stored computed
// value; no LLM, no new number. Blues/oranges only; reduced-motion respected.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

// ---- the artifacts (externalised strings; one card per result-page read) ----
// key = artifact id; tab = the analyser tab the deep-link opens; related = the
// interlink chips shown on the detail page.
const ARTIFACTS = [
  { key: "skills",    tab: "skills",           icon: "\u{1F4CB}", title: "Skill Analysis",     line: "Every essential skill rated against today's AI frontier", hue: "#1a56db", related: ["category", "taskprep", "journey"] },
  { key: "progression", tab: "progression",    icon: "\u{1F4C8}", title: "Career Progression", line: "Realistic next roles with the skill gaps named",          hue: "#1e40af", related: ["crossover", "skills"] },
  { key: "crossover", tab: "crossover",        icon: "\u{1F500}", title: "Role Crossover",     line: "Transferable skills that open adjacent doors",            hue: "#0e7490", related: ["progression", "category"] },
  { key: "category",  tab: "category",         icon: "\u{1F5C2}", title: "Skill Categories",   line: "Thematic clusters for structured learning",               hue: "#b45309", related: ["skills", "crossover"] },
  { key: "context",   tab: "context",          icon: "\u{1F30F}", title: "Role Context",       line: "How the role operates across SG and ASEAN sectors",       hue: "#1a56db", related: ["mcf_jobs", "skills"] },
  { key: "mcf_jobs",  tab: "mcf_jobs",         icon: "\u{1F4BC}", title: "Live SG Jobs",       line: "Real MyCareersFuture postings, read as one role",         hue: "#0e7490", related: ["demand", "responsibilities", "rolemix"] },
  { key: "rolemix",   tab: "rolemix",          icon: "\u{1F9ED}", title: "Role Mix",           line: "The occupations a messy job ad actually blends",          hue: "#1e40af", related: ["mcf_jobs", "jobanatomy"] },
  { key: "responsibilities", tab: "responsibilities", icon: "\u{1F4DC}", title: "Responsibilities", line: "The duties employers list, extracted and rated",      hue: "#b45309", related: ["taskprep", "jobanatomy", "rehearse"] },
  { key: "jobanatomy", tab: "jobanatomy",      icon: "\u{1F9EC}", title: "Job Anatomy",        line: "Each duty's work layer and its AI exposure",              hue: "#1a56db", related: ["responsibilities", "deepread"] },
  { key: "deepread",  tab: "deepread",         icon: "\u{1F52C}", title: "Deep Read",          line: "Why this vacancy exists - the stewardship reads",         hue: "#1e40af", related: ["praxis", "adscan", "demand"] },
  { key: "praxis",    tab: "deepread",         icon: "\u{1F6E1}", title: "Steward's Praxis",   line: "The four-phase shift from operator to steward",           hue: "#0e7490", related: ["deepread", "journey"] },
  { key: "taskprep",  tab: "taskprep",         icon: "\u{1F3AF}", title: "Task Prep",          line: "The real tasks plus how to prepare this week",            hue: "#b45309", related: ["responsibilities", "rehearse", "journey"] },
  { key: "rehearse",  tab: "rehearse",         icon: "\u{1F3A4}", title: "Interview Prep",     line: "Duty-grounded questions with STAR scaffolds",             hue: "#1a56db", related: ["taskprep", "journey"] },
  { key: "truefit",   tab: "rolegraph",        icon: "⚖",    title: "True-Fit Score",     line: "Evidence-tiered CV fit - demonstrated beats claimed",     hue: "#1e40af", related: ["brief", "fairness"] },
  { key: "fairness",  tab: "rolegraph",        icon: "\u{1F91D}", title: "Fairness Lens",      line: "Reads the ad's language for tilt and exclusion",          hue: "#0e7490", related: ["adscan", "scorecard"] },
  { key: "brief",     tab: "rolegraph",        icon: "\u{1F4C7}", title: "Candidate Brief",    line: "Your one-page evidence pack, every cell sourced",         hue: "#b45309", related: ["truefit", "rehearse"] },
  { key: "scorecard", tab: "rolegraph",        icon: "\u{1F3E2}", title: "Employer Scorecard", line: "Scores the employer's ad like they score you",            hue: "#1a56db", related: ["fairness", "demand"] },
  { key: "demand",    tab: "deepread",         icon: "\u{1F4CA}", title: "Demand Proof",       line: "Is the demand real - posting flow and salary bands",      hue: "#1e40af", related: ["mcf_jobs", "deepread"] },
  { key: "adscan",    tab: "deepread",         icon: "\u{1F50D}", title: "Ad Language Scan",   line: "Boilerplate, buzzwords and what the ad avoids saying",    hue: "#0e7490", related: ["deepread", "fairness"] },
  { key: "journey",   tab: "skills",           icon: "\u{1F5FA}", title: "Journey Spine",      line: "Five stations from job-read to rehearsed and ready",      hue: "#b45309", related: ["skills", "taskprep", "rehearse"] },
];
const byKey = Object.fromEntries(ARTIFACTS.map(a => [a.key, a]));
const PRAXIS_PHASES = ["Redefine the cognitive baseline", "Master the control surface", "Treat AI as an untrusted actor", "Cultivate change leadership"];
const BG = "#0b1220"; // deep navy - inside-the-sphere darkness (no red/green anywhere)

// ---- the saved analysis (written by App.jsx on completion; CV never saved) --
function loadLast() {
  try {
    const raw = localStorage.getItem("sgcv3_last_v1");
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1 || !s.result || !Array.isArray(s.result.skills) || !s.result.skills.length) return null;
    return s;
  } catch (_) { return null; }
}

// Deterministic per-artifact read of the saved result. Every line/row is a
// pass-through of an already-computed value - nothing is authored here.
// Returns { line, rows, locked } - locked carries the unlock hint instead.
function statsFor(key, saved) {
  if (!saved) return null;
  const r = saved.result || {};
  const skills = r.skills || [];
  const resp = (r.responsibilitiesData && r.responsibilitiesData.responsibilities) || [];
  const jobs = (r.responsibilitiesData && r.responsibilitiesData.jobs) || [];
  const duties = (r.jobAnatomy && !r.jobAnatomy.fallback && r.jobAnatomy.duties) || [];
  const comps = (r.roleMix && !r.roleMix.fallback && r.roleMix.components) || [];
  const lvl = { HIGH: 0, MEDIUM: 0, LOW: 0, HUMAN: 0 };
  skills.forEach(s => { if (lvl[s.level] !== undefined) lvl[s.level]++; });
  const name = x => (x && (x.role || x.title || x.name)) || "";
  const trunc = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 3) + "..." : s; };
  switch (key) {
    case "skills":
      return { line: `${skills.length} skills: ${lvl.HIGH} full-auto / ${lvl.MEDIUM} augmented / ${lvl.LOW} assisted / ${lvl.HUMAN} human-led`,
        rows: skills.slice(0, 6).map(s => `${s.skill} - ${s.level === "HUMAN" ? "Human-Led" : s.level === "HIGH" ? "Full Automation" : s.level === "MEDIUM" ? "AI-Augmented" : "AI-Assisted"}`) };
    case "progression": {
      const p = r.progressionData || [];
      if (!p.length) return { locked: "progression did not load on the last run" };
      return { line: `${p.length} career paths mapped`, rows: p.slice(0, 5).map(x => trunc(name(x), 44)).filter(Boolean) };
    }
    case "crossover": {
      const c = r.crossoverData || [];
      if (!c.length) return { locked: "crossover did not load on the last run" };
      return { line: `${c.length} adjacent roles found`, rows: c.slice(0, 5).map(x => trunc(name(x), 44)).filter(Boolean) };
    }
    case "category": {
      const tech = skills.filter(s => (s.skillType || s.type) === "technical").length;
      return { line: `${tech} technical / ${skills.length - tech} human-side skills`,
        rows: [`${tech} technical skills`, `${skills.length - tech} soft / human-side skills`, `${lvl.HUMAN} stay human-led`] };
    }
    case "context": {
      const secs = (r.contextData && r.contextData.sectors) || [];
      if (!secs.length) return { locked: "context did not load on the last run" };
      return { line: `${secs.length} sectors mapped`, rows: secs.slice(0, 5).map(s => trunc(s.name, 44)).filter(Boolean) };
    }
    case "mcf_jobs":
      if (!jobs.length) return { locked: "no live postings were captured on the last run" };
      return { line: `${jobs.length} live MyCareersFuture postings read`,
        rows: [r.corpusMeta ? `aggregate of ${r.corpusMeta.jobCount} ads` : r.postingMeta ? `single ad: ${trunc(r.postingMeta.employer || "employer withheld", 36)}` : `${jobs.length} postings behind the responsibilities read`] };
    case "rolemix":
      if (!comps.length) return { locked: "role-mix did not resolve on the last run" };
      return { line: `${comps.length}-part blend: ${trunc(comps[0].label, 30)} leads`,
        rows: comps.slice(0, 4).map(c => `${c.pct}% ${trunc(c.label, 38)}`) };
    case "responsibilities": {
      if (!resp.length) return { locked: "no duties were extracted on the last run" };
      const core = resp.filter(x => x.freq === "Core").length;
      return { line: `${resp.length} duties: ${core} core`, rows: resp.slice(0, 4).map(x => trunc(x.text, 52)) };
    }
    case "jobanatomy":
      if (!duties.length) return { locked: "anatomy did not resolve on the last run" };
      return { line: `${duties.length} duties layered by AI exposure`,
        rows: duties.slice(0, 4).map(d => `${trunc(d.text || d.duty || "", 40)}${d.layer ? ` [${d.layer}]` : ""}`) };
    case "deepread":
      if (!resp.length) return { locked: "deep read unlocks once duties are extracted" };
      return { line: "stewardship reads ready for this role",
        rows: ["Forensic reversal - why the post exists", "Strategy read - keep vs hand to AI", "Demand proof + ad language scan", "Steward's praxis - the four phases"] };
    case "praxis":
      return { line: "the four phases, tailored to this role's duties", rows: PRAXIS_PHASES };
    case "taskprep": {
      if (!resp.length) return { locked: "task prep unlocks once duties are extracted" };
      const f = { Core: 0, Common: 0, Occasional: 0 };
      resp.forEach(x => { if (f[x.freq] !== undefined) f[x.freq]++; });
      return { line: `${resp.length} tasks armed: ${f.Core} core / ${f.Common} common / ${f.Occasional} occasional`,
        rows: resp.slice(0, 4).map(x => trunc(x.text, 52)) };
    }
    case "rehearse":
      if (resp.length < 3) return { locked: "interview prep unlocks at 3+ extracted duties" };
      return { line: `questions grounded in ${Math.min(resp.length, 5)} real duties`,
        rows: resp.slice(0, 4).map(x => trunc(x.text, 52)) };
    case "truefit": case "fairness": case "brief": case "scorecard":
      return { locked: "paste your CV in the Role Graph tab to unlock this read" };
    case "demand":
      if (!jobs.length) return { locked: "demand proof needs live postings from a run" };
      return { line: `read from ${jobs.length} live postings`, rows: [`${jobs.length} postings in the sample`, "salary bands + posting flow live in Deep Read"] };
    case "adscan":
      if (!r.postingMeta) return { locked: "open one live ad in the analyser to unlock the scan" };
      return { line: `scanned: ${trunc(r.postingMeta.employer || "the posting", 36)}`, rows: ["boilerplate share", "buzzword density", "what the ad avoids saying"] };
    case "journey":
      return { line: "five stations, walkable in order", rows: ["1 Understand", "2 Position", "3 Become", "4 Arm", "5 Rehearse"] };
    default:
      return null;
  }
}

// ---- canvas card texture (no external images; CSP-safe) --------------------
function drawCard(a, roleTitle, stat) {
  const W = 512, H = 640, r = 36;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d");
  x.clearRect(0, 0, W, H);
  x.beginPath(); x.roundRect(0, 0, W, H, r);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#eef2f7");
  x.fillStyle = g; x.fill();
  // accent top band - carries YOUR role title once an analysis is saved
  x.save(); x.beginPath(); x.roundRect(0, 0, W, 112, [r, r, 0, 0]); x.fillStyle = a.hue; x.fill();
  x.fillStyle = "rgba(255,255,255,0.92)";
  x.font = "700 30px Arial, sans-serif";
  const band = roleTitle ? roleTitle.toUpperCase().slice(0, 24) : "SG CAREER VIEW v3";
  x.fillText(band, 36, 68);
  x.restore();
  x.font = "130px Arial, sans-serif";
  x.textAlign = "center";
  x.fillText(a.icon, W / 2, 295);
  x.fillStyle = "#1a202c";
  x.font = "800 44px Arial, sans-serif";
  x.fillText(a.title, W / 2, 390);
  x.fillStyle = "#4a5568";
  x.font = "400 27px Arial, sans-serif";
  const wrap = (text, width) => {
    const words = String(text).split(" "); const lines = [""];
    for (const w of words) {
      const t = (lines[lines.length - 1] + " " + w).trim();
      if (x.measureText(t).width > width) lines.push(w); else lines[lines.length - 1] = t;
    }
    return lines;
  };
  wrap(a.line, W - 96).slice(0, 2).forEach((ln, i) => x.fillText(ln, W / 2, 442 + i * 37));
  // the real read (or the unlock hint) - SPH2
  if (stat) {
    x.font = "700 26px Arial, sans-serif";
    x.fillStyle = stat.locked ? "#9aa5b4" : a.hue;
    wrap(stat.locked ? "locked: " + stat.locked : stat.line, W - 84).slice(0, 2).forEach((ln, i) => x.fillText(ln, W / 2, 532 + i * 34));
  }
  x.strokeStyle = "#dde3ec"; x.lineWidth = 2;
  x.beginPath(); x.moveTo(48, H - 60); x.lineTo(W - 48, H - 60); x.stroke();
  x.fillStyle = "#9aa5b4"; x.font = "600 23px Arial, sans-serif";
  x.fillText(roleTitle ? "your last analysis" : "an artifact of the analysis", W / 2, H - 24);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---- the gallery ------------------------------------------------------------
export default function SphericalGallery() {
  const hostRef = useRef(null);
  const apiRef = useRef(null);        // imperative bridge: { close, show }
  const [detail, setDetail] = useState(null); // { a, stat, layout } -> docked panel
  const [hasSave, setHasSave] = useState(false);
  const detailRef = useRef(null);
  const savedRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saved = loadLast();
    savedRef.current = saved;
    setHasSave(!!saved);

    // scene / camera / renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 16, 30);
    const camera = new THREE.PerspectiveCamera(72, host.clientWidth / host.clientHeight, 0.1, 120);
    camera.position.set(0, 0, 0.001);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    // cards on the inside of the sphere - rows of latitudes, cycled artifacts
    const R = 14;
    const group = new THREE.Group();
    scene.add(group);
    const ROWS = [
      { lat: -46, n: 11 }, { lat: -23, n: 14 }, { lat: 0, n: 16 },
      { lat: 23, n: 14 }, { lat: 46, n: 11 },
    ];
    const cards = [];
    let k = 0;
    const texCache = new Map();
    for (const row of ROWS) {
      const phi = (row.lat * Math.PI) / 180;
      const ringR = R * Math.cos(phi);
      const gap = (2 * Math.PI) / row.n;
      const w = ringR * gap * 0.58, h = w * 1.22;
      for (let i = 0; i < row.n; i++, k++) {
        const a = ARTIFACTS[k % ARTIFACTS.length];
        if (!texCache.has(a.key)) texCache.set(a.key, drawCard(a, saved ? saved.title : "", statsFor(a.key, saved)));
        // DoubleSide so the ball stays visible from OUTSIDE when docked left
        const mat = new THREE.MeshBasicMaterial({ map: texCache.get(a.key), transparent: true, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        const theta = i * gap + (row.lat === 0 ? 0 : gap / 2);
        mesh.position.set(ringR * Math.sin(theta), R * Math.sin(phi), -ringR * Math.cos(theta));
        mesh.lookAt(0, 0, 0);
        mesh.userData = { artifact: a };
        group.add(mesh); cards.push(mesh);
      }
    }

    // intro: cards bloom in (skipped under reduced motion)
    if (!reduced) {
      cards.forEach((m, i) => {
        m.scale.setScalar(0.001);
        gsap.to(m.scale, { x: 1, y: 1, z: 1, duration: 0.9, delay: 0.18 + (i % 16) * 0.05 + Math.floor(i / 16) * 0.12, ease: "back.out(1.5)" });
      });
    }

    // look-around state: damped "lens" easing toward a target, inertia on release
    const LAT_MAX = 0.62;
    let lon = 0, lat = 0, tLon = 0, tLat = 0;
    let dragging = false, moved = 0, px = 0, py = 0, vLon = 0, vLat = 0;
    let lastInteract = performance.now();
    let open = false; // docked-left detail showing

    const el = renderer.domElement;
    el.style.cursor = "grab";
    el.style.touchAction = "none";

    const onDown = (e) => {
      if (open) return;
      dragging = true; moved = 0; px = e.clientX; py = e.clientY; vLon = 0; vLat = 0;
      el.style.cursor = "grabbing";
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      lastInteract = performance.now();
    };
    const onMove = (e) => {
      lastInteract = performance.now();
      if (!dragging) { hover(e); return; }
      const dx = e.clientX - px, dy = e.clientY - py;
      px = e.clientX; py = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      vLon = -dx * 0.0032; vLat = dy * 0.0024;
      tLon += vLon; tLat = THREE.MathUtils.clamp(tLat + vLat, -LAT_MAX, LAT_MAX);
      e.preventDefault();
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false; el.style.cursor = "grab";
      if (moved < 7) { pick(e); return; }
      if (reduced) return;
      const iv = { lon: vLon * 14, lat: vLat * 10 };
      gsap.to(iv, {
        lon: 0, lat: 0, duration: 1.4, ease: "power3.out",
        onUpdate: () => { tLon += iv.lon * 0.06; tLat = THREE.MathUtils.clamp(tLat + iv.lat * 0.06, -LAT_MAX, LAT_MAX); },
      });
    };
    const onWheel = (e) => {
      if (open) return;
      e.preventDefault();
      lastInteract = performance.now();
      tLat = THREE.MathUtils.clamp(tLat + e.deltaY * 0.0011, -LAT_MAX, LAT_MAX);
      tLon += (e.deltaX || 0) * 0.0011;
    };
    const onKey = (e) => {
      if (e.key === "Escape" && open) { apiRef.current && apiRef.current.close(); return; }
      if (open) return;
      const step = 0.16;
      if (e.key === "ArrowLeft") tLon -= step;
      else if (e.key === "ArrowRight") tLon += step;
      else if (e.key === "ArrowUp") tLat = THREE.MathUtils.clamp(tLat - step * 0.6, -LAT_MAX, LAT_MAX);
      else if (e.key === "ArrowDown") tLat = THREE.MathUtils.clamp(tLat + step * 0.6, -LAT_MAX, LAT_MAX);
      else return;
      lastInteract = performance.now();
      e.preventDefault();
    };

    // hover + pick via raycast
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hovered = null;
    function cast(e) {
      const b = el.getBoundingClientRect();
      ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(cards, false);
      return hit.length ? hit[0].object : null;
    }
    function hover(e) {
      if (open) return;
      const m = cast(e);
      if (m === hovered) return;
      if (hovered) gsap.to(hovered.scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: "power2.out" });
      hovered = m;
      if (m) { gsap.to(m.scale, { x: 1.09, y: 1.09, z: 1.09, duration: 0.35, ease: "power2.out" }); el.style.cursor = "pointer"; }
      else el.style.cursor = dragging ? "grabbing" : "grab";
    }

    // SPH2 dock: the sphere swings out to the left margin (camera pulls
    // OUTSIDE; the ball keeps turning) and the detail shows in the centre.
    // Portrait viewports dock the ball to the top instead, detail below.
    function dockOpen(artifact) {
      open = true;
      if (hovered) { gsap.to(hovered.scale, { x: 1, y: 1, z: 1, duration: 0.3 }); hovered = null; }
      el.style.cursor = "default";
      const portrait = host.clientHeight > host.clientWidth * 1.05;
      const dur = reduced ? 0 : 1.0;
      gsap.to(camera.position, { z: 30, duration: dur, ease: "power3.inOut" });
      gsap.to(group.position, { x: portrait ? 0 : -10.5, y: portrait ? 8 : 0, duration: dur, ease: "power3.inOut" });
      gsap.to(group.scale, { x: 0.55, y: 0.55, z: 0.55, duration: dur, ease: "power3.inOut" });
      gsap.to(scene.fog, { near: 26, far: 75, duration: dur, ease: "power2.inOut" });
      const show = (a) => setDetail({ a, stat: statsFor(a.key, savedRef.current), layout: portrait ? "sheet" : "side" });
      gsap.delayedCall(reduced ? 0 : 0.45, () => show(artifact));
      apiRef.current = {
        show, // interlink chips swap the detail while the ball stays docked
        close: () => {
          const node = detailRef.current;
          const done = () => {
            setDetail(null);
            const d2 = reduced ? 0 : 0.9;
            gsap.to(camera.position, { z: 0.001, duration: d2, ease: "power3.inOut" });
            gsap.to(group.position, { x: 0, y: 0, duration: d2, ease: "power3.inOut" });
            gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: d2, ease: "power3.inOut" });
            gsap.to(scene.fog, { near: 16, far: 30, duration: d2, ease: "power2.inOut", onComplete: () => { open = false; } });
            if (reduced) open = false;
          };
          if (node && !reduced) gsap.to(node, { autoAlpha: 0, yPercent: 6, duration: 0.3, ease: "power2.in", onComplete: done });
          else done();
        },
      };
    }
    function pick(e) {
      const m = cast(e);
      if (!m || open) return;
      dockOpen(m.userData.artifact);
    }

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);

    // frame loop: lens-damped easing + idle drift; the docked ball keeps turning
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!reduced && !dragging && !open && performance.now() - lastInteract > 3500) tLon += 0.00045;
      if (!reduced && open) tLon += 0.0035; // the docked ball turns so it reads as a sphere
      lon += (tLon - lon) * 0.075;
      lat += (tLat - lat) * 0.075;
      group.rotation.y = lon;
      group.rotation.x = lat;
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      cards.forEach(c => { c.geometry.dispose(); c.material.dispose(); });
      texCache.forEach(t => t.dispose());
      renderer.dispose();
      host.contains(renderer.domElement) && host.removeChild(renderer.domElement);
    };
  }, []);

  // detail panel entrance (also re-fires when an interlink chip swaps content)
  useEffect(() => {
    const node = detailRef.current;
    if (!detail || !node) return;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { gsap.set(node, { autoAlpha: 1, yPercent: 0 }); return; }
    gsap.fromTo(node, { autoAlpha: 0, yPercent: 6 }, { autoAlpha: 1, yPercent: 0, duration: 0.45, ease: "power3.out" });
  }, [detail]);

  const ui = { fontFamily: "Arial, sans-serif" };
  const roleTitle = savedRef.current ? savedRef.current.title : "";
  const side = detail && detail.layout === "side";
  const panelPos = side
    ? { left: "42%", right: 26, top: "50%", transform: "translateY(-50%)", maxWidth: 600 }
    : { left: 12, right: 12, bottom: 12, maxHeight: "58vh" };
  return (
    <div style={{ position: "fixed", inset: 0, background: BG, overflow: "hidden", ...ui }}>
      <div ref={hostRef} role="application" tabIndex={0} aria-label="The Analysis Sphere - drag or use arrow keys to look around the gallery of analysis artifacts; click a card to open it" style={{ position: "absolute", inset: 0, outline: "none" }} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center, rgba(11,18,32,0) 52%, rgba(11,18,32,0.78) 100%)" }} />
      <div style={{ position: "absolute", top: 18, left: 22, color: "#e8f0fe", zIndex: 3 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>SG Career View</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9aa5b4" }}>
          {hasSave ? `The Analysis Sphere - your last read: ${roleTitle}` : "The Analysis Sphere - every artifact of one job read"}
        </p>
      </div>
      <a href="/" style={{ position: "absolute", top: 14, right: 18, zIndex: 3, color: "#e8f0fe", background: "rgba(26,86,219,0.32)", border: "1px solid rgba(232,240,254,0.35)", borderRadius: 22, padding: "11px 18px", minHeight: 44, display: "inline-flex", alignItems: "center", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
        Open the analyser
      </a>
      {!detail && (
        <p style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", margin: 0, color: "#e8f0fe", fontSize: 12.5, zIndex: 3, pointerEvents: "none", background: "rgba(11,18,32,0.78)", border: "1px solid rgba(232,240,254,0.18)", borderRadius: 20, padding: "9px 18px", whiteSpace: "nowrap" }}>
          {hasSave ? "Your results are on the cards - click one to open it" : "Drag to look around - scroll to tilt - click a card to open it"}
        </p>
      )}
      {/* SPH2 detail - the sphere is docked as a turning ball; this panel holds the card's read */}
      {detail && (
        <div ref={detailRef} role="dialog" aria-modal="true" aria-label={detail.a.title} style={{ position: "absolute", zIndex: 4, visibility: "hidden", ...panelPos }}>
          <div style={{ background: "#ffffff", borderRadius: 18, padding: "26px 28px 22px", boxShadow: "0 30px 80px rgba(0,0,0,0.55)", borderTop: `6px solid ${detail.a.hue}`, maxHeight: side ? "84vh" : "56vh", overflowY: "auto" }}>
            <p aria-hidden="true" style={{ margin: 0, fontSize: 46, lineHeight: 1 }}>{detail.a.icon}</p>
            <h1 style={{ margin: "10px 0 4px", fontSize: 26, color: "#1a202c" }}>{detail.a.title}</h1>
            {roleTitle && <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: detail.a.hue, textTransform: "uppercase", letterSpacing: "0.06em" }}>{roleTitle}</p>}
            <p style={{ margin: "0 0 12px", fontSize: 14.5, color: "#4a5568", lineHeight: 1.6 }}>{detail.a.line}.</p>
            {detail.stat && !detail.stat.locked && (
              <div style={{ margin: "0 0 14px", background: "#f5f7fa", border: "1px solid #dde3ec", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13.5, fontWeight: 700, color: "#1a202c" }}>{detail.stat.line}</p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {(detail.stat.rows || []).map((row, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: "#4a5568", lineHeight: 1.7 }}>{row}</li>
                  ))}
                </ul>
                <p style={{ margin: "8px 0 0", fontSize: 10.5, color: "#9aa5b4" }}>From your saved analysis - computed values, shown as stored. AI-assisted; human decides.</p>
              </div>
            )}
            {detail.stat && detail.stat.locked && (
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#5b6878", background: "#f5f7fa", border: "1px dashed #9aa5b4", borderRadius: 10, padding: "12px 14px" }}>
                Locked: {detail.stat.locked}.
              </p>
            )}
            {!detail.stat && (
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#5b6878", background: "#f5f7fa", border: "1px solid #dde3ec", borderRadius: 10, padding: "12px 14px" }}>
                Run any job title or live SG posting through the analyser and this card fills with your real, sourced read - deterministic numbers, provenance on every figure, AI as narration only.
              </p>
            )}
            {/* interlink chips - the related artifacts */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "0 0 16px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9aa5b4", alignSelf: "center" }}>Linked:</span>
              {(detail.a.related || []).map(rk => byKey[rk] && (
                <button key={rk} onClick={() => apiRef.current && apiRef.current.show(byKey[rk])}
                  style={{ minHeight: 32, padding: "5px 12px", borderRadius: 16, border: `1.5px solid ${byKey[rk].hue}`, background: "#ffffff", color: byKey[rk].hue, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {byKey[rk].icon} {byKey[rk].title}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => apiRef.current && apiRef.current.close()} style={{ minHeight: 44, padding: "10px 22px", borderRadius: 10, border: "2px solid #dde3ec", background: "#ffffff", color: "#1a202c", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Back to the sphere
              </button>
              <a href={hasSave && detail.stat && !detail.stat.locked ? `/?tab=${detail.a.tab}` : "/"} style={{ minHeight: 44, padding: "10px 22px", borderRadius: 10, background: "#1a56db", color: "#ffffff", fontSize: 14, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                {hasSave && detail.stat && !detail.stat.locked ? "Open this in the analyser" : "Run an analysis"}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
