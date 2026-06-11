// SphericalGallery.jsx - "The Analysis Sphere" (/spherical)
// Phantom.land-style inside-a-sphere gallery of the v3 analysis artifacts.
// You stand at the centre of a sphere lined with cards (one per result-page
// artifact); left-drag to look around with damped lens easing + release
// inertia, wheel to tilt, click a card to fly it forward and open a basic
// detail page. Three.js renders; GSAP animates; card faces are canvas-drawn
// (CSP allows no external images). Pure presentation - no LLM, no number.
// Palette: blues/oranges only (no red/green); reduced-motion respected.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

// ---- the artifacts (externalised strings; one card per result-page read) ----
const ARTIFACTS = [
  { icon: "\u{1F4CB}", title: "Skill Analysis",     line: "Every essential skill rated against today's AI frontier", hue: "#1a56db" },
  { icon: "\u{1F4C8}", title: "Career Progression", line: "Realistic next roles with the skill gaps named",          hue: "#1e40af" },
  { icon: "\u{1F500}", title: "Role Crossover",     line: "Transferable skills that open adjacent doors",            hue: "#0e7490" },
  { icon: "\u{1F5C2}", title: "Skill Categories",   line: "Thematic clusters for structured learning",               hue: "#b45309" },
  { icon: "\u{1F30F}", title: "Role Context",       line: "How the role operates across SG and ASEAN sectors",       hue: "#1a56db" },
  { icon: "\u{1F4BC}", title: "Live SG Jobs",       line: "Real MyCareersFuture postings, read as one role",         hue: "#0e7490" },
  { icon: "\u{1F9ED}", title: "Role Mix",           line: "The occupations a messy job ad actually blends",          hue: "#1e40af" },
  { icon: "\u{1F4DC}", title: "Responsibilities",   line: "The duties employers list, extracted and rated",          hue: "#b45309" },
  { icon: "\u{1F9EC}", title: "Job Anatomy",        line: "Each duty's work layer and its AI exposure",              hue: "#1a56db" },
  { icon: "\u{1F52C}", title: "Deep Read",          line: "Why this vacancy exists - the stewardship reads",         hue: "#1e40af" },
  { icon: "\u{1F6E1}", title: "Steward's Praxis",   line: "The four-phase shift from operator to steward",           hue: "#0e7490" },
  { icon: "\u{1F3AF}", title: "Task Prep",          line: "The real tasks plus how to prepare this week",            hue: "#b45309" },
  { icon: "\u{1F3A4}", title: "Interview Prep",     line: "Duty-grounded questions with STAR scaffolds",             hue: "#1a56db" },
  { icon: "⚖",    title: "True-Fit Score",     line: "Evidence-tiered CV fit - demonstrated beats claimed",     hue: "#1e40af" },
  { icon: "\u{1F91D}", title: "Fairness Lens",      line: "Reads the ad's language for tilt and exclusion",          hue: "#0e7490" },
  { icon: "\u{1F4C7}", title: "Candidate Brief",    line: "Your one-page evidence pack, every cell sourced",         hue: "#b45309" },
  { icon: "\u{1F3E2}", title: "Employer Scorecard", line: "Scores the employer's ad like they score you",            hue: "#1a56db" },
  { icon: "\u{1F4CA}", title: "Demand Proof",       line: "Is the demand real - posting flow and salary bands",      hue: "#1e40af" },
  { icon: "\u{1F50D}", title: "Ad Language Scan",   line: "Boilerplate, buzzwords and what the ad avoids saying",    hue: "#0e7490" },
  { icon: "\u{1F5FA}", title: "Journey Spine",      line: "Five stations from job-read to rehearsed and ready",      hue: "#b45309" },
];

const BG = "#0b1220"; // deep navy - inside-the-sphere darkness (no red/green anywhere)

// ---- canvas card texture (no external images; CSP-safe) --------------------
function drawCard(a) {
  const W = 512, H = 640, r = 36;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d");
  x.clearRect(0, 0, W, H);
  // rounded card
  x.beginPath(); x.roundRect(0, 0, W, H, r);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#eef2f7");
  x.fillStyle = g; x.fill();
  // accent top band
  x.save(); x.beginPath(); x.roundRect(0, 0, W, 112, [r, r, 0, 0]); x.fillStyle = a.hue; x.fill();
  x.fillStyle = "rgba(255,255,255,0.92)";
  x.font = "700 30px Arial, sans-serif";
  x.fillText("SG CAREER VIEW v3", 36, 68);
  x.restore();
  // icon
  x.font = "150px Arial, sans-serif";
  x.textAlign = "center";
  x.fillText(a.icon, W / 2, 320);
  // title
  x.fillStyle = "#1a202c";
  x.font = "800 44px Arial, sans-serif";
  x.fillText(a.title, W / 2, 420);
  // description, wrapped to two lines
  x.fillStyle = "#4a5568";
  x.font = "400 28px Arial, sans-serif";
  const words = a.line.split(" "); const lines = [""];
  for (const w of words) {
    const t = (lines[lines.length - 1] + " " + w).trim();
    if (x.measureText(t).width > W - 96) lines.push(w); else lines[lines.length - 1] = t;
  }
  lines.slice(0, 3).forEach((ln, i) => x.fillText(ln, W / 2, 478 + i * 40));
  // footer rule + chip
  x.strokeStyle = "#dde3ec"; x.lineWidth = 2;
  x.beginPath(); x.moveTo(48, H - 72); x.lineTo(W - 48, H - 72); x.stroke();
  x.fillStyle = "#9aa5b4"; x.font = "600 24px Arial, sans-serif";
  x.fillText("an artifact of the analysis", W / 2, H - 32);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---- the gallery ------------------------------------------------------------
export default function SphericalGallery() {
  const hostRef = useRef(null);
  const apiRef = useRef(null);        // imperative bridge: { close() }
  const [detail, setDetail] = useState(null); // selected artifact -> overlay page
  const detailRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // scene / camera / renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 16, 30);
    const camera = new THREE.PerspectiveCamera(72, host.clientWidth / host.clientHeight, 0.1, 60);
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
        if (!texCache.has(a.title)) texCache.set(a.title, drawCard(a));
        const mat = new THREE.MeshBasicMaterial({ map: texCache.get(a.title), transparent: true });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        const theta = i * gap + (row.lat === 0 ? 0 : gap / 2); // stagger alternate rows
        mesh.position.set(ringR * Math.sin(theta), R * Math.sin(phi), -ringR * Math.cos(theta));
        mesh.lookAt(0, 0, 0);
        mesh.userData = { artifact: a, baseScale: 1 };
        group.add(mesh); cards.push(mesh);
      }
    }

    // intro: cards bloom in (skipped under reduced motion)
    if (!reduced) {
      cards.forEach((m, i) => {
        m.scale.setScalar(0.001);
        gsap.to(m.scale, { x: 1, y: 1, z: 1, duration: 0.9, delay: 0.18 + (i % 15) * 0.05 + Math.floor(i / 15) * 0.12, ease: "back.out(1.5)" });
      });
    }

    // look-around state: damped "lens" easing toward a target, inertia on release
    const LAT_MAX = 0.62;
    let lon = 0, lat = 0, tLon = 0, tLat = 0;
    let dragging = false, moved = 0, px = 0, py = 0, vLon = 0, vLat = 0;
    let lastInteract = performance.now();
    let open = false; // detail page showing

    const el = renderer.domElement;
    el.style.cursor = "grab";
    el.style.touchAction = "none";

    const onDown = (e) => {
      if (open) return;
      dragging = true; moved = 0; px = e.clientX; py = e.clientY; vLon = 0; vLat = 0;
      el.style.cursor = "grabbing";
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      gsap.killTweensOf(inertia);
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
    const inertia = { v: 0 };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false; el.style.cursor = "grab";
      if (moved < 7) { pick(e); return; }
      if (reduced) return;
      // release inertia: carry the last drag velocity and decay it out
      inertia.v = 1;
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
    function pick(e) {
      const m = cast(e);
      if (!m || open) return;
      open = true;
      // fly the card toward the eye while the rest of the sphere falls away
      const dir = m.position.clone().normalize();
      const tl = gsap.timeline();
      cards.forEach(c => { if (c !== m) tl.to(c.material, { opacity: 0.06, duration: 0.55, ease: "power2.inOut" }, 0); });
      tl.to(m.position, { x: dir.x * 3.4, y: dir.y * 3.4, z: dir.z * 3.4, duration: 0.7, ease: "power3.inOut" }, 0);
      tl.to(m.scale, { x: 1.18, y: 1.18, z: 1.18, duration: 0.7, ease: "power3.inOut" }, 0);
      tl.add(() => setDetail({ ...m.userData.artifact }));
      // closing reverses the flight and restores the sphere
      apiRef.current = {
        close: () => {
          const node = detailRef.current;
          const done = () => {
            setDetail(null);
            const back = gsap.timeline({ onComplete: () => { open = false; } });
            back.to(m.position, { x: dir.x * R, y: dir.y * R, z: dir.z * R, duration: 0.6, ease: "power3.inOut" }, 0);
            back.to(m.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: "power3.inOut" }, 0);
            cards.forEach(c => { if (c !== m) back.to(c.material, { opacity: 1, duration: 0.5, ease: "power2.inOut" }, 0.1); });
          };
          if (node && !reduced) gsap.to(node, { autoAlpha: 0, yPercent: 6, duration: 0.32, ease: "power2.in", onComplete: done });
          else done();
        },
      };
    }

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);

    // frame loop: lens-damped easing toward the target + idle drift
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!reduced && !dragging && !open && performance.now() - lastInteract > 3500) tLon += 0.00045; // idle drift
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

  // detail page entrance
  useEffect(() => {
    const node = detailRef.current;
    if (!detail || !node) return;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { gsap.set(node, { autoAlpha: 1, yPercent: 0 }); return; }
    gsap.fromTo(node, { autoAlpha: 0, yPercent: 8 }, { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: "power3.out", delay: 0.15 });
  }, [detail]);

  const ui = { fontFamily: "Arial, sans-serif" };
  return (
    <div style={{ position: "fixed", inset: 0, background: BG, overflow: "hidden", ...ui }}>
      <div ref={hostRef} role="application" tabIndex={0} aria-label="The Analysis Sphere - drag or use arrow keys to look around the gallery of analysis artifacts; click a card to open it" style={{ position: "absolute", inset: 0, outline: "none" }} />
      {/* lens vignette */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center, rgba(11,18,32,0) 52%, rgba(11,18,32,0.78) 100%)" }} />
      {/* brand + exit */}
      <div style={{ position: "absolute", top: 18, left: 22, color: "#e8f0fe", zIndex: 3 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>SG Career View</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9aa5b4" }}>The Analysis Sphere - every artifact of one job read</p>
      </div>
      <a href="/" style={{ position: "absolute", top: 14, right: 18, zIndex: 3, color: "#e8f0fe", background: "rgba(26,86,219,0.32)", border: "1px solid rgba(232,240,254,0.35)", borderRadius: 22, padding: "11px 18px", minHeight: 44, display: "inline-flex", alignItems: "center", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
        Open the analyser
      </a>
      {/* hint */}
      {!detail && (
        <p style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", margin: 0, color: "#e8f0fe", fontSize: 12.5, zIndex: 3, pointerEvents: "none", background: "rgba(11,18,32,0.78)", border: "1px solid rgba(232,240,254,0.18)", borderRadius: 20, padding: "9px 18px", whiteSpace: "nowrap" }}>
          Drag to look around <span aria-hidden="true">- </span>scroll to tilt <span aria-hidden="true">- </span>click a card to open it
        </p>
      )}
      {/* detail page (basic template) */}
      {detail && (
        <div ref={detailRef} role="dialog" aria-modal="true" aria-label={detail.title} style={{ position: "absolute", inset: 0, zIndex: 4, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, rgba(11,18,32,0.55), rgba(11,18,32,0.88))", visibility: "hidden" }}>
          <div style={{ width: "min(92vw, 560px)", background: "#ffffff", borderRadius: 18, padding: "30px 30px 24px", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", borderTop: `6px solid ${detail.hue}` }}>
            <p aria-hidden="true" style={{ margin: 0, fontSize: 54, lineHeight: 1 }}>{detail.icon}</p>
            <h1 style={{ margin: "12px 0 6px", fontSize: 28, color: "#1a202c" }}>{detail.title}</h1>
            <p style={{ margin: "0 0 14px", fontSize: 15, color: "#4a5568", lineHeight: 1.6 }}>{detail.line}.</p>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#5b6878", lineHeight: 1.65, background: "#f5f7fa", border: "1px solid #dde3ec", borderRadius: 10, padding: "12px 14px" }}>
              This is one artifact of the full analysis. Run any job title or live SG posting through the analyser and this card becomes a real, sourced read - deterministic numbers, provenance on every figure, AI as narration only.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => apiRef.current && apiRef.current.close()} style={{ minHeight: 44, padding: "10px 22px", borderRadius: 10, border: "2px solid #dde3ec", background: "#ffffff", color: "#1a202c", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Back to the sphere
              </button>
              <a href="/" style={{ minHeight: 44, padding: "10px 22px", borderRadius: 10, background: "#1a56db", color: "#ffffff", fontSize: 14, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                Try it on a real job
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
